import { env } from '@/config/env';
import { expoGoFallbackProvider } from '@/services/ocr/providers/expoGoFallback';
import { googleVisionProvider } from '@/services/ocr/providers/googleVision';
import { nativeOcrProvider } from '@/services/ocr/providers/nativeOcr';
import { ocrSpaceProvider } from '@/services/ocr/providers/ocrSpace';
import type { OcrInput, OcrResult } from '@/services/ocr/types';

export type { OcrInput, OcrProvider, OcrProviderId, OcrResult } from '@/services/ocr/types';

export const SAMPLE_INPUT_PLACEHOLDER = `MENU DEL DIA
Paella Valenciana 12,50 EUR
Ensalada Mixta 8,00 EUR
Gazpacho 6,50 EUR
Tarta de Queso 5,00 EUR
Servicio incluido`;

export async function extractTextFromImage(input: string | OcrInput): Promise<OcrResult> {
  const ocrInput = typeof input === 'string' ? { uri: input } : input;
  if (env.ocrProvider === 'google-vision') return googleVisionProvider.extractText(ocrInput);
  if (env.ocrProvider === 'native') return nativeOcrProvider.extractText(ocrInput);
  if (env.ocrProvider === 'ocr-space') return ocrSpaceProvider.extractText(ocrInput);
  return expoGoFallbackProvider.extractText(ocrInput);
}

export async function prepareImageForManualText(input: string | OcrInput): Promise<OcrResult> {
  return extractTextFromImage(input);
}
