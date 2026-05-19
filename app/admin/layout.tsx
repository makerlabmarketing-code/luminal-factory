// app/admin/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRODUCT_CATEGORIES } from '@/config/categories'; // Hút file static cấu hình
import { LayoutDashboard, Users, Layers, PiggyBank, Settings, ClipboardList, CalendarDays, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-black text-blue-500 tracking-wider">LUMINAL HQ</h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hệ điều hành xưởng in</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${pathname === '/admin/dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard className="w-4 h-4" />Tổng quan tài chính</Link>
          <Link href="/admin/tasks" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${pathname === '/admin/tasks' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><ClipboardList className="w-4 h-4" />Gán Việc Sản Xuất</Link>
          <Link href="/admin/attendance" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${pathname === '/admin/attendance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><CalendarDays className="w-4 h-4" />Lịch Chấm Công Ca</Link>
          <Link href="/admin/employees" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${pathname === '/admin/employees' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Users className="w-4 h-4" />Hồ Sơ Nhân Sự</Link>
          <Link href="/admin/job-templates" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${pathname === '/admin/job-templates' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Layers className="w-4 h-4" />Khung Quy Trình</Link>
          <Link href="/admin/capital" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${pathname === '/admin/capital' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><PiggyBank className="w-4 h-4" />Vốn & Chi Tiêu Quỹ</Link>
          <Link href="/admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${pathname === '/admin/settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Settings className="w-4 h-4" />Cấu Hình Trung Tâm</Link>

          {/* RENDERING TỰ ĐỘNG DANH MỤC CHA - CON TỪ FILE STATIC FILE */}
          <div className="pt-4 border-t border-slate-800/60 mt-3 space-y-3">
            <span className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-wider block">Danh mục sản phẩm</span>
            
            {PRODUCT_CATEGORIES.map((parent) => (
              <div key={parent.id} className="space-y-1 px-2">
                {/* Tên danh mục Cha */}
                <div className="px-2 py-1 text-xs font-bold text-blue-400 bg-slate-950/30 rounded-lg">
                  {parent.name}
                </div>
                {/* Vòng lặp hiển thị các danh mục Con rủ xuống */}
                {parent.subCategories?.map((sub, idx) => (
                  <div key={idx} className="pl-4 pr-2 py-1 text-[11px] text-slate-400 font-medium hover:text-slate-200 transition cursor-default">
                    {sub}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 text-xs font-bold"><LogOut className="w-4 h-4" /> Thoát Admin</Link>
        </div>
      </aside>

      {/* VÙNG HIỂN THỊ NỘI DUNG BÊN PHẢI */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {children}
      </main>
    </div>
  );
}