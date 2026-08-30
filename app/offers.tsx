import { StyleSheet, Text, View } from 'react-native';

import { OfferCard } from '@/components/offers/OfferCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { offers } from '@/data/mockOffers';

export default function OffersScreen() {
  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader showBack title="Offers" />
      <View style={styles.heading}>
        <Text style={styles.title}>A little more back</Text>
        <Text style={styles.subtitle}>Limited, useful boosts from restaurants around Dubai.</Text>
      </View>
      <View style={styles.list}>
        {offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
      </View>
      <Text style={styles.note}>Offers apply automatically when an eligible bill is confirmed.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  heading: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.75 },
  subtitle: { color: colors.textSecondary, fontSize: typography.small, lineHeight: 21, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.xl },
  note: { color: colors.textTertiary, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: spacing.xxxl, marginTop: spacing.xl },
});
