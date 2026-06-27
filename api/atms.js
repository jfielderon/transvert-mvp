const fallbackCenter = { latitude: 40.4168, longitude: -3.7038 };
const LOW_FEE_OPERATORS = ['starling', 'chase', 'wise', 'revolut', 'monzo', 'halifax', 'barclaycard'];
const SURCHARGE_OPERATORS = ['euronet', 'travelex', 'cashzone', 'note machine', 'notemachine', 'cardtronics'];

const SEEDED_OPERATOR_RULES = [
  { countryCode: 'ES', operator: 'Unicaja', aliases: ['unicaja banco'], outcome: 'likely-free', label: 'Likely free', risk: 'low', confidence: 'medium', note: 'Spain seed: often reported as a good free-withdrawal candidate. Confirm on ATM screen.' },
  { countryCode: 'ES', operator: 'BBVA', aliases: ['banco bilbao vizcaya argentaria'], outcome: 'mixed', label: 'Mixed reports', risk: 'medium', confidence: 'medium', note: 'Spain seed: often worth trying, but not confirmed free for every UK card.' },
  { countryCode: 'ES', operator: 'Deutsche Bank', aliases: ['deutsche bank spain'], outcome: 'likely-free', label: 'Likely free', risk: 'low', confidence: 'low', note: 'Spain seed: potentially favourable, but needs UK-card reports.' },
  { countryCode: 'ES', operator: 'CaixaBank', aliases: ['caixa', 'la caixa'], outcome: 'mixed', label: 'Mixed reports', risk: 'medium', confidence: 'low', note: 'Spain seed: mixed reports. Check screen before accepting.' },
  { countryCode: 'ES', operator: 'Santander', aliases: ['banco santander'], outcome: 'mixed', label: 'Mixed reports', risk: 'medium', confidence: 'low', note: 'Spain seed: card/account-specific network rules can confuse results. Check screen.' },
  { countryCode: 'ES', operator: 'Bankinter', aliases: [], outcome: 'unknown', label: 'Unknown', risk: 'medium', confidence: 'unknown', note: 'Spain seed: needs user reports.' },
  { countryCode: 'ES', operator: 'Cajamar', aliases: ['grupo cooperativo cajamar'], outcome: 'unknown', label: 'Unknown', risk: 'medium', confidence: 'unknown', note: 'Spain seed: needs user reports.' },
  { countryCode: 'ES', operator: 'Banca March', aliases: [], outcome: 'unknown', label: 'Unknown', risk: 'medium', confidence: 'unknown', note: 'Spain seed: needs user reports.' },
  { countryCode: 'PT', operator: 'Multibanco', aliases: ['sibs multibanco'], outcome: 'likely-free', label: 'Likely free', risk: 'low', confidence: 'medium', note: 'Portugal seed: genuine Multibanco network ATMs are generally favourable.' },
  { countryCode: 'FR', operator: 'BNP Paribas', aliases: ['bnp'], outcome: 'likely-free', label: 'Likely free', risk: 'low', confidence: 'low', note: 'France seed: potentially favourable bank ATM; needs UK-card reports.' },
  { countryCode: 'IT', operator: 'BNL', aliases: ['bnl d’italia', 'bnl d\'italia', 'banca nazionale del lavoro'], outcome: 'likely-free', label: 'Likely free', risk: 'low', confidence: 'low', note: 'Italy seed: potentially favourable bank ATM; needs UK-card reports.' },
  { countryCode: 'DE', operator: 'Deutsche Bank', aliases: [], outcome: 'likely-free', label: 'Likely free', risk: 'low', confidence: 'low', note: 'Germany seed: potentially favourable versus independents; check screen.' },
  { countryCode: 'DE', operator: 'Sparkasse', aliases: ['sparkassen'], outcome: 'mixed', label: 'Mixed reports', risk: 'medium', confidence: 'medium', note: 'Germany seed: fees are network/card specific. Check screen.' },
  { countryCode: 'GLOBAL', operator: 'Euronet', aliases: ['euronet worldwide', 'euronet 360 finance'], outcome: 'avoid', label: 'Avoid if possible', risk: 'high', confidence: 'high', note: 'Global seed: tourist ATM operator. Often high surcharge/DCC risk.' },
  { countryCode: 'GLOBAL', operator: 'Travelex', aliases: [], outcome: 'avoid', label: 'Avoid if possible', risk: 'high', confidence: 'medium', note: 'Global seed: FX/tourist ATM. Prefer bank ATM where possible.' },
  { countryCode: 'GLOBAL', operator: 'Cardtronics', aliases: ['ncr atleos'], outcome: 'fee-likely', label: 'Fee likely', risk: 'high', confidence: 'medium', note: 'Global seed: independent ATM operator. Fee likely unless local reports say otherwise.' },
  { countryCode: 'GLOBAL', operator: 'Cashzone', aliases: [], outcome: 'fee-likely', label: 'Fee likely', risk: 'high', confidence: 'medium', note: 'Global seed: independent ATM operator. Fee likely unless local reports say otherwise.' },
  { countryCode: 'TH', operator: 'AEON', aliases: ['aeon bank'], outcome: 'known-fee', label: 'Known fee', risk: 'medium', confidence: 'medium', note: 'Thailand seed: often lower than other Thai banks, historically around ฿150, not free.' },
  { countryCode: 'TH', operator: 'Thai bank ATM', aliases: ['bangkok bank', 'kasikornbank', 'kbank', 'scb', 'krungthai', 'krungsri', 'tmbthanachart'], outcome: 'known-fee', label: 'Known fee', risk: 'high', confidence: 'medium', note: 'Thailand seed: foreign-card ATM fee commonly around ฿220.' },
];

