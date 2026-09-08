import { useLocalSearchParams, useRouter } from 'expo-router';
import { Link2Off } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Wordmark } from '@/components/ui/Wordmark';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRewards } from '@/context/RewardsContext';
import { parseClaimToken } from '@/utils/claimUrl';

export default function ClaimDeepLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const { isAuthenticated, isLoading } = useAuth();
  const { clearPendingClaim, previewClaimToken } = useRewards();
  const [error, setError] = useState('');
  const started = useRef(false);
  const rawToken = Array.isArray(params.token) ? params.token[0] : params.token;
  const parsedClaim = useMemo(() => {
    if (!rawToken) return { token: null, error: 'This claim link is incomplete.' };
    try {
      return { token: parseClaimToken(rawToken, true), error: '' };
    } catch (claimError) {
      return {
        token: null,
        error: claimError instanceof Error ? claimError.message : 'Unable to open this claim.',
      };
    }
  }, [rawToken]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || started.current || !parsedClaim.token) return;
    started.current = true;
    previewClaimToken(parsedClaim.token)
      .then(() => router.replace('/bill/confirm'))
      .catch((claimError) => {
        void clearPendingClaim().catch(() => undefined);
        setError(claimError instanceof Error ? claimError.message : 'Unable to open this claim.');
      });
  }, [clearPendingClaim, isAuthenticated, isLoading, parsedClaim.token, previewClaimToken, router]);

  const visibleError = parsedClaim.error || error;

  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']} scroll={false}>
      <Wordmark />
      <View style={styles.state}>
        {visibleError ? (
          <>
            <Link2Off color={colors.textTertiary} size={42} />
            <Text style={styles.title}>Claim link unavailable</Text>
            <Text style={styles.copy}>{visibleError}</Text>
            <Button label="Open scanner" onPress={() => router.replace('/(tabs)/scan')} />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.copy}>
              {isAuthenticated ? 'Verifying your restaurant bill…' : 'Taking you to secure sign in…'}
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  copy: { color: colors.textSecondary, fontSize: typography.small, lineHeight: 21, textAlign: 'center', maxWidth: 290 },
});
