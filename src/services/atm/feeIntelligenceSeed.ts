export type AtmFeeConfidence = 'confirmed' | 'high' | 'medium' | 'low' | 'unknown';
export type AtmFeeOutcome = 'free' | 'likely-free' | 'mixed' | 'fee-likely' | 'known-fee' | 'avoid' | 'unknown';
export type SourceType = 'official' | 'news' | 'forum' | 'user-report' | 'reference' | 'research-note';

export type AtmOperatorFeeRule = {
  id: string;
  countryCode: string;
  countryName: string;
  operator: string;
  aliases: string[];
  outcome: AtmFeeOutcome;
  typicalFeeLocal: string | null;
  cardNotes: string;
  dccWarning: boolean;
  confidence: AtmFeeConfidence;
  lastChecked: string;
  sources: Array<{
    type: SourceType;
    label: string;
    url?: string;
  }>;
  notes: string;
};

export type CountryAtmFeeRule = {
  countryCode: string;
  countryName: string;
  defaultOutcome: AtmFeeOutcome;
  defaultTypicalFeeLocal: string | null;
  defaultConfidence: AtmFeeConfidence;
  notes: string;
  sources: Array<{
    type: SourceType;
    label: string;
    url?: string;
  }>;
};

export type CardIssuerTravelRule = {
  id: string;
  issuer: string;
  cardName: string;
  homeCountry: string;
  fxMarkup: string;
  atmWithdrawalRule: string;
  networkRate: string;
  confidence: AtmFeeConfidence;
  lastChecked: string;
  notes: string;
  sources: Array<{
    type: SourceType;
    label: string;
    url?: string;
  }>;
};

export const countryAtmFeeSeed: CountryAtmFeeRule[] = [
  {
    countryCode: 'ES',
    countryName: 'Spain',
    defaultOutcome: 'mixed',
    defaultTypicalFeeLocal: 'Commonly €0-€5+ depending on ATM operator and card route',
    defaultConfidence: 'medium',
    notes: 'Spain is highly variable. Tourist areas can have many ATMs that add surcharges. Treat exact ATM as unknown unless operator/user-report data exists.',
    sources: [
      { type: 'reference', label: 'ATM usage fee overview notes significant variation in Spain' },
      { type: 'user-report', label: 'Founder report: La Cala de Mijas had one free ATM out of six tested; others charged about €3.50 or €4.99' },
    ],
  },
  {
    countryCode: 'PT',
    countryName: 'Portugal',
    defaultOutcome: 'likely-free',
    defaultTypicalFeeLocal: 'Multibanco withdrawals generally reported as free; independent/non-Multibanco ATMs still need caution',
    defaultConfidence: 'medium',
    notes: 'Portugal appears more favourable than Spain when using Multibanco network ATMs. Still warn users to reject DCC and confirm any on-screen fee.',
    sources: [
      { type: 'reference', label: 'Multibanco / Portugal fee references indicate Multibanco withdrawals are generally free' },
    ],
  },
  {
    countryCode: 'TH',
    countryName: 'Thailand',
    defaultOutcome: 'known-fee',
    defaultTypicalFeeLocal: 'Common foreign-card ATM fee: ฿220; Aeon historically lower around ฿150',
    defaultConfidence: 'medium',
    notes: 'Thailand should be displayed as known-fee by default for foreign cards unless a specific no-fee cash-advance route is confirmed.',
    sources: [
      { type: 'reference', label: 'ATM fee references report foreign-card ATM fees of ฿220 for most banks and lower Aeon fee' },
    ],
  },
  {
    countryCode: 'GR',
    countryName: 'Greece',
    defaultOutcome: 'fee-likely',
    defaultTypicalFeeLocal: 'Often a local ATM fee applies; exact fee varies by bank/operator',
    defaultConfidence: 'low',
    notes: 'Needs dedicated source sweep by operator: Alpha Bank, Eurobank, Piraeus, National Bank, Euronet.',
    sources: [{ type: 'research-note', label: 'Needs official/operator-specific verification' }],
  },
  {
    countryCode: 'TR',
    countryName: 'Turkey',
    defaultOutcome: 'fee-likely',
    defaultTypicalFeeLocal: 'Local ATM fee commonly applies; exact fee varies by operator',
    defaultConfidence: 'low',
    notes: 'Needs dedicated source sweep by operator: Ziraat, Halkbank, Garanti BBVA, Isbank, Akbank, DenizBank.',
    sources: [{ type: 'research-note', label: 'Needs official/operator-specific verification' }],
  },
];

