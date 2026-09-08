import { useRouter } from 'expo-router';
import { ArrowUpRight, Heart, MapPin } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import type { Restaurant } from '@/types';
import { Pill } from '@/components/ui/Pill';

type RestaurantCardProps = {
  restaurant: Restaurant;
  variant?: 'compact' | 'list';
};

export function RestaurantCard({ restaurant, variant = 'list' }: RestaurantCardProps) {
  const router = useRouter();

  const openRestaurant = () => {
    router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } });
  };

  if (variant === 'compact') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={openRestaurant}
        style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]}
      >
        <Image source={restaurant.image} style={styles.compactImage} />
        <View style={styles.compactBody}>
          <Text numberOfLines={1} style={styles.compactTitle}>
            {restaurant.name}
          </Text>
          <Text style={styles.meta}>{restaurant.cuisine}</Text>
          <View style={styles.compactFooter}>
            <Pill label={`${restaurant.rewardPercent}% rewards`} tone="green" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openRestaurant}
      style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
    >
      <Image source={restaurant.image} style={styles.listImage} />
      <View style={styles.listBody}>
        <View style={styles.listTitleRow}>
          <View style={styles.flex}>
            <Text numberOfLines={1} style={styles.listTitle}>
              {restaurant.name}
            </Text>
            <Text style={styles.meta}>{restaurant.cuisine}</Text>
          </View>
          <View style={styles.arrowIcon}>
            <ArrowUpRight color={colors.textSecondary} size={17} strokeWidth={2} />
          </View>
        </View>
        <View style={styles.listFooter}>
          <Pill label={`${restaurant.rewardPercent}% rewards`} tone="green" />
          <View style={styles.distance}>
            <MapPin color={colors.textTertiaryAccessible} size={13} />
            <Text style={styles.distanceText}>{restaurant.distance}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function FavouriteButton() {
  return (
    <View style={styles.favourite}>
      <Heart color={colors.white} fill={colors.white} size={17} strokeWidth={1.8} />
    </View>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    width: 224,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  compactImage: {
    width: '100%',
    height: 128,
    backgroundColor: colors.surface,
  },
  compactBody: {
    padding: spacing.md,
  },
  compactTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  compactFooter: {
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  listCard: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
  },
  listImage: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  listBody: {
    flex: 1,
    paddingVertical: 2,
    justifyContent: 'space-between',
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  listTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  arrowIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingRight: 2,
  },
  distanceText: {
    color: colors.textTertiaryAccessible,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  favourite: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,19,18,0.26)',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
