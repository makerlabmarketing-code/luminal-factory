// app/staff/attendance/AttendanceView.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; 
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Power, MapPin, RefreshCcw } from 'lucide-react';

export function StaffAttendanceContent({ token: propsToken, workerData }: any) {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = propsToken || searchParams.get('token'); 

  const [worker, setWorker] = useState<any>(null);
  const [localBranchName, setLocalBranchName] = useState('Đang nạp định vị...');
  const [isInShift, setIsInShift] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [fetching, setFetching] = useState(true);

  // Hàm quét trạng thái ca kíp hỏa tốc ngày hôm nay
  const loadInitialShiftStatus = async (currentWorker: any) => {
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const { data: check } = await supabase.from('attendance').select('*').eq('employee_id', currentWorker.id).eq('work_date', todayStr).maybeSingle();
      setIsInShift(!!(check && check.check_in && !check.check_out));
    } catch (e) { console.error(e); }
    // 🔥 ĐÃ VÁ LỖI: Đổi từ setLoading thành setFetching để Next.js thông qua vòng build hỏa tốc
    setFetching(false); 
  };

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    
    const initialize = async () => {
      let finalWorker = null;

      // Kéo dữ liệu nhân sự tươi từ DB về để chống bộ nhớ đệm cache cũ
      if (workerData?.id) {
        setFetching(true);
        const { data: freshEmp } = await supabase.from('employees').select('*').eq('id', workerData.id).maybeSingle();
        finalWorker = freshEmp || workerData; 
      } else if (token) {
        const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
        finalWorker = emp;
      }

      if (finalWorker) {
        setWorker(finalWorker);
        
        // Thuật toán quét chi nhánh động thông minh chấp mọi tên trường gán trong DB
        try {
          const { data: metaBranch } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách Chi nhánh').maybeSingle();
          const branchData = metaBranch?.data || [];
          
          const matchedBranch = branchData.find((b: any) => 
            Object.values(finalWorker).some(val => 
              typeof val === 'string' && (val.toLowerCase() === b.code.toLowerCase() || val.toLowerCase() === b.name.toLowerCase())
            )
          );
          
          setLocalBranchName(matchedBranch ? matchedBranch.name : 'Chưa gán cơ sở');
        } catch (err) {
          setLocalBranchName('Lỗi đồng bộ chi nhánh');
        }

        await loadInitialShiftStatus(finalWorker);
      } else {
        setFetching(false);
      }
    };

    initialize();
    return () => clearInterval(timer);
  }, [token, workerData]);

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

  const handleToggleShift = async () => {
    if (!worker) return showToast('Lỗi', 'Không tìm thấy hồ sơ nhân sự!', 'error');
    if (!navigator.geolocation) return showToast('Lỗi thiết bị', 'Thiết bị không hỗ trợ định vị GPS!', 'error');

    try {
      const { data: metaBranch } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách Chi nhánh').maybeSingle();
      const branchData = metaBranch?.data || [];
      
      const { data: freshEmp } = await supabase.from('employees').select('*').eq('id', worker.id).maybeSingle();
      const activeWorker = freshEmp || worker;

      const matchedBranch = branchData.find((b: any) => 
        Object.values(activeWorker).some(val => 
          typeof val === 'string' && (val.toLowerCase() === b.code.toLowerCase() || val.toLowerCase() === b.name.toLowerCase())
        )
      );

      setLocalBranchName(matchedBranch ? matchedBranch.name : 'Chưa gán cơ sở');

      if (!matchedBranch) return showToast('Lỗi địa điểm', 'Cơ sở được giao của bạn chưa được cấu hình tọa độ rào ranh giới GPS!', 'error');

      navigator.geolocation.getCurrentPosition(async (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        
        const distance = calculateDistance(uLat, uLng, matchedBranch.lat, matchedBranch.lng);

        if (distance > matchedBranch.radius) {
          return showToast('Từ Chối Chấm Công', `Vị trí sai! Bạn đang đứng cách cơ sở được chỉ định [${matchedBranch.name}] khoảng ${Math.round(distance)} mét (Yêu cầu phải < ${matchedBranch.radius}m).`, 'error');
        }

        const todayStr = new Date().toLocaleDateString('en-CA');
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        const currentShift = autoDetectShift(liveTime);

        if (!isInShift) {
          await supabase.from('attendance').insert([{ employee_id: activeWorker.id, employee_name: activeWorker.full_name, work_date: todayStr, check_in: timeStr, shift_name: currentShift, status: 'PRESENT' }]);
          showToast('Vào ca thành công', `✓ Đã ghi nhận [${currentShift}] tại [${matchedBranch.name}] lúc ${timeStr}.`, 'success');
        } else {
          await supabase.from('attendance').update({ check_out: timeStr }).eq('employee_id', activeWorker.id).eq('work_date', todayStr);
          showToast('Tắt máy về', `✓ Đã tan ca [${currentShift}] thành công!`, 'success');
        }
        setIsInShift(!isInShift);
      }, () => { 
        showToast('Quyền định vị', 'Vui lòng mở quyền truy cập vị trí GPS mức chính xác cao trên trình duyệt điện thoại!', 'error'); 
      }, { 
        enableHighAccuracy: true, 
        timeout: 5000 
      });

    } catch (err: any) { 
      showToast('Lỗi kết nối', err.message, 'error'); 
    }
  };

  if (fetching || !worker) return <div className="text-center p-12 text-xs text-slate-500 font-mono"><RefreshCcw className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-2"/> Đang đồng bộ trạm định vị Realtime hỏa tốc...</div>;

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-xl max-w-md mx-auto mt-6 animate-fadeIn w-full">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black font-mono text-slate-100">{liveTime.toLocaleTimeString('vi-VN')}</h2>
        <p className="text-[10px] text-slate-400 font-mono uppercase">{liveTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
      </div>

      <div className="w-full text-left space-y-1">
        <label className="text-[10px] text-slate-400 font-bold block pl-0.5">Cơ sở trực ban gán máy (Khóa cứng Realtime):</label>
        <div className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl font-sans text-xs text-slate-200 font-black tracking-wide border-l-4 border-l-purple-500 shadow-inner">
          🏛️ {localBranchName}
        </div>
      </div>

      <button onClick={handleToggleShift} className={`w-36 h-36 rounded-full border-4 font-black text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 shadow-2xl flex flex-col items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${isInShift ? 'bg-red-950/40 border-red-500 text-red-400' : 'bg-emerald-950/40 border-emerald-500 text-emerald-400'}`}>
        <Power className="w-7 h-7" />
        <span>{isInShift ? 'TẮT MÁY VỀ' : 'VÀO CA MÁY'}</span>
      </button>
      <span className="text-[9px] text-purple-400 font-mono text-center bg-slate-950 p-2 rounded-lg border border-slate-800 w-full">Hệ thống nhận diện ca: {autoDetectShift(liveTime)}</span>
    </div>
  );
}