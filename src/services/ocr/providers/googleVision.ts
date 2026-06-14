import { expoGoFallbackProvider } from '@/services/ocr/providers/expoGoFallback';
import type { OcrProvider } from '@/services/ocr/types';

export const googleVisionProvider: OcrProvider = {
  id: 'google-vision',
  async extractText(input) {
    const image = input.base64?.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
    if (!image) return expoGoFallbackProvider.extractText(input);

    try {
      const response = await fetch('/api/vision-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? 'OCR request failed.');
      const text = String(payload?.text ?? '').trim();
      return {
        text,
        status: text ? 'success' : 'fallback',
        provider: 'google-vision',
        warnings: text ? [] : payload?.warnings ?? ['No readable text was found. Try a clearer, closer image.'],
      };
    } catch (error) {
      return {
        text: '',
        status: 'failed',
        provider: 'google-vision',
        warnings: [error instanceof Error ? error.message : 'OCR request failed.'],
      };
    }
  },
};
