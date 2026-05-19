export const env = {
  exchangeRateApiKey: process.env.EXPO_PUBLIC_EXCHANGERATE_API_KEY,
  fxProvider: process.env.EXPO_PUBLIC_FX_PROVIDER ?? 'exchangerate',
  openAiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  deeplApiKey: process.env.EXPO_PUBLIC_DEEPL_API_KEY,
  translationProvider: process.env.EXPO_PUBLIC_TRANSLATION_PROVIDER ?? 'local',
  googleVisionApiKey: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY,
  ocrSpaceApiKey: process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY,
  ocrProvider: process.env.EXPO_PUBLIC_OCR_PROVIDER ?? 'fallback',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  atmProvider: process.env.EXPO_PUBLIC_ATM_PROVIDER ?? 'local',
};
