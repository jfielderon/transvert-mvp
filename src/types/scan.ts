export type CurrencyCode = 'EUR' | 'GBP' | 'USD';

export type DetectedPrice = {
  id: string;
  raw: string;
  amount: number;
  currency: CurrencyCode;
  convertedGbp?: number;
  context?: string;
};

export type ScanRecord = {
  id: string;
  createdAt: string;
  imageUri?: string;
  originalText: string;
  translatedText?: string;
  prices: DetectedPrice[];
  estimatedTotalGbp: number;
  source: 'camera' | 'library' | 'manual';
  ocrStatus: 'success' | 'fallback' | 'failed';
};

export type OcrResult = {
  text: string;
  status: 'success' | 'fallback' | 'failed';
  warnings: string[];
};
