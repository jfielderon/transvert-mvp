import { router } from 'expo-router';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { NavPill } from '@/components/NavPill';
import { GlowButton } from '@/components/GlowButton';
import { Screen } from '@/components/Screen';
import { styles } from '@/constants/styles';

export default function HomeScreen() {
  const handleScan = useCallback(() => {
    router.push('/scan');
  }, []);

  return (
    <Screen>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Transvert</Text>
        <Text style={styles.subtitle}>Scan, detect, convert.</Text>
      </View>
      <View style={styles.centerWrap}>
        <GlowButton label="Scan" onPress={handleScan} size="xl" />
      </View>
      <View style={styles.navStack}>
        <NavPill label="Saved scans" onPress={() => router.push('/saved')} />
        <NavPill label="Convert" onPress={() => router.push('/convert')} />
        <NavPill label="Settings" onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}
