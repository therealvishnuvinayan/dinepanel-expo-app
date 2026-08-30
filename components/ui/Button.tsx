import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, layout, radius, typography } from '@/constants/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon: Icon,
  style,
}: ButtonProps) {
  const foreground = variant === 'primary' || variant === 'dark' ? colors.white : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {Icon ? <Icon color={foreground} size={19} strokeWidth={2.2} /> : null}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  dark: {
    backgroundColor: colors.dark,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.38,
  },
});

