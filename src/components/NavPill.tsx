import { Pressable, Text } from 'react-native';
import { styles } from '@/constants/styles';

export function NavPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.cardTitle}>{label}</Text>
    </Pressable>
  );
}
