// app/admin/layout.tsx
import AdminLoginForm from './AdminLoginForm';
import AdminShell from './AdminShell';
import { getServerAuthContext, hasAdminAccess } from '@/services/server/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authContext = await getServerAuthContext();

  if (!authContext) {
    return <AdminLoginForm message="Vui lòng đăng nhập bằng tài khoản quản trị." />;
  }

  if (!hasAdminAccess(authContext.employee)) {
    return <AdminLoginForm message="Tài khoản hiện tại không có quyền quản trị." />;
  }

  return <AdminShell>{children}</AdminShell>;
}
