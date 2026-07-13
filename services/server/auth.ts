import 'server-only';

import { createClient } from '@/utils/supabase/server';

export class AuthFlowError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthFlowError';
    this.status = status;
  }
}

export interface ServerEmployee {
  id: number | string;
  auth_user_id?: string | null;
  employee_id?: number | string | null;
  full_name: string;
  email?: string | null;
  title?: string | null;
  status?: string | null;
  role?: string | null;
  is_manager?: boolean | null;
  is_active?: boolean | null;
  branch?: string | null;
  branch_code?: string | null;
  phone?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  hourly_rate?: number | string | null;
  base_salary_per_hour?: number | string | null;
}

export interface AuthContext {
  authUserId: string;
  email: string | null;
  employee: ServerEmployee;
}

export const STAFF_EMPLOYEE_SELECT =
  'id, auth_user_id, employee_id, full_name, email, title, status, role, is_manager, is_active, branch, branch_code, phone, bank_name, bank_account_number, hourly_rate, base_salary_per_hour';

function normalizeRole(role?: string | null): string {
  return (role || '').trim().toUpperCase();
}

export function isActiveEmployee(employee: ServerEmployee): boolean {
  const status = (employee.status || '').trim().toUpperCase();

  return employee.is_active !== false && status !== 'INACTIVE' && status !== 'LOCKED';
}

export function hasAdminAccess(employee: ServerEmployee): boolean {
  const role = normalizeRole(employee.role);

  return isActiveEmployee(employee) && (role === 'ADMIN' || role === 'OWNER');
}

export function toPublicStaffEmployee(employee: ServerEmployee) {
  return {
    id: employee.id,
    employee_id: employee.employee_id ?? null,
    full_name: employee.full_name,
    email: employee.email ?? null,
    title: employee.title ?? null,
    status: employee.status ?? null,
    branch: employee.branch ?? null,
    branch_code: employee.branch_code ?? null,
    phone: employee.phone ?? null,
    bank_name: employee.bank_name ?? null,
    bank_account_number: employee.bank_account_number ?? null,
    hourly_rate: employee.hourly_rate ?? null,
    base_salary_per_hour: employee.base_salary_per_hour ?? null,
  };
}

export async function getServerAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const user = userResult.user;

  if (userError || !user) return null;

  const email = user.email || null;
  if (!email) return null;

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select(STAFF_EMPLOYEE_SELECT)
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (employeeError || !employee) return null;

  return {
    authUserId: user.id,
    email,
    employee: employee as ServerEmployee,
  };
}

export async function requireAuthenticatedEmployee(): Promise<AuthContext> {
  const authContext = await getServerAuthContext();

  if (!authContext) {
    throw new AuthFlowError(401, 'Vui lòng đăng nhập để tiếp tục.');
  }

  if (!isActiveEmployee(authContext.employee)) {
    throw new AuthFlowError(403, 'Tài khoản nhân sự chưa được phép truy cập.');
  }

  return authContext;
}

export async function requireAdminEmployee(): Promise<AuthContext> {
  const authContext = await requireAuthenticatedEmployee();

  if (!hasAdminAccess(authContext.employee)) {
    throw new AuthFlowError(403, 'Bạn không có quyền quản trị.');
  }

  return authContext;
}
