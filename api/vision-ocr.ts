const GOOGLE_VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

function resolveGoogleApiKey() {
  return (
    process.env.GOOGLE_API_KEY ??
    process.env.GOOGLE_MAP_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

function normaliseBase64(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = resolveGoogleApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Google API key on server.' });
  }

  const base64 = normaliseBase64(req.body?.base64);
  if (!base64) {
    return res.status(400).json({ error: 'Missing image base64.' });
  }

  try {
    const response = await fetch(`${GOOGLE_VISION_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            imageContext: {
              languageHints: ['en', 'es', 'fr', 'de', 'it', 'pt'],
            },
          },
        ],
      }),
    });

    const payload = await response.json();
    const first = payload?.responses?.[0];
    const providerError = first?.error?.message;

    if (!response.ok || providerError) {
      return res.status(response.ok ? 502 : response.status).json({
        error: providerError ?? payload?.error?.message ?? 'Google Vision request failed.',
      });
    }

    const text = first?.fullTextAnnotation?.text ?? first?.textAnnotations?.[0]?.description ?? '';

    return res.status(200).json({
      text: String(text).trim(),
      provider: 'google-vision',
      warnings: String(text).trim() ? [] : ['No readable text was found. Try a clearer, closer image.'],
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Google Vision request failed.',
    });
  }
}
