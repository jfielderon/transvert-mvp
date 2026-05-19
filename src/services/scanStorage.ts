import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanRecord } from '@/types/scan';

const SCANS_KEY = 'transvert.scans';

export async function getSavedScans() {
  try {
    const raw = await AsyncStorage.getItem(SCANS_KEY);
    return raw ? (JSON.parse(raw) as ScanRecord[]) : [];
  } catch (error) {
    console.warn('[Transvert Storage] Failed to load scans', error);
    return [];
  }
}

export async function saveScan(scan: ScanRecord) {
  try {
    const existing = await getSavedScans();
    const next = [scan, ...existing.filter((item) => item.id !== scan.id)].slice(0, 50);
    await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn('[Transvert Storage] Failed to save scan', error);
    throw new Error('Could not save scan locally.');
  }
}

export async function deleteScan(id: string) {
  const existing = await getSavedScans();
  const next = existing.filter((scan) => scan.id !== id);
  await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(next));
  return next;
}

export async function clearScans() {
  await AsyncStorage.removeItem(SCANS_KEY);
}
