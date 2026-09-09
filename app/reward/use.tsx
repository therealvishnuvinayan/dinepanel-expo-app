import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  ChevronRight,
  Clock3,
  Gift,
  MapPin,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import * as redemptionsApi from '@/api/redemptions';
import {
  clearStoredRewardRedemption,
  getStoredRewardRedemption,
  storeRewardRedemption,
} from '@/api/redemptionStorage';
import type { ApiRewardRedemption } from '@/api/types';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import type { Restaurant } from '@/types';
import { formatAED } from '@/utils/format';

type SetupStep = 'restaurant' | 'amount' | 'review';

function friendlyRemaining(expiresAt: string, now: number) {
  if (now === 0) return 'a moment';
  const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');
  return remaining > 0 ? `${minutes}:${seconds}` : 'Checking…';
}

function validAmount(value: string, balance: number) {
  if (!/^\d+(\.\d{0,2})?$/.test(value.trim())) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 && amount <= balance;
}

export default function UseRewardsScreen() {
  const router = useRouter();
  const { restaurantId } = useLocalSearchParams<{ restaurantId?: string }>();
  const { balance, getRestaurant, refresh, restaurants } = useRewards();
  const preselected = getRestaurant(restaurantId);
  const [step, setStep] = useState<SetupStep>(restaurantId ? 'amount' : 'restaurant');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(preselected ?? null);
  const [amount, setAmount] = useState('');
  const [redemption, setRedemption] = useState<ApiRewardRedemption | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pollMessage, setPollMessage] = useState('');
  const [now, setNow] = useState(0);
  const polling = useRef(false);
  const terminalHandled = useRef<string | null>(null);

  const available = balance ?? 0;
  const selectedRestaurant = restaurant ?? getRestaurant(restaurantId) ?? null;
  const quickAmounts = useMemo(
    () => [10, 20].filter((value) => value <= available),
    [available],
  );

  const loadAuthoritativeState = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const stored = await getStoredRewardRedemption();
      const active = await redemptionsApi.getActiveRewardRedemption();
      if (active) {
        setRedemption(active);
        setQrPayload(stored?.id === active.id ? stored.qrPayload : null);
        return;
      }
      if (stored) {
        try {
          const restored = await redemptionsApi.getRewardRedemption(stored.id);
          setRedemption(restored);
          setQrPayload(restored.status === 'PENDING' ? stored.qrPayload : null);
          if (['CANCELLED', 'EXPIRED'].includes(restored.status)) await clearStoredRewardRedemption();
          if (restored.status === 'CONFIRMED') await refresh();
        } catch {
          await clearStoredRewardRedemption();
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to restore reward use.');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void loadAuthoritativeState();
    }, [loadAuthoritativeState]),
  );

  const poll = useCallback(async () => {
    if (!redemption || polling.current || !['PENDING', 'ACCEPTED'].includes(redemption.status)) return;
    polling.current = true;
    try {
      const next = await redemptionsApi.getRewardRedemption(redemption.id);
      setRedemption(next);
      setPollMessage('');
      if (['CANCELLED', 'EXPIRED'].includes(next.status)) {
        await clearStoredRewardRedemption();
      }
      if (next.status === 'CONFIRMED' && terminalHandled.current !== next.id) {
        terminalHandled.current = next.id;
        await refresh();
      }
    } catch {
      setPollMessage('Reconnecting…');
    } finally {
      polling.current = false;
    }
  }, [redemption, refresh]);

  useFocusEffect(
    useCallback(() => {
      if (!redemption || !['PENDING', 'ACCEPTED'].includes(redemption.status)) return undefined;
      let foreground = AppState.currentState === 'active';
      const appStateSubscription = AppState.addEventListener('change', (state) => {
        const becameActive = !foreground && state === 'active';
        foreground = state === 'active';
        if (becameActive) void poll();
      });
      const interval = setInterval(() => {
        if (foreground) void poll();
      }, 2500);
      return () => {
        clearInterval(interval);
        appStateSubscription.remove();
      };
    }, [poll, redemption]),
  );

  useEffect(() => {
    if (!redemption || !['PENDING', 'ACCEPTED'].includes(redemption.status)) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [redemption]);

  const generate = async () => {
    if (!selectedRestaurant || !validAmount(amount, available)) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await redemptionsApi.createRewardRedemption(
        selectedRestaurant.id,
        Number(amount).toFixed(2),
      );
      await storeRewardRedemption({ id: created.id, qrPayload: created.qr_payload });
      setRedemption(created);
      setQrPayload(created.qr_payload);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to generate reward QR.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => Alert.alert(
    'Cancel reward use?',
    'Your balance has not been changed. This QR will stop working.',
    [
      { text: 'Keep code', style: 'cancel' },
      {
        text: 'Cancel reward use',
        style: 'destructive',
        onPress: () => {
          if (!redemption) return;
          setSubmitting(true);
          void redemptionsApi.cancelRewardRedemption(redemption.id)
            .then(async (next) => {
              setRedemption(next);
              setQrPayload(null);
              await clearStoredRewardRedemption();
            })
            .catch((cancelError: unknown) => {
              setError(cancelError instanceof Error ? cancelError.message : 'Unable to cancel reward use.');
              void poll();
            })
            .finally(() => setSubmitting(false));
        },
      },
    ],
  );

  if (loading) {
    return (
      <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack title="Use rewards" />
        <View style={styles.stateWrap}><DataState loading title="Checking your rewards" /></View>
      </Screen>
    );
  }

  if (redemption) {
    const usedAmount = Number(redemption.amount);
    const isPending = redemption.status === 'PENDING';
    const isAccepted = redemption.status === 'ACCEPTED';
    const isConfirmed = redemption.status === 'CONFIRMED';
    const isCancelled = redemption.status === 'CANCELLED';
    return (
      <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack title="Use rewards" />
        <View accessibilityLiveRegion="polite" style={styles.activeBody}>
          <View style={[
            styles.statusIcon,
            isConfirmed && styles.statusIconSuccess,
            (isCancelled || redemption.status === 'EXPIRED') && styles.statusIconMuted,
          ]}>
            {isConfirmed ? <Check color={colors.white} size={30} strokeWidth={2.4} />
              : isCancelled || redemption.status === 'EXPIRED' ? <X color={colors.textSecondary} size={28} />
                : <Gift color={colors.primary} size={28} />}
          </View>
          <Text style={styles.activeEyebrow}>
            {isPending ? 'WAITING FOR RESTAURANT'
              : isAccepted ? 'RESTAURANT IS APPLYING YOUR REWARD'
                : isConfirmed ? 'REWARD USED'
                  : redemption.status === 'EXPIRED' ? 'CODE EXPIRED' : 'REWARD USE CANCELLED'}
          </Text>
          <Text style={styles.activeAmount}>{formatAED(usedAmount)}</Text>
          <Text style={styles.restaurantName}>{redemption.restaurant.name}</Text>

          {isPending && qrPayload ? (
            <View style={[styles.qrCard, shadow]}>
              <QRCode
                backgroundColor={colors.white}
                color={colors.dark}
                quietZone={10}
                size={220}
                value={qrPayload}
              />
            </View>
          ) : null}

          {isPending && !qrPayload ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>This code is active on another session</Text>
              <Text style={styles.infoCopy}>Return to the device that generated it, or cancel it here and create a new code.</Text>
            </View>
          ) : null}

          {(isPending || isAccepted) ? (
            <View style={styles.timerRow}>
              <Clock3 color={colors.textSecondaryAccessible} size={17} />
              <Text style={styles.timerText}>Expires in {friendlyRemaining(redemption.expires_at, now)}</Text>
              {pollMessage ? <Text style={styles.pollText}>{pollMessage}</Text> : null}
            </View>
          ) : null}

          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              {isPending ? 'Show this to restaurant staff before paying.'
                : isAccepted ? 'The restaurant is applying the discount in its POS.'
                  : isConfirmed ? `New reward balance ${formatAED(Number(redemption.current_balance))}`
                    : redemption.status === 'EXPIRED' ? 'This reward code expired.' : 'Reward use cancelled.'}
            </Text>
            <Text style={styles.messageCopy}>
              {isPending || isAccepted
                ? 'Your reward balance has not been deducted yet.'
                : isConfirmed
                  ? 'Your DinePanel balance and reward history have been updated.'
                  : 'Your balance was not changed.'}
            </Text>
          </View>

          {error ? <Text accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
          {isPending ? <Button label="Cancel" loading={submitting} onPress={cancel} variant="ghost" style={styles.action} /> : null}
          {isConfirmed ? <Button label="View rewards" onPress={() => { void clearStoredRewardRedemption(); router.replace('/(tabs)/rewards'); }} style={styles.action} /> : null}
          {(isCancelled || redemption.status === 'EXPIRED') ? (
            <Button
              label="Generate a new code"
              onPress={() => {
                setRedemption(null);
                setQrPayload(null);
                setAmount('');
                setStep(restaurantId ? 'amount' : 'restaurant');
              }}
              style={styles.action}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  if (error && !restaurant && restaurants.length === 0) {
    return (
      <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack title="Use rewards" />
        <View style={styles.stateWrap}><DataState message={error} onRetry={loadAuthoritativeState} title="Rewards are unavailable" /></View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']} keyboardShouldPersistTaps="handled">
      <AppHeader showBack title="Use rewards" />
      <View style={styles.setupBody}>
        <Text style={styles.eyebrow}>AVAILABLE REWARDS</Text>
        <Text style={styles.balance}>{formatAED(available)}</Text>

        {step === 'restaurant' ? (
          <>
            <Text style={styles.title}>Where would you like to use them?</Text>
            <Text style={styles.subtitle}>Choose an active DinePanel restaurant.</Text>
            <View style={styles.restaurantList}>
              {restaurants.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => { setRestaurant(item); setStep('amount'); }}
                  style={({ pressed }) => [styles.restaurantRow, pressed && styles.pressed]}
                >
                  <View style={styles.restaurantIcon}><Store color={colors.primary} size={21} /></View>
                  <View style={styles.restaurantCopy}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowSubtitle}><MapPin size={12} /> {item.area}, {item.city}</Text>
                  </View>
                  <ChevronRight color={colors.textTertiaryAccessible} size={19} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {step === 'amount' && selectedRestaurant ? (
          <>
            <Text style={styles.title}>How much would you like to use?</Text>
            <Text style={styles.subtitle}>At {selectedRestaurant.name}</Text>
            {quickAmounts.length ? (
              <View style={styles.quickAmounts}>
                {quickAmounts.map((value) => (
                  <Pressable
                    accessibilityRole="button"
                    key={value}
                    onPress={() => setAmount(value.toFixed(2))}
                    style={[styles.quickAmount, amount === value.toFixed(2) && styles.quickAmountSelected]}
                  >
                    <Text style={[styles.quickLabel, amount === value.toFixed(2) && styles.quickLabelSelected]}>{formatAED(value)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.amountField}>
              <Text style={styles.currency}>AED</Text>
              <TextInput
                accessibilityLabel="Reward amount in AED"
                inputMode="decimal"
                maxLength={13}
                onChangeText={(value) => setAmount(value.replace(',', '.'))}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiaryAccessible}
                returnKeyType="done"
                style={styles.amountInput}
                value={amount}
              />
            </View>
            {amount && !validAmount(amount, available) ? (
              <Text accessibilityLiveRegion="polite" style={styles.validation}>Enter an amount from AED 0.01 to {formatAED(available)}.</Text>
            ) : null}
            <Button disabled={!validAmount(amount, available)} label="Review reward use" onPress={() => setStep('review')} style={styles.action} />
            {!restaurantId ? <Button label="Choose another restaurant" onPress={() => setStep('restaurant')} variant="ghost" /> : null}
          </>
        ) : null}

        {step === 'review' && selectedRestaurant ? (
          <>
            <Text style={styles.title}>Review reward use</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>USE NOW</Text>
              <Text style={styles.reviewAmount}>{formatAED(Number(amount))}</Text>
              <Text style={styles.reviewRestaurant}>at {selectedRestaurant.name}</Text>
              <View style={styles.reviewDivider} />
              <View style={styles.safeRow}>
                <ShieldCheck color={colors.primary} size={20} />
                <Text style={styles.safeCopy}>Your reward will only be deducted after the restaurant confirms the discount was applied.</Text>
              </View>
            </View>
            {error ? <Text accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
            <Button label="Generate reward QR" loading={submitting} onPress={() => void generate()} style={styles.action} />
            <Button label="Change amount" onPress={() => { setError(''); setStep('amount'); }} variant="ghost" />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  stateWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  setupBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  balance: { color: colors.text, fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -1, marginTop: 3 },
  title: { color: colors.text, fontSize: typography.title, lineHeight: 33, fontWeight: '800', letterSpacing: -0.65, marginTop: spacing.xxxl },
  subtitle: { color: colors.textSecondaryAccessible, fontSize: typography.small, lineHeight: 21, marginTop: spacing.xs },
  restaurantList: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: spacing.md, overflow: 'hidden' },
  restaurantRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  restaurantIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  restaurantCopy: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  rowSubtitle: { color: colors.textSecondaryAccessible, fontSize: typography.caption, marginTop: 5 },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xl },
  quickAmount: { minHeight: 48, minWidth: 104, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  quickAmountSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  quickLabel: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  quickLabelSelected: { color: colors.primary },
  amountField: { marginTop: spacing.md, height: 76, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  currency: { color: colors.primary, fontSize: typography.small, fontWeight: '800' },
  amountInput: { flex: 1, color: colors.text, fontSize: 30, fontWeight: '700', paddingVertical: 0 },
  validation: { color: colors.danger, fontSize: typography.caption, lineHeight: 18, marginTop: spacing.xs },
  action: { marginTop: spacing.xl },
  reviewCard: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryMuted },
  reviewLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  reviewAmount: { color: colors.text, fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -1.2, marginTop: spacing.xs },
  reviewRestaurant: { color: colors.textSecondaryAccessible, fontSize: typography.body, lineHeight: 23, marginTop: 3 },
  reviewDivider: { height: 1, backgroundColor: colors.primaryMuted, marginVertical: spacing.lg },
  safeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  safeCopy: { flex: 1, color: colors.textSecondaryAccessible, fontSize: typography.small, lineHeight: 21 },
  activeBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' },
  statusIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  statusIconSuccess: { backgroundColor: colors.success },
  statusIconMuted: { backgroundColor: colors.surface },
  activeEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.05, textAlign: 'center', marginTop: spacing.lg },
  activeAmount: { color: colors.text, fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -1.1, marginTop: spacing.xs },
  restaurantName: { color: colors.textSecondaryAccessible, fontSize: typography.body, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  qrCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border },
  timerRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  timerText: { color: colors.textSecondaryAccessible, fontSize: typography.caption, fontWeight: '600' },
  pollText: { color: colors.warm, fontSize: typography.caption },
  infoCard: { width: '100%', marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  infoTitle: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  infoCopy: { color: colors.textSecondaryAccessible, fontSize: typography.caption, lineHeight: 18, marginTop: 4 },
  messageCard: { width: '100%', marginTop: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.lg, alignItems: 'center' },
  messageTitle: { color: colors.text, fontSize: typography.body, lineHeight: 23, fontWeight: '700', textAlign: 'center' },
  messageCopy: { color: colors.textSecondaryAccessible, fontSize: typography.small, lineHeight: 21, textAlign: 'center', marginTop: spacing.xs },
  error: { color: colors.danger, fontSize: typography.small, lineHeight: 20, textAlign: 'center', marginTop: spacing.md },
  pressed: { opacity: 0.72 },
});
