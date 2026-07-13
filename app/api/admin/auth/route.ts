// app/api/admin/auth/route.ts
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  AuthFailureStage,
  AuthFlowError,
  AuthFlowErrorCode,
  requireAdminEmployee,
} from '@/services/server/auth';

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'));
}

function logAdminAuthDiagnostic(
  diagnostic: Record<string, boolean | number | string | null>
) {
  console.warn('[admin-auth]', diagnostic);
}

function authErrorCode(status: number): AuthFlowErrorCode {
  if (status === 401) return 'session_not_verified';
  if (status === 404) return 'employee_not_linked';
  if (status === 403) return 'admin_forbidden';

  return 'admin_verification_failed';
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

function toErrorResponse(error: unknown, hasAuthCookie: boolean) {
  if (error instanceof AuthFlowError) {
    const diagnostic = {
      has_auth_cookie: hasAuthCookie,
      get_user_success: error.safeDetails?.get_user_success ?? error.status !== 401,
      employee_lookup_started:
        error.failureStage === 'employee_lookup' ||
        error.failureStage === 'employee_status' ||
        error.failureStage === 'admin_role',
      employee_lookup_result_count: error.safeDetails?.employee_lookup_result_count ?? null,
      failure_stage: error.failureStage,
      code: error.code,
      supabase_error_code: error.safeDetails?.supabase_error_code ?? null,
      supabase_error_message: error.safeDetails?.supabase_error_message ?? null,
      supabase_error_hint: error.safeDetails?.supabase_error_hint ?? null,
      supabase_error_details: error.safeDetails?.supabase_error_details ?? null,
    };

    logAdminAuthDiagnostic(diagnostic);

    return jsonNoStore(
      {
        success: false,
        status: error.status,
        code: error.code,
        failure_stage: error.failureStage,
        diagnostics: diagnostic,
        error: error.message,
      },
      { status: error.status }
    );
  }

  const failureStage: AuthFailureStage = 'unknown';
  const diagnostic = {
    has_auth_cookie: hasAuthCookie,
    get_user_success: false,
    employee_lookup_started: false,
    employee_lookup_result_count: null,
    failure_stage: failureStage,
    code: authErrorCode(500),
  };

  logAdminAuthDiagnostic(diagnostic);

  return jsonNoStore(
    {
      success: false,
      status: 500,
      code: 'admin_verification_failed',
      failure_stage: failureStage,
      diagnostics: diagnostic,
      error: 'Không thể xác minh quyền quản trị. Vui lòng thử lại.',
    },
    { status: 500 }
  );
}

async function verifyAdminSession(request: NextRequest) {
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  try {
    await requireAdminEmployee();

    logAdminAuthDiagnostic({
      has_auth_cookie: hasAuthCookie,
      get_user_success: true,
      employee_lookup_started: true,
      employee_lookup_result_count: 1,
      failure_stage: 'none',
      code: 'admin_verified',
    });

    return jsonNoStore({
      success: true,
      status: 200,
      code: 'admin_verified',
      message: 'Phiên quản trị hợp lệ.',
    });
  } catch (error) {
    return toErrorResponse(error, hasAuthCookie);
  }
}

export async function GET(request: NextRequest) {
  return verifyAdminSession(request);
}

export async function POST(request: NextRequest) {
  return verifyAdminSession(request);
}
