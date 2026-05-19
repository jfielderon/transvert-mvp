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
            height: 78,
            paddingTop: 7,
            paddingBottom: 10,
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
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="menu-outline" color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="translate"
          options={{
            title: 'Translate',
            tabBarIcon: ({ color }) => <Ionicons name="language-outline" color={color} size={21} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.scanTab, focused && styles.scanTabActive]}>
                <MaterialCommunityIcons name="camera-iris" color={focused ? colors.navy950 : color} size={30} />
              </View>
            ),
            tabBarLabelStyle: styles.scanLabel,
          }}
        />
        <Tabs.Screen
          name="convert"
          options={{
            title: 'Convert',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="swap-horizontal" color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="atm"
          options={{
            title: 'ATM',
            tabBarIcon: ({ color }) => <Ionicons name="navigate-outline" color={color} size={21} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="settings"
          options={{ href: null }}
        />
        <Tabs.Screen name="results" options={{ href: null }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  scanTab: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 31,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.38)',
    backgroundColor: 'rgba(103,232,249,0.08)',
    marginTop: -28,
    shadowColor: colors.cyan,
    shadowOpacity: 0.42,
    shadowRadius: 20,
  },
  scanTabActive: {
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.9,
    shadowRadius: 26,
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -3,
  },
});
