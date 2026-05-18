import { ConvertedPrice, DetectedPrice } from '@/types/scan';
import { makeId } from '@/services/id';

export const EUR_TO_GBP = 0.8635;

const pattern = /(?:€\s?\d+[\.,]\d{2}|\d+[\.,]\d{2}\s?€|£\s?\d+[\.,]\d{2}|\$\s?\d+[\.,]\d{2})/g;

const toValue = (price: string): number => {
  const numeric = price.replace(/[^\d,.]/g, '').replace(',', '.');
  return Number(numeric);
};

const asCurrency = (price: string): DetectedPrice['currency'] => {
  if (price.includes('€')) return 'EUR';
  if (price.includes('£')) return 'GBP';
  return 'USD';
};

export function extractPrices(text: string): {
  detected: DetectedPrice[];
  converted: ConvertedPrice[];
  estimatedTotalGBP: number;
} {
  const matches = text.match(pattern) ?? [];
  const detected = matches.map((raw) => ({
    id: makeId(),
    raw,
    currency: asCurrency(raw),
    normalizedValue: toValue(raw),
  }));

  const converted = detected
    .filter((d) => d.currency === 'EUR')
    .map((d) => ({ id: d.id, eur: d.normalizedValue, gbp: d.normalizedValue * EUR_TO_GBP }));

  const estimatedTotalGBP =
    detected
      .map((p) => {
        if (p.currency === 'EUR') return p.normalizedValue * EUR_TO_GBP;
        if (p.currency === 'GBP') return p.normalizedValue;
        return 0;
      })
      .reduce((sum, value) => sum + value, 0);

  return { detected, converted, estimatedTotalGBP };
}
