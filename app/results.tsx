import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { formatCurrency, formatGbp, getCachedRate } from '@/services/conversion';
import { saveScan } from '@/services/scanStorage';
import { translateMenuText } from '@/services/translation';
import { colors } from '@/theme/colors';
import { useScans } from '@/hooks/useScans';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { scans, isLoading, refresh } = useScans();
  const [savedMessage, setSavedMessage] = useState(false);
  const scan = useMemo(() => scans.find((item) => item.id === id), [id, scans]);

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

  const translatedText = scan.translatedText ?? translateMenuText(scan.originalText);

  const handleSave = async () => {
    await saveScan({ ...scan, translatedText });
    await refresh();
    setSavedMessage(true);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.topTitle}>Result</Text>
        <Pressable style={styles.iconButton}>
          <Ionicons name="share-outline" color={colors.text} size={18} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.label}>Estimated total</Text>
        <Text style={styles.total}>{formatGbp(scan.estimatedTotalGbp)}</Text>
        <Text style={styles.copy}>{scan.prices.length} prices detected - 1 EUR = {getCachedRate('EUR').toFixed(4)} GBP</Text>
      </View>

      {scan.imageUri && (
        <View style={styles.imageFrame}>
          <Image source={{ uri: scan.imageUri }} style={styles.image} />
        </View>
      )}

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Original</Text>
        <Text style={styles.body}>{scan.originalText}</Text>
      </GlassCard>

      <GlassCard style={[styles.card, styles.translatedCard]}>
        <Text style={[styles.label, styles.cyanLabel]}>Translated</Text>
        <Text style={styles.body}>{translatedText || 'No translation available.'}</Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <View style={styles.priceHeader}>
          <Text style={styles.label}>Detected prices</Text>
          <Text style={styles.rate}>EUR to GBP</Text>
        </View>
        {scan.prices.length === 0 ? (
          <Text style={styles.empty}>No prices detected in the entered text.</Text>
        ) : (
          scan.prices.map((price) => (
            <View key={price.id} style={styles.priceRow}>
              <View style={styles.priceContext}>
                <Text style={styles.priceOriginal}>{formatCurrency(price.amount, price.currency)}</Text>
                {!!price.context && <Text style={styles.context} numberOfLines={1}>{price.context}</Text>}
              </View>
              <Text style={styles.priceConverted}>{formatGbp(price.convertedGbp ?? 0)}</Text>
            </View>
          ))
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatGbp(scan.estimatedTotalGbp)}</Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.costCard}>
        <Text style={styles.goldLabel}>Real cost</Text>
        <View style={styles.costRow}>
          <View>
            <Text style={styles.costMeta}>Market estimate</Text>
            <Text style={styles.costValue}>{formatGbp(scan.estimatedTotalGbp)}</Text>
          </View>
          <View style={styles.costRight}>
            <Text style={styles.costMeta}>Card fees</Text>
            <Text style={styles.costComing}>Coming soon</Text>
          </View>
        </View>
      </GlassCard>

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
  hero: {
    marginTop: 34,
    marginBottom: 18,
  },
  label: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  total: {
    marginTop: 8,
    color: colors.text,
    fontSize: 46,
    fontWeight: '900',
  },
  copy: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  imageFrame: {
    height: 148,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.82,
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
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 14,
  },
  priceContext: {
    flex: 1,
    minWidth: 0,
  },
  priceOriginal: {
    color: colors.text,
    fontSize: 16,
  },
  context: {
    marginTop: 4,
    color: colors.dim,
    fontSize: 12,
  },
  priceConverted: {
    color: colors.cyan,
    fontSize: 16,
    fontWeight: '900',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  totalValue: {
    color: colors.cyan,
    fontSize: 18,
    fontWeight: '900',
  },
  costCard: {
    marginTop: 12,
    borderColor: 'rgba(216, 189, 102, 0.22)',
  },
  goldLabel: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 20,
  },
  costRight: {
    alignItems: 'flex-end',
  },
  costMeta: {
    color: colors.dim,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  costValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  costComing: {
    marginTop: 8,
    color: colors.warning,
    fontSize: 18,
    fontWeight: '900',
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
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
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  primaryAction: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.cyan,
  },
  primaryText: {
    color: colors.navy950,
    fontSize: 15,
    fontWeight: '900',
  },
});
