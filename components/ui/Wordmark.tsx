import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/constants/theme';

type WordmarkProps = {
  light?: boolean;
  compact?: boolean;
};

export function Wordmark({ light = false, compact = false }: WordmarkProps) {
  const foreground = light ? colors.white : colors.primary;

  return (
    <View style={styles.container}>
      <Image
        accessibilityIgnoresInvertColors
        accessible={false}
        source={require('../../assets/brand/dinepanel-mark-128.png')}
        style={[
          styles.mark,
          compact && styles.markCompact,
        ]}
      />
      <Text
        style={[
          styles.wordmark,
          compact && styles.wordmarkCompact,
          { color: foreground },
        ]}
      >
        DinePanel
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 34,
    height: 34,
  },
  markCompact: {
    width: 28,
    height: 28,
  },
  wordmark: {
    fontSize: typography.heading,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  wordmarkCompact: {
    fontSize: 18,
  },
});
