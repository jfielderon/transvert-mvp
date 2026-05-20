import { env } from '@/config/env';
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
    latitude: fallbackCenter.latitude + 0.001,
    longitude: fallbackCenter.longitude + 0.001,
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
    latitude: fallbackCenter.latitude - 0.0012,
    longitude: fallbackCenter.longitude + 0.0015,
  },
];

function distanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadius = 6371000;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function geocodeManualLocation(query: string) {
  if (!env.googleMapsApiKey) return undefined;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${env.googleMapsApiKey}`;
  const response = await fetch(url);
  if (!response.ok) return undefined;
  const payload = await response.json();
  const location = payload.results?.[0]?.geometry?.location;
  if (typeof location?.lat !== 'number' || typeof location?.lng !== 'number') return undefined;
  return { latitude: location.lat, longitude: location.lng };
}

async function fetchGoogleAtms(latitude: number, longitude: number): Promise<AtmLocation[]> {
  if (!env.googleMapsApiKey) return [];

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1600&type=atm&key=${env.googleMapsApiKey}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const payload = await response.json();

  return (payload.results ?? []).slice(0, 8).map((place: any, index: number) => {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    return {
      id: place.place_id ?? `google-atm-${index}`,
      name: place.name ?? 'ATM',
      feeLabel: 'Fee estimate',
      feeEstimate: null,
      feeDataStatus: 'community-coming-soon',
      risk: 'medium',
      riskLabel: 'Fee data estimate',
      distanceMeters: typeof lat === 'number' && typeof lng === 'number' ? distanceMeters(latitude, longitude, lat, lng) : 0,
      openLabel: place.opening_hours?.open_now === true ? 'Open now' : 'Hours unknown',
      cardNetworks: ['Visa', 'Mastercard'],
      latitude: lat,
      longitude: lng,
    } satisfies AtmLocation;
  });
}

function withLocalCoordinates(latitude: number, longitude: number) {
  return localAtms.map((atm, index) => ({
    ...atm,
    latitude: latitude + (index === 0 ? 0.001 : -0.0012),
    longitude: longitude + (index === 0 ? 0.001 : 0.0015),
  }));
}

export async function findNearbyAtms(input: AtmSearchInput = {}): Promise<AtmSearchResult> {
  const manualCenter = input.query ? await geocodeManualLocation(input.query) : undefined;
  const center = manualCenter ?? (
    typeof input.latitude === 'number' && typeof input.longitude === 'number'
      ? { latitude: input.latitude, longitude: input.longitude }
      : fallbackCenter
  );

  if (env.googleMapsApiKey) {
    const googleAtms = await fetchGoogleAtms(center.latitude, center.longitude);
    if (googleAtms.length > 0) {
      return {
        provider: 'google-maps',
        center,
        atms: googleAtms,
        warnings: ['ATM locations are from Google Maps. Fee data is estimate/community data coming soon.'],
      };
    }
  }

  return {
    provider: env.googleMapsApiKey ? 'google-maps-fallback' : 'local-fallback',
    center,
    atms: withLocalCoordinates(center.latitude, center.longitude),
    warnings: ['Fee data estimate / community data coming soon. ATM fee intelligence is not live yet.'],
  };
}

export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}
