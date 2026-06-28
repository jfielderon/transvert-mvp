import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { firstNameFromProfile } from '@/services/auth/supabaseAuth';
import { insertClientRow } from '@/services/supabase/clientRest';
import { getAppProfile, saveAppProfile, type AppProfile } from '@/storage/appProfile';
import { colors } from '@/theme/colors';

const cards = ['Revolut', 'Starling', 'Chase', 'Wise', 'Monzo', 'Other'];
const countries = ['United Kingdom', 'Ireland', 'Spain', 'France', 'Portugal', 'Other'];

async function syncProfile(profile: AppProfile) {
  if (!profile.userId) return;
  try {
    await insertClientRow('profiles', {
      id: profile.userId,
      email: profile.contact,
      first_name: profile.name?.split(' ')[0] ?? profile.contact?.split('@')[0],
      full_name: profile.name,
      provider: profile.provider,
      preferred_language: profile.preferredLanguage ?? 'English',
      preferred_currency: profile.preferredCurrency ?? 'GBP',
      marketing_opt_in: profile.updatesOptIn,
      atm_data_opt_in: profile.atmDataOptIn,
      last_seen_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[profile] Supabase sync skipped', error);
  }
}

export default function OnboardingScreen() {
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [name, setName] = useState('');
  const [homeCountry, setHomeCountry] = useState('United Kingdom');
  const [defaultCard, setDefaultCard] = useState('Revolut');
  const [preferredCurrency, setPreferredCurrency] = useState('GBP');

  useEffect(() => {
    getAppProfile().then((saved) => {
      setProfile(saved);
      setName(firstNameFromProfile(saved));
      setHomeCountry(saved?.homeCountry ?? 'United Kingdom');
      setDefaultCard(saved?.defaultCard ?? 'Revolut');
      setPreferredCurrency(saved?.preferredCurrency ?? 'GBP');
    });
  }, []);

  const complete = async () => {
    const nextProfile: AppProfile = {
      ...(profile ?? { contact: '', provider: 'guest', updatesOptIn: true, atmDataOptIn: true, createdAt: new Date().toISOString() }),
      name: name.trim() || profile?.name,
      homeCountry,
      defaultCard,
      preferredLanguage: 'English',
      preferredCurrency,
      onboardingComplete: true,
    };
    await saveAppProfile(nextProfile);
    await syncProfile(nextProfile);
    router.replace('/scan');
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="chevron-back" color={colors.text} size={20} /></Pressable>
        <Text style={styles.topTitle}>Account setup</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Almost ready</Text>
        <Text style={styles.title}>Complete your travel profile.</Text>
        <Text style={styles.copy}>This lets Transvert show the right currency, card tips and ATM fee warnings from the first scan.</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>First name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Andrew" placeholderTextColor={colors.dim} style={styles.input} />

        <Text style={styles.label}>Home country</Text>
        <View style={styles.pillGrid}>{countries.map((country) => <Pressable key={country} style={[styles.pill, homeCountry === country && styles.pillActive]} onPress={() => setHomeCountry(country)}><Text style={[styles.pillText, homeCountry === country && styles.pillTextActive]}>{country}</Text></Pressable>)}</View>

        <Text style={styles.label}>Default travel card</Text>
        <View style={styles.pillGrid}>{cards.map((card) => <Pressable key={card} style={[styles.pill, defaultCard === card && styles.pillActive]} onPress={() => setDefaultCard(card)}><Text style={[styles.pillText, defaultCard === card && styles.pillTextActive]}>{card}</Text></Pressable>)}</View>

        <Text style={styles.label}>Home currency</Text>
        <View style={styles.pillGrid}>{['GBP', 'EUR', 'USD'].map((currency) => <Pressable key={currency} style={[styles.pill, preferredCurrency === currency && styles.pillActive]} onPress={() => setPreferredCurrency(currency)}><Text style={[styles.pillText, preferredCurrency === currency && styles.pillTextActive]}>{currency}</Text></Pressable>)}</View>
      </GlassCard>

      <Pressable style={styles.primary} onPress={complete}><Text style={styles.primaryText}>Finish setup</Text></Pressable>
      <Pressable style={styles.skip} onPress={complete}><Text style={styles.skipText}>Use defaults for now</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  topTitle: { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  hero: { marginTop: 30, marginBottom: 18 },
  eyebrow: { color: colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  title: { marginTop: 10, color: colors.text, fontSize: 40, lineHeight: 44, fontWeight: '900' },
  copy: { marginTop: 12, color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { gap: 12 },
  label: { marginTop: 6, color: colors.dim, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  input: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 15, fontSize: 16, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.04)' },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 9 },
  pillActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  pillText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  pillTextActive: { color: colors.navy950 },
  primary: { marginTop: 18, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan },
  primaryText: { color: colors.navy950, fontSize: 15, fontWeight: '900' },
  skip: { alignItems: 'center', paddingVertical: 14, marginBottom: 96 },
  skipText: { color: colors.dim, fontSize: 13, fontWeight: '800' },
});