function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY
    ?? process.env.GOOGLE_MAP_API_KEY
    ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    ?? process.env.GOOGLE_API_KEY
    ?? process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
}

function clean(value) {
  return value?.toLowerCase?.().trim?.() ?? '';
}

function mapsUrl(name, latitude, longitude) {
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

function distanceMeters(fromLat, fromLng, toLat, toLng) {
  const earthRadius = 6371000;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function inferCountryCodeFromAddress(address = '') {
  const lower = clean(address);
  if (lower.includes('spain') || lower.includes('españa')) return 'ES';
  if (lower.includes('portugal')) return 'PT';
  if (lower.includes('france')) return 'FR';
  if (lower.includes('italy') || lower.includes('italia')) return 'IT';
  if (lower.includes('germany') || lower.includes('deutschland')) return 'DE';
  if (lower.includes('thailand')) return 'TH';
  if (lower.includes('greece')) return 'GR';
  if (lower.includes('turkey') || lower.includes('türkiye')) return 'TR';
  if (lower.includes('croatia')) return 'HR';
  if (lower.includes('morocco')) return 'MA';
  if (lower.includes('united states') || lower.includes('usa')) return 'US';
  if (lower.includes('canada')) return 'CA';
  if (lower.includes('ireland')) return 'IE';
  if (lower.includes('netherlands')) return 'NL';
  return undefined;
}

function findSeedRule(operator, network, name, countryCode) {
  const joined = clean(`${operator ?? ''} ${network ?? ''} ${name ?? ''}`);
  if (!joined) return undefined;

  return SEEDED_OPERATOR_RULES.find((rule) => {
    const appliesToCountry = rule.countryCode === 'GLOBAL' || !countryCode || rule.countryCode === countryCode;
    if (!appliesToCountry) return false;
    const names = [rule.operator, ...(rule.aliases ?? [])].map(clean).filter(Boolean);
    return names.some((needle) => joined.includes(needle));
  });
}

function confidenceFor(operator, network, fee, name, countryCode) {
  const joined = `${clean(operator)} ${clean(network)} ${clean(name)}`;
  const feeValue = clean(fee);
  const seedRule = findSeedRule(operator, network, name, countryCode);

  if (feeValue === 'no') {
    return { confidence: 'confirmed-free', feeLabel: 'Confirmed free', feeDataStatus: 'osm-confirmed', risk: 'low', riskLabel: 'OSM fee=no tag', confidenceLabel: 'Confirmed free', sourceLabel: 'OpenStreetMap fee tag' };
  }

  if (feeValue === 'yes') {
    return { confidence: 'fee-likely', feeLabel: 'Fee likely', feeDataStatus: 'osm-confirmed', risk: 'high', riskLabel: 'OSM fee=yes tag', confidenceLabel: 'Fee likely', sourceLabel: 'OpenStreetMap fee tag' };
  }

  if (seedRule) {
    return {
      confidence: seedRule.outcome === 'avoid' || seedRule.outcome === 'known-fee' ? 'fee-likely' : seedRule.outcome === 'likely-free' ? 'likely-free' : 'unknown',
      feeLabel: seedRule.label,
      feeDataStatus: 'operator-rule',
      risk: seedRule.risk,
      riskLabel: seedRule.note,
      confidenceLabel: `${seedRule.label} • ${seedRule.confidence} confidence`,
      sourceLabel: 'Transvert seed intelligence',
    };
  }

  if (SURCHARGE_OPERATORS.some((needle) => joined.includes(needle))) {
    return { confidence: 'fee-likely', feeLabel: 'Fee likely', feeDataStatus: 'operator-rule', risk: 'high', riskLabel: 'Known surcharge operator pattern', confidenceLabel: 'Fee likely', sourceLabel: 'Operator confidence rule' };
  }

  if (LOW_FEE_OPERATORS.some((needle) => joined.includes(needle))) {
    return { confidence: 'likely-free', feeLabel: 'Likely free', feeDataStatus: 'operator-rule', risk: 'medium', riskLabel: 'Travel-card friendly operator pattern', confidenceLabel: 'Likely free', sourceLabel: 'Operator confidence rule' };
  }

  return { confidence: 'unknown', feeLabel: 'Fee unknown', feeDataStatus: 'unknown', risk: 'medium', riskLabel: 'Check ATM screen before accepting', confidenceLabel: 'Unknown', sourceLabel: 'Google Places / no fee tag' };
}

async function geocodeManualLocation(query, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status !== 'OK') return { center: undefined, countryCode: undefined, warning: payload.error_message || payload.status || 'Geocoding failed' };

  const result = payload.results?.[0];
  const location = result?.geometry?.location;
  if (typeof location?.lat !== 'number' || typeof location?.lng !== 'number') return { center: undefined, countryCode: undefined, warning: 'Geocoding returned no coordinates' };

  const countryComponent = result.address_components?.find((component) => component.types?.includes('country'));
  return { center: { latitude: location.lat, longitude: location.lng }, countryCode: countryComponent?.short_name };
}

async function getPlaceCenter(placeId, apiKey) {
  const params = new URLSearchParams({ place_id: placeId, key: apiKey, fields: 'geometry,address_component,formatted_address' });
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status !== 'OK') return { center: undefined, countryCode: undefined, warning: payload.error_message || payload.status || 'Place details failed' };

  const location = payload.result?.geometry?.location;
  if (typeof location?.lat !== 'number' || typeof location?.lng !== 'number') return { center: undefined, countryCode: undefined, warning: 'Place details returned no coordinates' };

  const countryComponent = payload.result?.address_components?.find((component) => component.types?.includes('country'));
  return {
    center: { latitude: location.lat, longitude: location.lng },
    countryCode: countryComponent?.short_name ?? inferCountryCodeFromAddress(payload.result?.formatted_address ?? ''),
  };
}

