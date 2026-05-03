import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing } from '@qurl/ui';

const matrix = [
  [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
];

type MockQrPreviewProps = {
  destination: string;
};

export function MockQrPreview({ destination }: MockQrPreviewProps) {
  return (
    <View style={styles.card} accessibilityLabel="QR preview placeholder">
      <View style={styles.header}>
        <Text style={styles.kicker}>Live preview</Text>
        <Text style={styles.title}>Direct destination encoded</Text>
        <Text style={styles.subtitle}>No redirects, no hidden tracking, no surprises.</Text>
      </View>
      <View style={styles.grid}>
        {matrix.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, cellIndex) => (
              <View
                key={`cell-${rowIndex}-${cellIndex}`}
                style={[styles.cell, cell === 1 ? styles.cellOn : styles.cellOff]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Destination</Text>
        <Text style={styles.footerValue}>{destination}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.ink,
    borderRadius: radii.lg,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  kicker: {
    color: palette.highlight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.surface,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#d8dee2',
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    aspectRatio: 1,
    flex: 1,
    margin: 1,
  },
  cellOn: {
    backgroundColor: palette.ink,
  },
  cellOff: {
    backgroundColor: '#f4f1ea',
  },
  footer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  footerLabel: {
    color: palette.highlight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  footerValue: {
    color: palette.surface,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
