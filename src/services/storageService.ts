import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResult } from '@/types/scan';

const KEY = 'transvert_scans';

export async function loadScans(): Promise<ScanResult[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ScanResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function persistScan(scan: ScanResult): Promise<void> {
  const existing = await loadScans();
  const next = [scan, ...existing].slice(0, 40);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function getScanById(id: string): Promise<ScanResult | null> {
  const existing = await loadScans();
  return existing.find((s) => s.id === id) ?? null;
}
