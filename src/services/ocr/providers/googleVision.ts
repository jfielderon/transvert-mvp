import { env } from '@/config/env';
import { expoGoFallbackProvider } from '@/services/ocr/providers/expoGoFallback';
import type { OcrProvider } from '@/services/ocr/types';

export const googleVisionProvider: OcrProvider = {
  id: 'google-vision',
  async extractText(input) {
    void input;

    if (!env.googleVisionApiKey) {
      return expoGoFallbackProvider.extractText(input);
    }

    return {
      text: '',
      status: 'fallback',
      provider: 'google-vision',
      warnings: ['Google Vision provider is structured for the production build path. Expo Go is keeping editable text fallback active.'],
    };
  },
};
