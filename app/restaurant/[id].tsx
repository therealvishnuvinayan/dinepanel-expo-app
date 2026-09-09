import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Gift, MapPin, Navigation } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import type { Restaurant } from '@/types';
import { formatAED } from '@/utils/format';

type RestaurantLoadState = {
  routeId: string | undefined;
  restaurant: Restaurant | undefined;
  loading: boolean;
  error: string;
};

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { balance, getRestaurant, loadRestaurant, transactions } = useRewards();
  const cachedRestaurant = getRestaurant(id);
  const [loadState, setLoadState] = useState<RestaurantLoadState>(() => ({
    routeId: id,
    restaurant: cachedRestaurant,
    loading: !cachedRestaurant,
    error: '',
  }));
  const currentLoadState = loadState.routeId === id
    ? loadState
    : { routeId: id, restaurant: cachedRestaurant, loading: !cachedRestaurant, error: '' };
  const { restaurant, loading, error } = currentLoadState;

  const fetchRestaurant = useCallback(async (restaurantId: string, isActive: () => boolean) => {
    try {
      const loaded = await loadRestaurant(restaurantId);
      if (isActive()) setLoadState({ routeId: restaurantId, restaurant: loaded, loading: false, error: '' });
    } catch (loadError) {
      if (isActive()) {
        setLoadState({
          routeId: restaurantId,
          restaurant: getRestaurant(restaurantId),
          loading: false,
          error: loadError instanceof Error ? loadError.message : 'Unable to load this restaurant.',
        });
      }
    }
  }, [getRestaurant, loadRestaurant]);

  useEffect(() => {
    if (typeof id !== 'string') return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) void fetchRestaurant(id, () => active);
    });
    return () => {
      active = false;
    };
  }, [fetchRestaurant, id]);

  const retry = () => {
    if (typeof id !== 'string') return;
    setLoadState({ routeId: id, restaurant: cachedRestaurant, loading: true, error: '' });
    void fetchRestaurant(id, () => true);
  };

  if (!restaurant) {
    return (
      <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack title="Restaurant" />
        <View style={styles.stateWrap}>
          <DataState
            loading={loading}
            message={error || undefined}
            onRetry={error && typeof id === 'string' ? retry : undefined}
            title={loading ? 'Loading restaurant' : 'Restaurant unavailable'}
          />
        </View>
      </Screen>
    );
  }

  const latestVisit = transactions.find((transaction) => transaction.restaurantId === restaurant.id);
  const hasCoordinates = restaurant.latitude !== null && restaurant.longitude !== null;
  const locationLabel = [restaurant.area, restaurant.city].filter(Boolean).join(', ');

  const openDirections = async () => {
    if (!hasCoordinates) return;
    const latitude = restaurant.latitude!;
    const longitude = restaurant.longitude!;
    const label = encodeURIComponent(restaurant.name);
    const url = Platform.select({
      ios: `maps://?q=${label}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    if (url) await Linking.openURL(url);
  };

  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader showBack title="Restaurant" />
      <View style={styles.heroWrap}>
        <Image resizeMode="cover" source={restaurant.image} style={styles.hero} />
      </View>

      <View style={styles.main}>
        <View style={styles.titleRow}>
          <View style={styles.titleBody}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
          </View>
          <Pill label={`${restaurant.rewardPercent}% rewards`} tone="green" />
        </View>

        <View style={styles.rewardCard}>
          <View style={styles.rewardIcon}>
            <Gift color={colors.primary} size={22} strokeWidth={2} />
          </View>
          <View style={styles.rewardBody}>
            <Text style={styles.rewardTitle}>Earn {restaurant.rewardPercent}% in rewards</Text>
            <Text style={styles.rewardCopy}>Scan an eligible bill from this restaurant to preview and claim your reward.</Text>
          </View>
        </View>

        {restaurant.description ? <Text style={styles.description}>{restaurant.description}</Text> : null}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><MapPin color={colors.textSecondary} size={18} strokeWidth={2} /></View>
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>{restaurant.address}</Text>
              {locationLabel ? <Text style={styles.infoSub}>{locationLabel}</Text> : null}
            </View>
            {hasCoordinates ? (
              <Pressable
                accessibilityLabel="Open directions"
                accessibilityRole="button"
                onPress={() => void openDirections()}
                style={({ pressed }) => [styles.directions, pressed && styles.pressed]}
              >
                <Navigation color={colors.primary} size={19} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {latestVisit ? (
          <View style={styles.visitCard}>
            <Text style={styles.visitLabel}>Your latest activity here</Text>
            <Text style={styles.visitDate}>{latestVisit.date}</Text>
            <Text style={styles.visitReward}>
              {latestVisit.label} · {latestVisit.amount > 0 ? '+' : latestVisit.amount < 0 ? '−' : ''}{formatAED(Math.abs(latestVisit.amount))}
            </Text>
          </View>
        ) : null}

        {balance !== null && balance > 0 ? (
          <Button
            label="Use rewards here"
            onPress={() => router.push({ pathname: '/reward/use', params: { restaurantId: restaurant.id } } as unknown as Href)}
            style={styles.useButton}
          />
        ) : null}
        <Button label="Scan a bill here" onPress={() => router.push('/(tabs)/scan')} style={styles.scanButton} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  stateWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  heroWrap: { marginHorizontal: spacing.lg, marginTop: spacing.xs },
  hero: { width: '100%', height: 272, borderRadius: radius.xl, backgroundColor: colors.surface },
  main: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleBody: { flex: 1 },
  name: { color: colors.text, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.75 },
  cuisine: { color: colors.textSecondary, fontSize: typography.small, marginTop: 5 },
  rewardCard: { marginTop: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryMuted, padding: spacing.lg, flexDirection: 'row', gap: spacing.sm },
  rewardIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  rewardBody: { flex: 1 },
  rewardTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  rewardCopy: { color: colors.textSecondaryAccessible, fontSize: typography.caption, lineHeight: 18, marginTop: 5 },
  description: { color: colors.textSecondary, fontSize: typography.small, lineHeight: 22, marginTop: spacing.xl },
  infoSection: { marginTop: spacing.xxxl },
  sectionTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.4, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', minHeight: 66, gap: spacing.sm },
  infoIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  infoBody: { flex: 1 },
  infoTitle: { color: colors.text, fontSize: typography.small, fontWeight: '600', lineHeight: 20 },
  infoSub: { color: colors.textTertiaryAccessible, fontSize: typography.caption, marginTop: 3 },
  directions: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  visitCard: { marginTop: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  visitLabel: { color: colors.textSecondary, fontSize: typography.caption },
  visitDate: { color: colors.text, fontSize: typography.body, fontWeight: '700', marginTop: 5 },
  visitReward: { color: colors.primary, fontSize: typography.small, fontWeight: '600', marginTop: spacing.sm },
  scanButton: { marginTop: spacing.xl },
  useButton: { marginTop: spacing.xl },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
