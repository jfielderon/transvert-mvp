import { env } from '@/config/env';

export type SupabaseStatus = 'not-configured' | 'ready';

export function getSupabaseStatus(): SupabaseStatus {
  return env.supabaseUrl && env.supabaseAnonKey ? 'ready' : 'not-configured';
}

export function getSupabaseConfig() {
  return {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    status: getSupabaseStatus(),
  };
}
