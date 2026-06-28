import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'transvert:app-profile:v1';

export type AppProfile = {
  contact: string;
  name?: string;
  provider: 'email' | 'google' | 'apple' | 'yahoo' | 'guest';
  updatesOptIn: boolean;
  atmDataOptIn: boolean;
  createdAt: string;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  avatarUrl?: string;
  homeCountry?: string;
  defaultCard?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  onboardingComplete?: boolean;
};

export async function getAppProfile(): Promise<AppProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) as AppProfile : null;
  } catch {
    return null;
  }
}

export async function saveAppProfile(profile: AppProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function clearAppProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
