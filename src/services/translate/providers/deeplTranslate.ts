import { env } from '@/config/env';
import { fallback } from '@/services/translate/providers/openAiTranslate';
import type { TranslationProvider } from '@/services/translate/types';

export const deeplTranslateProvider: TranslationProvider = {
  id: 'deepl',
  async translate(request) {
    try {
      const body = new URLSearchParams({
        text: request.text,
        target_lang: request.targetLanguage ?? 'EN',
      });
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${env.deeplApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      const payload = await response.json();
      const output = payload?.translations?.[0]?.text;
      if (!response.ok || typeof output !== 'string') throw new Error('DeepL translation failed');
      return { text: output.trim(), provider: 'deepl', warnings: [] };
    } catch {
      return fallback(request.text, 'DeepL translation unavailable. Used local fallback.');
    }
  },
};
