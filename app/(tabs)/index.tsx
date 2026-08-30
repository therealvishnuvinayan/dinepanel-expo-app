import { useRouter } from 'expo-router';
import { Bell, ChevronDown, MapPin } from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OfferCard } from '@/components/offers/OfferCard';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RewardBalance } from '@/components/rewards/RewardBalance';
import { TransactionRow } from '@/components/rewards/TransactionRow';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Wordmark } from '@/components/ui/Wordmark';
import { colors, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import { offers } from '@/data/mockOffers';
import { restaurants } from '@/data/mockRestaurants';

export default function HomeScreen() {
  const router = useRouter();
  const { balance, monthlyEarned, transactions } = useRewards();
  const recent = transactions.filter((transaction) => transaction.type === 'earned').slice(0, 3);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topBar}>
        <View>
          <Wordmark compact />
          <View style={styles.locationRow}>
            <MapPin color={colors.textSecondary} size={13} strokeWidth={2} />
            <Text style={styles.location}>Dubai, UAE</Text>
            <ChevronDown color={colors.textSecondary} size={13} strokeWidth={2} />
          </View>
        </View>
        <IconButton
          icon={Bell}
          label="Notifications"
          onPress={() => Alert.alert('You’re all caught up', 'New dining rewards will appear here.')}
        />
      </View>

      <View style={styles.greeting}>
        <Text style={styles.hello}>Hi, Vishnu</Text>
        <Text style={styles.greetingSub}>Good food should give something back.</Text>
      </View>

      <RewardBalance
        balance={balance}
        monthlyEarned={monthlyEarned}
        onScan={() => router.push('/(tabs)/scan')}
      />

      <View style={styles.section}>
        <SectionHeader
          actionLabel="Explore"
          onAction={() => router.push('/(tabs)/discover')}
          title="Your favourites"
        />
        <ScrollView
          contentContainerStyle={styles.horizontalContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
        >
          {restaurants.slice(0, 3).map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} variant="compact" />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader actionLabel="All offers" onAction={() => router.push('/offers')} title="Made for you" />
        <ScrollView
          contentContainerStyle={styles.horizontalContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
        >
          {offers.slice(0, 2).map((offer) => (
            <OfferCard compact key={offer.id} offer={offer} />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <SectionHeader
          actionLabel="View all"
          onAction={() => router.push('/(tabs)/rewards')}
          title="Recent rewards"
        />
        <View style={styles.transactions}>
          {recent.map((transaction, index) => (
            <View key={transaction.id}>
              <TransactionRow transaction={transaction} />
              {index < recent.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  topBar: {
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    marginLeft: 2,
  },
  location: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600' },
  greeting: { marginTop: spacing.xxxl, marginBottom: spacing.lg },
  hello: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  greetingSub: { color: colors.textSecondary, fontSize: typography.small, marginTop: spacing.xs },
  section: { marginTop: spacing.xxxl, gap: spacing.md },
  lastSection: { marginBottom: spacing.lg },
  bleed: { marginHorizontal: -spacing.lg },
  horizontalContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: 2,
  },
  transactions: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
});
