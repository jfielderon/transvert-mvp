import type { AtmConfidence, AtmLocation, AtmSearchResult } from '@/services/atm/types';

type AtmSearchBody = {
  latitude?: number;
  longitude?: number;
  query?: string;
};

type OsmAtm = {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  operator?: string;
  network?: string;
  fee?: string;
};

const fallbackCenter = { latitude: 40.4168, longitude: -3.7038 };
const LOW_FEE_OPERATORS = ['starling', 'chase', 'wise', 'revolut', 'monzo', 'halifax', 'barclaycard'];
const SURCHARGE_OPERATORS = ['euronet', 'travelex', 'cashzone', 'note machine', 'notemachine', 'cardtronics'];

function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY
    ?? process.env.GOOGLE_MAP_API_KEY
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

function clean(value?: string) {
  return value?.toLowerCase().trim() ?? '';
}

function confidenceFor(operator?: string, network?: string, fee?: string): {
  confidence: AtmConfidence;
  feeLabel: string;
  feeDataStatus: AtmLocation['feeDataStatus'];
  risk: AtmLocation['risk'];
  riskLabel: string;
  confidenceLabel: string;
  sourceLabel: string;
} {
  const joined = `${clean(operator)} ${clean(network)}`;
  const feeValue = clean(fee);

  if (feeValue === 'no') {
    return {
      confidence: 'confirmed-free',
      feeLabel: 'Confirmed free',
      feeDataStatus: 'osm-confirmed',
      risk: 'low',
      riskLabel: 'OSM fee=no tag',
      confidenceLabel: 'Confirmed free',
      sourceLabel: 'OpenStreetMap fee tag',
    };
  }

  if (feeValue === 'yes') {
    return {
      confidence: 'fee-likely',
      feeLabel: 'Fee likely',
      feeDataStatus: 'osm-confirmed',
      risk: 'high',
      riskLabel: 'OSM fee=yes tag',
      confidenceLabel: 'Fee likely',
      sourceLabel: 'OpenStreetMap fee tag',
    };
  }

  if (SURCHARGE_OPERATORS.some((needle) => joined.includes(needle))) {
    return {
      confidence: 'fee-likely',
      feeLabel: 'Fee likely',
      feeDataStatus: 'operator-rule',
      risk: 'high',
      riskLabel: 'Known surcharge operator pattern',
      confidenceLabel: 'Fee likely',
      sourceLabel: 'Operator confidence rule',
    };
  }

  if (LOW_FEE_OPERATORS.some((needle) => joined.includes(needle))) {
    return {
      confidence: 'likely-free',
      feeLabel: 'Likely free',
      feeDataStatus: 'operator-rule',
      risk: 'medium',
      riskLabel: 'Travel-card friendly operator pattern',
      confidenceLabel: 'Likely free',
      sourceLabel: 'Operator confidence rule',
    };
  }

  return {
    confidence: 'unknown',
    feeLabel: 'Fee unknown',
    feeDataStatus: 'unknown',
    risk: 'medium',
    riskLabel: 'Check ATM screen before accepting',
    confidenceLabel: 'Unknown',
    sourceLabel: 'Google Places / no fee tag',
  };
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

async function fetchOsmAtms(latitude: number, longitude: number): Promise<OsmAtm[]> {
  const query = `
    [out:json][timeout:8];
    (
      node["amenity"="atm"](around:1800,${latitude},${longitude});
      way["amenity"="atm"](around:1800,${latitude},${longitude});
      relation["amenity"="atm"](around:1800,${latitude},${longitude});
    );
    out center tags 30;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ data: query }).toString(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(payload.elements)) return [];

    return payload.elements.map((element: any) => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (typeof lat !== 'number' || typeof lon !== 'number') return undefined;

      return {
        id: `osm-${element.type}-${element.id}`,
        latitude: lat,
        longitude: lon,
        name: element.tags?.name,
        operator: element.tags?.operator ?? element.tags?.brand,
        network: element.tags?.network,
        fee: element.tags?.fee,
      } satisfies OsmAtm;
    }).filter(Boolean) as OsmAtm[];
  } catch {
    return [];
  }
}

function nearestOsmAtm(placeLat: number, placeLng: number, osmAtms: OsmAtm[]) {
  let best: { atm: OsmAtm; distance: number } | undefined;
  for (const atm of osmAtms) {
    const distance = distanceMeters(placeLat, placeLng, atm.latitude, atm.longitude);
    if (!best || distance < best.distance) best = { atm, distance };
  }
  return best && best.distance <= 80 ? best.atm : undefined;
}

function enrichAtm(base: Omit<AtmLocation, 'feeLabel' | 'feeEstimate' | 'feeDataStatus' | 'risk' | 'riskLabel' | 'cardNetworks'>, osm?: OsmAtm): AtmLocation {
  const operator = osm?.operator ?? base.operator ?? base.name;
  const network = osm?.network;
  const confidence = confidenceFor(operator, network, osm?.fee);

  return {
    ...base,
    operator,
    network,
    feeEstimate: null,
    cardNetworks: ['Visa', 'Mastercard'],
    ...confidence,
  };
}

async function fetchGoogleAtms(latitude: number, longitude: number, apiKey: string, osmAtms: OsmAtm[]): Promise<AtmLocation[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1800&type=atm&key=${apiKey}`;
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS')) return [];

  return (payload.results ?? []).slice(0, 10).map((place: any, index: number) => {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    const name = place.name ?? 'ATM';
    const matchedOsm = typeof lat === 'number' && typeof lng === 'number' ? nearestOsmAtm(lat, lng, osmAtms) : undefined;

    return enrichAtm({
      id: place.place_id ?? `google-atm-${index}`,
      name: matchedOsm?.name ?? name,
      distanceMeters: typeof lat === 'number' && typeof lng === 'number' ? distanceMeters(latitude, longitude, lat, lng) : 0,
      openLabel: place.opening_hours?.open_now === true ? 'Open now' : 'Hours unknown',
      latitude: lat,
      longitude: lng,
      mapsUrl: mapsUrl(name, lat, lng),
      sourceLabel: 'Google Places',
      operator: matchedOsm?.operator ?? name,
      network: matchedOsm?.network,
    }, matchedOsm);
  });
}

function osmOnlyAtms(latitude: number, longitude: number, osmAtms: OsmAtm[]): AtmLocation[] {
  return osmAtms.slice(0, 10).map((atm) => enrichAtm({
    id: atm.id,
    name: atm.name ?? atm.operator ?? 'ATM',
    operator: atm.operator,
    network: atm.network,
    sourceLabel: 'OpenStreetMap',
    distanceMeters: distanceMeters(latitude, longitude, atm.latitude, atm.longitude),
    openLabel: 'Hours unknown',
    latitude: atm.latitude,
    longitude: atm.longitude,
    mapsUrl: mapsUrl(atm.name ?? atm.operator ?? 'ATM', atm.latitude, atm.longitude),
  }, atm));
}

export async function POST(request: Request) {
  const apiKey = getGoogleMapsApiKey();

  let body: AtmSearchBody;
  try {
    body = await request.json();
  } catch {
    return json({
      provider: 'atm-intelligence',
      atms: [],
      warnings: ['Invalid ATM search request.'],
      error: 'Could not read ATM search request.',
    }, 400);
  }

  try {
    const manualCenter = body.query && apiKey ? await geocodeManualLocation(body.query, apiKey) : undefined;
    if (body.query && apiKey && !manualCenter) {
      return json({
        provider: 'atm-intelligence',
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

    const osmAtms = await fetchOsmAtms(center.latitude, center.longitude);
    const googleAtms = apiKey ? await fetchGoogleAtms(center.latitude, center.longitude, apiKey, osmAtms) : [];
    const atms = googleAtms.length > 0 ? googleAtms : osmOnlyAtms(center.latitude, center.longitude, osmAtms);

    return json({
      provider: googleAtms.length > 0 ? 'google-places+osm' : 'osm-overpass',
      center,
      atms,
      warnings: [
        atms.length > 0
          ? 'ATM confidence uses Google Places plus OpenStreetMap fee/operator tags where available.'
          : 'No ATM results found. Try a more specific location.',
        'Always reject DCC and choose local currency at the ATM.',
      ],
      error: atms.length > 0 ? undefined : 'No ATM results returned by Google Places or OpenStreetMap.',
    });
  } catch (error) {
    return json({
      provider: 'atm-intelligence',
      atms: [],
      warnings: ['ATM search failed. Try again or search manually.'],
      error: error instanceof Error ? error.message : 'ATM search failed.',
    }, 502);
  }
}
