const GOOGLE_VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';

function resolveGoogleApiKey() {
  return (
    process.env.GOOGLE_VISION_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY
  );
}

function resolveOpenAiApiKey() {
  return process.env.OPENAI_API_KEY ?? process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.EXPO_PUBLIC_TRANSLATION_API_KEY;
}

function normaliseImage(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
}

function asDataUrl(base64: string) {
  return base64.startsWith('data:image/') ? base64 : `data:image/jpeg;base64,${base64}`;
}

function json(res: any, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

async function extractWithGoogleVision(image: string, apiKey: string) {
  const response = await fetch(`${GOOGLE_VISION_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: image },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          imageContext: { languageHints: ['en', 'es', 'fr', 'de', 'it', 'pt'] },
        },
      ],
    }),
  });

  const payload = await response.json();
  const first = payload?.responses?.[0];
  const providerError = first?.error?.message;

  if (!response.ok || providerError) {
    throw new Error(providerError ?? payload?.error?.message ?? 'Google Vision request failed.');
  }

  return String(first?.fullTextAnnotation?.text ?? first?.textAnnotations?.[0]?.description ?? '').trim();
}

async function extractWithOpenAiVision(image: string, apiKey: string) {
  const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Extract every readable word and price from this image. Preserve line breaks. Return plain OCR text only. Do not summarise.',
            },
            {
              type: 'input_image',
              image_url: asDataUrl(image),
            },
          ],
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'OpenAI vision OCR failed.');
  }

  return String(payload?.output_text ?? '').trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const image = normaliseImage(req.body?.image ?? req.body?.base64);
  if (!image) return json(res, 400, { error: 'Missing image.' });

  const warnings: string[] = [];
  const googleKey = resolveGoogleApiKey();

  if (googleKey) {
    try {
      const text = await extractWithGoogleVision(image, googleKey);
      return json(res, 200, {
        text,
        provider: 'google-vision',
        warnings: text ? warnings : ['No readable text was found. Try a clearer, closer image.'],
      });
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Google Vision request failed.');
    }
  } else {
    warnings.push('Missing Google Vision API key on server.');
  }

  const openAiKey = resolveOpenAiApiKey();
  if (openAiKey) {
    try {
      const text = await extractWithOpenAiVision(image, openAiKey);
      return json(res, 200, {
        text,
        provider: 'openai-vision',
        warnings: text ? warnings : [...warnings, 'No readable text was found. Try a clearer, closer image.'],
      });
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'OpenAI vision OCR failed.');
    }
  } else {
    warnings.push('Missing OpenAI API key on server.');
  }

  return json(res, 502, {
    error: warnings[0] ?? 'OCR failed.',
    warnings,
  });
}
