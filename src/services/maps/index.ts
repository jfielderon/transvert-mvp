import { env } from '@/config/env';

export type MapsProviderStatus = 'not-configured' | 'google-maps-ready';

export function getMapsProviderStatus(): MapsProviderStatus {
  return env.googleMapsApiKey ? 'google-maps-ready' : 'not-configured';
}
