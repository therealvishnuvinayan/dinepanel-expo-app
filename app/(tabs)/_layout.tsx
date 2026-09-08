import { Tabs } from 'expo-router';
import { Gift, Home, ScanLine, Search, UserRound, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, radius, spacing } from '@/constants/theme';

const tabItems: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'index', label: 'Home', icon: Home },
  { name: 'discover', label: 'Discover', icon: Search },
  { name: 'scan', label: 'Scan', icon: ScanLine },
  { name: 'rewards', label: 'Rewards', icon: Gift },
  { name: 'profile', label: 'Profile', icon: UserRound },
];

type TabBarProps = { activeRoute: string; onPress: (name: string) => void };

function CustomTabBar({ activeRoute, onPress }: TabBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeBar}>
      <View style={styles.bar}>
        {tabItems.map((item) => {
          const selected = activeRoute === item.name;
          const Icon = item.icon;
          const isScan = item.name === 'scan';

          return (
            <Pressable
              accessibilityRole="button"
              key={item.name}
              onPress={() => onPress(item.name)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, isScan && styles.scanIcon, selected && isScan && styles.scanIconActive]}>
                <Icon
                  color={isScan ? colors.white : selected ? colors.primary : colors.textTertiary}
                  fill={selected && !isScan && item.name === 'index' ? colors.primarySoft : 'transparent'}
                  size={isScan ? 21 : 20}
                  strokeWidth={selected ? 2.35 : 1.9}
                />
              </View>
              <Text style={[styles.label, selected && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <CustomTabBar
          activeRoute={state.routes[state.index]?.name ?? 'index'}
          onPress={(name) => navigation.navigate(name)}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="rewards" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safeBar: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  bar: {
    height: layout.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.white,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: { width: 32, height: 27, alignItems: 'center', justifyContent: 'center' },
  scanIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    marginTop: -15,
    marginBottom: 1,
    borderWidth: 3,
    borderColor: colors.white,
  },
  scanIconActive: { backgroundColor: colors.primaryPressed },
  label: { color: colors.textTertiaryAccessible, fontSize: 10, fontWeight: '600' },
  labelActive: { color: colors.primary, fontWeight: '700' },
  pressed: { opacity: 0.62 },
});
