import { Text, View } from 'react-native';
import { styles } from '@/constants/styles';

export function GlassCard({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardContent}>{content}</Text>
    </View>
  );
}
