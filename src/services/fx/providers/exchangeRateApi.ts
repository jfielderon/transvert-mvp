import { env } from '@/config/env';
import type { FxProvider, FxSnapshot } from '@/services/fx/types';

export const EXCHANGE_RATE_FALLBACK: FxSnapshot = {
  base: 'GBP',
  provider: 'local-fallback',
  status: 'fallback',
  fetchedAt: 0,
  rates: {
    GBP: 1,
    EUR: 0.8635,
    USD: 0.79,
  },
};

export const exchangeRateProvider: FxProvider = {
  id: env.exchangeRateApiKey ? 'exchangerate-api' : 'open-er-api',
  async loadRates() {
    const response = await fetch(buildUrl());
    if (!response.ok) throw new Error(`FX request failed with ${response.status}`);

    const payload = await response.json();
    const eurToGbp = Number(payload?.conversion_rates?.GBP);
    const eurToUsd = Number(payload?.conversion_rates?.USD);

    if (!Number.isFinite(eurToGbp) || !Number.isFinite(eurToUsd) || eurToUsd <= 0) {
      throw new Error('FX payload did not include usable EUR rates.');
    }

    return {
      base: 'GBP',
      provider: env.exchangeRateApiKey ? 'exchangerate-api' : 'open-er-api',
      status: 'live',
      fetchedAt: Date.now(),
      rates: {
        GBP: 1,
        EUR: eurToGbp,
        USD: eurToGbp / eurToUsd,
      },
    };
  },
};

function buildUrl() {
  if (env.exchangeRateApiKey) {
    return `https://v6.exchangerate-api.com/v6/${env.exchangeRateApiKey}/latest/EUR`;
  }

  return 'https://open.er-api.com/v6/latest/EUR';
}
