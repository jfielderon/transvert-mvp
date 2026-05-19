import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { convertWithRates, formatCurrency, formatGbp, getRateSnapshot, loadFxRates, type FxRates } from '@/services/conversion';
import { colors } from '@/theme/colors';

const quickAmounts = [10, 20, 50, 100];
const trend = [52, 58, 61, 57, 54, 50, 48, 51, 56, 60, 63, 61, 58, 55, 57, 59];

export default function ConvertScreen() {
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<FxRates>(getRateSnapshot().rates);
  const [provider, setProvider] = useState(getRateSnapshot().provider);
  const numericAmount = Number(amount.replace(',', '.')) || 0;
  const converted = useMemo(() => convertWithRates(numericAmount, 'EUR', rates), [numericAmount, rates]);

  useEffect(() => {
    loadFxRates().then((snapshot) => {
      setRates(snapshot.rates);
      setProvider(snapshot.provider);
    });
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CONVERT</Text>
        <Text style={styles.title}>Know the real price before your card does.</Text>
      </View>

      <GlassCard style={styles.panel}>
        <View style={styles.currencyRow}>
          <View style={styles.amountBlock}>
            <Text style={styles.label}>From</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.dim}
              style={styles.amountInput}
            />
            <Text style={styles.meta}>Euro</Text>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorText}>EUR</Text>
            <Ionicons name="chevron-down" color={colors.dim} size={16} />
          </View>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <View style={styles.swap}>
            <MaterialCommunityIcons name="swap-vertical" color={colors.cyan} size={20} />
          </View>
          <View style={styles.divider} />
        </View>

        <View style={styles.currencyRow}>
          <View>
            <Text style={[styles.label, styles.accentLabel]}>To</Text>
            <Text style={styles.converted}>{formatGbp(converted)}</Text>
            <Text style={styles.meta}>British Pound</Text>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorText}>GBP</Text>
            <Ionicons name="chevron-down" color={colors.dim} size={16} />
          </View>
        </View>
      </GlassCard>

      <View style={styles.rateRow}>
        <Text style={styles.rate}>1 EUR = {rates.EUR.toFixed(4)} GBP</Text>
        <Text style={styles.estimate}>{provider}</Text>
      </View>

      <View style={styles.quickRow}>
        {quickAmounts.map((value) => (
          <Pressable key={value} style={styles.quickButton} onPress={() => setAmount(String(value))}>
            <Text style={styles.quickText}>{formatCurrency(value, 'EUR')}</Text>
          </Pressable>
        ))}
      </View>

      <GlassCard style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.label}>24h signal</Text>
          <Text style={styles.chartMeta}>Indicative</Text>
        </View>
        <View style={styles.chart}>
          {trend.map((value, index) => (
            <View key={`${value}-${index}`} style={styles.chartColumn}>
              <View style={[styles.point, { bottom: value }]} />
              {index < trend.length - 1 && <View style={[styles.segment, { bottom: value + 3 }]} />}
            </View>
          ))}
        </View>
      </GlassCard>

      <Text style={styles.disclaimer}>Rates are live when network access is available and fall back locally in Expo Go.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 54,
    marginBottom: 24,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },
  title: {
    marginTop: 14,
    maxWidth: 320,
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 39,
  },
  panel: {
    padding: 22,
  },
  currencyRow: {
    minHeight: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  amountBlock: {
    flex: 1,
  },
  label: {
    color: colors.dim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  accentLabel: {
    color: colors.cyan,
  },
  amountInput: {
    marginTop: 12,
    color: colors.text,
    fontSize: 50,
    fontWeight: '700',
    lineHeight: 58,
    padding: 0,
  },
  converted: {
    marginTop: 18,
    color: colors.text,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 46,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
  },
  selector: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
  },
  selectorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  swap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 12,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
  },
  rate: {
    color: colors.muted,
    fontSize: 14,
  },
  estimate: {
    color: colors.success,
    fontSize: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  quickButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  chartCard: {
    marginTop: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartMeta: {
    color: colors.dim,
    fontSize: 12,
  },
  chart: {
    height: 128,
    flexDirection: 'row',
    marginTop: 20,
  },
  chartColumn: {
    flex: 1,
  },
  point: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cyan,
  },
  segment: {
    position: 'absolute',
    left: 4,
    right: -18,
    height: 1,
    backgroundColor: colors.cyanGlow,
  },
  disclaimer: {
    marginTop: 22,
    color: colors.dim,
    fontSize: 13,
    lineHeight: 20,
  },
});
