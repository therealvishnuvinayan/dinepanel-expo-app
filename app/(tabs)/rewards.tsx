import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RewardBalance } from '@/components/rewards/RewardBalance';
import { TransactionRow } from '@/components/rewards/TransactionRow';
import { DataState } from '@/components/ui/DataState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';

const tabs = ['Activity', 'Earned', 'Used'] as const;
type RewardsTab = (typeof tabs)[number];

export default function RewardsScreen() {
  const router = useRouter();
  const {
    balance,
    transactions,
    isLoading,
    isRefreshing,
    error,
    refresh,
    refreshIfStale,
  } = useRewards();
  const [activeTab, setActiveTab] = useState<RewardsTab>('Activity');

  useFocusEffect(
    useCallback(() => {
      void refreshIfStale();
    }, [refreshIfStale]),
  );

  const visibleTransactions = useMemo(() => {
    if (activeTab === 'Earned') return transactions.filter((item) => item.kind === 'earn');
    if (activeTab === 'Used') return transactions.filter((item) => item.kind === 'redeem');
    return transactions;
  }, [activeTab, transactions]);

  const showInitialError = Boolean(error && balance === null);

  return (
    <Screen
      contentStyle={styles.content}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
    >
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>Your rewards</Text>
        <Text style={styles.title}>Rewards</Text>
      </View>

      <View style={styles.balanceWrap}>
        {showInitialError ? (
          <DataState message={error ?? undefined} onRetry={refresh} title="Rewards are unavailable" />
        ) : (
          <RewardBalance
            balance={balance}
            compact
            loading={isLoading && balance === null}
            onUse={balance !== null && balance > 0 ? () => router.push('/reward/use' as Href) : undefined}
          />
        )}
      </View>

      {balance === 0 ? (
        <View accessibilityLiveRegion="polite" style={styles.zeroBalance}>
          <Text style={styles.zeroTitle}>Earn rewards before using them</Text>
          <Text style={styles.zeroCopy}>Scan an eligible restaurant bill and your available rewards will appear here.</Text>
        </View>
      ) : null}

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pill key={tab} label={tab} onPress={() => setActiveTab(tab)} selected={activeTab === tab} />
        ))}
      </View>

      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>{activeTab}</Text>
        <Text style={styles.activityCount}>{visibleTransactions.length} transactions</Text>
      </View>

      {visibleTransactions.length > 0 ? (
        <View style={styles.transactions}>
          {visibleTransactions.map((transaction, index) => (
            <View key={transaction.id}>
              <TransactionRow transaction={transaction} />
              {index < visibleTransactions.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      ) : !isLoading && !error ? (
        <View style={styles.emptyWrap}>
          <DataState
            message={activeTab === 'Activity'
              ? 'Scan an eligible restaurant bill to earn your first reward.'
              : `No ${activeTab.toLowerCase()} reward activity yet.`}
            title="Nothing here yet"
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  heading: { paddingTop: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '700', marginBottom: spacing.xs },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.75 },
  balanceWrap: { marginTop: spacing.xl },
  tabs: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
    marginBottom: spacing.sm,
  },
  activityTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.4 },
  activityCount: { color: colors.textTertiaryAccessible, fontSize: typography.caption, fontWeight: '600' },
  transactions: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  emptyWrap: { minHeight: 220, justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
  zeroBalance: { marginTop: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md },
  zeroTitle: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  zeroCopy: { color: colors.textSecondaryAccessible, fontSize: typography.caption, lineHeight: 18, marginTop: 4 },
});
