import { languageLabel } from '@/services/languages';

const LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: 'en-GB',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  tr: 'tr-TR',
  ar: 'ar-SA',
  ku: 'ku',
  ckb: 'ckb',
};

export function localeForLanguage(language?: string) {
  if (!language || language === 'auto') return undefined;
  return LOCALE_BY_LANGUAGE[language] ?? language;
}

export function orderPhraseForItem(itemName: string, language?: string) {
  const clean = itemName.trim();
  if (!clean) return '';

  switch (language) {
    case 'es':
      return `Me gustaría pedir ${clean}, por favor.`;
    case 'fr':
      return `Je voudrais commander ${clean}, s'il vous plaît.`;
    case 'de':
      return `Ich hätte gern ${clean}, bitte.`;
    case 'it':
      return `Vorrei ordinare ${clean}, per favore.`;
    case 'pt':
      return `Gostaria de pedir ${clean}, por favor.`;
    case 'tr':
      return `${clean} sipariş etmek istiyorum, lütfen.`;
    case 'ar':
      return `أريد طلب ${clean} من فضلك.`;
    case 'en':
      return `I'd like ${clean}, please.`;
    default:
      return clean;
  }
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speakText(text: string, language?: string) {
  if (!canSpeak()) throw new Error('Speech is not available on this device/browser yet.');

  const utterance = new SpeechSynthesisUtterance(text);
  const locale = localeForLanguage(language);
  if (locale) utterance.lang = locale;
  utterance.rate = 0.92;
  utterance.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function speechButtonLabel(language?: string) {
  const label = languageLabel(language ?? 'auto');
  return language && language !== 'auto' ? `Speak ${label}` : 'Speak original';
}
