export type CurrencyCode = 'EUR' | 'GBP' | 'USD';
export type ScanMode = 'menu' | 'receipt' | 'document';

export type DetectedPrice = {
  id: string;
  raw: string;
  originalAmount?: number;
  amount: number;
  currency: CurrencyCode;
  convertedGbp?: number;
  context?: string;
  itemText?: string;
  translatedItemText?: string;
  section?: string;
  role?: 'line-item' | 'total' | 'fee' | 'unknown';
  confidence?: 'detected' | 'interpreted-menu-pricing';
  note?: string;
};

export type RebuiltMenuItem = {
  id: string;
  originalName: string;
  englishName: string;
  description?: string;
  originalPrice: string;
  convertedPrice: string;
  icons: string[];
};

export type RebuiltMenuSection = {
  title: string;
  items: RebuiltMenuItem[];
};

export type RebuiltMenu = {
  title: string;
  subtitle: string;
  sections: RebuiltMenuSection[];
  itemCount: number;
  note: string;
};

export type OcrLine = {
  id: string;
  text: string;
  box?: unknown;
  confidence?: number;
};

export type OcrQuality = {
  score: number;
  label: 'good' | 'fair' | 'poor';
  reason: string;
};

export type ScanRecord = {
  id: string;
  createdAt: string;
  imageUri?: string;
  originalText: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  prices: DetectedPrice[];
  estimatedTotalGbp: number;
  mode?: ScanMode;
  source: 'camera' | 'library' | 'manual';
  ocrStatus: 'success' | 'fallback' | 'failed';
  fxStatus?: 'live' | 'cached' | 'fallback' | 'failed';
  fxFetchedAt?: string;
  realCost?: RealCostEstimate;
  rebuiltMenu?: RebuiltMenu;
  ocrLines?: OcrLine[];
  ocrQuality?: OcrQuality;
  ocrWarnings?: string[];
};

export type OcrResult = {
  text: string;
  status: 'success' | 'fallback' | 'failed';
  provider?: string;
  warnings: string[];
};

export type RealCostEstimate = {
  marketGbp: number;
  estimatedFeesGbp: number;
  estimatedTotalGbp: number;
  dccRisk: 'low' | 'medium' | 'high' | 'unknown';
  warnings: string[];
};
