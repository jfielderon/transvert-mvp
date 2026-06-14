import { env } from '@/config/env';
import { expoGoFallbackProvider } from '@/services/ocr/providers/expoGoFallback';
import type { OcrProvider } from '@/services/ocr/types';

export const googleVisionProvider: OcrProvider = {
  id: 'google-vision',
  async extractText(input) {
    if (!env.googleVisionApiKey) {
      return expoGoFallbackProvider.extractText(input);
    }

    try {
      const imageContent = input.base64;
      if (!imageContent) {
        return expoGoFallbackProvider.extractText(input);
      }

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(env.googleVisionApiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: { content: imageContent },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
              },
            ],
          }),
        }
      );

      const payload = await response.json();
      const text = payload?.responses?.[0]?.fullTextAnnotation?.text ?? payload?.responses?.[0]?.textAnnotations?.[0]?.description ?? '';
      const warning = payload?.responses?.[0]?.error?.message;

      if (!response.ok || warning) {
        throw new Error(warning ?? 'Google Vision request failed.');
      }

      return {
        text: String(text).trim(),
        status: String(text).trim() ? 'success' : 'fallback',
        provider: 'google-vision',
        warnings: String(text).trim() ? [] : ['Google Vision ran, but no readable text was found. Try a clearer image.'],
      };
    } catch (error) {
      return {
        text: '',
        status: 'failed',
        provider: 'google-vision',
        warnings: [error instanceof Error ? error.message : 'Google Vision extraction failed.'],
      };
    }
  },
};
