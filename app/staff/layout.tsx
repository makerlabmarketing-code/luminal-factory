// app/staff/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListTodo, ShoppingBag, MapPin, LogOut } from 'lucide-react';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navs = [
    { name: 'Vào Ca', path: '/staff/checkin', icon: MapPin },
    { name: 'Nhận Việc', path: '/staff/tasks', icon: ListTodo },
    { name: 'Báo Vật Tư/Chi', path: '/staff/expenses', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 pb-20 overflow-y-auto">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-around items-center z-50">
        {navs.map((nav) => {
          const isActive = pathname === nav.path;
          return (
            <Link key={nav.path} href={nav.path} className={`flex flex-col items-center gap-1 p-2 transition ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
              <nav.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{nav.name}</span>
            </Link>
          );
        })}
        <Link href="/" className="flex flex-col items-center gap-1 p-2 text-slate-600"><LogOut className="w-5 h-5" /><span className="text-[10px] font-bold">Rời Ca</span></Link>
      </nav>
    </div>
  );
}