import { StyleSheet, Text, View } from "react-native";

import { palette, radii, spacing } from "@qurl/ui";

import { SectionCard } from "../../src/components/section-card";

export default function AccountScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.shell}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>
          Sign in, save drafts, and sync project history when the account layer lands.
        </Text>

        <SectionCard
          eyebrow="Access"
          title="Authentication shell"
          subtitle="This tab gives the future sign-in flow a stable home without inventing backend behavior yet."
        >
          <View style={styles.cardBlock}>
            <Text style={styles.blockTitle}>Planned actions</Text>
            <Text style={styles.blockCopy}>
              Sign in, create account, recover access, and manage profile.
            </Text>
          </View>

          <View style={styles.cardBlock}>
            <Text style={styles.blockTitle}>State handoff</Text>
            <Text style={styles.blockCopy}>
              Anonymous drafts should move into a saved project without rewriting the QR payload.
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
    alignSelf: "center",
    gap: spacing.lg,
    maxWidth: 980,
    width: "100%",
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  cardBlock: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  blockTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
  },
  blockCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
