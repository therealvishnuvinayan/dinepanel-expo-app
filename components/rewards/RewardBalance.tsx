import { Gift, ScanLine } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatAED } from '@/utils/format';

type RewardBalanceProps = {
  balance: number | null;
  monthlyEarned?: number | null;
  onScan?: () => void;
  compact?: boolean;
  loading?: boolean;
};

export function RewardBalance({
  balance,
  monthlyEarned,
  onScan,
  compact = false,
  loading = false,
}: RewardBalanceProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Available rewards</Text>
          {loading ? (
            <View accessibilityLabel="Loading reward balance" style={styles.amountPlaceholder} />
          ) : (
            <Text style={[styles.amount, compact && styles.amountCompact]}>
              {balance === null ? 'Unavailable' : formatAED(balance)}
            </Text>
          )}
        </View>
        <View style={styles.sparkIcon}>
          <Gift color={colors.primary} size={20} strokeWidth={2.2} />
        </View>
      </View>
      {monthlyEarned !== undefined || onScan ? (
        <View style={styles.footer}>
          {monthlyEarned !== undefined ? (
            <View>
              <Text style={styles.footerLabel}>This month earned</Text>
              <Text style={styles.footerAmount}>
                {monthlyEarned === null ? '—' : formatAED(monthlyEarned)}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {onScan ? (
            <Pressable onPress={onScan} style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
              <ScanLine color={colors.white} size={18} strokeWidth={2.2} />
              <Text style={styles.scanLabel}>Scan bill</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    padding: spacing.xl,
  },
  cardCompact: {
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  amount: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  amountCompact: {
    fontSize: 32,
  },
  amountPlaceholder: {
    width: 164,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
  },
  sparkIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primaryMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    color: colors.textSecondaryAccessible,
    fontSize: typography.caption,
    marginBottom: 3,
  },
  footerAmount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  scanButton: {
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  scanLabel: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
