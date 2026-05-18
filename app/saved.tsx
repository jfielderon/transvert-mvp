import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { styles } from '@/constants/styles';
import { loadScans } from '@/services/storageService';
import { ScanResult } from '@/types/scan';

export default function SavedScreen() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  useEffect(() => {
    void loadScans().then(setScans);
  }, []);

  return (
    <Screen>
      <Text style={styles.screenTitle}>Saved Scans</Text>
      <ScrollView contentContainerStyle={styles.stackGap}>
        {scans.map((scan) => (
          <View key={scan.id} style={styles.card}>
            <Text style={styles.cardTitle}>{new Date(scan.createdAt).toLocaleString()}</Text>
            <Text style={styles.cardContent}>Items: {scan.prices.length} · Total: £{scan.estimatedTotalGBP.toFixed(2)}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
