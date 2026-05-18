import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  headerWrap: { marginTop: 36 },
  title: { color: colors.text, fontSize: 42, fontWeight: '800', letterSpacing: 1 },
  subtitle: { color: colors.muted, marginTop: 10, fontSize: 16 },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glowButton: { justifyContent: 'center', alignItems: 'center', borderRadius: 999, backgroundColor: '#0E2A42', borderWidth: 1.5, borderColor: colors.glow, shadowColor: colors.glow, shadowOpacity: 0.75, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 14 },
  glowButtonText: { color: colors.text, fontWeight: '800', fontSize: 28, letterSpacing: 1.2 },
  card: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14 },
  cardTitle: { color: colors.glow, fontWeight: '700', marginBottom: 8, fontSize: 16 },
  cardContent: { color: colors.text, lineHeight: 21 },
  screenTitle: { color: colors.text, fontSize: 30, fontWeight: '700' },
  stackGap: { marginTop: 24, gap: 14 },
  navStack: { gap: 8 },
  errorText: { color: colors.error, marginTop: 12 },
  input: { color: colors.text, borderWidth: 1, borderColor: '#2d5f76', borderRadius: 16, marginTop: 16, padding: 14 },
  convertResult: { color: colors.glow, fontSize: 26, marginTop: 18 },
  loadingText: { color: colors.text },
  settingsTitle: { color: colors.text, fontSize: 28, fontWeight: '600' },
  mutedTop12: { color: colors.muted, marginTop: 12 },
  mutedTop8: { color: colors.muted, marginTop: 8 },

});
