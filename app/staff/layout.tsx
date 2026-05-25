// app/staff/layout.tsx
'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Clock, ClipboardList, Banknote, User, RefreshCcw, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">
        <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> Đang khởi động cổng Portal...
      </div>
    }>
      <StaffAuthWrapper>{children}</StaffAuthWrapper>
    </Suspense>
  );
}

function StaffAuthWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    // 🔥 CHIẾN LƯỢC GHIM CHẶT TOKEN: Ưu tiên Token trên URL, nếu không có thì bốc từ bộ nhớ máy lên
    const urlToken = searchParams.get('token');
    const savedToken = localStorage.getItem('current_staff_token');

    if (urlToken) {
      localStorage.setItem('current_staff_token', urlToken);
      setActiveToken(urlToken);
    } else if (savedToken) {
      setActiveToken(savedToken);
    }
  }, [searchParams]);

  // Nếu hoàn toàn không phát hiện Token định danh, khóa màn hình yêu cầu quét QR
  if (!activeToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">LỖI XÁC THỰC LINK</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Đường dẫn thiếu mã định danh token. Sếp vui lòng sử dụng link quét QR Code chính chủ do Admin cấp để truy cập cổng ca máy!</p>
          <Link href="/" className="block w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-500 hover:text-white transition">Quay về cổng Gateway</Link>
        </div>
      </div>
    );
  }

  // Khởi tạo danh mục 4 Tab menu cốt lõi
  const menuItems = [
    { name: 'Ca Máy', icon: Clock, href: '/staff/attendance' },
    { name: 'Nhận Việc', icon: ClipboardList, href: '/staff/tasks' },
    { name: 'Khai Chi', icon: Banknote, href: '/staff/expenses' },
    { name: 'Cá Nhân', icon: User, href: '/staff/profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {children}

      {/* BOTTOM NAV BAR TRUYỀN TOKEN XUYÊN SUỐT */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-3 z-50 flex justify-around items-center shadow-2xl">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            // 🔥 VÁ ĐƯỜNG LINK: Tự động nối đuôi ?token=... vào mọi nút bấm di chuyển tab
            <Link 
              key={item.href} 
              href={`${item.href}?token=${activeToken}`} 
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                isActive ? 'text-blue-400 scale-105 font-black' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}