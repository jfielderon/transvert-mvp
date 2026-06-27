function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY
    ?? process.env.GOOGLE_MAP_API_KEY
    ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    ?? process.env.GOOGLE_API_KEY
    ?? process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ suggestions: [], error: 'Method not allowed' });
  }

  const apiKey = getGoogleMapsApiKey();
  const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';

  if (!apiKey) {
    return res.status(200).json({ suggestions: [], error: 'Google Maps key is not available to the server.' });
  }

  if (input.length < 2) {
    return res.status(200).json({ suggestions: [] });
  }

  try {
    const params = new URLSearchParams({
      input,
      key: apiKey,
      types: '(regions)',
      language: 'en',
    });

    const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS')) {
      return res.status(200).json({
        suggestions: [],
        error: payload.error_message || payload.status || `Google autocomplete HTTP ${response.status}`,
      });
    }

    const suggestions = (payload.predictions ?? []).slice(0, 6).map((prediction) => ({
      id: prediction.place_id,
      placeId: prediction.place_id,
      title: prediction.structured_formatting?.main_text ?? prediction.description,
      subtitle: prediction.structured_formatting?.secondary_text ?? '',
      description: prediction.description,
    }));

    return res.status(200).json({ suggestions });
  } catch (error) {
    return res.status(200).json({
      suggestions: [],
      error: error instanceof Error ? error.message : 'Place suggestions failed.',
    });
  }
}
