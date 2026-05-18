import { useMemo } from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '@/constants/styles';

type Props = { label: string; onPress: () => void; size?: 'md' | 'xl' };

export function GlowButton({ label, onPress, size = 'md' }: Props) {
  const dims = useMemo(() => (size === 'xl' ? { width: 220, height: 220 } : { width: 120, height: 120 }), [size]);
  return (
    <Pressable onPress={onPress} style={[styles.glowButton, dims]}>
      <Text style={styles.glowButtonText}>{label}</Text>
    </Pressable>
  );
}
