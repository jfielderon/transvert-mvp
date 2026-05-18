import { useMemo, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { styles } from '@/constants/styles';
import { EUR_TO_GBP } from '@/services/priceService';

export default function ConvertScreen() {
  const [eur, setEur] = useState('0');
  const gbp = useMemo(() => (Number(eur || '0') * EUR_TO_GBP).toFixed(2), [eur]);

  return (
    <Screen>
      <Text style={styles.settingsTitle}>Quick Convert</Text>
      <TextInput style={styles.input} value={eur} onChangeText={setEur} keyboardType="decimal-pad" />
      <Text style={styles.convertResult}>£{gbp}</Text>
    </Screen>
  );
}
