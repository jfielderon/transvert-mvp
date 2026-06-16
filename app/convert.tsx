import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { convertBetween, convertWithRates, formatCurrency, getRateSnapshot, loadFxRates } from '@/services/fx';
import type { FxRates } from '@/services/fx/types';
import { colors } from '@/theme/colors';
import type { CurrencyCode } from '@/types/scan';

const quickAmounts = [10, 20, 50, 100];
const trend = [52, 58, 61, 57, 54, 50, 48, 51, 56, 60, 63, 61, 58, 55, 57, 59];
const currencies: CurrencyCode[] = ['EUR', 'GBP', 'USD'];
const currencyNames: Record<CurrencyCode, string> = {
  EUR: 'Euro',
  GBP: 'British Pound',
  USD: 'US Dollar',
};
const bankPlaceholders = ['Revolut', 'Starling', 'Monzo', 'Metro', 'Chase', 'Wise'];

type OpenCurrencySelector = 'from' | 'to' | null;

function formatUpdatedAt(timestamp?: number) {
  if (!timestamp) return 'waiting for rate';
  return `updated ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function CurrencyDropdown({
  value,
  isOpen,
  onToggle,
  onSelect,
}: {
  value: CurrencyCode;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: CurrencyCode) => void;
}) {
  return (
    <View style={styles.dropdownWrap}>
      <Pressable style={[styles.selector, isOpen && styles.selectorActive]} onPress={onToggle}>
        <Text style={styles.selectorText}>{value}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} color={colors.dim} size={16} />
      </Pressable>
      {isOpen && (
        <GlassCard style={styles.dropdownMenu}>
          {currencies.map((currency) => (
            <Pressable
              key={currency}
              style={[styles.dropdownOption, currency === value && styles.dropdownOptionActive]}
              onPress={() => onSelect(currency)}
            >
              <View>
                <Text style={[styles.dropdownCode, currency === value && styles.dropdownCodeActive]}>{currency}</Text>
                <Text style={styles.dropdownName}>{currencyNames[currency]}</Text>
              </View>
              {currency === value && <Ionicons name="checkmark" color={colors.cyan} size={16} />}
            </Pressable>
          ))}
        </GlassCard>
      )}
    </View>
  );
}

export default function ConvertScreen() {
  const initialSnapshot = getRateSnapshot();
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<FxRates>(initialSnapshot.rates);
  const [status, setStatus] = useState(initialSnapshot.status);
  const [provider, setProvider] = useState(initialSnapshot.provider);
  const [fetchedAt, setFetchedAt] = useState(initialSnapshot.fetchedAt);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('EUR');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('GBP');
  const [openSelector, setOpenSelector] = useState<OpenCurrencySelector>(null);
  const numericAmount = Number(amount.replace(',', '.')) || 0;
  const converted = useMemo(() => {
    const gbpValue = convertWithRates(numericAmount, fromCurrency, rates);
    return toCurrency === 'GBP' ? gbpValue : gbpValue / (rates[toCurrency] || 1);
  }, [fromCurrency, numericAmount, rates, toCurrency]);

  useEffect(() => {
    loadFxRates().then((snapshot) => {
      setRates(snapshot.rates);
      setStatus(snapshot.status);
      setProvider(snapshot.provider);
      setFetchedAt(snapshot.fetchedAt);
    });
  }, []);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CONVERT</Text>
        <Text style={styles.title}>Know your price.</Text>
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
            <Text style={styles.meta}>{currencyNames[fromCurrency]}</Text>
          </View>
          <CurrencyDropdown
            value={fromCurrency}
            isOpen={openSelector === 'from'}
            onToggle={() => setOpenSelector((current) => current === 'from' ? null : 'from')}
            onSelect={(currency) => {
              setFromCurrency(currency);
              setOpenSelector(null);
            }}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Pressable style={styles.swap} onPress={swapCurrencies}>
            <MaterialCommunityIcons name="swap-vertical" color={colors.cyan} size={20} />
          </Pressable>
          <View style={styles.divider} />
        </View>

        <View style={styles.currencyRow}>
          <View style={styles.amountBlock}>
            <Text style={[styles.label, styles.accentLabel]}>To</Text>
            <Text style={styles.converted}>{formatCurrency(converted, toCurrency)}</Text>
            <Text style={styles.meta}>{currencyNames[toCurrency]}</Text>
          </View>
          <CurrencyDropdown
            value={toCurrency}
            isOpen={openSelector === 'to'}
            onToggle={() => setOpenSelector((current) => current === 'to' ? null : 'to')}
            onSelect={(currency) => {
              setToCurrency(currency);
              setOpenSelector(null);
            }}
          />
        </View>
      </GlassCard>

      <View style={styles.rateRow}>
        <View style={styles.rateTextBlock}>
          <Text style={styles.rate}>1 {fromCurrency} = {convertBetween(1, fromCurrency, toCurrency, rates).toFixed(4)} {toCurrency}</Text>
          <Text style={styles.rateMeta}>{provider} • {formatUpdatedAt(fetchedAt)}</Text>
        </View>
        <Text style={[styles.estimate, status === 'live' ? styles.liveStatus : styles.cachedStatus]}>{status}</Text>
      </View>

      <View style={styles.quickRow}>
        {quickAmounts.map((value) => (
          <Pressable key={value} style={styles.quickButton} onPress={() => setAmount(String(value))}>
            <Text style={styles.quickText}>{formatCurrency(value, fromCurrency)}</Text>
          </Pressable>
        ))}
      </View>

      <GlassCard style={styles.bankCard}>
        <View style={styles.bankHeader}>
          <View>
            <Text style={[styles.label, styles.accentLabel]}>Bank link</Text>
            <Text style={styles.bankTitle}>Exact fees coming soon.</Text>
          </View>
          <Ionicons name="lock-closed-outline" color={colors.cyan} size={20} />
        </View>
        <Text style={styles.bankCopy}>Connect a travel card later to show exact ATM charges, FX markups, card fees and final bank deductions.</Text>
        <View style={styles.bankGrid}>
          {bankPlaceholders.map((bank) => (
            <View key={bank} style={styles.bankPill}>
              <Text style={styles.bankPillText}>{bank}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.bankFootnote}>Coming soon — exact travel card fees, ATM charges and FX markups.</Text>
      </GlassCard>

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

      <Text style={styles.disclaimer}>Rates are live when network access is available and fall back to recent cache or local rates when unavailable.</Text>
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
    overflow: 'visible',
    zIndex: 4,
  },
  currencyRow: {
    minHeight: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    zIndex: 6,
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
  dropdownWrap: {
    position: 'relative',
    zIndex: 20,
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
  selectorActive: {
    borderColor: colors.cyanGlow,
  },
  selectorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 190,
    padding: 8,
    zIndex: 30,
  },
  dropdownOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 10,
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(103,232,249,0.08)',
  },
  dropdownCode: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  dropdownCodeActive: {
    color: colors.cyan,
  },
  dropdownName: {
    marginTop: 2,
    color: colors.dim,
    fontSize: 11,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    zIndex: 1,
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
  rateTextBlock: {
    flex: 1,
  },
  rate: {
    color: colors.muted,
    fontSize: 14,
  },
  rateMeta: {
    marginTop: 4,
    color: colors.dim,
    fontSize: 11,
  },
  estimate: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  liveStatus: {
    color: colors.success,
  },
  cachedStatus: {
    color: colors.dim,
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
  bankCard: {
    marginTop: 24,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  bankTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  bankCopy: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  bankPill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bankPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  bankFootnote: {
    marginTop: 14,
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
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
    marginBottom: 120,
    color: colors.dim,
    fontSize: 13,
    lineHeight: 20,
  },
});
