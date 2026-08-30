import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock3, Heart, MapPin, Navigation, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import type { Restaurant } from '@/types';
import { formatAED } from '@/utils/format';

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRestaurant, loadRestaurant, transactions } = useRewards();
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>(() => getRestaurant(id));
  const [loading, setLoading] = useState(!restaurant);
  const [error, setError] = useState('');
  const [favourite, setFavourite] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') return;
    let active = true;
    setLoading(true);
    setError('');
    loadRestaurant(id)
      .then((loaded) => {
        if (active) setRestaurant(loaded);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load this restaurant.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, loadRestaurant]);

  if (!restaurant) {
    return (
      <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack title="Restaurant" />
        <View style={styles.stateWrap}>
          <DataState
            loading={loading}
            message={error || undefined}
            onRetry={error && typeof id === 'string' ? () => void loadRestaurant(id).then(setRestaurant) : undefined}
            title={loading ? 'Loading restaurant' : 'Restaurant unavailable'}
          />
        </View>
      </Screen>
    );
  }

  const latestVisit = transactions.find(
    (transaction) => transaction.restaurantId === restaurant.id,
  );

  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader showBack title="Restaurant" />
      <View style={styles.heroWrap}>
        <Image source={restaurant.image} style={styles.hero} />
        <Pressable
          accessibilityLabel={favourite ? 'Remove from favourites' : 'Add to favourites'}
          onPress={() => setFavourite((current) => !current)}
          style={({ pressed }) => [styles.favourite, pressed && styles.pressed]}
        >
          <Heart
            color={favourite ? colors.white : colors.text}
            fill={favourite ? colors.white : 'transparent'}
            size={20}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={styles.titleRow}>
          <View style={styles.titleBody}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <Text style={styles.cuisine}>{restaurant.cuisine} · {restaurant.neighborhood}</Text>
          </View>
          <Pill label={`${restaurant.rewardPercent}% rewards`} tone="green" />
        </View>

        <View style={styles.quickFacts}>
          <View style={styles.fact}>
            <Star color={colors.primary} fill={colors.primary} size={16} strokeWidth={1.8} />
            <Text style={styles.factValue}>{restaurant.rating}</Text>
            <Text style={styles.factLabel}>rating</Text>
          </View>
          <View style={styles.factDivider} />
          <View style={styles.fact}>
            <MapPin color={colors.primary} size={16} strokeWidth={2} />
            <Text style={styles.factValue}>{restaurant.distance}</Text>
            <Text style={styles.factLabel}>away</Text>
          </View>
          <View style={styles.factDivider} />
          <View style={styles.fact}>
            <Clock3 color={colors.primary} size={16} strokeWidth={2} />
            <Text style={styles.factValue}>Open</Text>
            <Text style={styles.factLabel}>now</Text>
          </View>
        </View>

        <Text style={styles.description}>{restaurant.description}</Text>

        {restaurant.offer ? (
          <View style={styles.offer}>
            <Text style={styles.offerEyebrow}>Current offer</Text>
            <Text style={styles.offerTitle}>{restaurant.offer}</Text>
            <Text style={styles.offerDetail}>Rewards are calculated automatically after you scan and confirm your bill.</Text>
          </View>
        ) : null}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Visit</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><MapPin color={colors.textSecondary} size={18} strokeWidth={2} /></View>
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>{restaurant.address}</Text>
              <Text style={styles.infoSub}>{restaurant.distance} from you</Text>
            </View>
            <Navigation color={colors.primary} size={19} strokeWidth={2} />
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Clock3 color={colors.textSecondary} size={18} strokeWidth={2} /></View>
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>{restaurant.hours}</Text>
              <Text style={styles.infoSub}>Hours may vary on public holidays</Text>
            </View>
          </View>
        </View>

        {latestVisit ? (
          <View style={styles.visitCard}>
            <Text style={styles.visitLabel}>Your last reward activity</Text>
            <Text style={styles.visitDate}>{latestVisit.date}</Text>
            <Text style={styles.visitReward}>
              {latestVisit.type === 'earned' ? 'You earned ' : 'You used '}
              {formatAED(Math.abs(latestVisit.amount))}
            </Text>
          </View>
        ) : null}

        <Button label="Scan a bill here" onPress={() => router.push('/(tabs)/scan')} style={styles.scanButton} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  stateWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  heroWrap: { marginHorizontal: spacing.lg, marginTop: spacing.xs },
  hero: { width: '100%', height: 248, borderRadius: radius.xl, backgroundColor: colors.surface },
  favourite: {
    position: 'absolute', right: spacing.md, top: spacing.md, width: 44, height: 44,
    borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(17,19,18,0.34)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.34)',
  },
  main: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleBody: { flex: 1 },
  name: { color: colors.text, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.75 },
  cuisine: { color: colors.textSecondary, fontSize: typography.small, marginTop: 5 },
  quickFacts: {
    marginTop: spacing.xl, height: 70, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center',
  },
  fact: { flex: 1, alignItems: 'center', gap: 2 },
  factValue: { color: colors.text, fontSize: typography.caption, fontWeight: '700' },
  factLabel: { color: colors.textTertiary, fontSize: 10 },
  factDivider: { width: 1, height: 34, backgroundColor: colors.border },
  description: { color: colors.textSecondary, fontSize: typography.small, lineHeight: 22, marginTop: spacing.xl },
  offer: {
    marginTop: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primaryMuted, padding: spacing.lg,
  },
  offerEyebrow: { color: colors.primary, fontSize: typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  offerTitle: { color: colors.text, fontSize: typography.heading, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, marginTop: spacing.sm },
  offerDetail: { color: colors.textSecondary, fontSize: typography.caption, lineHeight: 18, marginTop: spacing.sm },
  infoSection: { marginTop: spacing.xxxl },
  sectionTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.4, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', minHeight: 66, gap: spacing.sm },
  infoIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  infoBody: { flex: 1 },
  infoTitle: { color: colors.text, fontSize: typography.small, fontWeight: '600', lineHeight: 20 },
  infoSub: { color: colors.textTertiary, fontSize: typography.caption, marginTop: 3 },
  infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  visitCard: { marginTop: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  visitLabel: { color: colors.textSecondary, fontSize: typography.caption },
  visitDate: { color: colors.text, fontSize: typography.body, fontWeight: '700', marginTop: 5 },
  visitReward: { color: colors.primary, fontSize: typography.small, fontWeight: '600', marginTop: spacing.sm },
  scanButton: { marginTop: spacing.xl },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
