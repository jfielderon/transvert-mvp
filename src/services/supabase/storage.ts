import { env } from '@/config/env';
import type { OcrInput } from '@/services/ocr/types';
import { getSupabaseConfig } from '@/services/supabase/client';

type UploadedOcrImage = {
  input: OcrInput;
  warnings: string[];
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function extensionForMimeType(mimeType?: string) {
  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('webp')) return 'webp';
  return 'jpg';
}

function createUploadPath(input: OcrInput) {
  const extension = extensionForMimeType(input.mimeType);
  const random = Math.random().toString(36).slice(2, 10);
  return `scans/${Date.now()}-${random}.${extension}`;
}

export async function uploadOcrImageToSupabase(input: OcrInput): Promise<UploadedOcrImage> {
  const config = getSupabaseConfig();
  if (config.status !== 'ready' || !config.url || !config.anonKey) {
    return {
      input,
      warnings: ['Supabase upload skipped. Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to send Vision OCR a public image URL.'],
    };
  }

  try {
    const baseUrl = trimTrailingSlash(config.url);
    const bucket = env.supabaseOcrBucket;
    const path = createUploadPath(input);
    const file = await fetch(input.uri).then((response) => response.blob());
    const uploadUrl = `${baseUrl}/storage/v1/object/${bucket}/${path}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': input.mimeType ?? file.type ?? 'image/jpeg',
        'x-upsert': 'false',
      },
      body: file,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || `Supabase upload failed with ${response.status}.`);
    }

    const imageUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
    console.log('[supabase:storage] upload complete', {
      bucket,
      path,
      status: response.status,
      imageUrl,
    });

    return {
      input: {
        ...input,
        imageUrl,
      },
      warnings: [],
    };
  } catch (error) {
    console.error('[supabase:storage] upload failed', error);
    return {
      input,
      warnings: [error instanceof Error ? error.message : 'Supabase upload failed. Vision OCR will use the local image payload.'],
    };
  }
}
