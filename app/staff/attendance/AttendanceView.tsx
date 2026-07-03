'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Power, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateHoursFromStrings, calculateSalary } from '@/services/payrollService';

interface AttendanceViewProps {
  token?: string | null;
  workerData?: Employee | null;
}

interface Employee {
  id: number | string;
  full_name: string;
  qr_token?: string | null;
  branch_code?: string | null;
  hourly_rate?: number | string | null;
}

interface Facility {
  id: number | string;
  facility_name: string;
  lat: number | string;
  lng: number | string;
  radius: number | string;
}

interface AttendanceRecord {
  id: number | string;
  employee_id: number | string;
  employee_name?: string | null;
  work_date: string;
  check_in?: string | null;
  check_out?: string | null;
  shift_name: string;
  status?: string | null;
  total_hours?: number | string | null;
  total_salary?: number | string | null;
}

export function StaffAttendanceContent({
  token: propsToken,
  workerData,
}: AttendanceViewProps) {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = propsToken || searchParams.get('token');

  const [worker, setWorker] = useState<Employee | null>(null);
  const [localBranchName, setLocalBranchName] = useState('Đang nạp định vị...');
  const [isInShift, setIsInShift] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [liveTime, setLiveTime] = useState(new Date());
  const [fetching, setFetching] = useState(true);

  const autoDetectShift = (date: Date) => {
    const hour = date.getHours();

    if (hour >= 6 && hour < 12) return 'Ca Sáng';
    if (hour >= 12 && hour < 18) return 'Ca Chiều';

    return 'Ca Tối';
  };

  const findMatchedBranch = (
    workerObj: Employee,
    branchList: Facility[]
  ): Facility | undefined => {
    return branchList.find((branch) => {
      if (String(workerObj.branch_code) === String(branch.id)) return true;

      const branchNameLower = branch.facility_name?.toLowerCase();
      if (workerObj.branch_code?.toLowerCase() === branchNameLower) return true;

      return false;
    });
  };

  const loadInitialShiftStatus = async (currentWorker: Employee) => {
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');

      const { data: openRecord } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', currentWorker.id)
        .eq('work_date', todayStr)
        .is('check_out', null)
        .not('check_in', 'is', null)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openRecord) {
        setTodayRecord(openRecord as AttendanceRecord);
        setIsInShift(true);
        return;
      }

      const currentShift = autoDetectShift(new Date());

      const { data: currentShiftRecord } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', currentWorker.id)
        .eq('work_date', todayStr)
        .eq('shift_name', currentShift)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      setTodayRecord((currentShiftRecord as AttendanceRecord) || null);
      setIsInShift(false);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);

    const initialize = async () => {
      setFetching(true);

      try {
        let finalWorker: Employee | null = null;

        if (workerData?.id) {
          const { data: freshEmp } = await supabase
            .from('employees')
            .select('*')
            .eq('id', workerData.id)
            .maybeSingle();

          finalWorker = (freshEmp as Employee) || workerData;
        } else if (token) {
          const { data: emp } = await supabase
            .from('employees')
            .select('*')
            .eq('qr_token', token)
            .maybeSingle();

          finalWorker = emp as Employee | null;
        }

        if (!finalWorker) {
          setFetching(false);
          return;
        }

        setWorker(finalWorker);

        try {
          const { data: facs } = await supabase.from('facilities').select('*');
          const matchedBranch = findMatchedBranch(finalWorker, (facs || []) as Facility[]);

          setLocalBranchName(matchedBranch ? matchedBranch.facility_name : 'Chưa gán cơ sở');
        } catch {
          setLocalBranchName('Lỗi đồng bộ chi nhánh');
        }

        await loadInitialShiftStatus(finalWorker);
      } catch (error) {
        console.error(error);
        setFetching(false);
      }
    };

    initialize();

    return () => clearInterval(timer);
  }, [token, workerData]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const radius = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const handleToggleShift = async () => {
    if (!worker) {
      showToast('Lỗi', 'Không tìm thấy hồ sơ nhân sự!', 'error');
      return;
    }

    if (!navigator.geolocation) {
      showToast('Lỗi thiết bị', 'Thiết bị không hỗ trợ định vị GPS!', 'error');
      return;
    }

    try {
      const { data: facs } = await supabase.from('facilities').select('*');

      const { data: freshEmp } = await supabase
        .from('employees')
        .select('*')
        .eq('id', worker.id)
        .maybeSingle();

      const activeWorker = ((freshEmp as Employee) || worker) as Employee;
      const matchedBranch = findMatchedBranch(activeWorker, (facs || []) as Facility[]);

      setLocalBranchName(matchedBranch ? matchedBranch.facility_name : 'Chưa gán cơ sở');

      if (!matchedBranch) {
        showToast(
          'Lỗi địa điểm',
          'Cơ sở được giao của bạn chưa được cấu hình tọa độ rào ranh giới GPS!',
          'error'
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const distance = calculateDistance(
              userLat,
              userLng,
              Number(matchedBranch.lat),
              Number(matchedBranch.lng)
            );

            if (distance > Number(matchedBranch.radius)) {
              showToast(
                'Từ Chối Chấm Công',
                `Vị trí sai! Bạn đang cách cơ sở khoảng ${Math.round(distance)} mét.`,
                'error'
              );
              return;
            }

            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA');
            const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
            const currentShift = autoDetectShift(now);

            const { data: openRecord } = await supabase
              .from('attendance')
              .select('*')
              .eq('employee_id', activeWorker.id)
              .eq('work_date', todayStr)
              .is('check_out', null)
              .not('check_in', 'is', null)
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (openRecord) {
              const record = openRecord as AttendanceRecord;
              const totalHours = calculateHoursFromStrings(record.check_in || null, timeStr);
              const hourlyRate = Number(activeWorker.hourly_rate || 30000);
              const totalSalary = calculateSalary(totalHours, hourlyRate);

              const { error } = await supabase
                .from('attendance')
                .update({
                  check_out: timeStr,
                  total_hours: totalHours,
                  total_salary: totalSalary,
                  status: 'PRESENT',
                })
                .eq('id', record.id);

              if (error) throw error;

              showToast('Tắt máy về', `Đã tan ca [${record.shift_name}] thành công.`, 'success');
              await loadInitialShiftStatus(activeWorker);
              return;
            }

            const { data: existingShift } = await supabase
              .from('attendance')
              .select('*')
              .eq('employee_id', activeWorker.id)
              .eq('work_date', todayStr)
              .eq('shift_name', currentShift)
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existingShift) {
              setTodayRecord(existingShift as AttendanceRecord);
              setIsInShift(false);
              showToast('Đã ghi nhận', `Ca [${currentShift}] đã có dữ liệu chấm công.`, 'info');
              return;
            }

            const { error } = await supabase.from('attendance').upsert(
              {
                employee_id: activeWorker.id,
                employee_name: activeWorker.full_name,
                work_date: todayStr,
                check_in: timeStr,
                shift_name: currentShift,
                status: 'PRESENT',
              },
              {
                onConflict: 'employee_id,work_date,shift_name',
                ignoreDuplicates: true,
              }
            );

            if (error) throw error;

            showToast('Vào ca thành công', `Đã ghi nhận [${currentShift}] lúc ${timeStr}.`, 'success');
            await loadInitialShiftStatus(activeWorker);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể chấm công.';
            showToast('Lỗi kết nối', message, 'error');
          }
        },
        () => {
          showToast('Quyền định vị', 'Vui lòng mở quyền truy cập vị trí GPS mức chính xác cao!', 'error');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể chấm công.';
      showToast('Lỗi kết nối', message, 'error');
    }
  };

  if (fetching) {
    return (
      <div className="text-center p-12 text-xs text-slate-500 font-mono">
        <RefreshCcw className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-2" />
        Đang đồng bộ trạm định vị Realtime...
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl max-w-md mx-auto mt-6 text-center text-xs text-slate-300 w-full animate-fadeIn">
        <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
        <p className="font-bold">Không tìm thấy hồ sơ nhân sự</p>
        <p className="text-[11px] text-slate-400">
          Đường dẫn Token không hợp lệ hoặc tài khoản của bạn chưa được đồng bộ trên ERP.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl max-w-md mx-auto mt-6 animate-fadeIn w-full">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black font-mono text-slate-100">
          {liveTime.toLocaleTimeString('vi-VN')}
        </h2>
        <p className="text-[10px] text-slate-400 font-mono uppercase">
          {liveTime.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>

      <div className="w-full text-left space-y-1">
        <label className="text-[10px] text-slate-400 font-bold block pl-0.5">
          Cơ sở trực ban gán máy:
        </label>
        <div className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl font-sans text-xs text-slate-200 font-black tracking-wide border-l-4 border-l-purple-500 shadow-inner">
          🏛️ {localBranchName}
        </div>
      </div>

      {!isInShift && todayRecord?.check_out && (
        <div className="w-full bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <p className="text-xs font-bold text-emerald-400">Ca làm việc đã hoàn thành!</p>
          <div className="flex justify-between w-full text-[11px] font-mono border-t border-emerald-900/30 pt-2 mt-2">
            <span className="text-slate-400">Thời gian: {todayRecord.total_hours || 0} giờ</span>
            <span className="text-emerald-300 font-bold">
              Lương: {Number(todayRecord.total_salary || 0).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleToggleShift}
        className={`w-36 h-36 rounded-full border-4 font-black text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 shadow-2xl flex flex-col items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
          isInShift
            ? 'bg-red-950/40 border-red-500 text-red-400'
            : 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
        }`}
      >
        <Power className="w-7 h-7" />
        <span>{isInShift ? 'TẮT MÁY VỀ' : 'VÀO CA MÁY'}</span>
      </button>

      <span className="text-[9px] text-purple-400 font-mono text-center bg-slate-950 p-2 rounded-lg border border-slate-800 w-full">
        Hệ thống nhận diện ca: {autoDetectShift(liveTime)}
      </span>
    </div>
  );
}