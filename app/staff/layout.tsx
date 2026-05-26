// app/staff/layout.tsx
'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2">
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Đang khởi động cổng thông tin nhà máy...</span>
      </div>
    }>
      <StaffAuthWrapper>{children}</StaffAuthWrapper>
    </Suspense>
  );
}

function StaffAuthWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // 🔥 KHÓA CHỐNG LỖI HYDRATION TRÊN NEXTJS

  useEffect(() => {
    // Ưu tiên Token trên URL, nếu không có thì bốc từ bộ nhớ máy lên
    const urlToken = searchParams.get('token');
    const savedToken = localStorage.getItem('current_staff_token');

    if (urlToken) {
      localStorage.setItem('current_staff_token', urlToken);
      setActiveToken(urlToken);
    } else if (savedToken) {
      setActiveToken(savedToken);
    }
    
    // Đánh dấu đã mounted hoàn toàn ở phía client-side
    setMounted(true);
  }, [searchParams]);

  // Trong lúc Server đang render hoặc Front-end đang đọc token ngầm, giữ màn hình chờ sạch sẽ
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3 select-none">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="tracking-wider uppercase text-[9px] text-slate-500 font-bold">Đang đồng bộ ma trận định danh...</span>
      </div>
    );
  }

  // Nếu đã kiểm tra xong hoàn toàn mà thực sự link không mang theo Token định danh
  if (!activeToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm space-y-5 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl animate-fadeIn">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto text-lg font-bold">
            ⚠️
          </div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">LỖI XÁC THỰC ĐƯỜNG DẪN</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Đường dẫn truy cập của sếp bị thiếu tham số mã định danh cá nhân. Vui lòng click trực tiếp vào đúng <b>Link định danh bảo mật</b> được hệ thống cấp riêng để vào xưởng ca máy!
          </p>
          <a href="/" className="block w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-500 hover:text-white transition">
            Quay về cổng Gateway tổng
          </a>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
}