export const operatorAtmFeeSeed: AtmOperatorFeeRule[] = [
  {
    id: 'es-unicaja',
    countryCode: 'ES',
    countryName: 'Spain',
    operator: 'Unicaja',
    aliases: ['Unicaja Banco', 'Unicaja ATM'],
    outcome: 'likely-free',
    typicalFeeLocal: 'Often reported as €0 with travel cards, but not yet official-confirmed',
    cardNotes: 'Candidate for Starling/Revolut/Chase/Wise free-withdrawal recommendation once user reports confirm.',
    dccWarning: true,
    confidence: 'medium',
    lastChecked: '2026-06-27',
    sources: [
      { type: 'user-report', label: 'Founder/Google AI discussion suggested Unicaja as a strong free candidate in Spain' },
      { type: 'research-note', label: 'Needs official ATM surcharge confirmation' },
    ],
    notes: 'Surface as likely-free, not confirmed-free, until Transvert has several user confirmations for the specific town/card.',
  },
  {
    id: 'es-bbva',
    countryCode: 'ES',
    countryName: 'Spain',
    operator: 'BBVA',
    aliases: ['BBVA ATM', 'Banco Bilbao Vizcaya Argentaria'],
    outcome: 'mixed',
    typicalFeeLocal: 'Often reported free by some travellers/cards, but can vary',
    cardNotes: 'Good candidate after Unicaja; ask user to confirm fee after use.',
    dccWarning: true,
    confidence: 'medium',
    lastChecked: '2026-06-27',
    sources: [
      { type: 'user-report', label: 'Founder remembers some Spanish bank ATMs were free with Starling/Revolut but many charged €3.50-€4.99' },
      { type: 'research-note', label: 'Needs operator-specific surcharge confirmation' },
    ],
    notes: 'Do not show confirmed free unless local/card-specific reports exist.',
  },
  {
    id: 'es-caixabank',
    countryCode: 'ES',
    countryName: 'Spain',
    operator: 'CaixaBank',
    aliases: ['Caixa', 'La Caixa', 'CaixaBank ATM'],
    outcome: 'mixed',
    typicalFeeLocal: 'Mixed reports; fee may appear on screen',
    cardNotes: 'Rank below known/likely free operators unless user reports confirm free nearby.',
    dccWarning: true,
    confidence: 'low',
    lastChecked: '2026-06-27',
    sources: [{ type: 'research-note', label: 'Needs operator-specific source sweep' }],
    notes: 'Ask for one-tap report after navigation/use.',
  },
  {
    id: 'es-santander',
    countryCode: 'ES',
    countryName: 'Spain',
    operator: 'Santander',
    aliases: ['Banco Santander', 'Santander ATM'],
    outcome: 'mixed',
    typicalFeeLocal: 'Mixed; Santander UK/Santander network card rules differ from third-party UK cards',
    cardNotes: 'Some Santander account/card holders may have network benefits; Starling/Revolut users still need ATM-owner fee check.',
    dccWarning: true,
    confidence: 'low',
    lastChecked: '2026-06-27',
    sources: [
      { type: 'news', label: 'UK press notes Santander card/account-specific travel fee rules' },
    ],
    notes: 'Do not infer free for Starling/Revolut without local report.',
  },
  {
    id: 'es-bankinter',
    countryCode: 'ES',
    countryName: 'Spain',
    operator: 'Bankinter',
    aliases: ['Bankinter ATM'],
    outcome: 'unknown',
    typicalFeeLocal: null,
    cardNotes: 'No reliable seed yet. Treat as unknown and request report.',
    dccWarning: true,
    confidence: 'unknown',
    lastChecked: '2026-06-27',
    sources: [{ type: 'research-note', label: 'Needs operator-specific source sweep' }],
    notes: 'Shown in La Cala results; likely important to research next.',
  },
  {
    id: 'es-cajamar',
    countryCode: 'ES',
    countryName: 'Spain',
    operator: 'Cajamar',
    aliases: ['Grupo Cooperativo Cajamar', 'Cajamar ATM'],
    outcome: 'unknown',
    typicalFeeLocal: null,
    cardNotes: 'No reliable seed yet. Treat as unknown and request report.',
    dccWarning: true,
    confidence: 'unknown',
    lastChecked: '2026-06-27',
    sources: [{ type: 'research-note', label: 'Needs operator-specific source sweep' }],
    notes: 'Shown in La Cala results; likely important to research next.',
  },
  {
    id: 'es-banca-march',
    countryCode: 'ES',
    countryName: 'Spain',
    operator: 'Banca March',
    aliases: ['Banca March ATM'],
    outcome: 'unknown',
    typicalFeeLocal: null,
    cardNotes: 'No reliable seed yet. Treat as unknown and request report.',
    dccWarning: true,
    confidence: 'unknown',
    lastChecked: '2026-06-27',
    sources: [{ type: 'research-note', label: 'Needs operator-specific source sweep' }],
    notes: 'Shown in La Cala results; likely important to research next.',
  },
  {
    id: 'global-euronet',
    countryCode: 'GLOBAL',
    countryName: 'Global tourist areas',
    operator: 'Euronet',
    aliases: ['Euronet Worldwide', 'Euronet ATM', 'Euronet 360 Finance'],
    outcome: 'avoid',
    typicalFeeLocal: 'Often high local surcharge in tourist areas; user-reported Spain fees commonly around €3.50-€4.99+',
    cardNotes: 'Avoid for Starling/Revolut/Chase/Wise where a bank ATM alternative exists.',
    dccWarning: true,
    confidence: 'high',
    lastChecked: '2026-06-27',
    sources: [
      { type: 'user-report', label: 'Founder report: Spain tourist ATMs often charged €3.50 or €4.99' },
      { type: 'research-note', label: 'Needs broader country-specific fee validation' },
    ],
    notes: 'Rank low by default. Strong candidate for “avoid” badge unless confirmed free locally.',
  },
  {
    id: 'pt-multibanco',
    countryCode: 'PT',
    countryName: 'Portugal',
    operator: 'Multibanco',
    aliases: ['SIBS Multibanco', 'MULTIBANCO'],
    outcome: 'likely-free',
    typicalFeeLocal: 'Generally free on the Multibanco network; still check screen',
    cardNotes: 'Good candidate for Starling/Revolut/Chase/Wise users if ATM is genuine Multibanco network.',
    dccWarning: true,
    confidence: 'medium',
    lastChecked: '2026-06-27',
    sources: [
      { type: 'reference', label: 'Portugal/Multibanco references indicate domestic network withdrawals generally free' },
    ],
    notes: 'Still warn against DCC and independent tourist ATMs.',
  },
  {
    id: 'th-aeon',
    countryCode: 'TH',
    countryName: 'Thailand',
    operator: 'AEON',
    aliases: ['Aeon Bank', 'AEON ATM'],
    outcome: 'known-fee',
    typicalFeeLocal: 'Historically around ฿150 for foreign cards',
    cardNotes: 'May be lower than other Thai banks; verify current fee on ATM screen.',
    dccWarning: true,
    confidence: 'medium',
    lastChecked: '2026-06-27',
    sources: [
      { type: 'reference', label: 'ATM fee references report Aeon foreign-card fee lower than other Thai banks' },
    ],
    notes: 'Good “least bad” option in Thailand, not free.',
  },
  {
    id: 'th-default-banks',
    countryCode: 'TH',
    countryName: 'Thailand',
    operator: 'Thai bank ATM',
    aliases: ['Bangkok Bank', 'Kasikornbank', 'KBank', 'SCB', 'Krungthai', 'Krungsri', 'TMBThanachart'],
    outcome: 'known-fee',
    typicalFeeLocal: 'Commonly ฿220 for foreign cards',
    cardNotes: 'Card issuer may still be fee-free, but Thai ATM owner fee usually applies.',
    dccWarning: true,
    confidence: 'medium',
    lastChecked: '2026-06-27',
    sources: [
      { type: 'reference', label: 'ATM fee references report ฿220 foreign-card fee for most Thai banks' },
    ],
    notes: 'Display as known fee unless user report says otherwise.',
  },
];

