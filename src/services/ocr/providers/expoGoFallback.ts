import type { OcrProvider } from '@/services/ocr/types';

export const expoGoFallbackProvider: OcrProvider = {
  id: 'expo-go-fallback',
  async extractText() {
    return {
      text: '',
      status: 'fallback',
      provider: 'expo-go-fallback',
      warnings: ['Expo Go is using editable text fallback. Upload an image, then paste or edit extracted text before processing.'],
    };
  },
};
