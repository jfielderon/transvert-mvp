import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { formatCurrency, formatGbp, getCachedRate } from '@/services/fx';
import { translateMenuText } from '@/services/translate';
import { saveScan } from '@/storage/scans';
import { useScans } from '@/hooks/useScans';
import { colors } from '@/theme/colors';

const IMAGE_FRAME_HEIGHT = 260;

function qualityFallback(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const shortWords = words.filter((word) => word.length <= 2 && !/^\d+[,.]?\d*$/.test(word)).length;
  let score = 68;
  if (words.length < 12) score -= 28;
  if (shortWords > words.length * 0.28) score -= 18;
  score = Math.max(0, Math.min(100, score));
  if (score >= 72) return { score, label: 'good', reason: 'Readable scan.' };
  if (score >= 48) return { score, label: 'fair', reason: 'Usable scan, but check details.' };
  return { score, label: 'poor', reason: 'Retake closer, flatter and without glare.' };
}

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreLineForPrice(line: any, price: any) {
  const lineText = normalise(String(line?.text ?? ''));
  const candidates = [price.itemText, price.context, price.raw, String(price.originalAmount ?? price.amount ?? '')]
    .filter(Boolean)
    .map((value) => normalise(String(value)));
  let score = 0;
  candidates.forEach((candidate) => {
    if (!candidate) return;
    if (lineText.includes(candidate) || candidate.includes(lineText)) score += 4;
    candidate.split(' ').filter((part) => part.length > 2).forEach((part) => {
      if (lineText.includes(part)) score += 1;
    });
  });
  return score;
}

