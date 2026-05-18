import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '@/constants/styles';

type Props = {
  action: 'camera' | 'library';
  busy: boolean;
  onResult: (uri: string) => Promise<void>;
  title: string;
};

export function ActionCard({ action, busy, onResult, title }: Props) {
  const onPress = useCallback(async () => {
    const res =
      action === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ quality: 1, allowsEditing: false });
    if (!res.canceled && res.assets[0]?.uri) {
      await onResult(res.assets[0].uri);
    }
  }, [action, onResult]);

  return (
    <Pressable disabled={busy} onPress={onPress} style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardContent}>{busy ? 'Processing...' : 'Tap to continue'}</Text>
    </Pressable>
  );
}
