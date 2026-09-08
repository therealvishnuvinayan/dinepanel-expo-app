import { useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

export default function OtpScreen() {
  const { requestOtp, verifyOtp } = useAuth();
  const { phone, cooldown } = useLocalSearchParams<{ phone?: string; cooldown?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(() => {
    const parsed = Number(cooldown);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(300, Math.ceil(parsed))) : 30;
  });

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const verify = async () => {
    if (typeof phone !== 'string') {
      setError('Your phone number is missing. Please go back and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phone, code);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify this code.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (typeof phone !== 'string' || cooldownRemaining > 0 || resending) return;
    setResending(true);
    setError('');
    setResendFeedback('');
    try {
      const response = await requestOtp(phone);
      setCooldownRemaining(Math.max(1, Math.ceil(response.resend_available_in_seconds)));
      setResendFeedback('A new code was sent.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend the code.');
    } finally {
      setResending(false);
    }
  };

  const phoneEnding = typeof phone === 'string' && phone.length >= 4 ? phone.slice(-4) : '4567';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen edges={['top', 'bottom', 'left', 'right']} scroll={false}>
        <AppHeader showBack title="" />
        <View style={styles.content}>
          <View>
            <Text style={styles.eyebrow}>Verify your number</Text>
            <Text style={styles.title}>Enter the 6-digit code</Text>
            <Text style={styles.subtitle}>Sent to +971 •• ••• {phoneEnding}</Text>

            <Pressable onPress={() => inputRef.current?.focus()} style={styles.codeRow}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.codeBox,
                    code.length === index && styles.codeBoxActive,
                    error ? styles.codeBoxError : null,
                  ]}
                >
                  <Text style={styles.codeText}>{code[index] ?? ''}</Text>
                </View>
              ))}
            </Pressable>
            <TextInput
              ref={inputRef}
              autoFocus
              caretHidden
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              style={styles.hiddenInput}
              value={code}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {resendFeedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{resendFeedback}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={resending || cooldownRemaining > 0}
              onPress={resend}
              style={[styles.resend, cooldownRemaining > 0 && styles.resendDisabled]}
            >
              <Text style={styles.resendText}>Didn’t receive it? </Text>
              <Text style={styles.resendAction}>
                {resending ? 'Sending…' : cooldownRemaining > 0 ? `Send again in ${cooldownRemaining}s` : 'Send again'}
              </Text>
            </Pressable>
          </View>

          <Button
            disabled={code.length !== 6}
            icon={ArrowRight}
            label="Verify and continue"
            loading={loading}
            onPress={verify}
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
  subtitle: { color: colors.textSecondary, fontSize: typography.body, marginTop: spacing.sm },
  codeRow: { flexDirection: 'row', gap: 8, marginTop: spacing.xxxl },
  codeBox: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  codeBoxError: { borderColor: colors.danger },
  codeText: { color: colors.text, fontSize: 22, fontWeight: '700' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  error: { color: colors.danger, fontSize: typography.small, marginTop: spacing.sm },
  feedback: { color: colors.primary, fontSize: typography.small, fontWeight: '600', marginTop: spacing.lg },
  resend: { flexDirection: 'row', marginTop: spacing.xl },
  resendDisabled: { opacity: 0.62 },
  resendText: { color: colors.textSecondary, fontSize: typography.small },
  resendAction: { color: colors.primary, fontSize: typography.small, fontWeight: '700' },
});
