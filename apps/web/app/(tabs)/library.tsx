import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing } from '@qurl/ui';

import { SectionCard } from '../../src/components/section-card';

export default function LibraryScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.shell}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>
          Saved QR projects, favorites, and re-download history will land here.
        </Text>

        <SectionCard
          eyebrow="Empty state"
          title="No saved projects yet"
          subtitle="The scaffold leaves space for authentication, project history, and templates."
        >
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing to show yet</Text>
            <Text style={styles.emptyCopy}>
              Once persistence is wired in, anonymous drafts can become named projects without
              losing their destination or design state.
            </Text>
          </View>
        </SectionCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.canvas,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  shell: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: 980,
    width: '100%',
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
  emptyCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
