import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (_client) return _client;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

/** Admin client that REQUIRES the service role key — use for storage operations that bypass RLS */
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for storage operations. Add it to your environment variables.');
  return createClient(url, key, { auth: { persistSession: false } });
}
