import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RewardBalance } from '@/components/rewards/RewardBalance';
import { TransactionRow } from '@/components/rewards/TransactionRow';
import { DataState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Wordmark } from '@/components/ui/Wordmark';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRewards } from '@/context/RewardsContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    balance,
    monthlyEarned,
    transactions,
    restaurants,
    isLoading,
    isRefreshing,
    error,
    refresh,
    refreshIfStale,
  } = useRewards();
  const recent = transactions.slice(0, 3);
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'there';

  useFocusEffect(
    useCallback(() => {
      void refreshIfStale();
    }, [refreshIfStale]),
  );

  const hasInitialError = Boolean(error && balance === null);

  return (
    <Screen
      contentStyle={styles.content}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
    >
      <View style={styles.topBar}>
        <Wordmark compact />
      </View>

      <View style={styles.greeting}>
        <Text style={styles.hello}>Hi, {firstName}</Text>
        <Text style={styles.greetingSub}>Good food should give something back.</Text>
      </View>

      {hasInitialError ? (
        <DataState message={error ?? undefined} onRetry={refresh} title="Your rewards are unavailable" />
      ) : (
        <RewardBalance
          balance={balance}
          loading={isLoading && balance === null}
          monthlyEarned={monthlyEarned}
          onScan={() => router.push('/(tabs)/scan')}
        />
      )}

      <View style={styles.section}>
        <SectionHeader
          actionLabel="Explore"
          onAction={() => router.push('/(tabs)/discover')}
          title="Participating restaurants"
        />
        {isLoading && restaurants.length === 0 ? (
          <DataState loading title="Finding restaurants" />
        ) : null}
        {error && restaurants.length === 0 && balance !== null ? (
          <DataState message={error} onRetry={refresh} title="Restaurants are unavailable" />
        ) : null}
        {!isLoading && !error && restaurants.length === 0 ? (
          <DataState
            message="Participating restaurants will appear here when they are available."
            title="No restaurants available"
          />
        ) : null}
        {restaurants.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.horizontalContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
          >
            {restaurants.slice(0, 6).map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} variant="compact" />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <SectionHeader
          actionLabel="View all"
          onAction={() => router.push('/(tabs)/rewards')}
          title="Recent activity"
        />
        {recent.length > 0 ? (
          <View style={styles.transactions}>
            {recent.map((transaction, index) => (
              <View key={transaction.id}>
                <TransactionRow transaction={transaction} />
                {index < recent.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </View>
        ) : !isLoading && !error ? (
          <DataState
            message="Scan an eligible restaurant bill to earn your first reward."
            title="No reward activity yet"
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  topBar: { paddingTop: spacing.sm, alignItems: 'flex-start' },
  greeting: { marginTop: spacing.xxxl, marginBottom: spacing.lg },
  hello: { color: colors.text, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.7 },
  greetingSub: { color: colors.textSecondary, fontSize: typography.small, marginTop: spacing.xs },
  section: { marginTop: spacing.xxxl, gap: spacing.md },
  lastSection: { marginBottom: spacing.lg },
  bleed: { marginHorizontal: -spacing.lg },
  horizontalContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: 2 },
  transactions: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
});
