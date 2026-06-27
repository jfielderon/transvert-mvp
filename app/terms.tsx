import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';

const sections = [
  ['Use of Transvert', 'Transvert helps translate, rebuild and explain travel information such as menus, signs, receipts, product labels and ATM fee estimates.'],
  ['Estimates only', 'Translations, currency conversions, allergens, ingredients, ATM fees and card cost estimates may be wrong or incomplete. Always confirm important details before ordering, buying or withdrawing cash.'],
  ['No financial advice', 'Transvert does not provide regulated financial advice and does not handle payments or hold money. Card and ATM information is provided for comparison and travel awareness only.'],
  ['User contributions', 'If you submit ATM fee reports or feedback, you allow Transvert to use that information to improve the app and help other travellers.'],
  ['Responsible use', 'Do not upload unlawful, harmful or sensitive content. Do not rely on Transvert for medical, legal, safety-critical or emergency decisions.'],
  ['Changes', 'These testing terms may be updated as Transvert moves toward public launch.'],
];

export default function TermsScreen() {
  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="chevron-back" color={colors.text} size={20} /></Pressable>
        <Text style={styles.topTitle}>Terms</Text>
        <View style={styles.iconButton} />
      </View>
      <Text style={styles.title}>Terms of Use</Text>
      <Text style={styles.copy}>Plain-English draft for private testing. Replace with reviewed terms before public launch.</Text>
      <GlassCard style={styles.card}>
        {sections.map(([title, body]) => (
          <View key={title} style={styles.section}>
            <Text style={styles.heading}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  topTitle: { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  title: { marginTop: 28, color: colors.text, fontSize: 40, lineHeight: 44, fontWeight: '900' },
  copy: { marginTop: 12, color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { marginTop: 18, gap: 18 },
  section: { gap: 6 },
  heading: { color: colors.text, fontSize: 17, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});
