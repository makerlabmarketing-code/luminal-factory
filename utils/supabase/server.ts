import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabasePublicKey, getSupabaseUrl } from './env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublicKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot persist cookies; Route Handlers can.
        }
      },
    },
  });
}

export function createServerSupabaseClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
