import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlobalBackdrop } from '@/components/GlobalBackdrop';
import { PolicyFooter } from '@/components/PolicyFooter';
import { Screen } from '@/components/Screen';
import { completeRedirectSignIn, firstNameFromProfile } from '@/services/auth/supabaseAuth';
import { getAppProfile, type AppProfile } from '@/storage/appProfile';
import { colors } from '@/theme/colors';

const intelligence = [
  { label: 'Live FX', value: 'EUR to GBP', icon: 'trending-up-outline' },
  { label: 'OCR ready', value: 'Upload or paste', icon: 'scan-outline' },
  { label: 'Low-fee ATM', value: 'Map prepared', icon: 'navigate-outline' },
] as const;

export default function HomeScreen() {
  const [profile, setProfile] = useState<AppProfile | null>(null);

  useEffect(() => {
    (async () => {
      const existing = await getAppProfile();
      const redirected = await completeRedirectSignIn(existing ?? undefined);
      setProfile(redirected ?? existing);
    })();
  }, []);

  const firstName = firstNameFromProfile(profile);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.brandLockup}>
          <View style={styles.brandMark}>
            <Text style={styles.markText}>T</Text>
          </View>
          <View>
            <Text style={styles.brand}>Transvert</Text>
            {firstName ? <Text style={styles.greeting}>Hi, {firstName}</Text> : null}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.signInButton} onPress={() => router.push('/sign-in')}>
            <Text style={styles.signInText}>{firstName ? 'Profile' : 'Sign in'}</Text>
          </Pressable>
          <Pressable style={styles.headerIcon} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" color={colors.muted} size={18} />
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <GlobalBackdrop />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>GLOBAL PURCHASE INTELLIGENCE</Text>
          <Text style={styles.title}>SEE IT. SCAN IT. KNOW IT.</Text>
          <Text style={styles.subtitle}>{firstName ? `Ready for your next trip, ${firstName}?` : 'Understand what you are buying anywhere in the world.'}</Text>
        </View>
        <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
          <LinearGradient colors={[colors.cyan, '#b7f7ff']} style={styles.scanButtonFill}>
            <MaterialCommunityIcons name="camera-iris" color={colors.navy950} size={25} />
            <Text style={styles.scanButtonText}>Scan now</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.intelligenceStrip}>
        {intelligence.map((item) => (
          <View key={item.label} style={styles.signal}>
            <Ionicons name={item.icon} color={colors.cyan} size={17} />
            <Text style={styles.signalLabel}>{item.label}</Text>
            <Text style={styles.signalValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.commandGrid}>
        <Pressable style={styles.command} onPress={() => router.push('/translate')}>
          <Ionicons name="language-outline" color={colors.text} size={21} />
          <View style={styles.commandText}>
            <Text style={styles.commandLabel}>Translate</Text>
            <Text style={styles.commandMeta}>Menus, signs, receipts</Text>
          </View>
          <Ionicons name="arrow-forward" color={colors.dim} size={16} />
        </Pressable>
        <Pressable style={styles.command} onPress={() => router.push('/convert')}>
          <MaterialCommunityIcons name="swap-horizontal" color={colors.text} size={23} />
          <View style={styles.commandText}>
            <Text style={styles.commandLabel}>Convert</Text>
            <Text style={styles.commandMeta}>Live-rate travel pricing</Text>
          </View>
          <Ionicons name="arrow-forward" color={colors.dim} size={16} />
        </Pressable>
        <Pressable style={styles.command} onPress={() => router.push('/atm')}>
          <Ionicons name="navigate-outline" color={colors.text} size={21} />
          <View style={styles.commandText}>
            <Text style={styles.commandLabel}>ATM Finder</Text>
            <Text style={styles.commandMeta}>Low-fee routing layer</Text>
          </View>
          <Ionicons name="arrow-forward" color={colors.dim} size={16} />
        </Pressable>
      </View>

      <PolicyFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signInButton: { height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  signInText: { color: colors.cyan, fontSize: 12, fontWeight: '900' },
  brandMark: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.04)' },
  markText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  brand: { color: colors.text, fontSize: 19, fontWeight: '700' },
  greeting: { marginTop: 2, color: colors.cyan, fontSize: 12, fontWeight: '800' },
  headerIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  hero: { minHeight: 486, justifyContent: 'flex-end', overflow: 'hidden', marginHorizontal: -22, marginTop: 12, paddingHorizontal: 22, paddingBottom: 24 },
  heroCopy: { maxWidth: 330 },
  eyebrow: { color: colors.cyan, fontSize: 10, fontWeight: '700', letterSpacing: 2.8 },
  title: { marginTop: 18, color: colors.text, fontSize: 56, fontWeight: '800', lineHeight: 58 },
  subtitle: { marginTop: 18, maxWidth: 285, color: colors.muted, fontSize: 16, lineHeight: 24 },
  scanButton: { marginTop: 28, width: 176, height: 54, borderRadius: 27, shadowColor: colors.cyan, shadowOpacity: 0.36, shadowRadius: 22 },
  scanButtonFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 27 },
  scanButtonText: { color: colors.navy950, fontSize: 15, fontWeight: '800' },
  intelligenceStrip: { flexDirection: 'row', gap: 8, marginTop: 8 },
  signal: { flex: 1, minHeight: 98, justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.035)', padding: 12 },
  signalLabel: { color: colors.dim, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  signalValue: { color: colors.text, fontSize: 12, lineHeight: 16 },
  commandGrid: { gap: 10, marginTop: 20 },
  command: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.035)', paddingHorizontal: 16 },
  commandText: { flex: 1, minWidth: 0 },
  commandLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  commandMeta: { marginTop: 4, color: colors.dim, fontSize: 12 },
});
