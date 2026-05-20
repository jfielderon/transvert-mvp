export type TranslationProviderId = 'openai' | 'deepl' | 'local-fallback';

export type TranslationRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

export type TranslationResult = {
  text: string;
  provider: TranslationProviderId;
  warnings: string[];
};

export type TranslationProvider = {
  id: TranslationProviderId;
  translate: (request: TranslationRequest) => Promise<TranslationResult>;
};
