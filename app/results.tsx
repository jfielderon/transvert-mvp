import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { languageLabel } from '@/services/languages';
import { buildRebuiltMenu } from '@/services/menu/rebuildMenu';
import { translateMenuText } from '@/services/translate';
import { saveScanFeedback } from '@/services/userData';
import { useScans } from '@/hooks/useScans';
import { saveScan } from '@/storage/scans';
import { colors } from '@/theme/colors';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { scans, isLoading, refresh } = useScans();
  const [showOriginal, setShowOriginal] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const scan = useMemo(() => scans.find((item) => item.id === id), [id, scans]);

  if (isLoading) return <Screen><Text style={styles.title}>Loading scan...</Text></Screen>;
  if (!scan) return <Screen><Text style={styles.title}>Result loading...</Text><Text style={styles.copy}>Try refreshing, or scan again.</Text><Pressable style={styles.primary} onPress={refresh}><Text style={styles.primaryText}>Refresh result</Text></Pressable><Pressable style={styles.secondary} onPress={() => router.replace('/scan')}><Text style={styles.secondaryText}>Scan again</Text></Pressable></Screen>;

  const translatedText = scan.translatedText ?? translateMenuText(scan.originalText);
  const menu = scan.rebuiltMenu ?? buildRebuiltMenu(scan.originalText, scan.prices);
  const direction = `${languageLabel(scan.sourceLanguage ?? 'auto')} → ${languageLabel(scan.targetLanguage ?? 'en')}`;
  const hasStructuredItems = Boolean(menu?.sections?.length && scan.prices.length);

  const save = async () => {
    await saveScan({ ...scan, translatedText, rebuiltMenu: menu } as any);
    setSaved(true);
  };

  const mark = async (verdict: 'right' | 'wrong') => {
    setFeedback(verdict);
    await saveScanFeedback({ scanId: scan.id, verdict, mode: scan.mode ?? 'menu', originalText: scan.originalText, detectedPriceCount: scan.prices.length });
    await saveScan({ ...scan, translatedText, rebuiltMenu: menu, userFeedback: verdict } as any);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="chevron-back" color={colors.text} size={20} /></Pressable>
        <Text style={styles.topTitle}>Transvert</Text>
        <View style={styles.iconButton}><Ionicons name="scan-outline" color={colors.text} size={18} /></View>
      </View>

      {scan.imageUri ? <View style={styles.imageFrame}><Image source={{ uri: scan.imageUri }} resizeMode="contain" style={styles.image} /></View> : null}
      {scan.imageUri ? <View style={styles.toggleRow}><Pressable style={[styles.toggleButton, !showOriginal && styles.toggleActive]} onPress={() => setShowOriginal(false)}><Text style={[styles.toggleText, !showOriginal && styles.toggleTextActive]}>Translation</Text></Pressable><Pressable style={[styles.toggleButton, showOriginal && styles.toggleActive]} onPress={() => setShowOriginal(true)}><Text style={[styles.toggleText, showOriginal && styles.toggleTextActive]}>Original</Text></Pressable></View> : null}

      {showOriginal && scan.imageUri ? (
        <GlassCard style={styles.card}><Text style={styles.label}>Original photo</Text><Image source={{ uri: scan.imageUri }} resizeMode="contain" style={styles.originalImage} /></GlassCard>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.label}>{direction}</Text>
            <Text style={styles.title}>See it your way.</Text>
            <Text style={styles.copy}>{scan.prices.length ? `${scan.prices.length} prices detected with GBP estimates.` : 'Text translated from your scan.'}</Text>
          </View>

          {hasStructuredItems ? (
            <GlassCard style={styles.card}>
              <View style={styles.menuHeader}><View style={{ flex: 1 }}><Text style={styles.label}>Translated items</Text><Text style={styles.menuTitle}>{menu?.title ?? 'Scan result'}</Text></View><View style={styles.countPill}><Text style={styles.count}>{menu?.itemCount ?? scan.prices.length}</Text><Text style={styles.countLabel}>items</Text></View></View>
              {menu.sections.map((section) => <View key={section.title} style={styles.section}><Text style={styles.sectionTitle}>{section.title}</Text>{section.items.map((item) => <View key={item.id} style={styles.item}><View style={styles.itemTop}><View style={{ flex: 1 }}><Text style={styles.englishName}>{item.englishName}</Text><Text style={styles.originalName}>{item.originalName}</Text></View><View style={styles.priceStack}><Text style={styles.convertedPrice}>{item.convertedPrice}</Text><Text style={styles.originalPrice}>{item.originalPrice}</Text></View></View>{item.description ? <Text style={styles.description}>{item.description}</Text> : null}</View>)}</View>)}
            </GlassCard>
          ) : (
            <GlassCard style={styles.card}>
              <Text style={styles.label}>Translation</Text>
              <Text style={styles.body}>{translatedText}</Text>
            </GlassCard>
          )}
        </>
      )}

      <GlassCard style={styles.card}><Text style={styles.label}>Was this useful?</Text><View style={styles.feedbackRow}><Pressable style={[styles.feedbackButton, feedback === 'right' && styles.feedbackActive]} onPress={() => mark('right')}><Text style={[styles.feedbackText, feedback === 'right' && styles.feedbackTextActive]}>Looks right</Text></Pressable><Pressable style={[styles.feedbackButton, feedback === 'wrong' && styles.feedbackActive]} onPress={() => mark('wrong')}><Text style={[styles.feedbackText, feedback === 'wrong' && styles.feedbackTextActive]}>Needs fixing</Text></Pressable></View><Text style={styles.copy}>{feedback ? 'Thanks — feedback saved.' : 'Tester feedback improves Transvert.'}</Text></GlassCard>
      <GlassCard style={styles.card}><Pressable style={styles.rawHeader} onPress={() => setShowRaw(!showRaw)}><Text style={styles.label}>View raw scan text</Text><Ionicons name={showRaw ? 'chevron-up' : 'chevron-down'} color={colors.dim} size={18} /></Pressable>{showRaw ? <><Text style={styles.rawSubhead}>Detected text</Text><Text style={styles.body}>{scan.originalText}</Text><Text style={styles.rawSubhead}>Translation</Text><Text style={styles.body}>{translatedText}</Text></> : null}</GlassCard>
      <Text style={styles.disclaimer}>Translations and currency conversions are estimates. Check important details before acting on them.</Text>
      {saved ? <Text style={styles.saved}>Scan saved</Text> : null}
      <View style={styles.actions}><Pressable style={styles.secondaryAction} onPress={save}><Text style={styles.secondaryText}>Save scan</Text></Pressable><Pressable style={styles.primaryAction} onPress={() => router.replace('/scan')}><Text style={styles.primaryText}>Scan again</Text></Pressable></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  topTitle: { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  imageFrame: { height: 240, borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginTop: 24, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  originalImage: { width: '100%', height: 500, marginTop: 14 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  toggleButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  toggleText: { color: colors.muted, fontWeight: '900' },
  toggleTextActive: { color: colors.navy950 },
  hero: { marginTop: 22 },
  label: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { marginTop: 8, color: colors.text, fontSize: 34, fontWeight: '900' },
  copy: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { marginTop: 12 },
  menuHeader: { flexDirection: 'row', gap: 14 },
  menuTitle: { marginTop: 8, color: colors.text, fontSize: 28, fontWeight: '900' },
  countPill: { minWidth: 62, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 10, alignItems: 'center' },
  count: { color: colors.cyan, fontSize: 22, fontWeight: '900' },
  countLabel: { color: colors.dim, fontSize: 10, fontWeight: '900' },
  section: { marginTop: 22 },
  sectionTitle: { color: colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTop: { flexDirection: 'row', gap: 12 },
  englishName: { color: colors.text, fontSize: 18, fontWeight: '900' },
  originalName: { marginTop: 4, color: colors.dim, fontSize: 12, fontWeight: '800' },
  priceStack: { alignItems: 'flex-end', minWidth: 76 },
  convertedPrice: { color: colors.cyan, fontSize: 17, fontWeight: '900' },
  originalPrice: { marginTop: 5, color: colors.text, fontSize: 12, fontWeight: '800' },
  description: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 20 },
  feedbackRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  feedbackButton: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, borderWidth: 1, borderColor: colors.border },
  feedbackActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  feedbackText: { color: colors.cyan, fontWeight: '900' },
  feedbackTextActive: { color: colors.navy950 },
  rawHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rawSubhead: { marginTop: 14, color: colors.cyan, fontWeight: '900' },
  body: { marginTop: 10, color: colors.text, fontSize: 16, lineHeight: 25 },
  disclaimer: { marginTop: 14, color: colors.dim, fontSize: 12, lineHeight: 18 },
  saved: { marginTop: 14, color: colors.success, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 110 },
  secondaryAction: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 1, borderColor: colors.border },
  secondary: { marginTop: 12, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontWeight: '800' },
  primaryAction: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: colors.cyan },
  primary: { marginTop: 22, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: colors.cyan },
  primaryText: { color: colors.navy950, fontWeight: '900' },
});
