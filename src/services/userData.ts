import { insertClientRow } from '@/services/supabase/clientRest';
import { getAppProfile } from '@/storage/appProfile';

export async function saveAtmFeeReport(input: {
  atmName: string;
  atmProvider?: string;
  latitude?: number;
  longitude?: number;
  feeLabel: string;
  feeAmount?: number | null;
  wasFree: boolean;
}) {
  const profile = await getAppProfile();
  return insertClientRow('atm_fee_reports', {
    user_id: profile?.userId ?? null,
    atm_name: input.atmName,
    atm_provider: input.atmProvider ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    fee_currency: 'EUR',
    fee_amount: input.feeAmount ?? null,
    fee_label: input.feeLabel,
    was_free: input.wasFree,
    card_country: profile?.homeCountry ?? 'GB',
    card_provider: profile?.defaultCard ?? null,
    source: 'user_report',
  });
}

export async function saveScanFeedback(input: {
  scanId?: string;
  verdict: 'right' | 'wrong';
  mode?: string;
  originalText?: string;
  detectedPriceCount?: number;
}) {
  const profile = await getAppProfile();
  return insertClientRow('scan_feedback', {
    user_id: profile?.userId ?? null,
    scan_id: input.scanId ?? null,
    verdict: input.verdict,
    mode: input.mode ?? 'menu',
    original_text: input.originalText ?? null,
    detected_price_count: input.detectedPriceCount ?? 0,
  });
}
