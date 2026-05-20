import { defaultCardFeeProfile, estimateCardFees } from '@/services/cardFees';
import type { DetectedPrice, RealCostEstimate } from '@/types/scan';

export function estimateRealCost(prices: DetectedPrice[], marketGbp: number): RealCostEstimate {
  const nonGbp = prices.find((price) => price.currency !== 'GBP');
  const estimatedFeesGbp = nonGbp
    ? estimateCardFees(marketGbp, nonGbp.currency, defaultCardFeeProfile)
    : 0;

  return {
    marketGbp,
    estimatedFeesGbp,
    estimatedTotalGbp: marketGbp + estimatedFeesGbp,
    dccRisk: detectDccRisk(prices),
    warnings: buildWarnings(prices),
  };
}

function detectDccRisk(prices: DetectedPrice[]): RealCostEstimate['dccRisk'] {
  const hasMultipleCurrencies = new Set(prices.map((price) => price.currency)).size > 1;
  if (hasMultipleCurrencies) return 'medium';
  return 'unknown';
}

function buildWarnings(prices: DetectedPrice[]) {
  const warnings: string[] = [];
  if (prices.some((price) => price.role === 'fee')) {
    warnings.push('Service, tip or fee language detected. Check whether it is included before paying.');
  }
  if (detectDccRisk(prices) === 'medium') {
    warnings.push('Multiple currencies detected. If a terminal offers conversion, paying in local currency is usually safer.');
  }
  return warnings;
}
