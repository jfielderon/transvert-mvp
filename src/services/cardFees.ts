import type { CurrencyCode } from '@/types/scan';

export type CardFeeProfile = {
  cardName: string;
  foreignExchangeFeePercent: number;
  atmFeeGbp: number;
  source: 'default' | 'future-card-connection';
};

export const defaultCardFeeProfile: CardFeeProfile = {
  cardName: 'Standard travel card',
  foreignExchangeFeePercent: 0,
  atmFeeGbp: 0,
  source: 'default',
};

export function estimateCardFees(amountGbp: number, originalCurrency: CurrencyCode, profile = defaultCardFeeProfile) {
  if (originalCurrency === 'GBP') return 0;
  return amountGbp * (profile.foreignExchangeFeePercent / 100) + profile.atmFeeGbp;
}
