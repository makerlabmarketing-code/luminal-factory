import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from './env';

function getSupabaseAdminKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!key) {
    throw new Error('Thiếu cấu hình Supabase secret key cho thao tác tài khoản.');
  }

  return key;
}

export function createSupabaseAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAdminKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
