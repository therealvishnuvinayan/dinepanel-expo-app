import { useRouter } from 'expo-router';
import { CalendarDays, Check, ReceiptText, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import { formatAED } from '@/utils/format';

export default function BillConfirmationScreen() {
  const router = useRouter();
  const { claimCurrentBill, currentBill } = useRewards();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');

  const claim = async () => {
    setClaiming(true);
    setError('');
    try {
      await claimCurrentBill();
      router.replace('/reward/success');
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Unable to claim this reward.');
    } finally {
      setClaiming(false);
    }
  };

  if (!currentBill) {
    return (
      <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack title="Confirm bill" />
        <View style={styles.missing}>
          <DataState
            message="Return to the scanner and use the demo bill first."
            title="No bill is ready"
          />
          <Button label="Open scanner" onPress={() => router.replace('/(tabs)/scan')} />
        </View>
      </Screen>
    );
  }

  const restaurant = currentBill.restaurant;
  const billDate = new Intl.DateTimeFormat('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${currentBill.billDate}T12:00:00`));

  return (
    <Screen
      contentStyle={styles.content}
      edges={['top', 'bottom', 'left', 'right']}
      footer={
        <View style={styles.footer}>
          <Button
            disabled={!currentBill.claimable}
            icon={Check}
            label={currentBill.claimable ? `Claim ${formatAED(currentBill.rewardAmount)}` : 'Reward already claimed'}
            loading={claiming}
            onPress={claim}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
              <Text style={styles.restaurantInitial}>{restaurant.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantMeta}>{restaurant.cuisine} · {restaurant.neighborhood}</Text>
            </View>
          </View>
          <View style={styles.billIdentity}>
            <View style={styles.identityRow}>
              <ReceiptText color={colors.textSecondary} size={17} strokeWidth={2} />
              <Text style={styles.identityText}>Bill #{currentBill.billNumber}</Text>
            </View>
            <View style={styles.identityRow}>
              <CalendarDays color={colors.textSecondary} size={17} strokeWidth={2} />
              <Text style={styles.identityText}>{billDate}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Bill summary</Text>
        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>Bill total</Text>
          <Text style={styles.lineValue}>{formatAED(currentBill.billAmount)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>Reward</Text>
          <Text style={styles.lineValue}>{currentBill.rewardPercentage}%</Text>
        </View>
        <View style={styles.rewardBox}>
          <View>
            <Text style={styles.rewardLabel}>You’ll earn</Text>
            <Text style={styles.rewardAmount}>{formatAED(currentBill.rewardAmount)}</Text>
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
  missing: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
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
  error: { color: colors.danger, fontSize: typography.caption, lineHeight: 18, textAlign: 'center', marginTop: spacing.xs },
});
