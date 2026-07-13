import { buildPasswordRecoveryRedirectUrl, getAppBaseUrlConfigError } from './flow';

interface PasswordRecoveryAuthClient {
  resetPasswordForEmail(
    email: string,
    options: {
      redirectTo: string;
    }
  ): Promise<unknown>;
}

export function getPasswordRecoveryConfigurationError(
  appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL
): string | null {
  return getAppBaseUrlConfigError(appBaseUrl)
    ? 'Cấu hình đặt lại mật khẩu chưa hợp lệ. Vui lòng liên hệ quản trị viên.'
    : null;
}

export async function sendPasswordRecoveryEmail(
  auth: PasswordRecoveryAuthClient,
  email: string,
  appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL
): Promise<unknown> {
  return auth.resetPasswordForEmail(email.trim(), {
    redirectTo: buildPasswordRecoveryRedirectUrl(appBaseUrl),
  });
}
