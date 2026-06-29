import { createClient, type User } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { saveAppProfile, type AppProfile } from '@/storage/appProfile';

export type AuthProvider = 'google' | 'apple' | 'yahoo';

let client: ReturnType<typeof createClient> | null = null;

function supabaseUrl() {
  return env.supabaseUrl?.replace(/\/$/, '') ?? '';
}

function publicKey() {
  return env.supabaseAnonKey ?? '';
}

function appRedirectUrl() {
  if (typeof window !== 'undefined') return `${window.location.origin}/sign-in`;
  return 'transvert://sign-in';
}

function getClient() {
  if (!hasAuthConfig()) return null;
  if (!client) {
    client = createClient(supabaseUrl(), publicKey(), {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: false,
      },
    });
  }
  return client;
}

export function hasAuthConfig() {
  return Boolean(supabaseUrl() && publicKey());
}

function friendlySupabaseMessage(error?: { message?: string } | null) {
  const message = error?.message ?? '';
  if (/invalid path specified/i.test(message)) {
    return 'Supabase URL is pointing at the REST API path. Set EXPO_PUBLIC_SUPABASE_URL to the project URL only, for example https://xqqkfoqpyntttslxbdxc.supabase.co, then redeploy.';
  }
  return message || 'Could not complete sign-in.';
}

export async function sendMagicLink(email: string) {
  const supabase = getClient();
  if (!supabase) throw new Error('Supabase Auth is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: appRedirectUrl(),
    },
  });

  if (error) throw new Error(friendlySupabaseMessage(error));
  return true;
}

export async function startOAuth(provider: AuthProvider) {
  const supabase = getClient();
  if (!supabase) throw new Error('Supabase Auth is not configured yet.');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: appRedirectUrl(),
      skipBrowserRedirect: true,
    },
  });

  if (error) throw new Error(friendlySupabaseMessage(error));

  if (typeof window !== 'undefined' && data?.url) {
    window.location.href = data.url;
    return true;
  }
  return Boolean(data?.url);
}

function userToProfile(user: User, existing?: Partial<AppProfile>): AppProfile {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0];
  return {
    contact: user.email ?? existing?.contact ?? '',
    name,
    provider: existing?.provider ?? 'email',
    updatesOptIn: existing?.updatesOptIn ?? true,
    atmDataOptIn: existing?.atmDataOptIn ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    userId: user.id,
    accessToken: undefined,
    refreshToken: undefined,
    avatarUrl: user.user_metadata?.avatar_url,
    homeCountry: existing?.homeCountry,
    defaultCard: existing?.defaultCard,
    preferredLanguage: existing?.preferredLanguage,
    preferredCurrency: existing?.preferredCurrency,
    onboardingComplete: existing?.onboardingComplete ?? false,
  };
}

export async function fetchUser(accessToken?: string): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();

  if (error) return null;
  return data.user ?? null;
}

export async function completeRedirectSignIn(existing?: Partial<AppProfile>) {
  const supabase = getClient();
  if (!supabase) return null;

  if (typeof window !== 'undefined') {
    const href = window.location.href;
    if (href.includes('access_token=') || href.includes('refresh_token=') || href.includes('code=')) {
      await supabase.auth.getSession();
    }
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const profile = userToProfile(data.user, existing);
  await saveAppProfile(profile);

  if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
  return profile;
}

export function firstNameFromProfile(profile?: Pick<AppProfile, 'name' | 'contact'> | null) {
  const raw = profile?.name || profile?.contact?.split('@')[0] || '';
  const first = raw.split(/[ ._-]/).filter(Boolean)[0] || '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
}
