import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '@/constants/theme';

type WordmarkProps = {
  light?: boolean;
  compact?: boolean;
};

export function Wordmark({ light = false, compact = false }: WordmarkProps) {
  const foreground = light ? colors.white : colors.primary;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.mark,
          compact && styles.markCompact,
          { backgroundColor: light ? colors.white : colors.primary },
        ]}
      >
        <View
          style={[
            styles.markInner,
            compact && styles.markInnerCompact,
            { borderColor: light ? colors.primary : colors.white },
          ]}
        />
        <View
          style={[
            styles.dot,
            compact && styles.dotCompact,
            { backgroundColor: light ? colors.primary : colors.white },
          ]}
        />
      </View>
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
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCompact: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  markInner: {
    width: 14,
    height: 18,
    borderWidth: 2,
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  markInnerCompact: {
    width: 12,
    height: 15,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    left: 9,
    top: 8,
  },
  dotCompact: {
    left: 7,
    top: 6,
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

