export type TravelBankRule = {
  id: string;
  bankName: string;
  cardName: string;
  country: 'UK' | 'EU' | 'Global';
  fxMarkupPercent: number | null;
  atmFeePercent: number | null;
  atmFlatFeeGbp: number | null;
  freeAllowanceText: string;
  confidence: 'official-source-needed' | 'curated' | 'partner-confirmed';
  notes: string;
  sourceUrl?: string;
  updatedAt: string;
};

// Keep this data conservative. Do not show an ATM/card as "free" unless the rule
// is checked against the provider's current official terms. These rules are the
// foundation for a future sourced fee database, not user-editable guesses.
export const travelBankFeeRules: TravelBankRule[] = [
  {
    id: 'revolut-standard-uk',
    bankName: 'Revolut',
    cardName: 'Standard personal card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Plan and fair-use dependent. Confirm against current Revolut UK fee page before marking free.',
    confidence: 'official-source-needed',
    notes: 'Weekend exchange and monthly ATM allowance rules can vary by plan. Treat as estimate until official source automation is added.',
    updatedAt: '2026-06-24',
  },
  {
    id: 'wise-uk',
    bankName: 'Wise',
    cardName: 'Wise card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Allowance and withdrawal fees vary by region/currency. Confirm current Wise pricing before marking free.',
    confidence: 'official-source-needed',
    notes: 'Wise typically uses transparent conversion fees rather than hidden FX spread; exact fee depends on currency route.',
    updatedAt: '2026-06-24',
  },
  {
    id: 'chase-uk-debit',
    bankName: 'Chase UK',
    cardName: 'Debit card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Foreign use can be fee-free subject to terms and ATM operator surcharge. Confirm official terms before marking free.',
    confidence: 'official-source-needed',
    notes: 'ATM operator surcharge/DCC can still apply even when the card provider does not charge FX fees.',
    updatedAt: '2026-06-24',
  },
  {
    id: 'starling-personal-uk',
    bankName: 'Starling Bank',
    cardName: 'Personal debit card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Often positioned as travel-friendly, but confirm current official terms before marking free.',
    confidence: 'official-source-needed',
    notes: 'Card-provider fee and ATM operator surcharge are separate.',
    updatedAt: '2026-06-24',
  },
  {
    id: 'monzo-personal-uk',
    bankName: 'Monzo',
    cardName: 'Personal debit card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Plan/EEA/non-EEA allowance dependent. Confirm current Monzo fees before marking free.',
    confidence: 'official-source-needed',
    notes: 'Useful candidate for a sourced rules importer because allowance depends on region and plan.',
    updatedAt: '2026-06-24',
  },
  {
    id: 'metro-bank-debit-uk',
    bankName: 'Metro Bank',
    cardName: 'Debit card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Foreign card charges apply on some transactions. Confirm current Metro fee page before estimating.',
    confidence: 'official-source-needed',
    notes: 'Do not surface as free without current official confirmation.',
    updatedAt: '2026-06-24',
  },
  {
    id: 'halifax-clarity-uk',
    bankName: 'Halifax',
    cardName: 'Clarity credit card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Travel credit-card rules differ for purchases vs cash withdrawals. Confirm current terms.',
    confidence: 'official-source-needed',
    notes: 'Cash withdrawal interest can apply even when FX fees are low/free.',
    updatedAt: '2026-06-24',
  },
  {
    id: 'barclaycard-rewards-uk',
    bankName: 'Barclaycard',
    cardName: 'Rewards credit card',
    country: 'UK',
    fxMarkupPercent: null,
    atmFeePercent: null,
    atmFlatFeeGbp: null,
    freeAllowanceText: 'Confirm current Barclaycard rewards travel terms before estimating.',
    confidence: 'official-source-needed',
    notes: 'Credit-card ATM withdrawals may attract interest/fees separate from purchase FX rules.',
    updatedAt: '2026-06-24',
  },
];
