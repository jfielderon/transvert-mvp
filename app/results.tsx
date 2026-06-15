import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { formatCurrency, formatGbp, getCachedRate } from '@/services/fx';
import { saveScan } from '@/storage/scans';
import { translateMenuText } from '@/services/translate';
import { colors } from '@/theme/colors';
import { useScans } from '@/hooks/useScans';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const { scans, isLoading, refresh } = useScans();
  const [savedMessage, setSavedMessage] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const scan = useMemo(() => scans.find((item) => item.id === id), [id, scans]);
  const isWide = width >= 760;

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
  const translatedText = scan.translatedText ?? translateMenuText(scan.originalText);
  const shouldShowTotal = mode === 'receipt';

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
      scan.imageUri ? `Original image: ${scan.imageUri}` : undefined,
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
      Alert.alert('Share unavailable', 'Could not open the share sheet. The scan text is ready to copy from this result.');
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
        </View>
      )}

      <View style={styles.hero}>
        <Text style={styles.label}>{mode === 'receipt' ? 'Receipt estimate' : 'Estimated menu prices'}</Text>
        <Text style={styles.copy}>
          {scan.prices.length} prices detected - {scan.fxStatus ?? 'fallback'} - 1 EUR = {getCachedRate('EUR').toFixed(4)} GBP
        </Text>
        {scan.prices.some((price) => price.confidence === 'interpreted-menu-pricing') && (
          <Text style={styles.confidence}>Interpreted as menu pricing where OCR looked like whole-number cents.</Text>
        )}
        {shouldShowTotal && <Text style={styles.total}>{formatGbp(scan.estimatedTotalGbp)}</Text>}
      </View>

      <GlassCard style={styles.card}>
        <View style={styles.priceHeader}>
          <Text style={styles.label}>Detected items</Text>
          <Text style={styles.rate}>Item | English | EUR | GBP estimate</Text>
        </View>
        {scan.prices.length === 0 ? (
          <View>
            <Text style={styles.empty}>No prices detected in the extracted text.</Text>
            <Text style={styles.rawSubhead}>Extracted OCR text</Text>
            <Text style={styles.body}>{scan.originalText}</Text>
          </View>
        ) : (
          scan.prices.map((price, index) => (
            <View key={price.id}>
              {price.section && (index === 0 || scan.prices[index - 1]?.section !== price.section) && (
                <Text style={styles.sectionLabel}>{price.section}</Text>
              )}
              <View style={styles.priceRow}>
                <View style={styles.itemCell}>
                  <Text style={styles.itemName} numberOfLines={2}>{price.itemText || price.context || 'Detected item'}</Text>
                  {price.note && <Text style={styles.note}>{price.note}</Text>}
                </View>
                <View style={styles.translationCell}>
                  <Text style={styles.translationText} numberOfLines={2}>{price.translatedItemText || 'Translation unavailable'}</Text>
                </View>
                <Text style={styles.priceOriginal}>{formatCurrency(price.amount, price.currency)}</Text>
                <Text style={styles.priceConverted}>{formatGbp(price.convertedGbp ?? 0)}</Text>
              </View>
            </View>
          ))
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

      <Text style={styles.disclaimer}>FX estimate only. Menu mode shows item prices individually and does not total the board as a bill.</Text>

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
  loading: {
    marginTop: 70,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  topBar: {
    paddingTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  imageFrame: {
    height: 220,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,7,19,0.74)',
    marginTop: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hero: {
    marginTop: 22,
    marginBottom: 8,
  },
  label: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  total: {
    marginTop: 10,
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
  },
  copy: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  confidence: {
    marginTop: 8,
    color: colors.cyan,
    fontSize: 13,
    lineHeight: 19,
  },
  textGrid: {
    gap: 12,
  },
  textGridWide: {
    flexDirection: 'row',
  },
  textCardWide: {
    flex: 1,
  },
  card: {
    marginTop: 12,
  },
  translatedCard: {
    borderColor: colors.cyanGlow,
  },
  cyanLabel: {
    color: colors.cyan,
  },
  body: {
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rate: {
    color: colors.dim,
    fontSize: 11,
    fontWeight: '800',
  },
  empty: {
    marginTop: 14,
    color: colors.muted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 14,
  },
  sectionLabel: {
    marginTop: 16,
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  itemCell: {
    flex: 1,
    minWidth: 0,
  },
  translationCell: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  note: {
    marginTop: 4,
    color: colors.cyan,
    fontSize: 11,
  },
  translationText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  priceOriginal: {
    width: 78,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  priceConverted: {
    width: 86,
    color: colors.cyan,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  disclaimer: {
    marginTop: 14,
    color: colors.dim,
    fontSize: 12,
    lineHeight: 18,
  },
  rawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rawSubhead: {
    marginTop: 14,
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  savedBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedText: {
    color: colors.success,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  secondaryAction: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryAction: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: colors.cyan,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '800',
  },
  primaryText: {
    color: colors.navy950,
    fontWeight: '900',
  },
});
