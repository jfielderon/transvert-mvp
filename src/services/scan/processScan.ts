import { loadFxRates } from '@/services/fx';
import { createId } from '@/services/ids';
import { detectPricesWithRates, totalGbp } from '@/services/priceParser';
import { estimateRealCost } from '@/services/realCost';
import { translateText } from '@/services/translate';
import type { ScanMode, ScanRecord } from '@/types/scan';

type ProcessScanInput = {
  text: string;
  imageUri?: string;
  source: ScanRecord['source'];
  ocrStatus: ScanRecord['ocrStatus'];
  mode?: ScanMode;
};

function cleanupOcrText(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[|]{2,}/g, ' ')
    .replace(/\s+([€£$])/g, '$1')
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
  const marketTotal = mode === 'receipt' ? totalGbp(prices) : 0;

  return {
    id: createId('scan'),
    createdAt: new Date().toISOString(),
    imageUri: input.imageUri,
    originalText: trimmed,
    translatedText: translation.text,
    prices,
    estimatedTotalGbp: marketTotal,
    mode,
    source: input.source,
    ocrStatus: input.ocrStatus,
    fxStatus: fx.status,
    fxFetchedAt: fx.fetchedAt ? new Date(fx.fetchedAt).toISOString() : undefined,
    realCost: estimateRealCost(prices, marketTotal),
  };
}
