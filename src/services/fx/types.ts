import type { CurrencyCode } from '@/types/scan';

export type FxStatus = 'live' | 'cached' | 'fallback' | 'failed';

export type FxRates = Record<CurrencyCode, number>;

export type FxSnapshot = {
  base: CurrencyCode;
  rates: FxRates;
  fetchedAt: number;
  provider: 'exchangerate-api' | 'open-er-api' | 'wise-ready' | 'local-fallback';
  status: FxStatus;
};

export type FxProvider = {
  id: FxSnapshot['provider'];
  loadRates: () => Promise<FxSnapshot>;
};
