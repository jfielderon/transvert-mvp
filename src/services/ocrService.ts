import { env } from '@/config/env';
import type { OcrResult } from '@/types/scan';

export const SAMPLE_INPUT_PLACEHOLDER = `MENÚ DEL DÍA
Paella Valenciana 12,50 €
Ensalada Mixta 8,00 €
Gazpacho 6,50 €
Tarta de Queso 5,00 €
Servicio incluido`;

export async function prepareImageForManualText(uri: string): Promise<OcrResult> {
  if (env.ocrProvider === 'google-vision' && env.googleVisionApiKey) {
    return extractWithGoogleVision(uri);
  }

  if (env.ocrProvider === 'ocr-space' && env.ocrSpaceApiKey) {
    return extractWithOcrSpace(uri);
  }

  return {
    text: '',
    status: 'fallback',
    warnings: ['Camera/OCR preview is unavailable in Expo Go. Paste or edit the image text below, then process it locally.'],
  };
}

export async function extractTextFromImage(uri: string): Promise<OcrResult> {
  return prepareImageForManualText(uri);
}

async function extractWithGoogleVision(uri: string): Promise<OcrResult> {
  void uri;
  return {
    text: '',
    status: 'fallback',
    warnings: ['Google Vision is reserved for a production/native build path. Expo Go is using editable text fallback.'],
  };
}

async function extractWithOcrSpace(uri: string): Promise<OcrResult> {
  void uri;
  return {
    text: '',
    status: 'fallback',
    warnings: ['OCR.Space is reserved for a production/native build path. Expo Go is using editable text fallback.'],
  };
}
