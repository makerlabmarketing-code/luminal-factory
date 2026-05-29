// app/staff/attendance/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; 
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Power, MapPin, RefreshCcw } from 'lucide-react';

// Khai báo giao diện nhận props để nhúng trực tiếp vào Portal không lo lỗi biến
interface AttendanceProps {
  token?: string | null;
  workerData?: any;
  assignedBranchData?: any;
}

export default function StaffAttendancePage({ token: propsToken, workerData, assignedBranchData }: AttendanceProps) {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  
  // Ưu tiên lấy token từ props (khi nhúng vào portal), nếu không có mới lấy từ URL (khi chạy độc lập)
  const token = propsToken || searchParams.get('token'); 

  const [worker, setWorker] = useState<any>(workerData || null);
  const [assignedBranch, setAssignedBranch] = useState<any>(assignedBranchData || null); 
  const [isInShift, setIsInShift] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [fetching, setFetching] = useState(!workerData);

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    
    const initializeAttendance = async () => {
      if (workerData && assignedBranchData) {
        // Nếu đã có sẵn dữ liệu truyền từ Portal sang, kiểm tra trạng thái ca trực ngay
        const todayStr = new Date().toLocaleDateString('en-CA');
        const { data: check } = await supabase.from('attendance').select('*').eq('employee_id', workerData.id).eq('work_date', todayStr).maybeSingle();
        setIsInShift(!!(check && check.check_in && !check.check_out));
        setFetching(false);
        return;
      }
      
      if (!token) { setFetching(false); return; }
      try {
        const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
        if (emp) {
          setWorker(emp);
          const { data: metaBranch } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách Chi nhánh').maybeSingle();
          const branchData = metaBranch?.data || [];
          const myBranch = branchData.find((b: any) => b.code === emp.branch_code || b.name === emp.branch);
          setAssignedBranch(myBranch || branchData[0] || null);

          const todayStr = new Date().toLocaleDateString('en-CA');
          const { data: check } = await supabase.from('attendance').select('*').eq('employee_id', emp.id).eq('work_date', todayStr).maybeSingle();
          setIsInShift(!!(check && check.check_in && !check.check_out));
        }
      } catch (e) { console.error(e); }
      setFetching(false);
    };

    initializeAttendance();
    return () => clearInterval(timer);
  }, [token, workerData, assignedBranchData]);

  const autoDetectShift = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'Ca Sáng';
    if (hour >= 12 && hour < 18) return 'Ca Chiều';
    return 'Ca Tối';
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const handleToggleShift = () => {
    if (!worker) return showToast('Lỗi', 'Không tìm thấy hồ sơ nhân sự!', 'error');
    if (!assignedBranch) return showToast('Thiếu địa điểm', 'Tài khoản chưa được phân phối chi nhánh trực ca!', 'error');
    if (!navigator.geolocation) return showToast('Lỗi thiết bị', 'Thiết bị không hỗ trợ quét định vị GPS!', 'error');

    navigator.geolocation.getCurrentPosition(async (position) => {
      const uLat = position.coords.latitude;
      const uLng = position.coords.longitude;
      const distance = calculateDistance(uLat, uLng, assignedBranch.lat, assignedBranch.lng);

      if (distance > assignedBranch.radius) {
        return showToast('Từ Chối Chấm Công', `Bạn đang cách xa cơ sở được giao [${assignedBranch.name}] ${Math.round(distance)}m (Yêu cầu phải < ${assignedBranch.radius}m).`, 'error');
      }

      const todayStr = new Date().toLocaleDateString('en-CA');
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
      const currentShift = autoDetectShift(liveTime);

      try {
        if (!isInShift) {
          await supabase.from('attendance').insert([{ employee_id: worker.id, employee_name: worker.full_name, work_date: todayStr, check_in: timeStr, shift_name: currentShift, status: 'PRESENT' }]);
          showToast('Vào ca thành công', `Ghi nhận [${currentShift}] tại ${assignedBranch.name} lúc ${timeStr}.`, 'success');
        } else {
          await supabase.from('attendance').update({ check_out: timeStr }).eq('employee_id', worker.id).eq('work_date', todayStr);
          showToast('Rời ca thành công', `Ghi nhận tan ca lúc ${timeStr}.`, 'success');
        }
        setIsInShift(!isInShift);
      } catch (err: any) { showToast('Lỗi Database', err.message, 'error'); }
    }, () => { showToast('Quyền định vị', 'Vui lòng mở quyền vị trí trên điện thoại!', 'error'); });
  };

  if (fetching || !worker) return <div className="text-center p-6 text-xs text-slate-500 font-mono"><RefreshCcw className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-2"/> Đang đồng bộ định vị ca máy...</div>;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-xl max-w-md mx-auto mt-2 animate-fadeIn">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black font-mono text-slate-100">{liveTime.toLocaleTimeString('vi-VN')}</h2>
        <p className="text-[10px] text-slate-400 font-mono uppercase">{liveTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
      </div>

      <div className="w-full text-left space-y-1">
        <label className="text-[10px] text-slate-500 font-bold uppercase block pl-0.5">Cơ sở trực ban gán máy (Khóa cứng):</label>
        <div className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl font-sans text-xs text-slate-200 font-black tracking-wide border-l-4 border-l-purple-500 shadow-inner">
          🏛️ {assignedBranch ? assignedBranch.name : 'Đang bóc tách định vị...'}
        </div>
      </div>

      <button onClick={handleToggleShift} className={`w-36 h-36 rounded-full border-8 transition-all duration-300 transform hover:scale-105 shadow-2xl flex flex-col items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${isInShift ? 'bg-red-950/20 border-red-500 text-red-400 shadow-red-500/10' : 'bg-emerald-950/20 border-emerald-500 text-emerald-400 shadow-emerald-500/10'}`}>
        <Power className="w-8 h-8" />
        <span className="font-black text-[9px] tracking-widest uppercase">{isInShift ? 'TẮT MÁY VỀ' : 'BẤM VÀO CA'}</span>
      </button>
      <span className="text-[9px] text-purple-400 font-mono text-center bg-slate-950 p-2 rounded-lg border border-slate-850 w-full">Hệ thống nhận ca: {autoDetectShift(liveTime)}</span>
    </div>
  );
}