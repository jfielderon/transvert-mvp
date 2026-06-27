export type OcrProviderId = 'ocr-space' | 'google-vision' | 'gpt-vision-ready' | 'native-ocr-ready' | 'expo-go-fallback';

export type OcrResult = {
  text: string;
  status: 'success' | 'fallback' | 'failed';
  provider: OcrProviderId;
  warnings: string[];
  lines?: any[];
  quality?: any;
};

export type OcrInput = {
  uri: string;
  base64?: string;
  mimeType?: string;
  imageUrl?: string;
};

export type OcrProvider = {
  id: OcrProviderId;
  extractText: (input: OcrInput) => Promise<OcrResult>;
};
