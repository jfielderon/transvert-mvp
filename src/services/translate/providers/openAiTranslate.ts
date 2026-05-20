import { env } from '@/config/env';
import { localFallbackTranslate } from '@/services/translate/localFallback';
import type { TranslationProvider, TranslationResult } from '@/services/translate/types';

export const openAiTranslateProvider: TranslationProvider = {
  id: 'openai',
  async translate(request) {
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          input: `Translate this travel purchase text to ${request.targetLanguage ?? 'English'}. Preserve prices and line breaks.\n\n${request.text}`,
        }),
      });
      const payload = await response.json();
      const output = payload?.output_text;
      if (!response.ok || typeof output !== 'string') throw new Error('OpenAI translation failed');
      return { text: output.trim(), provider: 'openai', warnings: [] };
    } catch {
      return fallback(request.text, 'OpenAI translation unavailable. Used local fallback.');
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
