import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXCHANGE_RATE_FALLBACK, exchangeRateProvider } from '@/services/fx/providers/exchangeRateApi';
import type { CurrencyCode } from '@/types/scan';
import type { FxRates, FxSnapshot } from '@/services/fx/types';

const FX_CACHE_KEY = 'transvert.fx.snapshot';
const CACHE_TTL_MS = 30 * 60 * 1000;

let memorySnapshot: FxSnapshot = EXCHANGE_RATE_FALLBACK;

export async function loadFxRates(): Promise<FxSnapshot> {
  const cached = await readCachedSnapshot();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    memorySnapshot = { ...cached, status: 'cached' };
    return memorySnapshot;
  }

  try {
    const live = await exchangeRateProvider.loadRates();
    memorySnapshot = live;
    await AsyncStorage.setItem(FX_CACHE_KEY, JSON.stringify(live));
    return live;
  } catch {
    if (cached) {
      memorySnapshot = { ...cached, status: 'cached' };
      return memorySnapshot;
    }

    memorySnapshot = { ...EXCHANGE_RATE_FALLBACK, fetchedAt: Date.now(), status: 'fallback' };
    return memorySnapshot;
  }
}

export function getRateSnapshot() {
  return memorySnapshot;
}

export function getCachedRate(currency: CurrencyCode) {
  return memorySnapshot.rates[currency] ?? EXCHANGE_RATE_FALLBACK.rates[currency] ?? 1;
}

export function convertWithRates(amount: number, currency: CurrencyCode, rates: FxRates = memorySnapshot.rates) {
  if (!Number.isFinite(amount)) return 0;
  return amount * (rates[currency] ?? EXCHANGE_RATE_FALLBACK.rates[currency] ?? 1);
}

export function convertToGbp(amount: number, currency: CurrencyCode) {
  return convertWithRates(amount, currency);
}

export function convertBetween(amount: number, from: CurrencyCode, to: CurrencyCode, rates: FxRates = memorySnapshot.rates) {
  if (!Number.isFinite(amount)) return 0;
  const gbp = convertWithRates(amount, from, rates);
  const targetRate = rates[to] ?? EXCHANGE_RATE_FALLBACK.rates[to] ?? 1;
  return targetRate === 0 ? 0 : gbp / targetRate;
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
  const converted = convertBetween(1, from, to);
  return `1 ${from} = ${converted.toFixed(4)} ${to}`;
}

async function readCachedSnapshot() {
  try {
    const raw = await AsyncStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FxSnapshot;
  } catch {
    return null;
  }
}
