import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Checks whether Supabase environment variables are properly defined.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

let browserClient: SupabaseClient | null = null;

/**
 * Client-safe Supabase instance (uses anonymous key & Row Level Security).
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
};

/**
 * Checks whether Supabase service-role credentials are configured for backend writes/reads.
 */
export const isServiceSupabaseConfigured = (): boolean => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    serviceKey &&
    serviceKey.length > 20
  );
};

/**
 * Server-side Admin Supabase instance (uses Service Role Key for privileged RLS-protected ops).
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is missing so callers never silently downgrade to anon.
 * NEVER expose this to the browser!
 */
export const getServiceSupabase = (): SupabaseClient | null => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    if (supabaseUrl && process.env.NODE_ENV === 'production') {
      console.error('[Supabase] SUPABASE_SERVICE_ROLE_KEY is not configured; refusing anon fallback.');
    }
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
