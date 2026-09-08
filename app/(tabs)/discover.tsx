import { useFocusEffect } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { DataState } from '@/components/ui/DataState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const { restaurants, isLoading, isRefreshing, error, refresh, refreshIfStale } = useRewards();

  useFocusEffect(
    useCallback(() => {
      void refreshIfStale();
    }, [refreshIfStale]),
  );

  const cuisines = useMemo(
    () => ['All', ...Array.from(new Set(restaurants.map((item) => item.cuisine).filter(Boolean))).sort()],
    [restaurants],
  );

  const filteredRestaurants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesQuery =
        !normalized ||
        restaurant.name.toLowerCase().includes(normalized) ||
        restaurant.cuisine.toLowerCase().includes(normalized) ||
        restaurant.area.toLowerCase().includes(normalized) ||
        restaurant.city.toLowerCase().includes(normalized);
      return matchesQuery && (cuisine === 'All' || restaurant.cuisine === cuisine);
    });
  }, [cuisine, query, restaurants]);

  return (
    <Screen
      contentStyle={styles.content}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
    >
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>DinePanel restaurants</Text>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find participating restaurants and see their current reward rate.</Text>
      </View>

      <View style={styles.searchField}>
        <Search color={colors.textTertiary} size={19} strokeWidth={2} />
        <TextInput
          onChangeText={setQuery}
          placeholder="Search restaurants, cuisine or area"
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          style={styles.input}
          value={query}
        />
      </View>

      {cuisines.length > 1 ? (
        <ScrollView
          contentContainerStyle={styles.filterContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {cuisines.map((item) => (
            <Pill key={item} label={item} onPress={() => setCuisine(item)} selected={cuisine === item} />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.restaurantSection}>
        <SectionHeader title={query || cuisine !== 'All' ? 'Search results' : 'Participating restaurants'} />
        {isLoading && restaurants.length === 0 ? <DataState loading title="Finding restaurants" /> : null}
        {error && restaurants.length === 0 ? (
          <DataState message={error} onRetry={refresh} title="Restaurants are unavailable" />
        ) : null}
        <View style={styles.list}>
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
          {!isLoading && !error && filteredRestaurants.length === 0 ? (
            <DataState
              message={restaurants.length === 0
                ? 'Participating restaurants will appear here when they are available.'
                : 'Try another restaurant name, cuisine or area.'}
              title={restaurants.length === 0 ? 'No restaurants available' : 'No matches found'}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  heading: { paddingTop: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '700', marginBottom: spacing.xs },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.75 },
  subtitle: { color: colors.textSecondary, fontSize: typography.small, lineHeight: 21, marginTop: spacing.xs, maxWidth: 430 },
  searchField: {
    height: 52,
    marginTop: spacing.xl,
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
  filterScroll: { flexGrow: 0, marginHorizontal: -spacing.lg, marginTop: spacing.md },
  filterContent: { gap: spacing.xs, paddingHorizontal: spacing.lg },
  restaurantSection: { marginTop: spacing.xxxl, gap: spacing.md },
  list: { gap: spacing.sm },
});
