import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import { formatAED } from '@/utils/format';

export default function RewardSuccessScreen() {
  const router = useRouter();
  const { balance } = useRewards();
  const [scale] = useState(() => new Animated.Value(0.6));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']} scroll={false}>
      <View style={styles.successContent}>
        <Animated.View style={[styles.checkOuter, { opacity, transform: [{ scale }] }]}>
          <View style={styles.checkInner}>
            <Check color={colors.white} size={34} strokeWidth={2.5} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.copy, { opacity }]}>
          <Text style={styles.eyebrow}>Reward added</Text>
          <Text style={styles.amount}>{formatAED(10)}</Text>
          <Text style={styles.restaurant}>Green Chilli</Text>
        </Animated.View>

        <Animated.View style={[styles.balanceCard, { opacity }]}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceAmount}>{formatAED(balance)}</Text>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Button label="Done" onPress={() => router.replace('/(tabs)')} />
        <Button label="View rewards" onPress={() => router.replace('/(tabs)/rewards')} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  checkOuter: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  checkInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', marginTop: spacing.xxxl },
  eyebrow: { color: colors.primary, fontSize: typography.body, fontWeight: '700' },
  amount: { color: colors.text, fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -1.3, marginTop: spacing.xs },
  restaurant: { color: colors.textSecondary, fontSize: typography.body, marginTop: spacing.xs },
  balanceCard: {
    marginTop: spacing.xxxl,
    minWidth: 230,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  balanceLabel: { color: colors.textSecondary, fontSize: typography.caption, marginBottom: 5 },
  balanceAmount: { color: colors.text, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.4 },
  actions: { gap: spacing.xs },
});
