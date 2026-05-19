import { convertToGbp, convertWithRates, type FxRates } from '@/services/conversion';
import { createId } from '@/services/ids';
import type { CurrencyCode, DetectedPrice } from '@/types/scan';

const AMOUNT = String.raw`\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?`;
const LEADING_SYMBOL_PATTERN = new RegExp(String.raw`(?<symbol>[€£$])\s*(?<amount>${AMOUNT})\b`, 'g');
const TRAILING_SYMBOL_PATTERN = new RegExp(String.raw`\b(?<amount>${AMOUNT})\s*(?<symbol>[€£$])`, 'g');
const CODE_PATTERN = new RegExp(String.raw`\b(?:(?<code1>EUR|GBP|USD)\s*(?<amount1>${AMOUNT})|(?<amount2>${AMOUNT})\s*(?<code2>EUR|GBP|USD))\b`, 'gi');

function currencyFromToken(token: string): CurrencyCode {
  const upper = token.toUpperCase();
  if (token === '€' || upper === 'EUR') return 'EUR';
  if (token === '£' || upper === 'GBP') return 'GBP';
  return 'USD';
}

function normaliseAmount(raw: string) {
  const trimmed = raw.trim();
  const lastComma = trimmed.lastIndexOf(',');
  const lastDot = trimmed.lastIndexOf('.');

  if (lastComma > lastDot) {
    return Number(trimmed.replace(/\./g, '').replace(',', '.'));
  }

  return Number(trimmed.replace(/,/g, ''));
}

function contextFor(text: string, start: number, end: number) {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const lineEndRaw = text.indexOf('\n', end);
  const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
  return text.slice(lineStart, lineEnd).replace(/\s+/g, ' ').trim();
}

function addMatch(
  output: DetectedPrice[],
  occupied: Set<number>,
  text: string,
  match: RegExpExecArray,
  amountRaw: string,
  currencyToken: string,
  rates?: FxRates
) {
  const amount = normaliseAmount(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) return;

  const start = match.index;
  const end = match.index + match[0].length;
  for (let index = start; index < end; index += 1) {
    if (occupied.has(index)) return;
  }
  for (let index = start; index < end; index += 1) occupied.add(index);

  const currency = currencyFromToken(currencyToken);

  output.push({
    id: createId('price'),
    raw: match[0].trim(),
    amount,
    currency,
    convertedGbp: rates ? convertWithRates(amount, currency, rates) : convertToGbp(amount, currency),
    context: contextFor(text, start, end),
  });
}

export function detectPrices(text: string): DetectedPrice[] {
  return detectPricesWithRates(text);
}

export function detectPricesWithRates(text: string, rates?: FxRates): DetectedPrice[] {
  const prices: DetectedPrice[] = [];
  const occupied = new Set<number>();

  for (const pattern of [LEADING_SYMBOL_PATTERN, TRAILING_SYMBOL_PATTERN]) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);

    while (match) {
      const groups = match.groups ?? {};
      addMatch(prices, occupied, text, match, groups.amount ?? '', groups.symbol ?? '', rates);
      match = pattern.exec(text);
    }
  }

  CODE_PATTERN.lastIndex = 0;
  let codeMatch = CODE_PATTERN.exec(text);
  while (codeMatch) {
    const groups = codeMatch.groups ?? {};
    addMatch(
      prices,
      occupied,
      text,
      codeMatch,
      groups.amount1 ?? groups.amount2 ?? '',
      groups.code1 ?? groups.code2 ?? '',
      rates
    );
    codeMatch = CODE_PATTERN.exec(text);
  }

  return prices.sort((a, b) => text.indexOf(a.raw) - text.indexOf(b.raw));
}

export function totalGbp(prices: DetectedPrice[]) {
  return prices.reduce((sum, price) => sum + (price.convertedGbp ?? 0), 0);
}
