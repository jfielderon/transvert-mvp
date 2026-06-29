import { env } from '@/config/env';
import { saveAppProfile, type AppProfile } from '@/storage/appProfile';

export type AuthProvider = 'google' | 'apple' | 'yahoo';

type SupabaseUser = {
  id?: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
};

function authBase() {
  return env.supabaseUrl ? `${env.supabaseUrl.replace(/\/$/, '')}/auth/v1` : '';
}

function appRedirectUrl() {
  if (typeof window !== 'undefined') return `${window.location.origin}/sign-in`;
  return 'transvert://sign-in';
}

function publicKey() {
  return env.supabaseAnonKey ?? '';
}

function withApiKey(path: string) {
  const key = publicKey();
  const joiner = path.includes('?') ? '&' : '?';
  return `${path}${joiner}apikey=${encodeURIComponent(key)}`;
}

function headers(accessToken?: string) {
  const key = publicKey();
  return {
    apikey: key,
    Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export function hasAuthConfig() {
  return Boolean(env.supabaseUrl && publicKey());
}

function friendlySupabaseMessage(text: string) {
  try {
    const payload = JSON.parse(text);
    const message = payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error;
    if (payload?.code === 'PGRST125' || /invalid path specified/i.test(message ?? '')) {
      return 'Supabase URL is pointing at the REST API path. Set EXPO_PUBLIC_SUPABASE_URL to the project URL only, for example https://xqqkfoqpyntttslxbdxc.supabase.co, then redeploy.';
    }
    return message ?? 'Could not send sign-in email.';
  } catch {
    return text || 'Could not send sign-in email.';
  }
}

export async function sendMagicLink(email: string) {
  if (!hasAuthConfig()) throw new Error('Supabase Auth is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');

  const response = await fetch(withApiKey(`${authBase()}/otp`), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email,
      create_user: true,
      should_create_user: true,
      type: 'magiclink',
      options: { email_redirect_to: appRedirectUrl() },
    }),
  });

  if (!response.ok) {
    throw new Error(friendlySupabaseMessage(await response.text().catch(() => '')));
  }

  return true;
}

export function startOAuth(provider: AuthProvider) {
  if (!hasAuthConfig()) throw new Error('Supabase Auth is not configured yet.');
  const params = new URLSearchParams({
    provider,
    redirect_to: appRedirectUrl(),
    apikey: publicKey(),
  });
  const url = `${authBase()}/authorize?${params.toString()}`;
  if (typeof window !== 'undefined') {
    window.location.href = url;
    return true;
  }
  return false;
}

function parseHashSession() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  const query = window.location.search.replace(/^\?/, '');
  const params = new URLSearchParams(hash || query);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token') ?? undefined;
  if (!accessToken) return null;
  return { accessToken, refreshToken };
}

export async function fetchUser(accessToken: string): Promise<SupabaseUser | null> {
  if (!hasAuthConfig()) return null;
  const response = await fetch(withApiKey(`${authBase()}/user`), {
    method: 'GET',
    headers: headers(accessToken),
  });
  if (!response.ok) return null;
  return response.json();
}

export async function completeRedirectSignIn(existing?: Partial<AppProfile>) {
  const session = parseHashSession();
  if (!session?.accessToken) return null;
  const user = await fetchUser(session.accessToken);
  const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0];
  const profile: AppProfile = {
    contact: user?.email ?? existing?.contact ?? '',
    name,
    provider: existing?.provider ?? 'email',
    updatesOptIn: existing?.updatesOptIn ?? true,
    atmDataOptIn: existing?.atmDataOptIn ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    userId: user?.id,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    avatarUrl: user?.user_metadata?.avatar_url,
    homeCountry: existing?.homeCountry,
    defaultCard: existing?.defaultCard,
    preferredLanguage: existing?.preferredLanguage,
    preferredCurrency: existing?.preferredCurrency,
    onboardingComplete: existing?.onboardingComplete ?? false,
  };
  await saveAppProfile(profile);
  if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
  return profile;
}

export function firstNameFromProfile(profile?: Pick<AppProfile, 'name' | 'contact'> | null) {
  const raw = profile?.name || profile?.contact?.split('@')[0] || '';
  const first = raw.split(/[ ._-]/).filter(Boolean)[0] || '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
}
