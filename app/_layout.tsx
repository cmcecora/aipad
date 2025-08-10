import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="calibration" options={{ headerShown: false }} />
        <Stack.Screen name="recording" options={{ headerShown: false }} />
        <Stack.Screen name="record" options={{ headerShown: false }} />
        <Stack.Screen name="sync-recording" options={{ headerShown: false }} />
        <Stack.Screen name="report/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="upload" options={{ headerShown: false }} />
        <Stack.Screen name="video-player" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}