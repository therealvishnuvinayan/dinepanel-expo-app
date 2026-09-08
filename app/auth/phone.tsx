import { useRouter } from 'expo-router';
import { ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function PhoneScreen() {
  const router = useRouter();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const normalizedPhone = phone.replace(/\D/g, '').slice(0, 9);
  const canContinue = normalizedPhone.length === 9;

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9)].filter(Boolean);
    return parts.join(' ');
  };

  const continueWithPhone = async () => {
    const fullPhone = `+971${normalizedPhone}`;
    setLoading(true);
    setError('');
    try {
      const response = await requestOtp(fullPhone);
      router.push({
        pathname: '/auth/otp',
        params: { phone: fullPhone, cooldown: String(response.resend_available_in_seconds) },
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send a code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <Screen edges={['top', 'bottom', 'left', 'right']} scroll={false}>
        <AppHeader showBack title="" />
        <View style={styles.content}>
          <View>
            <Text style={styles.eyebrow}>Welcome to DinePanel</Text>
            <Text style={styles.title}>Enter your mobile number</Text>
            <Text style={styles.subtitle}>
              We’ll send you a one-time code to securely sign in.
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.country}>
                <Text style={styles.flag}>🇦🇪</Text>
                <Text style={styles.countryCode}>+971</Text>
              </View>
              <TextInput
                autoFocus
                keyboardType="phone-pad"
                maxLength={11}
                onChangeText={(value) => setPhone(formatPhone(value))}
                placeholder="50 123 4567"
                placeholderTextColor={colors.textTertiary}
                selectionColor={colors.primary}
                style={styles.input}
                value={phone}
              />
            </View>

            <View style={styles.securityNote}>
              <ShieldCheck color={colors.primary} size={18} strokeWidth={2} />
              <Text style={styles.securityText}>Your number is used only to secure your account.</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <Button
            disabled={!canContinue}
            icon={ArrowRight}
            label="Continue"
            loading={loading}
            onPress={continueWithPhone}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 33,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxxl },
  country: {
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  flag: { fontSize: 18 },
  countryCode: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  input: {
    flex: 1,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  securityText: { color: colors.textSecondary, fontSize: typography.caption, flex: 1 },
  error: { color: colors.danger, fontSize: typography.small, lineHeight: 20, marginTop: spacing.md },
});
