import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { RewardsProvider } from '@/context/RewardsContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';
import { getPendingClaimToken, storePendingClaimToken } from '@/api/claimContinuationStorage';
import { claimTokenFromInternalPath } from '@/utils/claimUrl';

function SessionRedirector() {
  const { authStatus } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    if (authStatus === 'RESTORING') return;
    let active = true;

    const redirect = async () => {
      const root = segments[0];
      const protectedRoute = ['(tabs)', 'bill', 'claim', 'reward', 'restaurant'].includes(root ?? '');
      const isAuthenticated = authStatus === 'AUTHENTICATED';

      if (!isAuthenticated && root === 'claim') {
        const token = claimTokenFromInternalPath(pathname);
        if (!token) return;
        await storePendingClaimToken(token);
        if (active) router.replace('/auth/phone');
        return;
      }

      if (!isAuthenticated && protectedRoute) {
        const pendingToken = await getPendingClaimToken();
        if (active) router.replace(pendingToken ? '/auth/phone' : '/');
        return;
      }

      if (isAuthenticated && (root === undefined || root === 'auth')) {
        const pendingToken = await getPendingClaimToken();
        if (!active) return;
        if (pendingToken) {
          router.replace({ pathname: '/claim/[token]', params: { token: pendingToken } });
        } else {
          router.replace('/(tabs)');
        }
      }
    };

    void redirect();
    return () => {
      active = false;
    };
  }, [authStatus, pathname, router, segments]);

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
        <Stack.Screen name="reward/use" />
        <Stack.Screen name="restaurant/[id]" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/privacy" />
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
