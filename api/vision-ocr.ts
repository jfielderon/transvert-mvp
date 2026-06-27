const GOOGLE_VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';

declare const Buffer: {
  from(input: ArrayBuffer): { toString(encoding: string): string };
};

type OcrLine = {
  id: string;
  text: string;
  box?: { x: number; y: number; width: number; height: number };
  confidence?: number;
};

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

function firstChars(value: string, length = 300) {
  return value.slice(0, length);
}

function json(res: any, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

function boxFromVertices(vertices: Array<{ x?: number; y?: number }> = []) {
  const xs = vertices.map((vertex) => vertex.x ?? 0);
  const ys = vertices.map((vertex) => vertex.y ?? 0);
  if (!xs.length || !ys.length) return undefined;
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function mergeBoxes(boxes: Array<{ x: number; y: number; width: number; height: number } | undefined>) {
  const valid = boxes.filter(Boolean) as Array<{ x: number; y: number; width: number; height: number }>;
  if (!valid.length) return undefined;
  const minX = Math.min(...valid.map((box) => box.x));
  const minY = Math.min(...valid.map((box) => box.y));
  const maxX = Math.max(...valid.map((box) => box.x + box.width));
  const maxY = Math.max(...valid.map((box) => box.y + box.height));
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function buildLines(fullTextAnnotation: any): OcrLine[] {
  const lines: OcrLine[] = [];
  const pages = fullTextAnnotation?.pages ?? [];

  pages.forEach((page: any, pageIndex: number) => {
    (page.blocks ?? []).forEach((block: any, blockIndex: number) => {
      (block.paragraphs ?? []).forEach((paragraph: any, paragraphIndex: number) => {
        const words = paragraph.words ?? [];
        let currentWords: string[] = [];
        let currentBoxes: Array<{ x: number; y: number; width: number; height: number } | undefined> = [];
        let currentConfidence = 0;
        let currentCount = 0;

        const flush = () => {
          const text = currentWords.join(' ').replace(/\s+([,.!?;:])/g, '$1').trim();
          if (!text) return;
          lines.push({
            id: `line-${pageIndex}-${blockIndex}-${paragraphIndex}-${lines.length}`,
            text,
            box: mergeBoxes(currentBoxes),
            confidence: currentCount ? currentConfidence / currentCount : paragraph.confidence,
          });
          currentWords = [];
          currentBoxes = [];
          currentConfidence = 0;
          currentCount = 0;
        };

        words.forEach((word: any) => {
          const wordText = (word.symbols ?? []).map((symbol: any) => symbol.text ?? '').join('');
          if (!wordText) return;
          currentWords.push(wordText);
          currentBoxes.push(boxFromVertices(word.boundingBox?.vertices ?? word.boundingBox?.normalizedVertices));
          currentConfidence += typeof word.confidence === 'number' ? word.confidence : 0.75;
          currentCount += 1;

          const lastSymbol = word.symbols?.[word.symbols.length - 1];
          const breakType = lastSymbol?.property?.detectedBreak?.type;
          if (['EOL_SURE_SPACE', 'LINE_BREAK'].includes(breakType)) flush();
        });

        flush();
      });
    });
  });

  return lines;
}

function estimateQuality(text: string, lines: OcrLine[]) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const shortWordCount = words.filter((word) => word.length <= 2 && !/^\d+[,.]?\d*$/.test(word)).length;
  const oddCharCount = (trimmed.match(/[{}_[\]^~<>\\]/g) ?? []).length;
  const avgConfidence = lines.length ? lines.reduce((sum, line) => sum + (line.confidence ?? 0.75), 0) / lines.length : 0.7;
  let score = Math.round(avgConfidence * 100);
  if (words.length < 8) score -= 25;
  if (shortWordCount > words.length * 0.25) score -= 20;
  if (oddCharCount > 4) score -= 15;
  score = Math.max(0, Math.min(100, score));

  if (score >= 72) return { score, label: 'good', reason: 'Readable OCR with enough text for reliable menu parsing.' };
  if (score >= 48) return { score, label: 'fair', reason: 'OCR is usable, but some menu lines may need checking.' };
  return { score, label: 'poor', reason: 'OCR looks unreliable. Retake closer, flatter and without glare.' };
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
  const text = String(first?.fullTextAnnotation?.text ?? first?.textAnnotations?.[0]?.description ?? '').trim();
  const lines = buildLines(first?.fullTextAnnotation);
  const quality = estimateQuality(text, lines);

  console.log('[api:vision-ocr] OCR provider used', 'google-vision');
  console.log('[api:vision-ocr] extracted text length', text.length);
  console.log('[api:vision-ocr] line count', lines.length);
  console.log('[api:vision-ocr] quality', quality);
  console.log('[api:vision-ocr] first 300 chars of extracted OCR text', firstChars(text));

  if (!response.ok || providerError) {
    throw new Error(providerError ?? payload?.error?.message ?? 'Google Vision request failed.');
  }

  return { text, lines, quality };
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

  const text = String(payload?.output_text ?? '').trim();
  return { text, lines: [], quality: estimateQuality(text, []) };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
  let image = normaliseImage(req.body?.image ?? req.body?.base64);

  console.log('[api:vision-ocr] request payload', {
    hasImageUrl: Boolean(imageUrl),
    imageUrl: imageUrl || undefined,
    hasBase64: Boolean(image),
    base64Length: image.length,
    mimeType: req.body?.mimeType,
  });

  if (imageUrl) {
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBytes = await imageResponse.arrayBuffer();
      const imageByteSize = imageBytes.byteLength;
      const imageContentType = imageResponse.headers.get('content-type');

      console.log('[api:vision-ocr] image fetch', {
        imageUrl,
        status: imageResponse.status,
        contentType: imageContentType,
        byteSize: imageByteSize,
      });

      if (!imageResponse.ok || imageByteSize === 0) {
        return json(res, 502, {
          error: `Image fetch failed with ${imageResponse.status}.`,
          warnings: ['Supabase image URL could not be fetched for OCR.'],
        });
      }

      image = Buffer.from(imageBytes).toString('base64');
    } catch (error) {
      console.error('[api:vision-ocr] image fetch failed', error);
      return json(res, 502, {
        error: error instanceof Error ? error.message : 'Image fetch failed.',
        warnings: ['Supabase image URL could not be fetched for OCR.'],
      });
    }
  }

  if (!image) return json(res, 400, { error: 'Missing image.' });

  const warnings: string[] = [];
  const googleKey = resolveGoogleApiKey();

  if (googleKey) {
    try {
      const ocr = await extractWithGoogleVision(image, googleKey);
      const qualityWarning = ocr.quality.label === 'poor' ? ocr.quality.reason : undefined;
      return json(res, 200, {
        text: ocr.text,
        lines: ocr.lines,
        quality: ocr.quality,
        provider: 'google-vision',
        warnings: ocr.text ? [qualityWarning, ...warnings].filter(Boolean) : ['No readable text was found. Try a clearer, closer image.'],
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
      const ocr = await extractWithOpenAiVision(image, openAiKey);
      return json(res, 200, {
        text: ocr.text,
        lines: ocr.lines,
        quality: ocr.quality,
        provider: 'openai-vision',
        warnings: ocr.text ? warnings : [...warnings, 'No readable text was found. Try a clearer, closer image.'],
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
