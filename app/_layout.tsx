import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 12,
            height: 72,
            paddingTop: 8,
            paddingBottom: 9,
            borderRadius: 28,
            backgroundColor: 'rgba(2, 7, 19, 0.94)',
            borderTopColor: 'rgba(103,232,249,0.08)',
            borderTopWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.blue,
            shadowOpacity: 0.26,
            shadowRadius: 28,
          },
          tabBarActiveTintColor: colors.cyan,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="menu-outline" color={color} size={22} /> }} />
        <Tabs.Screen name="translate" options={{ title: 'Translate', tabBarIcon: ({ color }) => <Ionicons name="language-outline" color={color} size={21} /> }} />
        <Tabs.Screen name="scan" options={{ title: '', tabBarIcon: ({ focused, color }) => <View style={[styles.scanTab, focused && styles.scanTabActive]}><MaterialCommunityIcons name="camera-iris" color={focused ? colors.navy950 : color} size={29} /></View>, tabBarLabel: () => null }} />
        <Tabs.Screen name="convert" options={{ title: 'Convert', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="swap-horizontal" color={color} size={24} /> }} />
        <Tabs.Screen name="atm" options={{ title: 'ATM', tabBarIcon: ({ color }) => <Ionicons name="navigate-outline" color={color} size={21} /> }} />
        <Tabs.Screen name="sign-in" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="terms" options={{ href: null }} />
        <Tabs.Screen name="cookies" options={{ href: null }} />
        <Tabs.Screen name="saved" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="results" options={{ href: null }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  scanTab: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.34)',
    backgroundColor: 'rgba(103,232,249,0.07)',
    marginTop: 10,
    shadowColor: colors.cyan,
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  scanTabActive: {
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.56,
    shadowRadius: 14,
  },
});
