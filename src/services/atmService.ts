import { env } from '@/config/env';

export type AtmLocation = {
  id: string;
  name: string;
  feeLabel: string;
  feeEstimate: number | null;
  risk: 'low' | 'medium' | 'high';
  riskLabel: string;
  distanceMeters: number;
  openLabel: string;
  cardNetworks: string[];
};

const localAtms: AtmLocation[] = [
  {
    id: 'santander-select',
    name: 'Santander Select',
    feeLabel: 'Free',
    feeEstimate: 0,
    risk: 'low',
    riskLabel: 'Low DCC risk',
    distanceMeters: 240,
    openLabel: 'Open now',
    cardNetworks: ['Visa', 'Mastercard'],
  },
  {
    id: 'wise-partner',
    name: 'Wise Partner ATM',
    feeLabel: 'EUR 1.50',
    feeEstimate: 1.5,
    risk: 'low',
    riskLabel: 'Card friendly',
    distanceMeters: 410,
    openLabel: 'Open now',
    cardNetworks: ['Visa', 'Mastercard'],
  },
  {
    id: 'euronet',
    name: 'Euronet',
    feeLabel: 'High fee',
    feeEstimate: null,
    risk: 'high',
    riskLabel: 'Avoid DCC',
    distanceMeters: 520,
    openLabel: '24h',
    cardNetworks: ['Visa', 'Mastercard'],
  },
];

export async function findNearbyAtms(): Promise<{ provider: string; atms: AtmLocation[]; warnings: string[] }> {
  if (env.atmProvider === 'google-maps' && env.googleMapsApiKey) {
    return {
      provider: 'google-maps-ready',
      atms: localAtms,
      warnings: ['Google Maps ATM search is ready to connect after native location permissions are added.'],
    };
  }

  return {
    provider: 'local-fallback',
    atms: localAtms,
    warnings: ['Using sample ATM intelligence until maps and live location are connected.'],
  };
}

export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}
