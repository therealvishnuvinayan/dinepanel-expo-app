import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { RewardsProvider } from '@/context/RewardsContext';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <RewardsProvider>
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
          <Stack.Screen name="reward/success" options={{ animation: 'fade' }} />
          <Stack.Screen name="restaurant/[id]" />
          <Stack.Screen name="offers" />
        </Stack>
      </RewardsProvider>
    </SafeAreaProvider>
  );
}
