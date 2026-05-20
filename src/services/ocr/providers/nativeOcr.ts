import { expoGoFallbackProvider } from '@/services/ocr/providers/expoGoFallback';
import type { OcrProvider } from '@/services/ocr/types';

export const nativeOcrProvider: OcrProvider = {
  id: 'native-ocr-ready',
  async extractText(input) {
    const fallback = await expoGoFallbackProvider.extractText(input);
    return {
      ...fallback,
      provider: 'native-ocr-ready',
      warnings: ['Native OCR is reserved for a custom dev client or production build. Editable text fallback is active.'],
    };
  },
};
