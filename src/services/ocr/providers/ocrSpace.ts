import { env } from '@/config/env';
import * as FileSystem from 'expo-file-system';
import { expoGoFallbackProvider } from '@/services/ocr/providers/expoGoFallback';
import type { OcrProvider } from '@/services/ocr/types';

export const ocrSpaceProvider: OcrProvider = {
  id: 'ocr-space',
  async extractText(input) {
    if (!env.ocrSpaceApiKey) {
      return expoGoFallbackProvider.extractText(input);
    }

    try {
      const base64 = input.base64 ?? await FileSystem.readAsStringAsync(input.uri, { encoding: 'base64' });
      const mimeType = input.mimeType ?? 'image/jpeg';
      const body = new FormData();
      body.append('base64Image', `data:${mimeType};base64,${base64}`);
      body.append('language', 'auto');
      body.append('isOverlayRequired', 'false');
      body.append('detectOrientation', 'true');
      body.append('scale', 'true');
      body.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          apikey: env.ocrSpaceApiKey,
        },
        body,
      });
      const payload = await response.json();
      const parsedText = payload?.ParsedResults?.[0]?.ParsedText;

      if (!response.ok || typeof parsedText !== 'string') {
        throw new Error(payload?.ErrorMessage?.[0] ?? 'OCR.Space did not return text.');
      }

      return {
        text: parsedText.trim(),
        status: parsedText.trim() ? 'success' : 'fallback',
        provider: 'ocr-space',
        warnings: parsedText.trim() ? [] : ['OCR completed, but no text was detected. You can enter text manually.'],
      };
    } catch (error) {
      return {
        text: '',
        status: 'failed',
        provider: 'ocr-space',
        warnings: [error instanceof Error ? error.message : 'OCR.Space extraction failed. Enter text manually.'],
      };
    }
  },
};
