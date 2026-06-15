import type { AtmLocation, AtmSearchResult } from '@/services/atm/types';

type AtmSearchBody = {
  latitude?: number;
  longitude?: number;
  query?: string;
};

const fallbackCenter = { latitude: 40.4168, longitude: -3.7038 };

function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY
    ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    ?? process.env.GOOGLE_API_KEY
    ?? process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
}

function mapsUrl(name: string, latitude?: number, longitude?: number) {
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

function distanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadius = 6371000;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function json(body: AtmSearchResult, status = 200) {
  return Response.json(body, { status });
}

async function geocodeManualLocation(query: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status !== 'OK') return undefined;

  const location = payload.results?.[0]?.geometry?.location;
  if (typeof location?.lat !== 'number' || typeof location?.lng !== 'number') return undefined;
  return { latitude: location.lat, longitude: location.lng };
}

async function fetchGoogleAtms(latitude: number, longitude: number, apiKey: string): Promise<AtmLocation[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1600&type=atm&key=${apiKey}`;
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS')) return [];

  return (payload.results ?? []).slice(0, 8).map((place: any, index: number) => {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    const name = place.name ?? 'ATM';

    return {
      id: place.place_id ?? `google-atm-${index}`,
      name,
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
      mapsUrl: mapsUrl(name, lat, lng),
    } satisfies AtmLocation;
  });
}

export async function POST(request: Request) {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return json({
      provider: 'google-maps-proxy',
      atms: [],
      warnings: ['Google Maps key is missing.'],
      error: 'Add a Google Maps server key in Vercel for live ATM search.',
    }, 500);
  }

  let body: AtmSearchBody;
  try {
    body = await request.json();
  } catch {
    return json({
      provider: 'google-maps-proxy',
      atms: [],
      warnings: ['Invalid ATM search request.'],
      error: 'Could not read ATM search request.',
    }, 400);
  }

  try {
    const manualCenter = body.query ? await geocodeManualLocation(body.query, apiKey) : undefined;
    if (body.query && !manualCenter) {
      return json({
        provider: 'google-maps-proxy',
        center: fallbackCenter,
        atms: [],
        warnings: ['Could not find that location. Try a more specific city, area, or postcode.'],
        error: 'Google could not geocode that location.',
      }, 404);
    }

    const center = manualCenter ?? (
      typeof body.latitude === 'number' && typeof body.longitude === 'number'
        ? { latitude: body.latitude, longitude: body.longitude }
        : fallbackCenter
    );

    const atms = await fetchGoogleAtms(center.latitude, center.longitude, apiKey);
    return json({
      provider: 'google-maps-proxy',
      center,
      atms,
      warnings: atms.length > 0
        ? ['ATM locations are from Google Maps. Fee data is estimate/community data coming soon.']
        : ['No nearby ATMs returned by Google Places. Try another location.'],
      error: atms.length > 0 ? undefined : 'Google Places returned no ATM results.',
    });
  } catch (error) {
    return json({
      provider: 'google-maps-proxy',
      atms: [],
      warnings: ['ATM search failed. Try again or search manually.'],
      error: error instanceof Error ? error.message : 'ATM search failed.',
    }, 502);
  }
}
