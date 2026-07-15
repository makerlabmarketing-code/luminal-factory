// app/admin/employees/page.tsx
import { getAdminEmployeeListData } from '@/services/server/adminEmployeeData';
import AdminEmployeesClient from './AdminEmployeesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AdminEmployeesPage() {
  const employeeListData = await getAdminEmployeeListData();

  return <AdminEmployeesClient initialData={employeeListData} />;
}
