import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  UPDATE_PASSWORD_PATH,
  getRequestBaseUrl,
  parseAuthCallbackAction,
} from '@/utils/auth/flow';

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, getRequestBaseUrl(request.url)));
}

function redirectWithError(request: NextRequest) {
  return redirectTo(
    request,
    `${UPDATE_PASSWORD_PATH}?error=Link không hợp lệ hoặc đã hết hạn.`
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const action = parseAuthCallbackAction(requestUrl.searchParams);

  if (action.kind === 'error') return redirectWithError(request);

  const supabase = await createClient();

  if (action.kind === 'code') {
    const { error } = await supabase.auth.exchangeCodeForSession(action.code);
    if (error) return redirectWithError(request);

    return redirectTo(request, action.redirectPath);
  }

  if (action.kind === 'otp') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: action.tokenHash,
      type: action.type,
    });

    if (error) return redirectWithError(request);

    return redirectTo(request, action.redirectPath);
  }

  return redirectWithError(request);
}
