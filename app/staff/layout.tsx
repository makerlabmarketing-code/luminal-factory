// app/staff/layout.tsx
import StaffLoginForm from './StaffLoginForm';
import { getServerAuthContext, isActiveEmployee } from '@/services/server/auth';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const authContext = await getServerAuthContext();

  if (!authContext) {
    return <StaffLoginForm message="Vui lòng đăng nhập bằng tài khoản nhân sự." />;
  }

  if (!isActiveEmployee(authContext.employee)) {
    return <StaffLoginForm message="Tài khoản nhân sự chưa được phép truy cập." />;
  }

  return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
}
