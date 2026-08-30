import { useRouter } from 'expo-router';
import { ArrowRight, ReceiptText, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Wordmark } from '@/components/ui/Wordmark';
import { colors, radius, spacing, typography } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen
      contentStyle={styles.screen}
      edges={['top', 'bottom', 'left', 'right']}
      scroll={false}
    >
      <View style={styles.top}>
        <Wordmark />
      </View>

      <View style={styles.hero}>
        <View style={styles.visual}>
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />
          <View style={styles.receiptCard}>
            <View style={styles.receiptTop}>
              <View style={styles.restaurantMark}>
                <Text style={styles.restaurantInitial}>G</Text>
              </View>
              <View>
                <Text style={styles.restaurantName}>Green Chilli</Text>
                <Text style={styles.restaurantMeta}>Your dining reward</Text>
              </View>
            </View>
            <View style={styles.rewardRow}>
              <View>
                <Text style={styles.rewardLabel}>Reward earned</Text>
                <Text style={styles.rewardAmount}>AED 10.00</Text>
              </View>
              <View style={styles.sparkle}>
                <Sparkles color={colors.primary} size={22} strokeWidth={1.8} />
              </View>
            </View>
          </View>
          <View style={styles.scanBadge}>
            <ReceiptText color={colors.primary} size={17} strokeWidth={2} />
            <Text style={styles.scanBadgeText}>Bill confirmed</Text>
          </View>
        </View>

        <Text style={styles.headline}>Eat. Earn. Come back.</Text>
        <Text style={styles.subtitle}>
          Rewards from the restaurants you already love, added with one quick scan.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          icon={ArrowRight}
          label="Get started"
          onPress={() => router.push('/auth/phone')}
        />
        <Button label="Log in" onPress={() => router.push('/auth/phone')} variant="ghost" />
        <Text style={styles.legal}>By continuing, you agree to DinePanel’s terms and privacy policy.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  top: {
    paddingTop: spacing.md,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  visual: {
    height: 300,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xxxl,
  },
  glowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D6F0E1',
    top: -82,
    right: -80,
  },
  glowTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F5FBF7',
    bottom: -56,
    left: -20,
  },
  receiptCard: {
    width: '82%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  receiptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restaurantMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInitial: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  restaurantName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: 3,
  },
  restaurantMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  rewardRow: {
    paddingTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginBottom: 4,
  },
  rewardAmount: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sparkle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBadge: {
    position: 'absolute',
    bottom: 30,
    right: 18,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  scanBadgeText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  headline: {
    color: colors.text,
    fontSize: typography.display,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1.1,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actions: {
    gap: spacing.xs,
  },
  legal: {
    color: colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
});

