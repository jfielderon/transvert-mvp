import { env } from '@/config/env';

const PHRASE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/\bmen[uú]\s+del\s+d[ií]a\b/gi, 'daily menu'],
  [/\bpaella\s+valenciana\b/gi, 'Valencian paella'],
  [/\bensalada\s+mixta\b/gi, 'mixed salad'],
  [/\bgazpacho\b/gi, 'gazpacho'],
  [/\btarta\s+de\s+queso\b/gi, 'cheesecake'],
  [/\bservicio\s+incluido\b/gi, 'service included'],
  [/\bpulpo\s+a\s+la\s+gallega\b/gi, 'Galician-style octopus'],
  [/\bpollo\s+a\s+la\s+parrilla\b/gi, 'grilled chicken'],
  [/\bpaella\s+de\s+mariscos\b/gi, 'seafood paella'],
  [/\bpaella\s+marinera\b/gi, 'seafood paella'],
  [/\barroz\s+negro\b/gi, 'black rice'],
  [/\bfilete\s+de\s+lubina\b/gi, 'sea bass fillet'],
  [/\btrucha\s+a\s+la\s+menta\b/gi, 'trout with mint'],
  [/\bcerdo\s+al\s+azafr[aá]n\b/gi, 'pork with saffron'],
  [/\bjam[oó]n\b/gi, 'ham'],
  [/\bqueso\b/gi, 'cheese'],
  [/\bpan\b/gi, 'bread'],
  [/\bagua\b/gi, 'water'],
  [/\bvino\b/gi, 'wine'],
  [/\bcaf[eé]\b/gi, 'coffee'],
  [/\bpostre\b/gi, 'dessert'],
  [/\bentrada\b/gi, 'starter'],
  [/\bde\s+primero\b/gi, 'first course'],
  [/\bde\s+segundo\b/gi, 'main course'],
  [/\bprecio\b/gi, 'price'],
  [/\btotal\b/gi, 'total'],
];

function matchCase(source: string, translated: string) {
  if (source === source.toUpperCase()) return translated.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) return translated[0].toUpperCase() + translated.slice(1);
  return translated;
}

export function translateMenuText(text: string) {
  if (!text.trim()) return '';

  return PHRASE_TRANSLATIONS.reduce(
    (output, [pattern, replacement]) =>
      output.replace(pattern, (matched) => matchCase(matched, replacement)),
    text
  );
}

export type TranslationRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

export type TranslationResult = {
  text: string;
  provider: 'openai' | 'deepl' | 'local-fallback';
  warnings: string[];
};

export async function translateText(request: TranslationRequest): Promise<TranslationResult> {
  const trimmed = request.text.trim();
  if (!trimmed) return { text: '', provider: 'local-fallback', warnings: [] };

  if (env.translationProvider === 'openai' && env.openAiApiKey) {
    return translateWithOpenAi(trimmed, request.targetLanguage ?? 'English');
  }

  if (env.translationProvider === 'deepl' && env.deeplApiKey) {
    return translateWithDeepL(trimmed, request.targetLanguage ?? 'EN');
  }

  return {
    text: translateMenuText(trimmed),
    provider: 'local-fallback',
    warnings: ['Using local phrase translation. Add an OpenAI or DeepL key for full translation.'],
  };
}

async function translateWithOpenAi(text: string, targetLanguage: string): Promise<TranslationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: `Translate this travel purchase text to ${targetLanguage}. Preserve prices and line breaks.\n\n${text}`,
      }),
    });
    const payload = await response.json();
    const output = payload?.output_text;
    if (!response.ok || typeof output !== 'string') throw new Error('OpenAI translation failed');
    return { text: output.trim(), provider: 'openai', warnings: [] };
  } catch {
    return {
      text: translateMenuText(text),
      provider: 'local-fallback',
      warnings: ['OpenAI translation unavailable. Used local fallback.'],
    };
  }
}

async function translateWithDeepL(text: string, targetLanguage: string): Promise<TranslationResult> {
  try {
    const body = new URLSearchParams({
      text,
      target_lang: targetLanguage,
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
    return {
      text: translateMenuText(text),
      provider: 'local-fallback',
      warnings: ['DeepL translation unavailable. Used local fallback.'],
    };
  }
}