export const cardIssuerTravelSeed: CardIssuerTravelRule[] = [
  {
    id: 'uk-starling-debit',
    issuer: 'Starling Bank',
    cardName: 'Personal debit card',
    homeCountry: 'UK',
    fxMarkup: 'No Starling FX markup reported; Mastercard rate used',
    atmWithdrawalRule: 'Starling does not charge its own overseas ATM withdrawal fee, subject to account/card limits; ATM owner may charge separately',
    networkRate: 'Mastercard',
    confidence: 'high',
    lastChecked: '2026-06-27',
    notes: 'Excellent default UK travel card for Transvert recommendations. Must still separate ATM-owner surcharge from Starling fee.',
    sources: [
      { type: 'news', label: 'UK money press repeatedly lists Starling as fee-free abroad with Mastercard rate' },
    ],
  },
  {
    id: 'uk-chase-debit',
    issuer: 'Chase UK',
    cardName: 'Debit card',
    homeCountry: 'UK',
    fxMarkup: 'Generally positioned as fee-free abroad',
    atmWithdrawalRule: 'Fee-free cash withdrawals abroad subject to Chase limits; ATM owner may charge separately',
    networkRate: 'Mastercard/Visa depending product route',
    confidence: 'medium',
    lastChecked: '2026-06-27',
    notes: 'Needs official-page source in next research pass.',
    sources: [
      { type: 'news', label: 'UK money press lists Chase among fee-free travel debit options' },
    ],
  },
  {
    id: 'uk-revolut-standard',
    issuer: 'Revolut',
    cardName: 'Standard personal card',
    homeCountry: 'UK',
    fxMarkup: 'Plan/currency/weekend/fair-use dependent',
    atmWithdrawalRule: 'Free ATM allowance is plan dependent; ATM owner may charge separately',
    networkRate: 'Revolut exchange route / card network depending transaction',
    confidence: 'medium',
    lastChecked: '2026-06-27',
    notes: 'Do not show “free” as universal. Show allowance caveat until official API/rules are wired.',
    sources: [
      { type: 'news', label: 'Historic Revolut travel-card coverage notes free ATM withdrawals up to standard allowance' },
      { type: 'research-note', label: 'Needs current official Revolut UK pricing scrape' },
    ],
  },
  {
    id: 'uk-monzo-debit',
    issuer: 'Monzo',
    cardName: 'Personal debit card',
    homeCountry: 'UK',
    fxMarkup: 'No exchange-rate markup commonly reported; Mastercard rate passed through',
    atmWithdrawalRule: 'EEA withdrawals can be fee-free; outside EEA has allowance/plan limits; ATM owner may charge separately',
    networkRate: 'Mastercard',
    confidence: 'medium',
    lastChecked: '2026-06-27',
    notes: 'Must model EEA/non-EEA and plan limits.',
    sources: [
      { type: 'news', label: 'UK money press reports Monzo EEA ATM withdrawals can be unlimited fee-free, with non-EEA limits' },
    ],
  },
  {
    id: 'uk-metro-debit',
    issuer: 'Metro Bank',
    cardName: 'Debit card',
    homeCountry: 'UK',
    fxMarkup: '2.99% overseas debit card fee reported from Aug 2024',
    atmWithdrawalRule: '2.99% plus £1.50 overseas ATM withdrawal fee reported from Aug 2024; ATM owner may also charge',
    networkRate: 'Card network plus Metro fees',
    confidence: 'high',
    lastChecked: '2026-06-27',
    notes: 'Useful “avoid for travel cash” comparison card.',
    sources: [
      { type: 'news', label: 'Metro Bank 2.99% overseas debit fee plus £1.50 ATM fee reported in UK press' },
    ],
  },
  {
    id: 'uk-club-lloyds-debit',
    issuer: 'Lloyds Bank',
    cardName: 'Club Lloyds debit card',
    homeCountry: 'UK',
    fxMarkup: 'Foreign currency fees removed for Club Lloyds from April 2025 according to UK money press',
    atmWithdrawalRule: 'ATM/cash withdrawal foreign fees removed for Club Lloyds; ATM owner may charge separately',
    networkRate: 'Card network route',
    confidence: 'medium',
    lastChecked: '2026-06-27',
    notes: 'Needs official Lloyds tariff source in next pass; model only for Club Lloyds, not all Lloyds accounts.',
    sources: [
      { type: 'news', label: 'MoneyWeek reports Club Lloyds foreign fees removed from April 2025' },
    ],
  },
];
