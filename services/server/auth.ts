import 'server-only';

import { createClient } from '@/utils/supabase/server';

export class AuthFlowError extends Error {
  status: number;
  code: AuthFlowErrorCode;
  failureStage: AuthFailureStage;
  safeDetails?: Record<string, boolean | number | string | null>;

  constructor({
    status,
    code,
    message,
    failureStage,
    safeDetails,
  }: {
    status: number;
    code: AuthFlowErrorCode;
    message: string;
    failureStage: AuthFailureStage;
    safeDetails?: Record<string, boolean | number | string | null>;
  }) {
    super(message);
    this.name = 'AuthFlowError';
    this.status = status;
    this.code = code;
    this.failureStage = failureStage;
    this.safeDetails = safeDetails;
  }
}

export type AuthFlowErrorCode =
  | 'session_not_verified'
  | 'employee_not_linked'
  | 'employee_inactive'
  | 'admin_forbidden'
  | 'admin_verification_failed';

export type AuthFailureStage =
  | 'auth_get_user'
  | 'employee_lookup'
  | 'employee_status'
  | 'admin_role'
  | 'unknown';

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

type AuthContextLookupResult =
  | {
      ok: true;
      authContext: AuthContext;
    }
  | {
      ok: false;
      reason:
        | 'session_not_verified'
        | 'employee_not_linked'
        | 'employee_inactive'
        | 'database_error';
      failureStage: AuthFailureStage;
      safeDetails?: Record<string, boolean | number | string | null>;
    };

export const STAFF_EMPLOYEE_SELECT =
  'id, auth_user_id, full_name, email, title, status, role, is_manager, is_active, branch, branch_code, phone, bank_name, bank_account_number, hourly_rate, base_salary_per_hour';

export const ADMIN_EMPLOYEE_AUTH_SELECT =
  'id, auth_user_id, role, status, is_active';

function normalizeRole(role?: string | null): string {
  return (role || '').trim().toUpperCase();
}

function redactSafeDatabaseText(value?: string | null): string | null {
  if (!value) return null;

  return value
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}/gi, '[uuid]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]');
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

async function getServerAuthContextLookup(
  employeeSelect = STAFF_EMPLOYEE_SELECT
): Promise<AuthContextLookupResult> {
  const supabase = await createClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const user = userResult.user;

  if (userError || !user) {
    return {
      ok: false,
      reason: 'session_not_verified',
      failureStage: 'auth_get_user',
      safeDetails: {
        get_user_success: false,
      },
    };
  }

  const email = user.email || null;
  if (!email) {
    return {
      ok: false,
      reason: 'session_not_verified',
      failureStage: 'auth_get_user',
      safeDetails: {
        get_user_success: false,
      },
    };
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select(employeeSelect)
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (employeeError) {
    return {
      ok: false,
      reason: 'database_error',
      failureStage: 'employee_lookup',
      safeDetails: {
        get_user_success: true,
        employee_lookup_result_count: 0,
        supabase_error_code: employeeError.code ?? 'unknown',
        supabase_error_message: redactSafeDatabaseText(employeeError.message),
        supabase_error_hint: redactSafeDatabaseText(employeeError.hint),
        supabase_error_details: redactSafeDatabaseText(employeeError.details),
      },
    };
  }
  if (!employee) {
    return {
      ok: false,
      reason: 'employee_not_linked',
      failureStage: 'employee_lookup',
      safeDetails: {
        get_user_success: true,
        employee_lookup_result_count: 0,
      },
    };
  }

  const serverEmployee = employee as unknown as ServerEmployee;
  if (!isActiveEmployee(serverEmployee)) {
    return {
      ok: false,
      reason: 'employee_inactive',
      failureStage: 'employee_status',
      safeDetails: {
        get_user_success: true,
        employee_lookup_result_count: 1,
      },
    };
  }

  return {
    ok: true,
    authContext: {
      authUserId: user.id,
      email,
      employee: serverEmployee,
    },
  };
}

export async function getServerAuthContext(): Promise<AuthContext | null> {
  const result = await getServerAuthContextLookup();

  return result.ok ? result.authContext : null;
}

export async function getServerAdminAuthContext(): Promise<AuthContext | null> {
  const result = await getServerAuthContextLookup(ADMIN_EMPLOYEE_AUTH_SELECT);

  return result.ok ? result.authContext : null;
}

export async function requireAuthenticatedEmployee(): Promise<AuthContext> {
  const result = await getServerAuthContextLookup();

  if (!result.ok) {
    if (result.reason === 'employee_not_linked') {
      throw new AuthFlowError({
        status: 404,
        code: 'employee_not_linked',
        message: 'Tài khoản chưa được liên kết với nhân viên.',
        failureStage: result.failureStage,
        safeDetails: result.safeDetails,
      });
    }

    if (result.reason === 'employee_inactive') {
      throw new AuthFlowError({
        status: 403,
        code: 'employee_inactive',
        message: 'Bạn không có quyền truy cập khu vực quản trị.',
        failureStage: result.failureStage,
        safeDetails: result.safeDetails,
      });
    }

    if (result.reason === 'database_error') {
      throw new AuthFlowError({
        status: 500,
        code: 'admin_verification_failed',
        message: 'Không thể xác minh quyền quản trị. Vui lòng thử lại.',
        failureStage: result.failureStage,
        safeDetails: result.safeDetails,
      });
    }

    throw new AuthFlowError({
      status: 401,
      code: 'session_not_verified',
      message: 'Phiên đăng nhập chưa được xác nhận. Vui lòng đăng nhập lại.',
      failureStage: result.failureStage,
      safeDetails: result.safeDetails,
    });
  }

  return result.authContext;
}

export async function requireAdminEmployee(): Promise<AuthContext> {
  const result = await getServerAuthContextLookup(ADMIN_EMPLOYEE_AUTH_SELECT);

  if (!result.ok) {
    if (result.reason === 'employee_not_linked') {
      throw new AuthFlowError({
        status: 404,
        code: 'employee_not_linked',
        message: 'Tài khoản chưa được liên kết với nhân viên.',
        failureStage: result.failureStage,
        safeDetails: result.safeDetails,
      });
    }

    if (result.reason === 'employee_inactive') {
      throw new AuthFlowError({
        status: 403,
        code: 'employee_inactive',
        message: 'Bạn không có quyền truy cập khu vực quản trị.',
        failureStage: result.failureStage,
        safeDetails: result.safeDetails,
      });
    }

    if (result.reason === 'database_error') {
      throw new AuthFlowError({
        status: 500,
        code: 'admin_verification_failed',
        message: 'Không thể xác minh quyền quản trị. Vui lòng thử lại.',
        failureStage: result.failureStage,
        safeDetails: result.safeDetails,
      });
    }

    throw new AuthFlowError({
      status: 401,
      code: 'session_not_verified',
      message: 'Phiên đăng nhập chưa được xác nhận. Vui lòng đăng nhập lại.',
      failureStage: result.failureStage,
      safeDetails: result.safeDetails,
    });
  }

  const authContext = result.authContext;

  if (!hasAdminAccess(authContext.employee)) {
    throw new AuthFlowError({
      status: 403,
      code: 'admin_forbidden',
      message: 'Bạn không có quyền truy cập khu vực quản trị.',
      failureStage: 'admin_role',
      safeDetails: {
        get_user_success: true,
        employee_lookup_result_count: 1,
      },
    });
  }

  return authContext;
}
