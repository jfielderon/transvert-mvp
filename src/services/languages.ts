export type LanguageCode = 'auto' | 'en' | 'es' | 'ku' | 'ckb' | 'fr' | 'de' | 'it' | 'pt' | 'tr' | 'ar';

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  nativeLabel?: string;
  targetCode: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'auto', label: 'Auto detect', targetCode: 'auto' },
  { code: 'en', label: 'English', targetCode: 'en' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', targetCode: 'es' },
  { code: 'ku', label: 'Kurdish Kurmanji', nativeLabel: 'Kurdî', targetCode: 'ku' },
  { code: 'ckb', label: 'Kurdish Sorani', nativeLabel: 'کوردی', targetCode: 'ckb' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', targetCode: 'fr' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', targetCode: 'de' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', targetCode: 'it' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', targetCode: 'pt' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', targetCode: 'tr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', targetCode: 'ar' },
];

export function languageLabel(code?: string) {
  return LANGUAGE_OPTIONS.find((option) => option.code === code)?.label ?? code ?? 'Auto detect';
}

export function translationTarget(code?: string) {
  const option = LANGUAGE_OPTIONS.find((item) => item.code === code);
  return option?.targetCode ?? code ?? 'en';
}
