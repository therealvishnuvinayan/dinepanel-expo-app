import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

type DataStateProps = {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
};

export function DataState({ title, message, loading = false, onRetry }: DataStateProps) {
  return (
    <View style={styles.card}>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  title: { color: colors.text, fontSize: typography.small, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textSecondary, fontSize: typography.caption, lineHeight: 18, textAlign: 'center' },
  retry: { marginTop: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  retryText: { color: colors.primary, fontSize: typography.small, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
