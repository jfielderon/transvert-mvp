import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { PolicyFooter } from '@/components/PolicyFooter';
import { Screen } from '@/components/Screen';
import { saveAppProfile } from '@/storage/appProfile';
import { colors } from '@/theme/colors';

type Provider = 'email' | 'google' | 'yahoo' | 'apple' | 'guest';

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

export default function SignInScreen() {
  const [contact, setContact] = useState('');
  const [updatesOptIn, setUpdatesOptIn] = useState(true);
  const [atmDataOptIn, setAtmDataOptIn] = useState(true);
  const [error, setError] = useState('');

  const continueWith = async (provider: Provider) => {
    const cleanContact = contact.trim().toLowerCase();
    if (provider !== 'guest' && provider === 'email' && !isValidEmail(cleanContact)) {
      setError('Enter your email so Transvert can save your scans and send your welcome note.');
      return;
    }

    await saveAppProfile({
      contact: provider === 'guest' ? '' : cleanContact,
      provider: provider === 'apple' || provider === 'yahoo' ? 'email' : provider,
      updatesOptIn,
      atmDataOptIn,
      createdAt: new Date().toISOString(),
    });
    router.replace('/scan');
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Transvert</Text>
        <Text style={styles.title}>See and know the world your way.</Text>
        <Text style={styles.copy}>Translate menus, understand prices and help build better travel fee intelligence.</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={contact}
          onChangeText={(value) => { setContact(value); setError(''); }}
          placeholder="you@example.com"
          placeholderTextColor={colors.dim}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} onPress={() => continueWith('email')}>
          <Text style={styles.primaryText}>Continue with email</Text>
        </Pressable>

        <View style={styles.socialGrid}>
          <Pressable style={styles.socialButton} onPress={() => continueWith('google')}>
            <Ionicons name="logo-google" color={colors.text} size={18} />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={styles.socialButton} onPress={() => continueWith('apple')}>
            <Ionicons name="logo-apple" color={colors.text} size={20} />
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
          <Pressable style={styles.socialButton} onPress={() => continueWith('yahoo')}>
            <Text style={styles.yahooIcon}>Y!</Text>
            <Text style={styles.socialText}>Yahoo</Text>
          </Pressable>
        </View>

        <Text style={styles.oauthNote}>Google, Apple and Yahoo buttons are ready for OAuth wiring. Email works for private testing.</Text>

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
