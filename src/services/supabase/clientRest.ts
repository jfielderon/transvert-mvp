import { env } from '@/config/env';
import { getAppProfile } from '@/storage/appProfile';

function restBase() {
  return env.supabaseUrl ? `${env.supabaseUrl.replace(/\/$/, '')}/rest/v1` : '';
}

function authHeaders(prefer = 'return=minimal', token?: string) {
  const bearer = token || env.supabaseAnonKey || '';
  return {
    apikey: env.supabaseAnonKey || '',
    Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  };
}

export function hasSupabaseRestConfig() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export async function insertClientRow(table: string, payload: Record<string, unknown>) {
  if (!hasSupabaseRestConfig()) return { ok: false, skipped: true };
  const profile = await getAppProfile();
  const response = await fetch(`${restBase()}/${table}`, {
    method: 'POST',
    headers: authHeaders('return=minimal', profile?.accessToken),
    body: JSON.stringify(payload),
  });
  if (!response.ok) return { ok: false, error: await response.text().catch(() => '') };
  return { ok: true };
}

export async function upsertClientRow(table: string, payload: Record<string, unknown>, conflictKey: string) {
  if (!hasSupabaseRestConfig()) return { ok: false, skipped: true };
  const profile = await getAppProfile();
  const response = await fetch(`${restBase()}/${table}?on_conflict=${encodeURIComponent(conflictKey)}`, {
    method: 'POST',
    headers: authHeaders('resolution=merge-duplicates,return=minimal', profile?.accessToken),
    body: JSON.stringify(payload),
  });
  if (!response.ok) return { ok: false, error: await response.text().catch(() => '') };
  return { ok: true };
}
