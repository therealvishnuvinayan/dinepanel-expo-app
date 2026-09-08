import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRewards } from '@/context/RewardsContext';
import { formatAED } from '@/utils/format';

export default function RewardSuccessScreen() {
  const router = useRouter();
  const { authStatus } = useAuth();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const { lastClaim, loadClaimResult } = useRewards();
  const [recovery, setRecovery] = useState<{
    transactionId: string;
    claim: typeof lastClaim;
    error: string;
  } | null>(null);
  const [scale] = useState(() => new Animated.Value(0.6));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  useEffect(() => {
    if (!transactionId || lastClaim?.transaction.id === transactionId || authStatus !== 'AUTHENTICATED') return;
    let active = true;
    loadClaimResult(transactionId)
      .then((result) => {
        if (active) setRecovery({ transactionId, claim: result, error: '' });
      })
      .catch((error) => {
        if (active) {
          setRecovery({
            transactionId,
            claim: null,
            error: error instanceof Error ? error.message : 'Unable to restore this reward receipt.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [authStatus, lastClaim?.transaction.id, loadClaimResult, transactionId]);

  const recoveredClaim = recovery && recovery.transactionId === transactionId ? recovery.claim : null;
  const claim = lastClaim?.transaction.id === transactionId
    ? lastClaim
    : recoveredClaim;
  const recovering = Boolean(transactionId)
    && !claim
    && (authStatus !== 'AUTHENTICATED' || recovery?.transactionId !== transactionId);
  const recoveryError = recovery && recovery.transactionId === transactionId ? recovery.error : '';

  if (!claim) {
    return (
      <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']} scroll={false}>
        <View style={styles.successContent}>
          <DataState
            loading={recovering}
            message={recovering
              ? 'Retrieving the completed reward from DinePanel.'
              : recoveryError || 'Your authoritative reward activity remains available in Rewards.'}
            title={recovering ? 'Restoring reward receipt' : 'Reward receipt unavailable'}
          />
        </View>
        <View style={styles.actions}>
          <Button label="View rewards" onPress={() => router.replace('/(tabs)/rewards')} />
          <Button label="Return home" onPress={() => router.replace('/(tabs)')} variant="ghost" />
        </View>
      </Screen>
    );
  }

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
          <Text style={styles.amount}>{formatAED(claim.rewardAmount)}</Text>
          <Text style={styles.restaurant}>{claim.restaurant.name}</Text>
        </Animated.View>

        <Animated.View style={[styles.balanceCard, { opacity }]}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceAmount}>{formatAED(claim.updatedBalance)}</Text>
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
