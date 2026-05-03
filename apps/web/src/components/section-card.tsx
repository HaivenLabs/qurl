import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing } from '@qurl/ui';

type SectionCardProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function SectionCard({
  eyebrow,
  title,
  subtitle,
  children,
  style,
}: SectionCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

type StatTileProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    gap: spacing.lg,
  },
  statTile: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  statLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  statValue: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  statDetail: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