function buildOverlayItems(prices: any[], lines: any[], frameWidth: number) {
  const boxedLines = lines.filter((line) => line?.box && Number.isFinite(line.box.x) && Number.isFinite(line.box.y));
  const maxX = Math.max(1, ...boxedLines.map((line) => line.box.x + line.box.width));
  const maxY = Math.max(1, ...boxedLines.map((line) => line.box.y + line.box.height));

  return prices.slice(0, 6).map((price, index) => {
    const bestLine = boxedLines
      .map((line) => ({ line, score: scoreLineForPrice(line, price) }))
      .sort((a, b) => b.score - a.score)[0];
    const hasBox = Boolean(bestLine?.line?.box && bestLine.score > 0);
    const box = bestLine?.line?.box;
    const top = hasBox ? Math.min(IMAGE_FRAME_HEIGHT - 76, Math.max(8, (box.y / maxY) * IMAGE_FRAME_HEIGHT)) : 18 + index * 58;
    const left = hasBox ? Math.min(frameWidth - 220, Math.max(10, (box.x / maxX) * frameWidth)) : index % 2 === 0 ? 14 : undefined;
    const right = hasBox ? undefined : index % 2 === 1 ? 14 : undefined;
    return { price, top, left, right, hasBox };
  });
}

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const { scans, isLoading, refresh } = useScans();
  const [savedMessage, setSavedMessage] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [overlayMode, setOverlayMode] = useState(true);
  const scan = useMemo(() => scans.find((item) => item.id === id), [id, scans]);
  const isWide = width >= 760;
  const frameWidth = Math.max(280, Math.min(width - 48, 680));

  if (isLoading) {
    return (
      <Screen>
        <Text style={styles.loading}>Loading scan...</Text>
      </Screen>
    );
  }

  if (!scan) {
    return (
      <Screen>
        <Text style={styles.loading}>Scan not found</Text>
      </Screen>
    );
  }

  const mode = scan.mode ?? 'menu';
  const scanAny = scan as any;
  const translatedText = scan.translatedText ?? translateMenuText(scan.originalText);
  const shouldShowTotal = mode === 'receipt';
  const ocrQuality = scanAny.ocrQuality ?? qualityFallback(scan.originalText);
  const ocrLines = Array.isArray(scanAny.ocrLines) ? scanAny.ocrLines : [];
  const ocrWarnings = Array.isArray(scanAny.ocrWarnings) ? scanAny.ocrWarnings : [];
  const qualityTone = ocrQuality.label === 'poor' ? styles.qualityPoor : ocrQuality.label === 'fair' ? styles.qualityFair : styles.qualityGood;
  const overlayItems = buildOverlayItems(scan.prices, ocrLines, frameWidth);
  const trueOverlayCount = overlayItems.filter((item) => item.hasBox).length;

  const handleSave = async () => {
    await saveScan({ ...scan, translatedText });
    await refresh();
    setSavedMessage(true);
  };

  const handleShare = async () => {
    const date = new Date(scan.createdAt).toLocaleString();
    const prices = scan.prices.length
      ? scan.prices.map((price) => {
        const section = price.section ? `${price.section} - ` : '';
        return `${section}${price.itemText || price.context || 'Detected item'} -> ${price.translatedItemText || 'Translation unavailable'} | ${formatCurrency(price.amount, price.currency)} | ${formatGbp(price.convertedGbp ?? 0)} GBP`;
      }).join('\n')
      : 'No prices detected.';
    const message = [
      'Transvert scan',
      `Date/time: ${date}`,
      '',
      translatedText ? 'Translated text:' : undefined,
      translatedText || undefined,
      '',
      'Detected prices:',
      prices,
      shouldShowTotal ? `\nReceipt total estimate: ${formatGbp(scan.estimatedTotalGbp)}` : undefined,
      '\nFX estimate only',
    ].filter(Boolean).join('\n');

    try {
      const navigatorShare = typeof navigator !== 'undefined' && 'share' in navigator ? navigator.share : undefined;
      if (navigatorShare) {
        await navigatorShare.call(navigator, { title: 'Transvert scan', text: message });
        return;
      }
      await Share.share({ message });
    } catch {
      Alert.alert('Share unavailable', 'Could not open the share sheet.');
    }
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.topTitle}>Result</Text>
        <Pressable style={styles.iconButton} onPress={handleShare}>
          <Ionicons name="share-outline" color={colors.text} size={18} />
        </Pressable>
      </View>

      {scan.imageUri && (
        <View style={styles.imageFrame}>
          <Image source={{ uri: scan.imageUri }} resizeMode="contain" style={styles.image} />
          {overlayMode && overlayItems.length > 0 && (
            <View pointerEvents="none" style={styles.overlayLayer}>
              {overlayItems.map(({ price, top, left, right, hasBox }) => (
                <View key={price.id} style={[styles.overlayChip, hasBox && styles.trueOverlayChip, { top, left, right }]}>
                  <Text style={styles.overlayOriginal} numberOfLines={1}>{price.itemText || price.context || 'Menu item'}</Text>
                  <Text style={styles.overlayEnglish} numberOfLines={1}>{price.translatedItemText || 'English translation'}</Text>
                  <Text style={styles.overlayPrice}>{formatCurrency(price.amount, price.currency)} ≈ {formatGbp(price.convertedGbp ?? 0)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {scan.imageUri && scan.prices.length > 0 && (
        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggleButton, overlayMode && styles.toggleActive]} onPress={() => setOverlayMode(true)}>
            <Text style={[styles.toggleText, overlayMode && styles.toggleTextActive]}>Overlay</Text>
          </Pressable>
          <Pressable style={[styles.toggleButton, !overlayMode && styles.toggleActive]} onPress={() => setOverlayMode(false)}>
            <Text style={[styles.toggleText, !overlayMode && styles.toggleTextActive]}>Clean photo</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.hero}>
        <Text style={styles.label}>{mode === 'receipt' ? 'Receipt estimate' : 'Menu translated'}</Text>
        <Text style={styles.copy}>
          {scan.prices.length} prices detected • {scan.fxStatus ?? 'fallback'} • 1 EUR = {getCachedRate('EUR').toFixed(4)} GBP
        </Text>
        {shouldShowTotal && <Text style={styles.total}>{formatGbp(scan.estimatedTotalGbp)}</Text>}
      </View>

      <GlassCard style={[styles.card, qualityTone]}>
        <View style={styles.qualityHeader}>
          <Text style={styles.label}>OCR quality</Text>
          <Text style={styles.qualityScore}>{ocrQuality.score ?? '—'}%</Text>
        </View>
        <Text style={styles.qualityTitle}>{String(ocrQuality.label ?? 'unknown').toUpperCase()}</Text>
        <Text style={styles.qualityCopy}>{ocrQuality.reason ?? 'Scan quality estimate.'}</Text>
        <Text style={styles.qualityMeta}>{ocrLines.length ? `${ocrLines.length} positioned text lines captured. ${trueOverlayCount} menu overlays placed from OCR boxes.` : 'Bounding boxes unavailable for this scan. Retake after the new deployment for true overlay data.'}</Text>
        {ocrWarnings[0] && <Text style={styles.qualityWarning}>{ocrWarnings[0]}</Text>}
      </GlassCard>

      <GlassCard style={styles.card}>
        <View style={styles.priceHeader}>
          <Text style={styles.label}>Tap-and-read menu</Text>
          <Text style={styles.rate}>English + GBP</Text>
        </View>
        {scan.prices.length === 0 ? (
          <View>
            <Text style={styles.empty}>No prices detected in the extracted text.</Text>
            <Text style={styles.rawSubhead}>Extracted OCR text</Text>
            <Text style={styles.body}>{scan.originalText}</Text>
          </View>
        ) : (
          <View style={styles.menuCards}>
            {scan.prices.map((price, index) => (
              <View key={price.id}>
                {price.section && (index === 0 || scan.prices[index - 1]?.section !== price.section) && (
                  <Text style={styles.sectionLabel}>{price.section}</Text>
                )}
                <View style={styles.menuCard}>
                  <View style={styles.menuCardHeader}>
                    <Text style={styles.itemName} numberOfLines={2}>{price.itemText || price.context || 'Detected item'}</Text>
                    <Text style={styles.priceConverted}>{formatGbp(price.convertedGbp ?? 0)}</Text>
                  </View>
                  <Text style={styles.translationText}>{price.translatedItemText || 'Translation unavailable'}</Text>
                  <View style={styles.menuCardFooter}>
                    <Text style={styles.priceOriginal}>{formatCurrency(price.amount, price.currency)}</Text>
                    {price.note && <Text style={styles.note}>{price.note}</Text>}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        {shouldShowTotal && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total estimate</Text>
            <Text style={styles.totalValue}>{formatGbp(scan.estimatedTotalGbp)}</Text>
          </View>
        )}
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

      <Text style={styles.disclaimer}>FX estimate only. Overlay uses OCR text boxes where available, with fallback placement when a menu row cannot be matched.</Text>

      {savedMessage && (
        <View style={styles.savedBanner}>
          <Ionicons name="checkmark-circle-outline" color={colors.success} size={17} />
          <Text style={styles.savedText}>Scan saved</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.secondaryAction} onPress={handleSave}>
          <Text style={styles.secondaryText}>Save scan</Text>
        </Pressable>
        <Pressable style={styles.primaryAction} onPress={() => router.push('/scan')}>
          <Text style={styles.primaryText}>Scan again</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 70, color: colors.text, fontSize: 22, fontWeight: '900' },
  topBar: { paddingTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  topTitle: { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  imageFrame: { height: IMAGE_FRAME_HEIGHT, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(2,7,19,0.74)', marginTop: 24, position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlayLayer: { ...StyleSheet.absoluteFillObject },
  overlayChip: { position: 'absolute', width: 205, maxWidth: '74%', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(103,232,249,0.45)', backgroundColor: 'rgba(2,7,19,0.9)', paddingHorizontal: 10, paddingVertical: 8 },
  trueOverlayChip: { borderColor: 'rgba(34,197,94,0.55)' },
  overlayOriginal: { color: colors.dim, fontSize: 10, fontWeight: '800' },
  overlayEnglish: { marginTop: 2, color: colors.text, fontSize: 13, fontWeight: '900' },
  overlayPrice: { marginTop: 3, color: colors.cyan, fontSize: 12, fontWeight: '900' },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  toggleButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  toggleText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  toggleTextActive: { color: colors.navy950 },
  hero: { marginTop: 22, marginBottom: 8 },
  label: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  total: { marginTop: 10, color: colors.text, fontSize: 42, fontWeight: '900' },
  copy: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 21 },
  qualityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qualityScore: { color: colors.text, fontSize: 18, fontWeight: '900' },
  qualityTitle: { marginTop: 10, color: colors.text, fontSize: 18, fontWeight: '900' },
  qualityCopy: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 19 },
  qualityMeta: { marginTop: 8, color: colors.dim, fontSize: 12, lineHeight: 18 },
  qualityWarning: { marginTop: 8, color: colors.danger, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  qualityGood: { borderColor: 'rgba(34,197,94,0.45)' },
  qualityFair: { borderColor: 'rgba(250,204,21,0.45)' },
  qualityPoor: { borderColor: 'rgba(251,113,133,0.55)' },
  textGrid: { gap: 12 },
  textGridWide: { flexDirection: 'row' },
  textCardWide: { flex: 1 },
  card: { marginTop: 12 },
  body: { marginTop: 14, color: colors.text, fontSize: 16, lineHeight: 25 },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rate: { color: colors.dim, fontSize: 11, fontWeight: '800' },
  empty: { marginTop: 14, color: colors.muted },
  menuCards: { marginTop: 12, gap: 10 },
  menuCard: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.035)', padding: 14 },
  menuCardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sectionLabel: { marginTop: 10, color: colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase' },
  itemName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
  note: { color: colors.cyan, fontSize: 11, flex: 1, textAlign: 'right' },
  translationText: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 20 },
  menuCardFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  priceOriginal: { color: colors.text, fontSize: 13, fontWeight: '800' },
  priceConverted: { color: colors.cyan, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 },
  totalLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  totalValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
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
