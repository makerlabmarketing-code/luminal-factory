export const DEFAULT_APP_BASE_URL = 'https://luminalfactory.com';
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const UPDATE_PASSWORD_PATH = '/auth/update-password';
export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
export const STAFF_PORTAL_PATH = '/staff/portal';

const allowedRedirectPaths = new Set([
  AUTH_CALLBACK_PATH,
  UPDATE_PASSWORD_PATH,
  ADMIN_DASHBOARD_PATH,
  STAFF_PORTAL_PATH,
  '/',
]);

export interface PasswordValidationResult {
  ok: boolean;
  message?: string;
}

export type AuthCallbackAction =
  | {
      kind: 'code';
      code: string;
      redirectPath: string;
    }
  | {
      kind: 'otp';
      tokenHash: string;
      type: 'invite' | 'recovery';
      redirectPath: string;
    }
  | {
      kind: 'error';
      redirectPath: string;
      message: string;
    };

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) return null;

  const candidate = value.startsWith('http') ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;

    return trimTrailingSlash(url.origin);
  } catch {
    return null;
  }
}

export function getConfiguredAppBaseUrl(
  env: Record<string, string | undefined> = process.env
): string {
  return (
    normalizeBaseUrl(env.NEXT_PUBLIC_APP_BASE_URL) ||
    normalizeBaseUrl(env.VERCEL_URL) ||
    normalizeBaseUrl(
      env.CODESPACE_NAME && env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
        ? `${env.CODESPACE_NAME}-3000.${env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
        : undefined
    ) ||
    DEFAULT_APP_BASE_URL
  );
}

export function getRequestBaseUrl(
  requestUrl: string,
  env: Record<string, string | undefined> = process.env
): string {
  const configuredBaseUrl = getConfiguredAppBaseUrl(env);
  if (configuredBaseUrl !== DEFAULT_APP_BASE_URL) return configuredBaseUrl;

  try {
    return trimTrailingSlash(new URL(requestUrl).origin);
  } catch {
    return configuredBaseUrl;
  }
}

export function isSafeInternalRedirectPath(value: string | null | undefined): boolean {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;

  try {
    const parsed = new URL(value, DEFAULT_APP_BASE_URL);
    if (parsed.origin !== DEFAULT_APP_BASE_URL) return false;

    return allowedRedirectPaths.has(parsed.pathname);
  } catch {
    return false;
  }
}

export function resolveSafeRedirectPath(
  value: string | null | undefined,
  fallbackPath = ADMIN_DASHBOARD_PATH
): string {
  return isSafeInternalRedirectPath(value) ? value! : fallbackPath;
}

export function parseAuthCallbackAction(searchParams: URLSearchParams): AuthCallbackAction {
  const fallbackPath = UPDATE_PASSWORD_PATH;
  const redirectPath = resolveSafeRedirectPath(searchParams.get('next'), fallbackPath);

  if (searchParams.get('error')) {
    return {
      kind: 'error',
      redirectPath: fallbackPath,
      message: 'Link không hợp lệ hoặc đã hết hạn.',
    };
  }

  const code = searchParams.get('code');
  if (code) {
    return {
      kind: 'code',
      code,
      redirectPath,
    };
  }

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  if (tokenHash && (type === 'invite' || type === 'recovery')) {
    return {
      kind: 'otp',
      tokenHash,
      type,
      redirectPath,
    };
  }

  return {
    kind: 'error',
    redirectPath: fallbackPath,
    message: 'Link không hợp lệ hoặc đã hết hạn.',
  };
}

export function buildAuthRedirectUrl(baseUrl: string, path = AUTH_CALLBACK_PATH): string {
  const safePath = resolveSafeRedirectPath(path, AUTH_CALLBACK_PATH);
  return new URL(safePath, trimTrailingSlash(baseUrl)).toString();
}

export function validateNewPassword(
  password: string,
  confirmPassword: string
): PasswordValidationResult {
  if (password.length < 8) {
    return { ok: false, message: 'Mật khẩu cần có ít nhất 8 ký tự.' };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: 'Hai mật khẩu chưa giống nhau.' };
  }

  return { ok: true };
}
