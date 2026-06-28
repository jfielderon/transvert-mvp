import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { PolicyFooter } from '@/components/PolicyFooter';
import { Screen } from '@/components/Screen';
import { completeRedirectSignIn, firstNameFromProfile, sendMagicLink, startOAuth, type AuthProvider } from '@/services/auth/supabaseAuth';
import { sendWelcomeAfterAuth } from '@/services/auth/welcomeAfterAuth';
import { getAppProfile, saveAppProfile, type AppProfile } from '@/storage/appProfile';
import { colors } from '@/theme/colors';

type Provider = 'email' | AuthProvider | 'guest';

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function nextRoute(profile: AppProfile | null) {
  if (!profile?.contact || profile.provider === 'guest') return '/onboarding';
  return profile.onboardingComplete ? '/scan' : '/onboarding';
}

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Could not start sign-in.';
  if (/load failed|failed to fetch|network request failed/i.test(message)) {
    return 'Supabase connection failed. Check Vercel EXPO_PUBLIC_SUPABASE_URL is the full project URL starting https:// and ending .supabase.co, then redeploy.';
  }
  return message;
}

export default function EntryScreen() {
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [contact, setContact] = useState('');
  const [updatesOptIn, setUpdatesOptIn] = useState(true);
  const [atmDataOptIn, setAtmDataOptIn] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await getAppProfile();
      const redirected = await completeRedirectSignIn(existing ?? undefined);
      const active = redirected ?? existing;
      setProfile(active);
      if (redirected) {
        await sendWelcomeAfterAuth(redirected);
        router.replace(nextRoute(redirected));
      }
    })();
  }, []);

  const continueWith = async (provider: Provider) => {
    const cleanContact = contact.trim().toLowerCase();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (provider === 'guest') {
        const guestProfile: AppProfile = {
          contact: '',
          provider: 'guest',
          updatesOptIn: false,
          atmDataOptIn,
          createdAt: new Date().toISOString(),
          onboardingComplete: false,
        };
        await saveAppProfile(guestProfile);
        router.replace('/onboarding');
        return;
      }

      if (provider === 'email') {
        if (!isValidEmail(cleanContact)) throw new Error('Enter your email so Transvert can save your profile and send your sign-in link.');
        const emailProfile: AppProfile = {
          contact: cleanContact,
          provider: 'email',
          updatesOptIn,
          atmDataOptIn,
          createdAt: new Date().toISOString(),
          onboardingComplete: false,
        };
        await saveAppProfile(emailProfile);
        await sendMagicLink(cleanContact);
        await sendWelcomeAfterAuth(emailProfile);
        setMessage('Check your email. Tap the Transvert sign-in link, then complete your profile.');
        return;
      }

      await saveAppProfile({
        contact: cleanContact,
        provider,
        updatesOptIn,
        atmDataOptIn,
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
      });
      startOAuth(provider);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstName = firstNameFromProfile(profile);
  const hasProfile = Boolean(profile?.contact && profile.provider !== 'guest');

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Transvert</Text>
        <Text style={styles.title}>See and know the world your way.</Text>
        <Text style={styles.copy}>Create your free profile to save scans, set your home currency, pick your card and improve ATM fee data.</Text>
      </View>

      {hasProfile ? (
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Welcome back</Text>
          <Text style={styles.welcome}>{firstName ? `Hi, ${firstName}` : profile?.contact}</Text>
          <Text style={styles.muted}>Complete setup before scanning so prices, cards and ATM reports are linked correctly.</Text>
          <Pressable style={styles.primary} onPress={() => router.replace(nextRoute(profile))}>
            <Text style={styles.primaryText}>{profile?.onboardingComplete ? 'Open Transvert' : 'Complete account setup'}</Text>
          </Pressable>
        </GlassCard>
      ) : (
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={contact}
            onChangeText={(value) => { setContact(value); setError(''); setMessage(''); }}
            placeholder="you@example.com"
            placeholderTextColor={colors.dim}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <Pressable style={styles.primary} onPress={() => continueWith('email')} disabled={isSubmitting}>
            <Text style={styles.primaryText}>{isSubmitting ? 'Working...' : 'Sign up / sign in with email'}</Text>
          </Pressable>

          <View style={styles.socialGrid}>
            <Pressable style={styles.socialButton} onPress={() => continueWith('google')} disabled={isSubmitting}>
              <Ionicons name="logo-google" color={colors.text} size={18} />
              <Text style={styles.socialText}>Google</Text>
            </Pressable>
            <Pressable style={styles.socialButton} onPress={() => continueWith('apple')} disabled={isSubmitting}>
              <Ionicons name="logo-apple" color={colors.text} size={20} />
              <Text style={styles.socialText}>Apple</Text>
            </Pressable>
          </View>

          <View style={styles.consentBlock}>
            <Pressable style={styles.consentRow} onPress={() => setUpdatesOptIn((value) => !value)}>
              <Ionicons name={updatesOptIn ? 'checkbox' : 'square-outline'} color={colors.cyan} size={20} />
              <Text style={styles.consentText}>Send me the welcome email and occasional Transvert updates.</Text>
            </Pressable>
            <Pressable style={styles.consentRow} onPress={() => setAtmDataOptIn((value) => !value)}>
              <Ionicons name={atmDataOptIn ? 'checkbox' : 'square-outline'} color={colors.cyan} size={20} />
              <Text style={styles.consentText}>Let me help improve ATM fee data when I report a withdrawal fee.</Text>
            </Pressable>
          </View>

          <Pressable style={styles.guest} onPress={() => continueWith('guest')}>
            <Text style={styles.guestText}>Preview without saving</Text>
          </Pressable>
        </GlassCard>
      )}

      <PolicyFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 42, marginBottom: 22 },
  eyebrow: { color: colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  title: { marginTop: 12, color: colors.text, fontSize: 42, lineHeight: 46, fontWeight: '900' },
  copy: { marginTop: 14, color: colors.muted, fontSize: 16, lineHeight: 23 },
  card: { gap: 12 },
  label: { color: colors.dim, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  input: { height: 54, borderRadius: 17, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 16, fontSize: 16, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.04)' },
  error: { color: colors.danger, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  success: { color: colors.success, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  primary: { height: 54, borderRadius: 27, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.navy950, fontSize: 15, fontWeight: '900' },
  socialGrid: { flexDirection: 'row', gap: 8 },
  socialButton: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  socialText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  consentBlock: { gap: 10, marginTop: 8 },
  consentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  consentText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
  guest: { alignItems: 'center', paddingVertical: 10 },
  guestText: { color: colors.dim, fontSize: 13, fontWeight: '800' },
  welcome: { color: colors.text, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
