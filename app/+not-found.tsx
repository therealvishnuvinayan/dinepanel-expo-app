import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom']} scroll={false}>
      <View>
        <Text style={styles.eyebrow}>404</Text>
        <Text style={styles.title}>This page isn’t available</Text>
        <Text style={styles.subtitle}>The page you’re looking for can’t be found.</Text>
      </View>
      <Button label="Back to DinePanel" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '700', marginTop: spacing.huge },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, marginTop: spacing.sm },
});
