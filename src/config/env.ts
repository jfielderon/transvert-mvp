function withHttps(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function supabaseProjectUrl(value?: string) {
  const url = withHttps(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.origin.replace(/\/+$/, '');
  } catch {
    return url
      .replace(/\/+$/, '')
      .replace(/\/rest\/v1.*$/i, '')
      .replace(/\/auth\/v1.*$/i, '')
      .replace(/\/storage\/v1.*$/i, '');
  }
}

export const env = {
  exchangeRateApiKey: process.env.EXPO_PUBLIC_EXCHANGERATE_API_KEY ?? process.env.EXPO_PUBLIC_FX_API_KEY,
  fxProvider: process.env.EXPO_PUBLIC_FX_PROVIDER ?? 'open-er-api',
  openAiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.EXPO_PUBLIC_TRANSLATION_API_KEY,
  deeplApiKey: process.env.EXPO_PUBLIC_DEEPL_API_KEY ?? process.env.EXPO_PUBLIC_TRANSLATION_API_KEY,
  translationProvider: process.env.EXPO_PUBLIC_TRANSLATION_PROVIDER ?? 'google',
  googleVisionApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  ocrSpaceApiKey: process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY,
  ocrProvider: process.env.EXPO_PUBLIC_OCR_PROVIDER ?? 'google-vision',
  googleMapsApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
  googleApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
  atmProvider: process.env.EXPO_PUBLIC_ATM_PROVIDER ?? 'local',
  supabaseUrl: supabaseProjectUrl(
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL
  ),
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANNON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLIC_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY,
  supabaseOcrBucket: process.env.EXPO_PUBLIC_SUPABASE_OCR_BUCKET ?? 'scan-images',
};
