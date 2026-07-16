'use client';
import { Camera } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (token: string) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
      <div className="w-44 h-44 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
        <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
        <div className="absolute top-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-bounce mt-2"></div>
        <span className="text-[10px] text-slate-500 font-medium mt-2">
          Đang tìm tín hiệu...
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center leading-relaxed">
        Đặt mã QR cá nhân của bạn vào trung tâm khung ngắm camera để hệ thống tự
        động nhận diện và quét GPS ngầm.
      </p>
    </div>
  );
}
