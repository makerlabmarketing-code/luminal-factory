// app/staff/layout.tsx
import { redirect } from 'next/navigation';
import { canAccessStaff, getServerAuthContext } from '@/services/server/auth';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const authContext = await getServerAuthContext();

  if (!authContext) {
    redirect('/');
  }

  const staffAccess = await canAccessStaff(authContext);

  if (!staffAccess.allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
          <h1 className="text-base font-bold text-white">Tài khoản chưa được cấp quyền truy cập</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Vui lòng liên hệ người quản trị để được cấp quyền vào khu vực nhân viên.
          </p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
}
