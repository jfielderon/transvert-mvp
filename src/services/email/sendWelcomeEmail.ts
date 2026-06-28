import type { AppProfile } from '@/storage/appProfile';

const SENT_KEY = 'transvert:welcome-email-sent:v1';

function storageKey(email: string) {
  return `${SENT_KEY}:${email.toLowerCase()}`;
}

export async function sendWelcomeEmail(profile: Pick<AppProfile, 'contact' | 'name' | 'updatesOptIn'>) {
  const email = profile.contact?.trim().toLowerCase();
  if (!email || !profile.updatesOptIn) return { ok: false, skipped: true };

  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(storageKey(email))) {
      return { ok: true, skipped: true };
    }

    const response = await fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName: profile.name }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error ?? 'Welcome email failed.');

    if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey(email), new Date().toISOString());
    return { ok: true, id: payload?.id };
  } catch (error) {
    console.warn('[email] welcome failed', error);
    return { ok: false, error };
  }
}
