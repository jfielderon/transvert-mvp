export type AtmLocation = {
  id: string;
  name: string;
  feeLabel: string;
  feeEstimate: number | null;
  feeDataStatus?: 'estimate' | 'community-coming-soon' | 'unknown';
  risk: 'low' | 'medium' | 'high';
  riskLabel: string;
  distanceMeters: number;
  openLabel: string;
  cardNetworks: string[];
  latitude?: number;
  longitude?: number;
};

export type AtmSearchResult = {
  provider: string;
  atms: AtmLocation[];
  warnings: string[];
  center?: {
    latitude: number;
    longitude: number;
  };
};
