// app/staff/checkin/page.tsx
'use client';
import { useState } from 'react';
import { MapPin, ScanLine, AlertCircle, CheckCircle } from 'lucide-react';

export default function StaffCheckinPage() {
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [log, setLog] = useState('');

  const triggerCheckin = () => {
    setStatus('SCANNING');
    // Trình giả lập kích hoạt quyền lấy GPS Trái Đất của trình duyệt điện thoại
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTimeout(() => {
          setStatus('SUCCESS');
          setLog(`Đã xác thực tọa độ (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) nằm trong bán kính 15m an toàn của xưởng! Ghi nhận vào ca lúc 08:30 AM.`);
        }, 1500);
      },
      () => {
        alert('Lỗi! Vui lòng bật định vị GPS trên điện thoại để chấm công.');
        setStatus('IDLE');
      }
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-100">Cổng Điểm Danh Công Nhật Điện Tử</h2>
          <p className="text-xs text-slate-500 mt-1">Yêu cầu bật GPS để hệ thống đối soát chống chấm công từ xa</p>
        </div>

        {status === 'IDLE' && <div className="w-36 h-36 bg-slate-950 border border-slate-800 rounded-xl mx-auto flex items-center justify-center"><MapPin className="w-12 h-12 text-slate-600" /></div>}
        {status === 'SCANNING' && <div className="w-36 h-36 bg-slate-950 border-2 border-blue-500 rounded-xl mx-auto flex items-center justify-center relative overflow-hidden"><div className="absolute top-0 w-full h-0.5 bg-blue-500 shadow-lg animate-bounce"></div><ScanLine className="w-10 h-10 text-blue-500 animate-pulse" /></div>}
        {status === 'SUCCESS' && <div className="w-36 h-36 bg-emerald-950/30 border-2 border-emerald-500 rounded-xl mx-auto flex items-center justify-center"><CheckCircle className="w-12 h-12 text-emerald-400 animate-scaleUp" /></div>}

        {log && <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 text-left leading-relaxed">{log}</div>}

        <button onClick={triggerCheckin} disabled={status === 'SCANNING'} className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider">
          {status === 'SCANNING' ? 'Đang quét tọa độ GPS...' : 'Bấm Quét QR Vào Ca'}
        </button>
      </div>
    </div>
  );
}