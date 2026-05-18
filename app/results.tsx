import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { styles } from '@/constants/styles';
import { getScanById } from '@/services/storageService';
import { ScanResult } from '@/types/scan';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scan, setScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (!id) return;
    void getScanById(id).then(setScan);
  }, [id]);

  if (!scan) return <Screen><Text style={styles.loadingText}>Loading...</Text></Screen>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.stackGap}>
        <GlassCard title="Original text" content={scan.originalText || 'No text detected'} />
        <GlassCard title="Detected prices" content={scan.prices.map((x) => `${x.currency} ${x.raw}`).join('\n') || 'None'} />
        <GlassCard title="Converted prices" content={scan.converted.map((x) => `€${x.eur.toFixed(2)} -> £${x.gbp.toFixed(2)}`).join('\n') || 'None'} />
        <GlassCard title="Estimated total (GBP)" content={`£${scan.estimatedTotalGBP.toFixed(2)}`} />
      </ScrollView>
    </Screen>
  );
}
