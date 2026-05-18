import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
