# Transvert

Expo Go compatible React Native MVP for global travel purchase intelligence.

Transvert answers the core travel question: **Can I trust this price before I pay?**

Primary journey:

1. See it
2. Scan it
3. Know it

## Stack

- Expo / Expo Router
- React Native
- TypeScript
- AsyncStorage
- `expo-image-picker`
- Provider-ready services for FX, translation, OCR, ATM search, maps, real-cost analysis, and future card intelligence

## Run

```bash
npm install
npm run start
```

If PowerShell blocks npm scripts on Windows, use:

```bash
npm.cmd run start
```

## Build Paths

### Expo Go Preview

Use Expo Go for fast UI and pipeline previews:

```bash
npm.cmd run start
```

Expo Go supports the current upload/manual text path. Camera capture uses Expo-compatible permissions, but native OCR remains a cloud/provider flow.

### EAS Custom Dev Client

Use a custom dev client when testing native camera, permissions, location and production-like behavior:

```bash
npx eas build --profile development --platform ios
npx expo start --dev-client
```

The `development` profile in `eas.json` enables an internal custom client.

### TestFlight Build

Use the production profile for a TestFlight-ready iOS archive:

```bash
npx eas build --profile production --platform ios
```

After the build completes, upload through EAS Submit or App Store Connect.

### App Store Production Build

Before submission:

- Replace the placeholder iOS bundle identifier in `app.json`.
- Confirm camera, photo library and location permission strings.
- Add real app icons/splash assets.
- Set production API keys in EAS secrets, not in git.
- Build with `npx eas build --profile production --platform ios`.
- Submit with `npx eas submit --profile production --platform ios`.

## Environment

Copy `.env.example` to `.env` and add keys as providers are enabled.

- FX defaults to live `open.er-api.com` without a key, or ExchangeRate API with `EXPO_PUBLIC_EXCHANGERATE_API_KEY` / `EXPO_PUBLIC_FX_API_KEY`.
- Translation defaults to local phrase fallback. Set `EXPO_PUBLIC_TRANSLATION_PROVIDER=openai` or `deepl` with the matching key.
- OCR defaults to OCR.Space provider mode. Without `EXPO_PUBLIC_OCR_SPACE_API_KEY`, it falls back to editable text.
- ATM Finder uses local travel-intelligence data until Google Maps/location permissions are connected.
- Card fee logic is isolated in `src/services/cardFees.ts` for future personal bank/card profiles. Bank linking is not implemented.
- Supabase configuration is isolated in `src/services/supabase/client.ts`; no backend dependency is required for the current local MVP.

Never commit `.env` or `.env.local`. For EAS builds, store API keys with EAS environment variables or secrets.

## Architecture

Current product domains:

- `src/services/ocr` - OCR provider abstraction for Expo Go fallback, OCR.Space, Google Vision, native OCR placeholder, and future GPT vision.
- `src/services/translate` - local fallback and API translation providers for OpenAI/DeepL.
- `src/services/fx` - live FX loading, local cache, offline fallback, timestamps, and status labels.
- `src/services/scan` - scan orchestration: translation, price detection, FX conversion, and real-cost estimate.
- `src/services/realCost` - fee/DCC warning foundation.
- `src/services/atm` and `src/services/maps` - ATM intelligence and future Google Maps structure.
- `src/storage` - local saved scan persistence.
- `src/services/supabase` - future backend configuration seam.

## Current MVP Flow

1. Home presents the Transvert brand direction around global purchase intelligence.
2. Scan captures a camera image, uploads an image, or accepts pasted text.
3. Uploaded/captured images are sent through the OCR provider; extracted text populates the editable text box.
4. FX loads live rates when available and falls back locally when offline.
5. Results show original text, translated text, detected prices, converted prices, total estimate, real-cost warnings, and share/save actions.
6. Saved scans store text, translations, prices, totals, timestamps, and image previews locally, with delete and clear-all controls.