async function fetchOsmAtms(latitude, longitude) {
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
    const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams({ data: query }).toString() });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(payload.elements)) return [];

    return payload.elements.map((element) => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (typeof lat !== 'number' || typeof lon !== 'number') return undefined;
      return { id: `osm-${element.type}-${element.id}`, latitude: lat, longitude: lon, name: element.tags?.name, operator: element.tags?.operator ?? element.tags?.brand, network: element.tags?.network, fee: element.tags?.fee };
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function nearestOsmAtm(placeLat, placeLng, osmAtms) {
  let best;
  for (const atm of osmAtms) {
    const distance = distanceMeters(placeLat, placeLng, atm.latitude, atm.longitude);
    if (!best || distance < best.distance) best = { atm, distance };
  }
  return best && best.distance <= 80 ? best.atm : undefined;
}

function enrichAtm(base, osm, countryCode) {
  const operator = osm?.operator ?? base.operator ?? base.name;
  const network = osm?.network;
  const confidence = confidenceFor(operator, network, osm?.fee, base.name, countryCode);
  return { ...base, operator, network, countryCode, feeEstimate: null, cardNetworks: ['Visa', 'Mastercard'], ...confidence };
}

function sortAtmsByRecommendation(atms) {
  const score = (atm) => {
    if (atm.risk === 'low') return 0;
    if (atm.feeLabel === 'Likely free') return 1;
    if (atm.feeLabel === 'Mixed reports') return 2;
    if (atm.risk === 'medium') return 3;
    if (atm.risk === 'high') return 5;
    return 4;
  };
  return [...atms].sort((a, b) => score(a) - score(b) || (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999));
}

async function fetchGoogleAtms(latitude, longitude, apiKey, osmAtms, countryCode) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1800&type=atm&key=${apiKey}`;
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS')) return { atms: [], warning: payload.error_message || payload.status || `Google Places HTTP ${response.status}` };

  const atms = (payload.results ?? []).slice(0, 10).map((place, index) => {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    const name = place.name ?? 'ATM';
    const matchedOsm = typeof lat === 'number' && typeof lng === 'number' ? nearestOsmAtm(lat, lng, osmAtms) : undefined;
    return enrichAtm({ id: place.place_id ?? `google-atm-${index}`, name: matchedOsm?.name ?? name, distanceMeters: typeof lat === 'number' && typeof lng === 'number' ? distanceMeters(latitude, longitude, lat, lng) : 0, openLabel: place.opening_hours?.open_now === true ? 'Open now' : 'Hours unknown', latitude: lat, longitude: lng, mapsUrl: mapsUrl(name, lat, lng), sourceLabel: 'Google Places', operator: matchedOsm?.operator ?? name, network: matchedOsm?.network }, matchedOsm, countryCode);
  });

  return { atms: sortAtmsByRecommendation(atms) };
}

function osmOnlyAtms(latitude, longitude, osmAtms, countryCode) {
  return sortAtmsByRecommendation(osmAtms.slice(0, 10).map((atm) => enrichAtm({ id: atm.id, name: atm.name ?? atm.operator ?? 'ATM', operator: atm.operator, network: atm.network, sourceLabel: 'OpenStreetMap', distanceMeters: distanceMeters(latitude, longitude, atm.latitude, atm.longitude), openLabel: 'Hours unknown', latitude: atm.latitude, longitude: atm.longitude, mapsUrl: mapsUrl(atm.name ?? atm.operator ?? 'ATM', atm.latitude, atm.longitude) }, atm, countryCode)));
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ provider: 'atm-intelligence', atms: [], warnings: ['Use POST to search for ATMs.'], error: 'Method not allowed' });

  const apiKey = getGoogleMapsApiKey();
  const body = typeof req.body === 'object' && req.body ? req.body : {};

  try {
    const warnings = [];
    let center;
    let countryCode;

    if (body.placeId && apiKey) {
      const place = await getPlaceCenter(body.placeId, apiKey);
      center = place.center;
      countryCode = place.countryCode;
      if (place.warning) warnings.push(`Google place details: ${place.warning}`);
    } else if (body.query && apiKey) {
      const geocode = await geocodeManualLocation(body.query, apiKey);
      center = geocode.center;
      countryCode = geocode.countryCode ?? inferCountryCodeFromAddress(body.query);
      if (geocode.warning) warnings.push(`Google geocoding: ${geocode.warning}`);
    }

    center = center ?? (typeof body.latitude === 'number' && typeof body.longitude === 'number' ? { latitude: body.latitude, longitude: body.longitude } : fallbackCenter);
    countryCode = countryCode ?? inferCountryCodeFromAddress(body.query ?? '');

    const osmAtms = await fetchOsmAtms(center.latitude, center.longitude);
    const google = apiKey ? await fetchGoogleAtms(center.latitude, center.longitude, apiKey, osmAtms, countryCode) : { atms: [], warning: 'GOOGLE_MAPS_API_KEY is not available to the server function.' };
    if (google.warning) warnings.push(`Google Places: ${google.warning}`);

    const atms = google.atms.length > 0 ? google.atms : osmOnlyAtms(center.latitude, center.longitude, osmAtms, countryCode);
    const provider = google.atms.length > 0 ? 'google-places+osm+seed' : (osmAtms.length > 0 ? 'osm-overpass+seed' : 'atm-intelligence');

    return res.status(200).json({
      provider,
      center,
      atms,
      warnings: [
        atms.length > 0 ? 'ATM ranking uses Google Places, OpenStreetMap and Transvert seed intelligence where available.' : 'No ATM results found. Try a more specific location.',
        'Always reject DCC and choose local currency at the ATM.',
        ...warnings,
      ],
      error: atms.length > 0 ? undefined : 'No ATM results returned by Google Places or OpenStreetMap.',
    });
  } catch (error) {
    return res.status(502).json({ provider: 'atm-intelligence', atms: [], warnings: ['ATM search failed. Try again or search manually.'], error: error instanceof Error ? error.message : 'ATM search failed.' });
  }
}
