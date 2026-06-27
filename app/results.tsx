import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { getCachedRate } from '@/services/fx';
import { buildRebuiltMenu } from '@/services/menu/rebuildMenu';
import { translateMenuText } from '@/services/translate';
import { saveScan } from '@/storage/scans';
import { useScans } from '@/hooks/useScans';
import { colors } from '@/theme/colors';

function qualityFallback(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  let score = words.length < 12 ? 40 : 76;
  score = Math.max(0, Math.min(100, score));
  if (score >= 72) return { score, label: 'good', reason: 'Readable scan.' };
  if (score >= 48) return { score, label: 'fair', reason: 'Usable scan, but check details.' };
  return { score, label: 'poor', reason: 'Retake closer, flatter and without glare.' };
}

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const { scans, isLoading, refresh } = useScans();
  const [savedMessage, setSavedMessage] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const scan = useMemo(() => scans.find((item) => item.id === id), [id, scans]);
  const isWide = width >= 760;

  if (isLoading) return <Screen><Text style={styles.loading}>Loading scan...</Text></Screen>;
  if (!scan) return <Screen><Text style={styles.loading}>Scan not found</Text></Screen>;

  const mode = scan.mode ?? 'menu';
  const scanAny = scan as any;
  const translatedText = scan.translatedText ?? translateMenuText(scan.originalText);
  const ocrQuality = scanAny.ocrQuality ?? qualityFallback(scan.originalText);
  const ocrLines = Array.isArray(scanAny.ocrLines) ? scanAny.ocrLines : [];
  const rebuiltMenu = scan.rebuiltMenu ?? (mode === 'menu' ? buildRebuiltMenu(scan.originalText, scan.prices) : undefined);
  const qualityTone = ocrQuality.label === 'poor' ? styles.qualityPoor : ocrQuality.label === 'fair' ? styles.qualityFair : styles.qualityGood;

  const handleSave = async () => {
    await saveScan({ ...scan, translatedText, rebuiltMenu });
    await refresh();
    setSavedMessage(true);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.topTitle}>Smart Upload</Text>
        <View style={styles.iconButton}><Ionicons name="restaurant-outline" color={colors.text} size={18} /></View>
      </View>

      {scan.imageUri && (
        <View style={styles.imageFrame}>
          <Image source={{ uri: scan.imageUri }} resizeMode="contain" style={styles.image} />
          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeLabel}>Original captured</Text>
            <Text style={styles.imageBadgeCopy}>Rebuilt below in English + GBP</Text>
          </View>
        </View>
      )}

      {scan.imageUri && (
        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggleButton, !showOriginal && styles.toggleActive]} onPress={() => setShowOriginal(false)}>
            <Text style={[styles.toggleText, !showOriginal && styles.toggleTextActive]}>Your menu</Text>
          </Pressable>
          <Pressable style={[styles.toggleButton, showOriginal && styles.toggleActive]} onPress={() => setShowOriginal(true)}>
            <Text style={[styles.toggleText, showOriginal && styles.toggleTextActive]}>Original</Text>
          </Pressable>
        </View>
      )}

      {showOriginal && scan.imageUri ? (
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Original</Text>
          <Image source={{ uri: scan.imageUri }} resizeMode="contain" style={styles.originalImage} />
        </GlassCard>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.label}>Menu rebuilt</Text>
            <Text style={styles.heroTitle}>Read it your way.</Text>
            <Text style={styles.copy}>{scan.prices.length} prices detected • {scan.fxStatus ?? 'fallback'} • 1 EUR = {getCachedRate('EUR').toFixed(4)} GBP</Text>
          </View>

          <GlassCard style={[styles.card, styles.rebuiltCard]}>
            <View style={styles.menuHeader}>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuEyebrow}>Translated restaurant menu</Text>
                <Text style={styles.menuTitle}>{rebuiltMenu?.title ?? 'Translated Menu'}</Text>
                <Text style={styles.menuSubtitle}>{rebuiltMenu?.subtitle ?? 'English + GBP estimates'}</Text>
              </View>
              <View style={styles.menuCountPill}>
                <Text style={styles.menuCount}>{rebuiltMenu?.itemCount ?? scan.prices.length}</Text>
                <Text style={styles.menuCountLabel}>items</Text>
              </View>
            </View>

            {rebuiltMenu?.sections?.length ? (
              <View style={styles.rebuiltSections}>
                {rebuiltMenu.sections.map((section) => (
                  <View key={section.title} style={styles.rebuiltSection}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.items.map((item) => (
                      <View key={item.id} style={styles.rebuiltItem}>
                        <View style={styles.rebuiltItemTop}>
                          <View style={styles.rebuiltItemText}>
                            <Text style={styles.englishName}>{item.englishName}</Text>
                            <Text style={styles.originalName}>{item.originalName}</Text>
                          </View>
                          <View style={styles.priceStack}>
                            <Text style={styles.convertedPrice}>{item.convertedPrice}</Text>
                            <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                          </View>
                        </View>
                        {item.description && <Text style={styles.description}>{item.description}</Text>}
                        {item.icons.length > 0 && <Text style={styles.icons}>{item.icons.join('  ')}</Text>}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : <Text style={styles.empty}>No menu items detected. Try a clearer menu upload.</Text>}
            <Text style={styles.rebuiltNote}>{rebuiltMenu?.note ?? 'Confirm final prices with the restaurant.'}</Text>
          </GlassCard>
        </>
      )}

      <GlassCard style={[styles.card, qualityTone]}>
        <View style={styles.qualityHeader}>
          <Text style={styles.label}>Scan quality</Text>
          <Text style={styles.qualityScore}>{ocrQuality.score ?? '—'}%</Text>
        </View>
        <Text style={styles.qualityTitle}>{String(ocrQuality.label ?? 'unknown').toUpperCase()}</Text>
        <Text style={styles.qualityCopy}>{ocrQuality.reason ?? 'Scan quality estimate.'}</Text>
        <Text style={styles.qualityMeta}>{ocrLines.length ? `${ocrLines.length} positioned text lines captured for rebuilt menu layout.` : 'Bounding boxes unavailable for this scan.'}</Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Pressable style={styles.rawHeader} onPress={() => setShowRawOcr((value) => !value)}>
          <Text style={styles.label}>View raw OCR</Text>
          <Ionicons name={showRawOcr ? 'chevron-up' : 'chevron-down'} color={colors.dim} size={18} />
        </Pressable>
        {showRawOcr && (
          <View style={[styles.textGrid, isWide && styles.textGridWide]}>
            <View style={isWide && styles.textCardWide}>
              <Text style={styles.rawSubhead}>Original OCR</Text>
              <Text style={styles.body}>{scan.originalText}</Text>
            </View>
            <View style={isWide && styles.textCardWide}>
              <Text style={styles.rawSubhead}>Full English translation</Text>
              <Text style={styles.body}>{translatedText || 'Translation unavailable.'}</Text>
            </View>
          </View>
        )}
      </GlassCard>

      <Text style={styles.disclaimer}>FX estimate only. Smart Upload rebuilds the menu from OCR; final prices should be confirmed with the restaurant.</Text>

      {savedMessage && <View style={styles.savedBanner}><Ionicons name="checkmark-circle-outline" color={colors.success} size={17} /><Text style={styles.savedText}>Scan saved</Text></View>}

      <View style={styles.actions}>
        <Pressable style={styles.secondaryAction} onPress={handleSave}><Text style={styles.secondaryText}>Save scan</Text></Pressable>
        <Pressable style={styles.primaryAction} onPress={() => router.push('/scan')}><Text style={styles.primaryText}>Scan again</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 70, color: colors.text, fontSize: 22, fontWeight: '900' },
  topBar: { paddingTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  topTitle: { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  imageFrame: { height: 250, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(2,7,19,0.74)', marginTop: 24, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageBadge: { position: 'absolute', left: 16, right: 16, bottom: 16, borderRadius: 18, backgroundColor: 'rgba(2,7,19,0.86)', borderWidth: 1, borderColor: 'rgba(103,232,249,0.28)', padding: 14 },
  imageBadgeLabel: { color: colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  imageBadgeCopy: { marginTop: 6, color: colors.text, fontSize: 18, fontWeight: '900' },
  originalImage: { width: '100%', height: 520, marginTop: 14, borderRadius: 14 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  toggleButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  toggleText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  toggleTextActive: { color: colors.navy950 },
  hero: { marginTop: 22, marginBottom: 8 },
  label: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  heroTitle: { marginTop: 8, color: colors.text, fontSize: 34, fontWeight: '900' },
  copy: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { marginTop: 12 },
  rebuiltCard: { backgroundColor: 'rgba(255,255,255,0.055)' },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' },
  menuHeaderText: { flex: 1 },
  menuEyebrow: { color: colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, textTransform: 'uppercase' },
  menuTitle: { marginTop: 8, color: colors.text, fontSize: 28, fontWeight: '900' },
  menuSubtitle: { marginTop: 5, color: colors.muted, fontSize: 13, fontWeight: '700' },
  menuCountPill: { minWidth: 64, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(103,232,249,0.35)', paddingVertical: 10, alignItems: 'center' },
  menuCount: { color: colors.cyan, fontSize: 22, fontWeight: '900' },
  menuCountLabel: { color: colors.dim, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  rebuiltSections: { marginTop: 22, gap: 22 },
  rebuiltSection: { gap: 10 },
  sectionTitle: { color: colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  rebuiltItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  rebuiltItemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rebuiltItemText: { flex: 1 },
  englishName: { color: colors.text, fontSize: 18, fontWeight: '900', lineHeight: 23 },
  originalName: { marginTop: 4, color: colors.dim, fontSize: 12, fontWeight: '800' },
  priceStack: { alignItems: 'flex-end', minWidth: 76 },
  convertedPrice: { color: colors.cyan, fontSize: 17, fontWeight: '900' },
  originalPrice: { marginTop: 5, color: colors.text, fontSize: 12, fontWeight: '800' },
  description: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 20 },
  icons: { marginTop: 8, fontSize: 16 },
  rebuiltNote: { marginTop: 18, color: colors.dim, fontSize: 12, lineHeight: 18 },
  qualityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qualityScore: { color: colors.text, fontSize: 18, fontWeight: '900' },
  qualityTitle: { marginTop: 10, color: colors.text, fontSize: 18, fontWeight: '900' },
  qualityCopy: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 19 },
  qualityMeta: { marginTop: 8, color: colors.dim, fontSize: 12, lineHeight: 18 },
  qualityGood: { borderColor: 'rgba(34,197,94,0.45)' },
  qualityFair: { borderColor: 'rgba(250,204,21,0.45)' },
  qualityPoor: { borderColor: 'rgba(251,113,133,0.55)' },
  textGrid: { gap: 12 },
  textGridWide: { flexDirection: 'row' },
  textCardWide: { flex: 1 },
  body: { marginTop: 14, color: colors.text, fontSize: 16, lineHeight: 25 },
  empty: { marginTop: 14, color: colors.muted },
  disclaimer: { marginTop: 14, color: colors.dim, fontSize: 12, lineHeight: 18 },
  rawHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rawSubhead: { marginTop: 14, color: colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.7, textTransform: 'uppercase' },
  savedBanner: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.1)', padding: 12 },
  savedText: { color: colors.success, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 20 },
  secondaryAction: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontWeight: '800' },
  primaryAction: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: colors.cyan },
  primaryText: { color: colors.navy950, fontWeight: '900' },
});
