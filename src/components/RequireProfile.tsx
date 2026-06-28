import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { getAppProfile, type AppProfile } from '@/storage/appProfile';
import { colors } from '@/theme/colors';

export function RequireProfile({ onReady }: { onReady?: (profile: AppProfile) => void }) {
  const [profile, setProfile] = useState<AppProfile | null | undefined>(undefined);

  useEffect(() => {
    getAppProfile().then((saved) => {
      setProfile(saved);
      if (saved?.contact && saved.provider !== 'guest') onReady?.(saved);
    });
  }, [onReady]);

  if (profile === undefined) return null;
  if (profile?.contact && profile.provider !== 'guest') {
    if (!profile.onboardingComplete) {
      return (
        <Pressable style={styles.banner} onPress={() => router.push('/onboarding')}>
          <Ionicons name="person-circle-outline" color={colors.cyan} size={20} />
          <Text style={styles.text}>Complete account setup: country, card and currency.</Text>
          <Ionicons name="chevron-forward" color={colors.cyan} size={18} />
        </Pressable>
      );
    }
    return null;
  }

  return (
    <Pressable style={styles.banner} onPress={() => router.replace('/sign-in')}>
      <Ionicons name="mail-outline" color={colors.cyan} size={20} />
      <Text style={styles.text}>Sign in to save scans and continue.</Text>
      <Ionicons name="chevron-forward" color={colors.cyan} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(103,232,249,0.32)', backgroundColor: 'rgba(103,232,249,0.08)', padding: 12 },
  text: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800', lineHeight: 18 },
});
