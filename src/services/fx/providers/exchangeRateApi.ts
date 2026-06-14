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
  id: env.exchangeRateApiKey ? 'exchangerate-api' : 'frankfurter',
  async loadRates() {
    const errors: string[] = [];

    for (const url of buildUrls()) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FX request failed with ${response.status}`);

        const payload = await response.json();
        const snapshot = parseFxPayload(payload, env.exchangeRateApiKey ? 'exchangerate-api' : 'frankfurter');
        if (snapshot) return snapshot;
        errors.push('FX payload did not include usable rates.');
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'FX request failed.');
      }
    }

    throw new Error(errors[0] ?? 'FX request failed.');
  },
};

function buildUrls() {
  if (env.exchangeRateApiKey) {
    return [`https://v6.exchangerate-api.com/v6/${env.exchangeRateApiKey}/latest/EUR`];
  }

  return [
    'https://api.frankfurter.app/latest?from=EUR&to=GBP,USD',
    'https://open.er-api.com/v6/latest/EUR',
  ];
}

function parseFxPayload(payload: any, provider: string): FxSnapshot | null {
  const gbp = Number(payload?.rates?.GBP ?? payload?.conversion_rates?.GBP);
  const usd = Number(payload?.rates?.USD ?? payload?.conversion_rates?.USD);

  if (!Number.isFinite(gbp) || !Number.isFinite(usd) || usd <= 0) {
    return null;
  }

  return {
    base: 'GBP',
    provider,
    status: 'live',
    fetchedAt: Date.now(),
    rates: {
      GBP: 1,
      EUR: gbp,
      USD: gbp / usd,
    },
  };
}
