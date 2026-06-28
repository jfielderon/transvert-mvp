import { env } from '@/config/env';
import { getAppProfile } from '@/storage/appProfile';

function restBase() {
  return env.supabaseUrl ? `${env.supabaseUrl.replace(/\/$/, '')}/rest/v1` : '';
}

export function hasSupabaseRestConfig() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export async function insertClientRow(table: string, payload: Record<string, unknown>) {
  if (!hasSupabaseRestConfig()) return { ok: false, skipped: true };
  const profile = await getAppProfile();
  const token = profile?.accessToken || env.supabaseAnonKey || '';
  const response = await fetch(`${restBase()}/${table}`, {
    method: 'POST',
    headers: {
      apikey: env.supabaseAnonKey || '',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return { ok: false, error: await response.text().catch(() => '') };
  return { ok: true };
}
