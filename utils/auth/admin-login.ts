import { ADMIN_DASHBOARD_PATH } from './flow';

export const ADMIN_LOGIN_MESSAGES = {
  invalidCredentials: 'Email hoặc mật khẩu chưa đúng.',
  unconfirmedSession: 'Phiên đăng nhập chưa được xác nhận. Vui lòng đăng nhập lại.',
  missingEmployee: 'Tài khoản chưa được liên kết với nhân viên.',
  forbidden: 'Bạn không có quyền truy cập khu vực quản trị.',
  serverError: 'Không thể xác minh quyền quản trị. Vui lòng thử lại.',
} as const;

export const ADMIN_LOGIN_STEP_MESSAGES = {
  sign_in_started: 'Đang đăng nhập...',
  sign_in_succeeded: 'Đã xác thực tài khoản.',
  admin_verify_started: 'Đang xác minh quyền quản trị.',
  admin_verify_response_status: 'Đã nhận phản hồi xác minh quản trị.',
  admin_verify_succeeded: 'Đã xác minh quyền quản trị.',
  navigation_started: 'Đang chuyển tới bảng điều khiển.',
} as const;

export type AdminLoginStep = keyof typeof ADMIN_LOGIN_STEP_MESSAGES;

export type AdminLoginResult =
  | {
      ok: true;
      redirectPath: string;
    }
  | {
      ok: false;
      message: string;
    };

interface AdminLoginAuthClient {
  signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{
    data?: {
      session?: unknown;
      user?: unknown;
    } | null;
    error?: unknown;
  }>;
}

interface AdminSessionVerificationResponse {
  ok: boolean;
  status: number;
  json(): Promise<{
    error?: string;
    code?: string;
    status?: number;
  }>;
}

interface AdminLoginInput {
  auth: AdminLoginAuthClient;
  email: string;
  password: string;
  verifyAdminSession: () => Promise<AdminSessionVerificationResponse>;
  onStep?: (step: AdminLoginStep, status?: number) => void;
}

function toAdminVerificationMessage(
  status: number,
  errorMessage?: string,
  errorCode?: string
): string {
  if (status === 401) return ADMIN_LOGIN_MESSAGES.unconfirmedSession;
  if (status === 404 || errorCode === 'employee_not_linked') {
    return ADMIN_LOGIN_MESSAGES.missingEmployee;
  }
  if (errorMessage === ADMIN_LOGIN_MESSAGES.missingEmployee) {
    return ADMIN_LOGIN_MESSAGES.missingEmployee;
  }
  if (status === 403 || errorMessage === ADMIN_LOGIN_MESSAGES.forbidden) {
    return ADMIN_LOGIN_MESSAGES.forbidden;
  }

  return ADMIN_LOGIN_MESSAGES.serverError;
}

export async function verifyAdminSessionWithApi(): Promise<AdminSessionVerificationResponse> {
  return fetch('/api/admin/auth', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
  });
}

export function navigateToAdminDashboard(redirectPath: string): void {
  window.location.replace(redirectPath);
}

export async function submitAdminLogin({
  auth,
  email,
  password,
  verifyAdminSession,
  onStep,
}: AdminLoginInput): Promise<AdminLoginResult> {
  onStep?.('sign_in_started');
  const { data: signInData, error: signInError } = await auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (signInError || !signInData?.session || !signInData?.user) {
    return {
      ok: false,
      message: ADMIN_LOGIN_MESSAGES.invalidCredentials,
    };
  }

  onStep?.('sign_in_succeeded');
  onStep?.('admin_verify_started');

  try {
    const verificationResponse = await verifyAdminSession();
    onStep?.('admin_verify_response_status', verificationResponse.status);
    if (verificationResponse.ok) {
      onStep?.('admin_verify_succeeded');
      return {
        ok: true,
        redirectPath: ADMIN_DASHBOARD_PATH,
      };
    }

    const verificationPayload = await verificationResponse.json();

    return {
      ok: false,
      message: toAdminVerificationMessage(
        verificationResponse.status,
        verificationPayload.error,
        verificationPayload.code
      ),
    };
  } catch {
    return {
      ok: false,
      message: ADMIN_LOGIN_MESSAGES.serverError,
    };
  }
}
