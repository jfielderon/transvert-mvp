import { expoGoFallbackProvider } from '@/services/ocr/providers/expoGoFallback';
import type { OcrProvider } from '@/services/ocr/types';

export const googleVisionProvider: OcrProvider = {
  id: 'google-vision',
  async extractText(input) {
    const base64 = input.imageUrl
      ? undefined
      : input.base64?.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();

    if (!input.imageUrl && !base64) return expoGoFallbackProvider.extractText(input);

    try {
      const response = await fetch('/api/vision-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.imageUrl
          ? { imageUrl: input.imageUrl, mimeType: input.mimeType }
          : { base64, mimeType: input.mimeType }),
      });
      const payload = await response.json();
      const text = String(payload?.text ?? '').trim();
      console.log('[ocr:google-vision] OCR provider used', input.imageUrl ? 'api:imageUrl' : 'api:base64');
      console.log('[ocr:google-vision] uploaded Supabase URL', input.imageUrl ?? null);
      console.log('[ocr:google-vision] raw extracted text length', text.length);
      console.log('[ocr:google-vision] first 300 chars of extracted OCR text', text.slice(0, 300));

      if (!response.ok && !text) throw new Error(payload?.error ?? 'OCR request failed.');

      return {
        text,
        status: text ? 'success' : 'failed',
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
