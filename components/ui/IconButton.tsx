import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, radius } from '@/constants/theme';

type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  size?: number;
  tone?: 'light' | 'dark' | 'plain';
  style?: ViewStyle;
};

export function IconButton({
  icon: Icon,
  onPress,
  label,
  size = 20,
  tone = 'light',
  style,
}: IconButtonProps) {
  const foreground = tone === 'dark' ? colors.white : colors.text;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === 'light' && styles.light,
        tone === 'dark' && styles.dark,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon color={foreground} size={size} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.96 }],
  },
});

