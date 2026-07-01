import { loadFxRates } from '@/services/fx';
import { createId } from '@/services/ids';
import { translationTarget } from '@/services/languages';
import { buildRebuiltMenu } from '@/services/menu/rebuildMenu';
import { getLatestOcrMetadata } from '@/services/ocr/lastResult';
import { detectPricesWithRates, totalGbp } from '@/services/priceParser';
import { estimateRealCost } from '@/services/realCost';
import { inferScanMode } from '@/services/scanModes';
import { localFallbackTranslate, translateText } from '@/services/translate';
import type { ScanMode, ScanRecord } from '@/types/scan';

type ProcessScanInput = {
  text: string;
  imageUri?: string;
  source: ScanRecord['source'];
  ocrStatus: ScanRecord['ocrStatus'];
  mode?: ScanMode;
  sourceLanguage?: string;
  targetLanguage?: string;
  ocrLines?: unknown[];
  ocrQuality?: unknown;
  ocrWarnings?: string[];
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

function cleanLines(lines: unknown[] = []) {
  return lines
    .filter((line: any) => typeof line?.text === 'string' && line.text.trim())
    .slice(0, 120)
    .map((line: any, index) => ({
      id: String(line.id ?? `line-${index}`),
      text: line.text.trim(),
      box: line.box,
      confidence: typeof line.confidence === 'number' ? line.confidence : undefined,
    }));
}

function estimateTextQuality(text: string, lineCount: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const shortWords = words.filter((word) => word.length <= 2 && !/^\d+[,.]?\d*$/.test(word)).length;
  const priceLike = (text.match(/\d+[,.]?\d{0,2}/g) ?? []).length;
  let score = 68;
  if (words.length < 12) score -= 28;
  if (lineCount >= 6) score += 8;
  if (priceLike >= 2) score += 8;
  if (shortWords > words.length * 0.28) score -= 18;
  score = Math.max(0, Math.min(100, score));
  if (score >= 72) return { score, label: 'good', reason: 'Readable OCR with enough text for reliable parsing.' };
  if (score >= 48) return { score, label: 'fair', reason: 'OCR is usable, but some lines may need checking.' };
  return { score, label: 'poor', reason: 'OCR looks unreliable. Retake closer, flatter and without glare.' };
}

function matchingCachedMetadata(trimmed: string) {
  const cached = getLatestOcrMetadata();
  if (!cached?.text) return null;
  return cleanupOcrText(cached.text) === trimmed ? cached : null;
}

export async function processScanInput(input: ProcessScanInput): Promise<ScanRecord> {
  const selectedMode = input.mode ?? 'auto';
  const sourceLanguage = input.sourceLanguage ?? 'auto';
  const targetLanguage = input.targetLanguage ?? 'en';
  const target = translationTarget(targetLanguage);
  const trimmed = cleanupOcrText(input.text);
  const mode = inferScanMode(trimmed, selectedMode);
  const cached = input.source === 'manual' ? null : matchingCachedMetadata(trimmed);
  const sourceLines = input.ocrLines?.length ? input.ocrLines : cached?.lines ?? [];
  const ocrLines = cleanLines(sourceLines);
  const ocrQuality = input.ocrQuality ?? cached?.quality ?? estimateTextQuality(trimmed, ocrLines.length);
  const ocrWarnings = [
    ...(input.ocrWarnings ?? cached?.warnings ?? []),
    (ocrQuality as any)?.label === 'poor' ? (ocrQuality as any).reason : undefined,
  ].filter(Boolean);

  if (!trimmed) throw new Error('Paste or enter text before processing.');

  const [fx, translation] = await Promise.all([
    loadFxRates(),
    translateText({ text: trimmed, sourceLanguage, targetLanguage: target }),
  ]);
  const prices = detectPricesWithRates(trimmed, fx.rates, mode === 'auto' ? 'menu' : mode);
  const translatedItems = await Promise.all(
    prices.map(async (price) => {
      const itemText = price.itemText || price.context || '';
      if (!itemText.trim()) return price;
      try {
        const itemTranslation = await translateText({ text: itemText, sourceLanguage, targetLanguage: target });
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

  const record: ScanRecord = {
    id: createId('scan'),
    createdAt: new Date().toISOString(),
    imageUri: input.imageUri,
    originalText: trimmed,
    translatedText: translation.provider === 'local-fallback' ? undefined : translation.text,
    sourceLanguage,
    targetLanguage,
    prices: translatedItems,
    estimatedTotalGbp: marketTotal,
    mode,
    source: input.source,
    ocrStatus: input.ocrStatus,
    fxStatus: fx.status,
    fxFetchedAt: fx.fetchedAt ? new Date(fx.fetchedAt).toISOString() : undefined,
    realCost: estimateRealCost(translatedItems, marketTotal),
    rebuiltMenu: mode === 'menu' ? buildRebuiltMenu(trimmed, translatedItems) : undefined,
  };
  return { ...record, ocrLines, ocrQuality, ocrWarnings } as ScanRecord;
}
