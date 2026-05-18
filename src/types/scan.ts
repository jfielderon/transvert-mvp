export type Currency = 'EUR' | 'GBP' | 'USD';

export type DetectedPrice = {
  id: string;
  currency: Currency;
  raw: string;
  normalizedValue: number;
};

export type ConvertedPrice = {
  id: string;
  eur: number;
  gbp: number;
};

export type ScanResult = {
  id: string;
  createdAt: string;
  imageUri: string;
  originalText: string;
  prices: DetectedPrice[];
  converted: ConvertedPrice[];
  estimatedTotalGBP: number;
};
