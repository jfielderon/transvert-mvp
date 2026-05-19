import { StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatGbp } from '@/services/conversion';
import { colors } from '@/theme/colors';
import type { DetectedPrice } from '@/types/scan';

type PriceRowProps = {
  price: DetectedPrice;
};

export function PriceRow({ price }: PriceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.raw}>{price.raw}</Text>
        <Text style={styles.context} numberOfLines={1}>{price.context}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.original}>{formatCurrency(price.amount, price.currency)}</Text>
        <Text style={styles.converted}>{formatGbp(price.convertedGbp ?? 0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  right: {
    alignItems: 'flex-end',
  },
  raw: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  context: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
  },
  original: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  converted: {
    marginTop: 4,
    color: colors.cyan,
    fontSize: 18,
    fontWeight: '900',
  },
});
