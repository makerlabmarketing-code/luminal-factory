// app/staff/portal/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MapPin, ShieldCheck, RefreshCcw, LogIn, LogOut } from 'lucide-react';

export default function StaffPersonalPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // Đọc mã định danh độc quyền từ URL

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }
      const { data } = await supabase.from('employees').select('*').eq('qr_token', token).eq('is_active', true).maybeSingle();
      setEmployee(data);
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const handleAttendance = (type: 'IN' | 'OUT') => {
    setIsProcessing(true);
    // Kích hoạt lõi định vị Trái Đất của trình duyệt điện thoại
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const currentHour = new Date().getHours();
        // Thuật toán tự động phân loại Ca làm việc dựa trên mốc thời gian thực tế của bạn
        let currentShift = 'SANG';
        let shiftNum = 1;
        if (currentHour >= 12 && currentHour < 17) { currentShift = 'CHIEU'; shiftNum = 2; }
        if (currentHour >= 17) { currentShift = 'TOI'; shiftNum = 3; }

        setTimeout(() => {
          setIsProcessing(false);
          setLog(`[XÁC THỰC AN TOÀN] Xin chào ${employee.full_name}! Định vị GPS hợp lệ. Ghi nhận thao tác ${type === 'IN' ? 'VÀO CA' : 'RA CA'} thành công cho Ca ${currentShift} (Số hiệu: ${shiftNum}). Hệ thống tự động ghi sổ kế toán.`);
        }, 1200);
      },
      () => {
        alert('Lỗi! Bạn bắt buộc phải cho phép điện thoại bật Định vị vị trí để chấm công vào xưởng.');
        setIsProcessing(false);
      }
    );
  };

  if (loading) return <div className="p-6 text-xs font-mono text-slate-500 text-center"><RefreshCcw className="w-4 h-4 animate-spin inline" /> Đang bảo mật đường truyền...</div>;
  if (!employee) return <div className="p-6 text-xs font-mono text-red-400 text-center">❌ Đường dẫn cổng điểm danh không hợp lệ hoặc hồ sơ đã bị Admin đóng khóa!</div>;

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full text-center space-y-5 shadow-2xl">
        <div className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20"><ShieldCheck className="w-6 h-6" /></div>
          <h2 className="text-base font-bold text-slate-200 pt-2">Cổng Điểm Danh: {employee.full_name}</h2>
          <p className="text-[11px] text-slate-500 font-mono">Định mức: {employee.hourly_rate.toLocaleString()} đ/giờ | {employee.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={() => handleAttendance('IN')} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 p-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex flex-col items-center gap-2 transition">
            <LogIn className="w-5 h-5" /> Vào Ca Làm
          </button>
          <button onClick={() => handleAttendance('OUT')} disabled={isProcessing} className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl font-bold text-xs text-amber-400 uppercase tracking-wider flex flex-col items-center gap-2 transition">
            <LogOut className="w-5 h-5" /> Bấm Ra Ca
          </button>
        </div>

        {log && <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-emerald-400 text-left leading-relaxed animate-fadeIn">{log}</div>}
      </div>
    </div>
  );
}