import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';

const sections = [
  ['What we collect', 'Email address if you sign in, scans you choose to save, app settings such as preferred currency, and optional ATM fee reports you submit.'],
  ['Camera, photos and OCR', 'When you scan or upload an image, Transvert extracts text to rebuild menus, translate content and estimate prices. Do not upload sensitive documents unless you are happy for them to be processed.'],
  ['Location and ATM data', 'If you use ATM Finder, location may be used to find nearby ATMs. If you report an ATM fee, we may store the ATM location, provider and fee amount to improve future results.'],
  ['Marketing emails', 'We only send welcome emails and updates where you have opted in. You can unsubscribe or ask us to remove your email.'],
  ['Third-party services', 'Transvert may use services such as Supabase, Google, OpenAI, Resend and exchange-rate providers to operate the app.'],
  ['Your rights', 'You can ask for access, correction or deletion of your information by contacting Transvert support.'],
];

export default function PrivacyScreen() {
  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="chevron-back" color={colors.text} size={20} /></Pressable>
        <Text style={styles.topTitle}>Privacy</Text>
        <View style={styles.iconButton} />
      </View>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.copy}>Plain-English draft for live testing. Replace with solicitor-reviewed wording before full public launch.</Text>
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
