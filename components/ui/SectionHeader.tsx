import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors, typography } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable hitSlop={8} onPress={onAction} style={styles.action}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <ChevronRight color={colors.primary} size={15} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    letterSpacing: -0.45,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
  },
});

