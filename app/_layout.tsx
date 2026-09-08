import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { RewardsProvider } from '@/context/RewardsContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';

function SessionRedirector() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const root = segments[0];
    const protectedRoute = ['(tabs)', 'bill', 'claim', 'reward', 'restaurant', 'offers'].includes(root ?? '');
    if (!isAuthenticated && protectedRoute) router.replace('/');
    if (isAuthenticated && (root === undefined || root === 'auth')) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading, router, segments]);

  return null;
}

function RootStack() {
  return (
    <>
      <Head><title>DinePanel Customer</title></Head>
      <SessionRedirector />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          animationDuration: 260,
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/phone" />
        <Stack.Screen name="auth/otp" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="bill/confirm" options={{ presentation: 'card' }} />
        <Stack.Screen name="claim/[token]" options={{ animation: 'fade' }} />
        <Stack.Screen name="reward/success" options={{ animation: 'fade' }} />
        <Stack.Screen name="restaurant/[id]" />
        <Stack.Screen name="offers" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <RewardsProvider>
          <RootStack />
        </RewardsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
