import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

type PillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'green' | 'neutral' | 'warm';
};

export function Pill({ label, selected = false, onPress, tone = 'neutral' }: PillProps) {
  const Component = onPress ? Pressable : View;

  return (
    <Component
      onPress={onPress}
      style={[
        styles.base,
        tone === 'green' && styles.green,
        tone === 'warm' && styles.warm,
        selected && styles.selected,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'green' && styles.greenLabel,
          tone === 'warm' && styles.warmLabel,
          selected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  green: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  warm: {
    backgroundColor: colors.warmSoft,
    borderColor: colors.warmSoft,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.white,
  },
  greenLabel: {
    color: colors.primary,
  },
  warmLabel: {
    color: colors.warm,
  },
});

