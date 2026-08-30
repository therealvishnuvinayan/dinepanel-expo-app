import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RewardBalance } from '@/components/rewards/RewardBalance';
import { TransactionRow } from '@/components/rewards/TransactionRow';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';

const tabs = ['Activity', 'Earned', 'Redeemed'] as const;
type RewardsTab = (typeof tabs)[number];

export default function RewardsScreen() {
  const { balance, transactions } = useRewards();
  const [activeTab, setActiveTab] = useState<RewardsTab>('Activity');

  const visibleTransactions = useMemo(() => {
    if (activeTab === 'Earned') return transactions.filter((item) => item.type === 'earned');
    if (activeTab === 'Redeemed') return transactions.filter((item) => item.type === 'redeemed');
    return transactions;
  }, [activeTab, transactions]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>Your rewards</Text>
        <Text style={styles.title}>Rewards</Text>
      </View>

      <View style={styles.balanceWrap}>
        <RewardBalance balance={balance} compact />
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pill key={tab} label={tab} onPress={() => setActiveTab(tab)} selected={activeTab === tab} />
        ))}
      </View>

      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>{activeTab}</Text>
        <Text style={styles.activityCount}>{visibleTransactions.length} transactions</Text>
      </View>

      <View style={styles.transactions}>
        {visibleTransactions.map((transaction, index) => (
          <View key={transaction.id}>
            <TransactionRow transaction={transaction} />
            {index < visibleTransactions.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  heading: { paddingTop: spacing.lg },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: -0.75,
  },
  balanceWrap: { marginTop: spacing.xl },
  tabs: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
    marginBottom: spacing.sm,
  },
  activityTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  activityCount: { color: colors.textTertiary, fontSize: typography.caption, fontWeight: '600' },
  transactions: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
});

