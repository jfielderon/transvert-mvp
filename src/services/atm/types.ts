export type AtmConfidence = 'confirmed-free' | 'likely-free' | 'fee-likely' | 'unknown';

export type AtmLocation = {
  id: string;
  name: string;
  feeLabel: string;
  feeEstimate: number | null;
  feeDataStatus?: 'estimate' | 'community-coming-soon' | 'unknown' | 'osm-confirmed' | 'operator-rule';
  confidence?: AtmConfidence;
  confidenceLabel?: string;
  sourceLabel?: string;
  operator?: string;
  network?: string;
  risk: 'low' | 'medium' | 'high';
  riskLabel: string;
  distanceMeters: number;
  openLabel: string;
  cardNetworks: string[];
  latitude?: number;
  longitude?: number;
  mapsUrl?: string;
};

export type AtmSearchResult = {
  provider: string;
  atms: AtmLocation[];
  warnings: string[];
  error?: string;
  center?: {
    latitude: number;
    longitude: number;
  };
};
