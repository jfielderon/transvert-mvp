import type { ScanMode } from '@/types/scan';

export type ScanModeOption = {
  mode: ScanMode;
  label: string;
  icon: string;
  hint: string;
};

export const SCAN_MODE_OPTIONS: ScanModeOption[] = [
  { mode: 'auto', label: 'Auto', icon: 'sparkles-outline', hint: 'Let Transvert decide' },
  { mode: 'menu', label: 'Menu', icon: 'restaurant-outline', hint: 'Menus and price lists' },
  { mode: 'receipt', label: 'Bill', icon: 'receipt-outline', hint: 'Receipts and charges' },
  { mode: 'product', label: 'Product', icon: 'cube-outline', hint: 'Labels and packaging' },
  { mode: 'sign', label: 'Sign', icon: 'trail-sign-outline', hint: 'Airports, streets and transport' },
  { mode: 'document', label: 'Document', icon: 'document-text-outline', hint: 'Notes, flyers and forms' },
];

export function scanModeLabel(mode?: ScanMode) {
  return SCAN_MODE_OPTIONS.find((option) => option.mode === mode)?.label ?? 'Auto';
}

export function nextScanMode(current: ScanMode) {
  const index = SCAN_MODE_OPTIONS.findIndex((option) => option.mode === current);
  return SCAN_MODE_OPTIONS[(index + 1) % SCAN_MODE_OPTIONS.length]?.mode ?? 'auto';
}

export function inferScanMode(text: string, selected: ScanMode = 'auto'): ScanMode {
  if (selected !== 'auto') return selected;

  const lower = text.toLowerCase();
  const priceCount = (text.match(/[€£$]\s*\d|\d+[,.]\d{1,2}\s*[€£$]?/g) ?? []).length;

  if (/\b(total|subtotal|receipt|factura|iva|vat|service|servicio|tip|propina|card|cash|change)\b/i.test(text) && priceCount >= 2) return 'receipt';
  if (/\b(menu|tapas|starter|main|dessert|drinks|bebidas|postres|entrantes|paella|pizza|burger|salad|vino|cerveza)\b/i.test(text) && priceCount >= 1) return 'menu';
  if (/\b(ingredients|ingredientes|nutrition|nutrici[oó]n|allergens|al[eé]rgenos|shampoo|gel|crema|milk|leche|detergent|detergente)\b/i.test(text)) return 'product';
  if (/\b(exit|salida|entrance|entrada|platform|and[eé]n|gate|puerta|closed|cerrado|warning|prohibido|passport|equipaje|baggage)\b/i.test(text)) return 'sign';
  if (lower.length > 180) return 'document';
  return priceCount >= 2 ? 'receipt' : 'document';
}

export function resultTitleForMode(mode?: ScanMode) {
  switch (mode) {
    case 'menu': return 'Translated items';
    case 'receipt': return 'Bill breakdown';
    case 'product': return 'Product translation';
    case 'sign': return 'Sign translation';
    case 'document': return 'Document translation';
    default: return 'Translation';
  }
}
