import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { layout, palette, radii, spacing } from "@qurl/ui";

import { QrPreview } from "../../src/components/qr-preview";
import { SectionCard, StatTile } from "../../src/components/section-card";

const modes = ["URL"] as const;

export default function CreateScreen() {
  const [destination, setDestination] = useState("https://example.com");
  const [activeMode, setActiveMode] = useState<(typeof modes)[number]>("URL");

  const headline =
    activeMode === "URL"
      ? "Create a direct QR that points exactly where you expect."
      : "Create a clean QR draft.";

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.page}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>qurl</Text>
            <Text style={styles.tagline}>Direct QR creation for people who want the truth.</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Anonymous creator</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{headline}</Text>
          <Text style={styles.heroCopy}>
            Build a scannable QR, preview it live, and keep the destination honest by default.
          </Text>
        </View>

        <View style={styles.workspace}>
          <View style={styles.column}>
            <SectionCard
              eyebrow="Step 1"
              title="Destination"
              subtitle="Slice 1 supports direct URL payloads only."
            >
              <View style={styles.modeRow}>
                {modes.map((mode) => {
                  const selected = mode === activeMode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setActiveMode(mode)}
                      style={({ pressed }) => [
                        styles.modeChip,
                        selected && styles.modeChipActive,
                        pressed && styles.modeChipPressed,
                      ]}
                    >
                      <Text style={[styles.modeText, selected && styles.modeTextActive]}>
                        {mode}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Destination URL</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onChangeText={setDestination}
                  placeholder="https://example.com"
                  placeholderTextColor={palette.muted}
                  style={styles.input}
                  value={destination}
                />
              </View>

              <View style={styles.notePanel}>
                <Text style={styles.noteTitle}>What happens next</Text>
                <Text style={styles.noteCopy}>
                  The preview now updates from the current URL, and downloads use the shared QR
                  config with a backend fallback when one is available.
                </Text>
              </View>
            </SectionCard>

            <SectionCard
              eyebrow="Step 2"
              title="Look and feel"
              subtitle="The scaffold leaves room for logo placement, color control, and production exports."
            >
              <View style={styles.swatchRow}>
                <View style={[styles.swatch, { backgroundColor: palette.ink }]} />
                <View style={[styles.swatch, { backgroundColor: palette.accent }]} />
                <View style={[styles.swatch, { backgroundColor: palette.highlight }]} />
                <View style={[styles.swatch, { backgroundColor: palette.borderStrong }]} />
              </View>

              <View style={styles.helperGrid}>
                <View style={styles.helperTile}>
                  <Text style={styles.helperLabel}>Quiet zone</Text>
                  <Text style={styles.helperValue}>Reserved</Text>
                </View>
                <View style={styles.helperTile}>
                  <Text style={styles.helperLabel}>Export</Text>
                  <Text style={styles.helperValue}>SVG live, PNG later</Text>
                </View>
                <View style={styles.helperTile}>
                  <Text style={styles.helperLabel}>Tracking</Text>
                  <Text style={styles.helperValue}>Opt in only</Text>
                </View>
              </View>
            </SectionCard>
          </View>

          <View style={styles.column}>
            <QrPreview destination={destination} />

            <View style={styles.statsRow}>
              <StatTile
                label="Promise"
                value="Direct"
                detail="No hidden redirects or surprise domains."
              />
              <StatTile label="State" value="Draft" detail="Anonymous until a save flow exists." />
              <StatTile label="Next" value="Export" detail="PNG and print-ready paths later." />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.canvas,
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  shell: {
    maxWidth: layout.maxWidth,
    width: "100%",
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  brand: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
  },
  tagline: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
    maxWidth: 420,
  },
  badge: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
    maxWidth: 760,
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 40,
  },
  heroCopy: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 680,
  },
  workspace: {
    gap: spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  column: {
    gap: spacing.xl,
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 320,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modeChip: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeChipActive: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
  },
  modeChipPressed: {
    opacity: 0.86,
  },
  modeText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
  },
  modeTextActive: {
    color: palette.surface,
  },
  inputBlock: {
    gap: spacing.sm,
  },
  inputLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notePanel: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  noteTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  noteCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  swatchRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  swatch: {
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    width: 32,
  },
  helperGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  helperTile: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: 150,
    gap: spacing.xs,
    padding: spacing.md,
  },
  helperLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  helperValue: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
