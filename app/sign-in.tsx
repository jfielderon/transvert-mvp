import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { PolicyFooter } from '@/components/PolicyFooter';
import { Screen } from '@/components/Screen';
import { completeRedirectSignIn, sendMagicLink, startOAuth, type AuthProvider } from '@/services/auth/supabaseAuth';
import { sendWelcomeAfterAuth } from '@/services/auth/welcomeAfterAuth';
import { getAppProfile, saveAppProfile } from '@/storage/appProfile';
import { colors } from '@/theme/colors';

type Provider = 'email' | AuthProvider | 'guest';

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

export default function SignInScreen() {
  const [contact, setContact] = useState('');
  const [updatesOptIn, setUpdatesOptIn] = useState(true);
  const [atmDataOptIn, setAtmDataOptIn] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await getAppProfile();
      const profile = await completeRedirectSignIn(existing ?? undefined);
      if (profile) {
        await sendWelcomeAfterAuth(profile);
        router.replace('/');
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
        await saveAppProfile({
          contact: '',
          provider: 'guest',
          updatesOptIn,
          atmDataOptIn,
          createdAt: new Date().toISOString(),
        });
        router.replace('/scan');
        return;
      }

      if (provider === 'email') {
        if (!isValidEmail(cleanContact)) throw new Error('Enter your email so Transvert can send your sign-in link.');
        const profile = { contact: cleanContact, provider: 'email' as const, updatesOptIn, atmDataOptIn, createdAt: new Date().toISOString() };
        await saveAppProfile(profile);
        await sendMagicLink(cleanContact);
        await sendWelcomeAfterAuth(profile);
        setMessage('Check your email. We sent you a secure Transvert sign-in link and welcome note.');
        return;
      }

      await saveAppProfile({ contact: cleanContact, provider, updatesOptIn, atmDataOptIn, createdAt: new Date().toISOString() });
      startOAuth(provider);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not start sign-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Transvert</Text>
        <Text style={styles.title}>See and know the world your way.</Text>
        <Text style={styles.copy}>Sign in once to save your scans, settings and travel intelligence.</Text>
      </View>

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
          <Text style={styles.primaryText}>{isSubmitting ? 'Working...' : 'Email me a sign-in link'}</Text>
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
          <Pressable style={styles.socialButton} onPress={() => continueWith('yahoo')} disabled={isSubmitting}>
            <Text style={styles.yahooIcon}>Y!</Text>
            <Text style={styles.socialText}>Yahoo</Text>
          </Pressable>
        </View>

        <Text style={styles.oauthNote}>OAuth requires providers enabled in Supabase Auth and the Vercel URL added to redirect URLs.</Text>

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
          <Text style={styles.guestText}>Skip for now</Text>
        </Pressable>
      </GlassCard>

      <Text style={styles.footer}>Welcome email: “Thanks for joining Transvert — see and know the world your way.”</Text>
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
  error: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  success: { color: colors.success, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  primary: { height: 54, borderRadius: 27, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.navy950, fontSize: 15, fontWeight: '900' },
  socialGrid: { flexDirection: 'row', gap: 8 },
  socialButton: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  socialText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  yahooIcon: { color: colors.text, fontSize: 14, fontWeight: '900' },
  oauthNote: { color: colors.dim, fontSize: 11, lineHeight: 16 },
  consentBlock: { gap: 10, marginTop: 8 },
  consentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  consentText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
  guest: { alignItems: 'center', paddingVertical: 10 },
  guestText: { color: colors.dim, fontSize: 13, fontWeight: '800' },
  footer: { marginTop: 18, color: colors.dim, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
