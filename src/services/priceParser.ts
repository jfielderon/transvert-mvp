import { convertToGbp, convertWithRates } from '@/services/fx';
import type { FxRates } from '@/services/fx/types';
import { createId } from '@/services/ids';
import type { CurrencyCode, DetectedPrice, ScanMode } from '@/types/scan';

const AMOUNT = String.raw`\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?`;
const CURRENCY_SYMBOLS = String.raw`\u20ac\u00a3$`;
const LEADING_SYMBOL_PATTERN = new RegExp(String.raw`(?<symbol>[${CURRENCY_SYMBOLS}])\s*(?<amount>${AMOUNT})\b`, 'g');
const TRAILING_SYMBOL_PATTERN = new RegExp(String.raw`\b(?<amount>${AMOUNT})\s*(?<symbol>[${CURRENCY_SYMBOLS}])`, 'g');
const CODE_PATTERN = new RegExp(String.raw`\b(?:(?<code1>EUR|GBP|USD)\s*(?<amount1>${AMOUNT})|(?<amount2>${AMOUNT})\s*(?<code2>EUR|GBP|USD))\b`, 'gi');

function currencyFromToken(token: string): CurrencyCode {
  const upper = token.toUpperCase();
  if (token === '\u20ac' || upper === 'EUR') return 'EUR';
  if (token === '\u00a3' || upper === 'GBP') return 'GBP';
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

function itemTextFor(context: string, rawPrice: string) {
  return context
    .replace(rawPrice, ' ')
    .replace(/\b(EUR|GBP|USD)\b/gi, ' ')
    .replace(/[€£$]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+[-–—:]\s*$/, '')
    .trim();
}

function sectionFor(text: string, start: number) {
  const before = text.slice(0, start).split('\n').map((line) => line.trim()).filter(Boolean);
  for (let index = before.length - 1; index >= 0; index -= 1) {
    const line = before[index];
    if (/[€£$]|\b(EUR|GBP|USD)\b/i.test(line)) continue;
    if (line.length > 42) continue;
    if (/^[A-Z0-9 À-ÿ'&-]+$/.test(line) || /\b(menu|tapas|starters|mains|desserts|drinks|bebidas|postres|entrantes)\b/i.test(line)) {
      return line;
    }
  }
  return undefined;
}

function textLooksLikeMenu(text: string) {
  return /\b(menu|tapas|raciones|bocadillo|paella|ensalada|gazpacho|queso|vino|cerveza|cafe|pizza|pasta|starter|main|dessert|plato|bebida)\b/i.test(text);
}

function shouldInterpretAsMenuCents(amountRaw: string, amount: number, currency: CurrencyCode, context: string, text: string, mode: ScanMode) {
  if (currency !== 'EUR') return false;
  if (mode !== 'menu' && !textLooksLikeMenu(text)) return false;
  if (/[,.]/.test(amountRaw)) return false;
  if (/\b(total|subtotal|importe|amount due|balance due|receipt|factura)\b/i.test(context)) return false;
  return amount >= 100 && amount <= 999;
}

function roleForContext(context: string): DetectedPrice['role'] {
  const lower = context.toLowerCase();
  if (/\b(total|importe|amount due|balance due|subtotal)\b/.test(lower)) return 'total';
  if (/\b(service|servicio|tip|propina|fee|charge|cover|cubierto)\b/.test(lower)) return 'fee';
  return 'line-item';
}

function addMatch(
  output: DetectedPrice[],
  occupied: Set<number>,
  text: string,
  match: RegExpExecArray,
  amountRaw: string,
  currencyToken: string,
  rates: FxRates | undefined,
  mode: ScanMode
) {
  const originalAmount = normaliseAmount(amountRaw);
  if (!Number.isFinite(originalAmount) || originalAmount <= 0) return;

  const start = match.index;
  const end = match.index + match[0].length;
  for (let index = start; index < end; index += 1) {
    if (occupied.has(index)) return;
  }
  for (let index = start; index < end; index += 1) occupied.add(index);

  const currency = currencyFromToken(currencyToken);
  const context = contextFor(text, start, end);
  const itemText = itemTextFor(context, match[0].trim());
  const interpretedAsMenuPricing = shouldInterpretAsMenuCents(amountRaw, originalAmount, currency, context, text, mode);
  const amount = interpretedAsMenuPricing ? originalAmount / 100 : originalAmount;

  output.push({
    id: createId('price'),
    raw: match[0].trim(),
    originalAmount,
    amount,
    currency,
    convertedGbp: rates ? convertWithRates(amount, currency, rates) : convertToGbp(amount, currency),
    context,
    itemText: itemText || context,
    section: sectionFor(text, start),
    role: roleForContext(context),
    confidence: interpretedAsMenuPricing ? 'interpreted-menu-pricing' : 'detected',
    note: interpretedAsMenuPricing ? 'Interpreted as menu pricing' : undefined,
  });
}

export function detectPrices(text: string, mode: ScanMode = 'menu'): DetectedPrice[] {
  return detectPricesWithRates(text, undefined, mode);
}

export function detectPricesWithRates(text: string, rates?: FxRates, mode: ScanMode = 'menu'): DetectedPrice[] {
  const prices: DetectedPrice[] = [];
  const occupied = new Set<number>();

  for (const pattern of [LEADING_SYMBOL_PATTERN, TRAILING_SYMBOL_PATTERN]) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);

    while (match) {
      const groups = match.groups ?? {};
      addMatch(prices, occupied, text, match, groups.amount ?? '', groups.symbol ?? '', rates, mode);
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
      rates,
      mode
    );
    codeMatch = CODE_PATTERN.exec(text);
  }

  const seen = new Set<string>();
  return prices
    .filter((price) => {
      const key = `${price.section ?? ''}|${price.itemText ?? price.context ?? ''}|${price.amount}|${price.currency}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => text.indexOf(a.raw) - text.indexOf(b.raw));
}

export function totalGbp(prices: DetectedPrice[]) {
  const explicitTotals = prices.filter((price) => price.role === 'total');
  if (explicitTotals.length > 0) {
    return explicitTotals[explicitTotals.length - 1]?.convertedGbp ?? 0;
  }

  return prices
    .filter((price) => price.role !== 'fee')
    .reduce((sum, price) => sum + (price.convertedGbp ?? 0), 0);
}
