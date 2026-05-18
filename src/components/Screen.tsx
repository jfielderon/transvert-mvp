import { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/constants/styles';

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}
