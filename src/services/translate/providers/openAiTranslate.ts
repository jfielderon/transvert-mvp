import { env } from '@/config/env';
import { localFallbackTranslate } from '@/services/translate/localFallback';
import type { TranslationProvider, TranslationResult } from '@/services/translate/types';

function normaliseTargetLanguage(language?: string): string {
  const raw = (language ?? 'en').trim().toLowerCase();

  const aliases: Record<string, string> = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    italian: 'it',
    portuguese: 'pt',
    dutch: 'nl',
    polish: 'pl',
    greek: 'el',
    turkish: 'tr',
    arabic: 'ar',
    japanese: 'ja',
    chinese: 'zh',
  };

  return aliases[raw] ?? raw.split('-')[0] ?? 'en';
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export const openAiTranslateProvider: TranslationProvider = {
  id: 'openai',
  async translate(request) {
    try {
      const apiKey = env.googleMapsApiKey;

      if (!apiKey) {
        throw new Error('Missing Google API key');
      }

      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: request.text,
            target: normaliseTargetLanguage(request.targetLanguage),
            format: 'text',
          }),
        }
      );

      const payload = await response.json();
      const translatedText = payload?.data?.translations?.[0]?.translatedText;

      if (!response.ok || typeof translatedText !== 'string') {
        throw new Error(payload?.error?.message ?? 'Google translation failed');
      }

      return {
        text: decodeHtmlEntities(translatedText.trim()),
        provider: 'google-translate',
        warnings: [],
      };
    } catch {
      return fallback(request.text, 'Google translation unavailable. Used local fallback.');
    }
  },
};

export function fallback(text: string, warning: string): TranslationResult {
  return {
    text: localFallbackTranslate(text),
    provider: 'local-fallback',
    warnings: [warning],
  };
}
