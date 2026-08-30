import { useRouter } from 'expo-router';
import { ArrowLeft, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';
import { IconButton } from '@/components/ui/IconButton';

type AppHeaderProps = {
  title: string;
  eyebrow?: string;
  showBack?: boolean;
  rightIcon?: LucideIcon;
  onRightPress?: () => void;
  rightLabel?: string;
  light?: boolean;
};

export function AppHeader({
  title,
  eyebrow,
  showBack = false,
  rightIcon,
  onRightPress,
  rightLabel = 'More',
  light = false,
}: AppHeaderProps) {
  const router = useRouter();
  const textColor = light ? colors.white : colors.text;
  const secondaryColor = light ? 'rgba(255,255,255,0.62)' : colors.textSecondary;

  return (
    <View style={styles.container}>
      {showBack ? (
        <IconButton
          icon={ArrowLeft}
          label="Go back"
          onPress={() => router.back()}
          tone={light ? 'dark' : 'light'}
        />
      ) : null}
      <View style={[styles.titleWrap, !showBack && styles.flush]}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: secondaryColor }]}>{eyebrow}</Text> : null}
        <Text numberOfLines={1} style={[styles.title, { color: textColor }]}>
          {title}
        </Text>
      </View>
      {rightIcon && onRightPress ? (
        <IconButton
          icon={rightIcon}
          label={rightLabel}
          onPress={onRightPress}
          tone={light ? 'dark' : 'light'}
        />
      ) : showBack ? (
        <View style={styles.spacer} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleWrap: {
    flex: 1,
  },
  flush: {
    paddingVertical: spacing.xs,
  },
  eyebrow: {
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    letterSpacing: -0.45,
  },
  spacer: {
    width: 44,
  },
});

