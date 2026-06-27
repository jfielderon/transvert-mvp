import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function PolicyFooter() {
  return (
    <View style={styles.footer}>
      <Pressable onPress={() => router.push('/privacy')}><Text style={styles.link}>Privacy</Text></Pressable>
      <Text style={styles.dot}>•</Text>
      <Pressable onPress={() => router.push('/terms')}><Text style={styles.link}>Terms</Text></Pressable>
      <Text style={styles.dot}>•</Text>
      <Pressable onPress={() => router.push('/cookies')}><Text style={styles.link}>Cookies</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 96 },
  link: { color: colors.cyan, fontSize: 12, fontWeight: '800' },
  dot: { color: colors.dim, fontSize: 12 },
});
