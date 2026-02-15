import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}
function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}
function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function isSupabaseConfigured(): boolean {
  const url = getUrl();
  const key = getAnonKey();
  return (
    !!url &&
    url !== 'https://your-project.supabase.co' &&
    !!key &&
    key !== 'your-anon-key'
  );
}

// Lazy singleton clients – only created when actually needed at runtime
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(getUrl(), getAnonKey());
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceKey = getServiceKey();
    _supabaseAdmin = createClient(getUrl(), serviceKey || getAnonKey());
  }
  return _supabaseAdmin;
}

// Keep backward-compatible named exports as getters
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
