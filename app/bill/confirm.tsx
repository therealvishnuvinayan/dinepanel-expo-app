import { useRouter } from 'expo-router';
import { CalendarDays, Check, ReceiptText, ShieldCheck } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import { getRestaurant } from '@/data/mockRestaurants';
import { formatAED } from '@/utils/format';

const restaurant = getRestaurant('green-chilli');

export default function BillConfirmationScreen() {
  const router = useRouter();
  const { claimDemoBill, hasClaimedDemoBill } = useRewards();

  const claim = () => {
    claimDemoBill();
    router.replace('/reward/success');
  };

  return (
    <Screen
      contentStyle={styles.content}
      edges={['top', 'bottom', 'left', 'right']}
      footer={
        <View style={styles.footer}>
          <Button
            icon={Check}
            label={hasClaimedDemoBill ? 'Reward already claimed' : 'Claim AED 10'}
            onPress={claim}
          />
          <Text style={styles.footerNote}>The reward is added instantly to your DinePanel balance.</Text>
        </View>
      }
    >
      <AppHeader showBack title="Confirm bill" />

      <View style={styles.heroCard}>
        <Image source={restaurant.image} style={styles.image} />
        <View style={styles.heroBody}>
          <View style={styles.restaurantRow}>
            <View style={styles.restaurantMark}>
              <Text style={styles.restaurantInitial}>G</Text>
            </View>
            <View>
              <Text style={styles.restaurantName}>Green Chilli</Text>
              <Text style={styles.restaurantMeta}>Indian · Downtown Dubai</Text>
            </View>
          </View>
          <View style={styles.billIdentity}>
            <View style={styles.identityRow}>
              <ReceiptText color={colors.textSecondary} size={17} strokeWidth={2} />
              <Text style={styles.identityText}>Bill #GC-29482</Text>
            </View>
            <View style={styles.identityRow}>
              <CalendarDays color={colors.textSecondary} size={17} strokeWidth={2} />
              <Text style={styles.identityText}>28 Aug 2026 · 8:14 PM</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Bill summary</Text>
        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>Bill total</Text>
          <Text style={styles.lineValue}>{formatAED(500)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>Reward</Text>
          <Text style={styles.lineValue}>2%</Text>
        </View>
        <View style={styles.rewardBox}>
          <View>
            <Text style={styles.rewardLabel}>You’ll earn</Text>
            <Text style={styles.rewardAmount}>{formatAED(10)}</Text>
          </View>
          <View style={styles.rewardIcon}>
            <Check color={colors.primary} size={22} strokeWidth={2.3} />
          </View>
        </View>
      </View>

      <View style={styles.verified}>
        <ShieldCheck color={colors.primary} size={19} strokeWidth={2} />
        <View style={styles.verifiedBody}>
          <Text style={styles.verifiedTitle}>Bill verified</Text>
          <Text style={styles.verifiedText}>The restaurant, amount and reference have been matched.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 156, backgroundColor: colors.surface },
  heroBody: { padding: spacing.lg },
  restaurantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  restaurantMark: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  restaurantInitial: { color: colors.white, fontSize: 18, fontWeight: '700' },
  restaurantName: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 3 },
  restaurantMeta: { color: colors.textSecondary, fontSize: typography.caption },
  billIdentity: { gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  identityText: { color: colors.textSecondary, fontSize: typography.small, fontWeight: '500' },
  summary: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  summaryTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700', marginBottom: spacing.lg },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lineLabel: { color: colors.textSecondary, fontSize: typography.small },
  lineValue: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  rewardBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardLabel: { color: colors.primary, fontSize: typography.small, fontWeight: '600', marginBottom: 5 },
  rewardAmount: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  rewardIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  verified: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  verifiedBody: { flex: 1 },
  verifiedTitle: { color: colors.text, fontSize: typography.small, fontWeight: '700', marginBottom: 3 },
  verifiedText: { color: colors.textSecondary, fontSize: typography.caption, lineHeight: 18 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  footerNote: { color: colors.textTertiary, fontSize: 11, textAlign: 'center', marginTop: spacing.xs },
});
