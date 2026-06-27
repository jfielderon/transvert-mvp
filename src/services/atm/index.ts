import type { AtmLocation, AtmSearchResult } from '@/services/atm/types';

export type { AtmLocation, AtmSearchResult } from '@/services/atm/types';

export type AtmPlaceSuggestion = {
  id: string;
  placeId: string;
  title: string;
  subtitle?: string;
  description: string;
};

type AtmSearchInput = {
  latitude?: number;
  longitude?: number;
  query?: string;
  placeId?: string;
};

const fallbackCenter = { latitude: 40.4168, longitude: -3.7038 };

const localAtms: AtmLocation[] = [
  {
    id: 'sample-bank-atm',
    name: 'Nearby bank ATM',
    feeLabel: 'Fee estimate',
    feeEstimate: null,
    feeDataStatus: 'community-coming-soon',
    confidence: 'unknown',
    confidenceLabel: 'Unknown',
    sourceLabel: 'Local fallback',
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
    confidence: 'unknown',
    confidenceLabel: 'Unknown',
    sourceLabel: 'Local fallback',
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
    warnings: ['Live ATM search is unavailable. Showing safe fallback estimates while the server API is checked.'],
    error,
  };
}

export async function suggestAtmPlaces(input: string): Promise<AtmPlaceSuggestion[]> {
  const trimmed = input.trim();
  if (trimmed.length < 2) return [];

  try {
    const response = await fetch('/api/place-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: trimmed }),
    });
    const payload = await response.json().catch(() => undefined) as { suggestions?: AtmPlaceSuggestion[] } | undefined;
    return Array.isArray(payload?.suggestions) ? payload.suggestions : [];
  } catch {
    return [];
  }
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
