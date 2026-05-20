import { env } from '@/config/env';
import { localFallbackTranslate } from '@/services/translate/localFallback';
import { deeplTranslateProvider } from '@/services/translate/providers/deeplTranslate';
import { openAiTranslateProvider } from '@/services/translate/providers/openAiTranslate';
import type { TranslationRequest, TranslationResult } from '@/services/translate/types';

export { localFallbackTranslate };
export type { TranslationRequest, TranslationResult } from '@/services/translate/types';

export async function apiTranslate(request: TranslationRequest): Promise<TranslationResult> {
  const trimmed = request.text.trim();
  if (!trimmed) return { text: '', provider: 'local-fallback', warnings: [] };

  if (env.translationProvider === 'openai' && env.openAiApiKey) {
    return openAiTranslateProvider.translate({ ...request, text: trimmed });
  }

  if ((env.translationProvider === 'deepl' || env.deeplApiKey) && env.deeplApiKey) {
    return deeplTranslateProvider.translate({ ...request, text: trimmed });
  }

  return {
    text: localFallbackTranslate(trimmed),
    provider: 'local-fallback',
    warnings: ['Using local phrase translation. Add an OpenAI or DeepL key for full translation.'],
  };
}

export const translateText = apiTranslate;
export const translateMenuText = localFallbackTranslate;
