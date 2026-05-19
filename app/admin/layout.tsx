// app/admin/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminGatekeeper from './gatekeeper';
import { LayoutDashboard, Users, Settings, ClipboardList, CalendarDays, Database, Mail, PiggyBank, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Tổng quan & Giao dịch', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Gán Việc & Theo dõi Phase', path: '/admin/tasks', icon: ClipboardList },
    { name: 'Lịch Chấm Công Ca', path: '/admin/attendance', icon: CalendarDays },
    { name: 'Hồ Sơ Nhân Sự', path: '/admin/employees', icon: Users },
    { name: 'Quản Lý Danh Mục DB', path: '/admin/metadata', icon: Database },
    { name: 'Sổ Cái Vốn & Chi Tiêu', path: '/admin/capital', icon: PiggyBank },
    { name: 'Mẫu Email Template', path: '/admin/email-editor', icon: Mail },
    { name: 'Cấu Hình Trung Tâm', path: '/admin/settings', icon: Settings },
  ];

  return (
    <AdminGatekeeper>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-black text-blue-500 tracking-wider">LUMINAL HQ</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hệ điều hành xưởng in</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><item.icon className="w-4 h-4" />{item.name}</Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-800"><Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 text-xs font-bold"><LogOut className="w-4 h-4" /> Thoát Admin</Link></div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-slate-950">{children}</main>
      </div>
    </AdminGatekeeper>
  );
}