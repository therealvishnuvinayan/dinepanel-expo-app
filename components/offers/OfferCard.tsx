import { useRouter } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Offer } from '@/types';

type OfferCardProps = {
  offer: Offer;
  compact?: boolean;
};

export function OfferCard({ offer, compact = false }: OfferCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: offer.restaurantId } })}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: offer.accent },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{offer.eyebrow}</Text>
        <View style={styles.icon}>
          <ArrowUpRight color={colors.text} size={17} strokeWidth={2} />
        </View>
      </View>
      <Text style={[styles.restaurant, compact && styles.restaurantCompact]}>{offer.restaurantName}</Text>
      <Text numberOfLines={compact ? 2 : undefined} style={[styles.title, compact && styles.titleCompact]}>
        {offer.title}
      </Text>
      {!compact ? <Text style={styles.detail}>{offer.detail}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(17,19,18,0.06)',
    padding: spacing.xl,
  },
  cardCompact: {
    width: 250,
    minHeight: 160,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurant: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  restaurantCompact: {
    fontSize: typography.caption,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.45,
  },
  titleCompact: {
    fontSize: 17,
    lineHeight: 23,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});

