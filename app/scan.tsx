import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ActionCard } from '@/components/ActionCard';
import { Screen } from '@/components/Screen';
import { styles } from '@/constants/styles';
import { makeId } from '@/services/id';
import { runOCR } from '@/services/ocrService';
import { extractPrices } from '@/services/priceService';
import { persistScan } from '@/services/storageService';
import { ScanResult } from '@/types/scan';

export default function ScanScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processUri = useCallback(async (uri: string) => {
    setBusy(true);
    setError(null);
    try {
      const ocrText = await runOCR(uri);
      const parsed = extractPrices(ocrText);
      const scan: ScanResult = {
        id: makeId(),
        createdAt: new Date().toISOString(),
        imageUri: uri,
        originalText: ocrText,
        prices: parsed.detected,
        converted: parsed.converted,
        estimatedTotalGBP: parsed.estimatedTotalGBP,
      };
      await persistScan(scan);
      router.push({ pathname: '/results', params: { id: scan.id } });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to process image.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Screen>
      <Text style={styles.screenTitle}>Scan</Text>
      <View style={styles.stackGap}>
        <ActionCard action="camera" busy={busy} onResult={processUri} title="Take photo" />
        <ActionCard action="library" busy={busy} onResult={processUri} title="Upload image" />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Screen>
  );
}
