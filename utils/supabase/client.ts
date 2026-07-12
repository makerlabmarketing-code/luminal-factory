import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicKey, getSupabaseUrl } from './env';

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublicKey());
}

export const createBrowserSupabaseClient = createClient;
export const supabase = createClient();
