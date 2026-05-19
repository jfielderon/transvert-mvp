# Transvert

Expo Go compatible React Native MVP for travel purchase intelligence: scan or paste foreign text, translate it, detect prices, convert to GBP, save scans, and prepare low-fee ATM routing.

## Stack

- Expo / Expo Router
- React Native
- TypeScript
- AsyncStorage
- `expo-image-picker`
- Provider-ready services for FX, translation, OCR, ATM search, and future card fees

## Run

```bash
npm install
npm run start
```

If PowerShell blocks npm scripts on Windows, use:

```bash
npm.cmd run start
```

## Environment

Copy `.env.example` to `.env` and add keys as providers are enabled.

- FX defaults to live `open.er-api.com` without a key, or ExchangeRate API with `EXPO_PUBLIC_EXCHANGERATE_API_KEY`.
- Translation defaults to local phrase fallback. Set `EXPO_PUBLIC_TRANSLATION_PROVIDER=openai` or `deepl` with the matching key.
- OCR remains Expo Go compatible with editable text fallback. Google Vision/OCR.Space hooks are structured for the production build path.
- ATM Finder uses local travel-intelligence data until Google Maps/location permissions are connected.
- Card fee logic is isolated in `src/services/cardFees.ts` for future personal bank/card profiles. Bank linking is not implemented.

## Current MVP Flow

1. Home presents the Transvert brand direction around global purchase intelligence.
2. Scan uploads an image or accepts pasted text in Expo Go.
3. User input drives translation preview, price detection, and conversion.
4. FX loads live rates when available and falls back locally when offline.
5. Results are saved locally and can be reopened from saved scans.
