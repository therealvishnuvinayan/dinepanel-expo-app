import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalDocumentProps = {
  title: string;
  effectiveDate: string;
  introduction: string;
  sections: LegalSection[];
};

export function LegalDocument({ title, effectiveDate, introduction, sections }: LegalDocumentProps) {
  return (
    <Screen contentStyle={styles.content} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader showBack title={title} />
      <View style={styles.document}>
        <Text style={styles.eyebrow}>DinePanel Customer</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>Effective {effectiveDate}</Text>
        <Text style={styles.introduction}>{introduction}</Text>

        <View style={styles.sections}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.paragraphs.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  document: { marginHorizontal: spacing.lg, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.white, padding: spacing.xl },
  eyebrow: { color: colors.primary, fontSize: typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { color: colors.text, fontSize: typography.title, lineHeight: 34, fontWeight: '800', letterSpacing: -0.75, marginTop: spacing.xs },
  date: { color: colors.textTertiaryAccessible, fontSize: typography.caption, marginTop: spacing.xs },
  introduction: { color: colors.textSecondaryAccessible, fontSize: typography.small, lineHeight: 22, marginTop: spacing.xl },
  sections: { gap: spacing.xl, marginTop: spacing.xxxl },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  paragraph: { color: colors.textSecondaryAccessible, fontSize: typography.small, lineHeight: 22 },
});
