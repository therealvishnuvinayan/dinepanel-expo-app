import { useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import type { RewardTransaction } from '@/types';
import { formatAED } from '@/utils/format';

type TransactionRowProps = {
  transaction: RewardTransaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const router = useRouter();
  const earned = transaction.type === 'earned';
  const Icon = earned ? ArrowDownLeft : ArrowUpRight;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/restaurant/[id]', params: { id: transaction.restaurantId } })
      }
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, earned ? styles.iconEarned : styles.iconRedeemed]}>
        <Icon color={earned ? colors.primary : colors.warm} size={19} strokeWidth={2.1} />
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>
          {transaction.restaurantName}
        </Text>
        <Text style={styles.meta}>
          {earned ? 'Reward earned' : 'Reward used'} · {transaction.date}
        </Text>
      </View>
      <Text style={[styles.amount, earned ? styles.amountEarned : styles.amountRedeemed]}>
        {earned ? '+' : '−'} {formatAED(Math.abs(transaction.amount))}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEarned: {
    backgroundColor: colors.primarySoft,
  },
  iconRedeemed: {
    backgroundColor: colors.warmSoft,
  },
  body: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.15,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  amount: {
    fontSize: typography.small,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  amountEarned: {
    color: colors.primary,
  },
  amountRedeemed: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
});

