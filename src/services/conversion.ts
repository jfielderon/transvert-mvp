import { env } from '@/config/env';
import type { CurrencyCode } from '@/types/scan';

export const TEST_EUR_TO_GBP_RATE = 0.8635;
export const TEST_USD_TO_GBP_RATE = 0.79;

export type FxRates = Record<CurrencyCode, number>;

const fallbackRates: FxRates = {
  GBP: 1,
  EUR: TEST_EUR_TO_GBP_RATE,
  USD: TEST_USD_TO_GBP_RATE,
};

let rateCache: { rates: FxRates; fetchedAt: number; provider: string } = {
  rates: fallbackRates,
  fetchedAt: 0,
  provider: 'local-fallback',
};

export function convertToGbp(amount: number, currency: CurrencyCode) {
  if (!Number.isFinite(amount)) return 0;
  return amount * getCachedRate(currency);
}

export function convertWithRates(amount: number, currency: CurrencyCode, rates: FxRates = rateCache.rates) {
  if (!Number.isFinite(amount)) return 0;
  return amount * (rates[currency] ?? fallbackRates[currency] ?? 1);
}

export function getCachedRate(currency: CurrencyCode) {
  return rateCache.rates[currency] ?? fallbackRates[currency] ?? 1;
}

export function getRateSnapshot() {
  return rateCache;
}

export async function loadFxRates(): Promise<typeof rateCache> {
  const cacheAge = Date.now() - rateCache.fetchedAt;
  if (rateCache.fetchedAt && cacheAge < 30 * 60 * 1000) return rateCache;

  try {
    const response = await fetch(buildExchangeRateUrl());
    if (!response.ok) throw new Error(`FX request failed with ${response.status}`);

    const payload = await response.json();
    const eurToGbp = Number(payload?.conversion_rates?.GBP) || fallbackRates.EUR;
    const eurToUsd = Number(payload?.conversion_rates?.USD) || 1.1;

    rateCache = {
      provider: env.exchangeRateApiKey ? 'exchangerate-api' : 'open-er-api',
      fetchedAt: Date.now(),
      rates: {
        GBP: 1,
        EUR: eurToGbp,
        USD: eurToGbp / eurToUsd,
      },
    };
  } catch {
    rateCache = {
      provider: 'local-fallback',
      fetchedAt: Date.now(),
      rates: fallbackRates,
    };
  }

  return rateCache;
}

function buildExchangeRateUrl() {
  const key = env.exchangeRateApiKey;
  if (key) return `https://v6.exchangerate-api.com/v6/${key}/latest/EUR`;
  return 'https://open.er-api.com/v6/latest/EUR';
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatGbp(amount: number) {
  return formatCurrency(amount, 'GBP');
}

export function formatRateLine(from: CurrencyCode, to: CurrencyCode = 'GBP') {
  const rate = getCachedRate(from);
  return `1 ${from} = ${rate.toFixed(4)} ${to}`;
}
