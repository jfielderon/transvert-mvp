import { loadFxRates } from '@/services/fx';
import { createId } from '@/services/ids';
import { detectPricesWithRates, totalGbp } from '@/services/priceParser';
import { estimateRealCost } from '@/services/realCost';
import { localFallbackTranslate, translateText } from '@/services/translate';
import type { ScanMode, ScanRecord } from '@/types/scan';

type ProcessScanInput = {
  text: string;
  imageUri?: string;
  source: ScanRecord['source'];
  ocrStatus: ScanRecord['ocrStatus'];
  mode?: ScanMode;
};

function cleanupOcrText(text: string) {
  const seen = new Set<string>();

  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[|]{2,}/g, ' ')
    .replace(/\s+([€£$])/g, '$1')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      const key = line.toLowerCase();
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join('\n')
    .trim();
}

export async function processScanInput(input: ProcessScanInput): Promise<ScanRecord> {
  const mode = input.mode ?? 'menu';
  const trimmed = cleanupOcrText(input.text);
  if (!trimmed) throw new Error('Paste or enter text before processing.');

  const [fx, translation] = await Promise.all([
    loadFxRates(),
    translateText({ text: trimmed, targetLanguage: 'English' }),
  ]);
  const prices = detectPricesWithRates(trimmed, fx.rates, mode);
  const translatedItems = await Promise.all(
    prices.map(async (price) => {
      const itemText = price.itemText || price.context || '';
      if (!itemText.trim()) return price;

      try {
        const itemTranslation = await translateText({ text: itemText, targetLanguage: 'English' });
        return {
          ...price,
          translatedItemText: itemTranslation.provider === 'local-fallback' ? localFallbackTranslate(itemText) : itemTranslation.text,
        };
      } catch {
        return { ...price, translatedItemText: localFallbackTranslate(itemText) };
      }
    })
  );
  const marketTotal = mode === 'receipt' ? totalGbp(translatedItems) : 0;

  return {
    id: createId('scan'),
    createdAt: new Date().toISOString(),
    imageUri: input.imageUri,
    originalText: trimmed,
    translatedText: translation.provider === 'local-fallback' ? undefined : translation.text,
    prices: translatedItems,
    estimatedTotalGbp: marketTotal,
    mode,
    source: input.source,
    ocrStatus: input.ocrStatus,
    fxStatus: fx.status,
    fxFetchedAt: fx.fetchedAt ? new Date(fx.fetchedAt).toISOString() : undefined,
    realCost: estimateRealCost(translatedItems, marketTotal),
  };
}
