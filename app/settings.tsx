import { Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { styles } from '@/constants/styles';

export default function SettingsScreen() {
  return (
    <Screen>
      <Text style={styles.settingsTitle}>Settings</Text>
      <Text style={styles.mutedTop12}>EUR→GBP test rate: 0.8635</Text>
      <Text style={styles.mutedTop8}>Scans are stored locally on-device.</Text>
    </Screen>
  );
}
