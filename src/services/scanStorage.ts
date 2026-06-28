import AsyncStorage from '@react-native-async-storage/async-storage';
import { insertClientRow } from '@/services/supabase/clientRest';
import { getAppProfile } from '@/storage/appProfile';
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

async function syncScan(scan: ScanRecord) {
  try {
    const profile = await getAppProfile();
    await insertClientRow('saved_scans', {
      id: scan.id,
      user_id: profile?.userId ?? null,
      created_at: scan.createdAt,
      mode: scan.mode ?? 'menu',
      source: scan.source,
      ocr_status: scan.ocrStatus,
      fx_status: scan.fxStatus ?? null,
      original_text: scan.originalText,
      translated_text: scan.translatedText ?? null,
      price_count: scan.prices.length,
      estimated_total_gbp: scan.estimatedTotalGbp,
    });
  } catch (error) {
    console.warn('[Transvert Storage] Supabase scan sync skipped', error);
  }
}

export async function saveScan(scan: ScanRecord) {
  try {
    const existing = await getSavedScans();
    const next = [scan, ...existing.filter((item) => item.id !== scan.id)].slice(0, 50);
    await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(next));
    void syncScan(scan);
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
