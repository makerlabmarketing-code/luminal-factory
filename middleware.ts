import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/staff/portal') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/staff';
    return NextResponse.redirect(redirectUrl, 308);
  }

  const { supabase, response } = createClient(request);

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
