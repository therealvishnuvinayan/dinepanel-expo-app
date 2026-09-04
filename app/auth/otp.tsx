import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
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
  const router = useRouter();
  const { requestOtp, verifyOtp } = useAuth();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verify = async () => {
    if (typeof phone !== 'string') {
      setError('Your phone number is missing. Please go back and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phone, code);
      router.replace('/(tabs)');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify this code.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (typeof phone !== 'string') return;
    setResending(true);
    setError('');
    try {
      await requestOtp(phone);
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
            {__DEV__ ? (
              <View style={styles.demoNote}>
                <Text style={styles.demoLabel}>Prototype code</Text>
                <Pressable onPress={() => setCode('123456')}>
                  <Text style={styles.demoCode}>123456</Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable disabled={resending} onPress={resend} style={styles.resend}>
              <Text style={styles.resendText}>Didn’t receive it? </Text>
              <Text style={styles.resendAction}>{resending ? 'Sending…' : 'Send again'}</Text>
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
  demoNote: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoLabel: { color: colors.primary, fontSize: typography.small, fontWeight: '600' },
  demoCode: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  resend: { flexDirection: 'row', marginTop: spacing.xl },
  resendText: { color: colors.textSecondary, fontSize: typography.small },
  resendAction: { color: colors.primary, fontSize: typography.small, fontWeight: '700' },
});
