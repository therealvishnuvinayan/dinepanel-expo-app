import type { PropsWithChildren, ReactNode } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, layout } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  footer?: ReactNode;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({
  children,
  scroll = true,
  backgroundColor = colors.background,
  contentStyle,
  edges = ['top', 'left', 'right'],
  footer,
  keyboardShouldPersistTaps = 'handled',
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }]}>
      {body}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
});
