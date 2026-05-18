'use client';
import { useState } from 'react';
import { QrCode, ScanLine, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScanQR = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      alert(
        'Đã nhận mã QR: NV_DOHAIVAN\nĐang kiểm tra tọa độ GPS... Hợp lệ!\nCheck-in thành công lúc 08:55 AM'
      );
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="bg-slate-950 p-6 text-center border-b border-slate-800">
          <div className="inline-block p-3 bg-blue-600/20 rounded-full mb-3">
            <QrCode className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-slate-100">
            LUMINAL FACTORY
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Hệ thống quản trị nội bộ
          </p>
        </div>
        <div className="p-8 flex flex-col items-center">
          {isScanning ? (
            <div className="relative w-48 h-48 bg-slate-900 border-2 border-blue-500 rounded-xl flex items-center justify-center overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_#60a5fa] animate-bounce"></div>
              <ScanLine className="w-12 h-12 text-slate-600 animate-pulse" />
              <p className="absolute bottom-4 text-xs text-blue-400 font-medium">
                Đang tìm mã QR...
              </p>
            </div>
          ) : (
            <div className="w-48 h-48 bg-slate-900 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-500" />
            </div>
          )}
          <button
            onClick={handleScanQR}
            disabled={isScanning}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
          >
            {isScanning ? 'Đang mở Camera...' : 'Quét Mã QR Đăng Nhập'}
          </button>
        </div>
        <div className="bg-slate-900/50 p-4 flex gap-3 items-start border-t border-slate-700">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Yêu cầu cấp quyền Camera và Vị trí (GPS) để thực hiện Check-in. Chỉ
            áp dụng tại khu vực Studio.
          </p>
        </div>
      </div>
    </div>
  );
}
