import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { OfferCard } from '@/components/offers/OfferCard';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Pill } from '@/components/ui/Pill';
import { DataState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { offers } from '@/data/mockOffers';
import { useRewards } from '@/context/RewardsContext';

const filters = ['Nearby', 'Offers', 'Popular'] as const;
type Filter = (typeof filters)[number];

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Nearby');
  const { restaurants, isLoading, error, refresh } = useRewards();

  const filteredRestaurants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesQuery =
        !normalized ||
        restaurant.name.toLowerCase().includes(normalized) ||
        restaurant.cuisine.toLowerCase().includes(normalized);
      const matchesFilter =
        filter === 'Offers' ? Boolean(restaurant.offer) : filter === 'Popular' ? restaurant.popular : true;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, restaurants]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>Dine around Dubai</Text>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Places worth returning to — with rewards when you do.</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Search color={colors.textTertiary} size={19} strokeWidth={2} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Search restaurants or cuisine"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.primary}
            style={styles.input}
            value={query}
          />
        </View>
        <View style={styles.filterIcon}>
          <SlidersHorizontal color={colors.text} size={19} strokeWidth={2} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.filterContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {filters.map((item) => (
          <Pill key={item} label={item} onPress={() => setFilter(item)} selected={filter === item} />
        ))}
      </ScrollView>

      {!query ? (
        <View style={styles.offerSection}>
          <SectionHeader title="Offers near you" />
          <ScrollView
            contentContainerStyle={styles.offerContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.offerScroll}
          >
            {offers.map((offer) => (
              <OfferCard compact key={offer.id} offer={offer} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.restaurantSection}>
        <SectionHeader title={query ? 'Search results' : 'Restaurants for you'} />
        {isLoading && restaurants.length === 0 ? (
          <DataState loading title="Finding restaurants" />
        ) : null}
        {error && restaurants.length === 0 ? (
          <DataState message={error} onRetry={refresh} title="Restaurants are unavailable" />
        ) : null}
        <View style={styles.list}>
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
          {!isLoading && !error && filteredRestaurants.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyText}>Try a restaurant name or a different filter.</Text>
            </View>
          ) : null}
        </View>
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
  subtitle: { color: colors.textSecondary, fontSize: typography.small, marginTop: spacing.xs },
  searchRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  searchField: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  input: { flex: 1, color: colors.text, fontSize: typography.small, height: '100%' },
  filterIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: { marginHorizontal: -spacing.lg, marginTop: spacing.md },
  filterContent: { gap: spacing.xs, paddingHorizontal: spacing.lg },
  offerSection: { marginTop: spacing.xxxl, gap: spacing.md },
  offerScroll: { marginHorizontal: -spacing.lg },
  offerContent: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  restaurantSection: { marginTop: spacing.xxxl, gap: spacing.md },
  list: { gap: spacing.sm },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  emptyTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, fontSize: typography.small, marginTop: spacing.xs },
});
