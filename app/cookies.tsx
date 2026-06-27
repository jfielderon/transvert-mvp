import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';

const sections = [
  ['Essential storage', 'Transvert may use local storage or similar technology to keep scans, preferences, sign-in state and app settings working.'],
  ['Analytics', 'During testing we may use simple analytics to understand crashes, usage and feature performance.'],
  ['Marketing', 'Marketing cookies should stay off unless added later with a proper consent banner.'],
  ['Control', 'You can clear app/browser storage from your device settings or browser settings.'],
];

export default function CookiesScreen() {
  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="chevron-back" color={colors.text} size={20} /></Pressable>
        <Text style={styles.topTitle}>Cookies</Text>
        <View style={styles.iconButton} />
      </View>
      <Text style={styles.title}>Cookie Notice</Text>
      <Text style={styles.copy}>Simple testing notice for app storage and browser storage.</Text>
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
