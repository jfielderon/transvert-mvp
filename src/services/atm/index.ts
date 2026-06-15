import type { AtmLocation, AtmSearchResult } from '@/services/atm/types';

export type { AtmLocation, AtmSearchResult } from '@/services/atm/types';

type AtmSearchInput = {
  latitude?: number;
  longitude?: number;
  query?: string;
};

const fallbackCenter = { latitude: 40.4168, longitude: -3.7038 };

const localAtms: AtmLocation[] = [
  {
    id: 'sample-bank-atm',
    name: 'Nearby bank ATM',
    feeLabel: 'Fee estimate',
    feeEstimate: null,
    feeDataStatus: 'community-coming-soon',
    risk: 'medium',
    riskLabel: 'Fee data estimate',
    distanceMeters: 240,
    openLabel: 'Check locally',
    cardNetworks: ['Visa', 'Mastercard'],
  },
  {
    id: 'sample-station-atm',
    name: 'Station ATM',
    feeLabel: 'Fee unknown',
    feeEstimate: null,
    feeDataStatus: 'unknown',
    risk: 'high',
    riskLabel: 'Avoid DCC prompts',
    distanceMeters: 410,
    openLabel: 'Check locally',
    cardNetworks: ['Visa', 'Mastercard'],
  },
];

function mapsUrl(name: string, latitude?: number, longitude?: number) {
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

function withLocalCoordinates(latitude: number, longitude: number) {
  return localAtms.map((atm, index) => {
    const atmLatitude = latitude + (index === 0 ? 0.001 : -0.0012);
    const atmLongitude = longitude + (index === 0 ? 0.001 : 0.0015);

    return {
      ...atm,
      latitude: atmLatitude,
      longitude: atmLongitude,
      mapsUrl: mapsUrl(atm.name, atmLatitude, atmLongitude),
    };
  });
}

function localFallback(error?: string): AtmSearchResult {
  return {
    provider: 'local-fallback',
    center: fallbackCenter,
    atms: withLocalCoordinates(fallbackCenter.latitude, fallbackCenter.longitude),
    warnings: ['ATM search is in fallback mode. Add a Google Maps/Places server key to return live nearby ATMs.'],
    error,
  };
}

export async function findNearbyAtms(input: AtmSearchInput = {}): Promise<AtmSearchResult> {
  try {
    const response = await fetch('/api/atms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => undefined) as AtmSearchResult | undefined;

    if (!payload) {
      return localFallback('ATM search returned an unreadable response.');
    }

    if (!response.ok) {
      return {
        ...payload,
        atms: payload.atms.length > 0 ? payload.atms : localFallback().atms,
        error: payload.error ?? `ATM search failed with HTTP ${response.status}.`,
      };
    }

    return payload;
  } catch (error) {
    return localFallback(error instanceof Error ? error.message : 'ATM search failed.');
  }
}

export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}
