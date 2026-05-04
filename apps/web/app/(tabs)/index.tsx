import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  createQrPayload,
  encodeQrPayload,
  QR_TYPE_REGISTRY_V1,
  type QrPayloadConfigV1,
  type QrPayloadKind,
} from "@qurl/qr-core";
import { layout, palette, radii, spacing } from "@qurl/ui";

import { QrPreview } from "../../src/components/qr-preview";
import { SectionCard, StatTile } from "../../src/components/section-card";

type FormState = {
  url: string;
  text: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  smsNumber: string;
  smsMessage: string;
  wifiSsid: string;
  wifiPassword: string;
  vcardName: string;
  vcardEmail: string;
  vcardPhone: string;
  latitude: string;
  longitude: string;
  locationLabel: string;
  cryptoCurrency: "btc" | "eth" | "usdc" | "sol" | "ltc" | "other";
  cryptoAddress: string;
};

const initialForm: FormState = {
  url: "https://example.com",
  text: "Hello from qurl",
  emailTo: "hello@example.com",
  emailSubject: "Hello",
  emailBody: "",
  phone: "+15551234567",
  smsNumber: "+15551234567",
  smsMessage: "Hi",
  wifiSsid: "Guest Wi-Fi",
  wifiPassword: "guest-password",
  vcardName: "Ada Lovelace",
  vcardEmail: "ada@example.com",
  vcardPhone: "+15551234567",
  latitude: "47.6062",
  longitude: "-122.3321",
  locationLabel: "Seattle",
  cryptoCurrency: "btc",
  cryptoAddress: "bc1qexampleaddress",
};

export default function CreateScreen() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [activeKind, setActiveKind] = useState<QrPayloadKind>("url");

  const payloadResult = buildPayload(activeKind, form);
  const activeType = QR_TYPE_REGISTRY_V1.types.find((type) => type.kind === activeKind);
  const payloadPreview =
    payloadResult.payload === null ? payloadResult.error : encodeQrPayload(payloadResult.payload);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

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
          <Text style={styles.heroTitle}>
            Create direct static QR codes that point exactly where you expect.
          </Text>
          <Text style={styles.heroCopy}>
            Build scannable QR payloads, preview them live, and keep every encoded value honest by
            default.
          </Text>
        </View>

        <View style={styles.workspace}>
          <View style={styles.column}>
            <SectionCard
              eyebrow="Step 1"
              title="Payload"
              subtitle="Choose a static QR type. Every MVP type encodes directly into the QR."
            >
              <View style={styles.modeRow}>
                {QR_TYPE_REGISTRY_V1.types.map((type) => {
                  const selected = type.kind === activeKind;
                  return (
                    <Pressable
                      key={type.kind}
                      onPress={() => setActiveKind(type.kind)}
                      style={({ pressed }) => [
                        styles.modeChip,
                        selected && styles.modeChipActive,
                        pressed && styles.modeChipPressed,
                      ]}
                    >
                      <Text style={[styles.modeText, selected && styles.modeTextActive]}>
                        {type.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {renderPayloadFields(activeKind, form, updateField)}

              <View style={styles.notePanel}>
                <Text style={styles.noteTitle}>{activeType?.label ?? "Static QR"}</Text>
                <Text style={payloadResult.payload ? styles.noteCopy : styles.errorCopy}>
                  {payloadPreview}
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
                  <Text style={styles.helperValue}>SVG and PNG</Text>
                </View>
                <View style={styles.helperTile}>
                  <Text style={styles.helperLabel}>Tracking</Text>
                  <Text style={styles.helperValue}>Opt in only</Text>
                </View>
              </View>
            </SectionCard>
          </View>

          <View style={styles.column}>
            <QrPreview payload={payloadResult.payload} payloadPreview={payloadPreview} />

            <View style={styles.statsRow}>
              <StatTile
                label="Promise"
                value="Direct"
                detail="No hidden redirects or surprise domains."
              />
              <StatTile label="State" value="Draft" detail="Anonymous until a save flow exists." />
              <StatTile label="Types" value="9" detail="URL, text, contact, network, and more." />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function buildPayload(
  kind: QrPayloadKind,
  form: FormState,
): { payload: QrPayloadConfigV1 | null; error: string } {
  try {
    switch (kind) {
      case "url":
        return { payload: createQrPayload("url", { destinationUrl: form.url }), error: "" };
      case "text":
        return { payload: createQrPayload("text", { text: form.text }), error: "" };
      case "email":
        return {
          payload: createQrPayload("email", {
            to: form.emailTo,
            subject: form.emailSubject,
            body: form.emailBody,
          }),
          error: "",
        };
      case "phone":
        return { payload: createQrPayload("phone", { number: form.phone }), error: "" };
      case "sms":
        return {
          payload: createQrPayload("sms", { number: form.smsNumber, message: form.smsMessage }),
          error: "",
        };
      case "wifi":
        return {
          payload: createQrPayload("wifi", {
            ssid: form.wifiSsid,
            security: "wpa2",
            password: form.wifiPassword,
          }),
          error: "",
        };
      case "vcard":
        return {
          payload: createQrPayload("vcard", {
            fullName: form.vcardName,
            email: form.vcardEmail,
            phone: form.vcardPhone,
          }),
          error: "",
        };
      case "location":
        return {
          payload: createQrPayload("location", {
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            label: form.locationLabel,
          }),
          error: "",
        };
      case "crypto-address":
        return {
          payload: createQrPayload("crypto-address", {
            currency: form.cryptoCurrency,
            address: form.cryptoAddress,
          }),
          error: "",
        };
    }
  } catch (error) {
    return {
      payload: null,
      error: error instanceof Error ? error.message : "This QR payload is not valid yet.",
    };
  }
}

function renderPayloadFields(
  kind: QrPayloadKind,
  form: FormState,
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void,
) {
  switch (kind) {
    case "url":
      return (
        <InputBlock
          label="Destination URL"
          keyboardType="url"
          onChangeText={(value) => updateField("url", value)}
          placeholder="https://example.com"
          value={form.url}
        />
      );
    case "text":
      return (
        <InputBlock
          label="Text"
          multiline
          onChangeText={(value) => updateField("text", value)}
          placeholder="Plain text to encode"
          value={form.text}
        />
      );
    case "email":
      return (
        <View style={styles.fieldStack}>
          <InputBlock
            label="To"
            keyboardType="email-address"
            onChangeText={(value) => updateField("emailTo", value)}
            value={form.emailTo}
          />
          <InputBlock
            label="Subject"
            onChangeText={(value) => updateField("emailSubject", value)}
            value={form.emailSubject}
          />
          <InputBlock
            label="Body"
            multiline
            onChangeText={(value) => updateField("emailBody", value)}
            value={form.emailBody}
          />
        </View>
      );
    case "phone":
      return (
        <InputBlock
          label="Phone number"
          keyboardType="phone-pad"
          onChangeText={(value) => updateField("phone", value)}
          value={form.phone}
        />
      );
    case "sms":
      return (
        <View style={styles.fieldStack}>
          <InputBlock
            label="SMS number"
            keyboardType="phone-pad"
            onChangeText={(value) => updateField("smsNumber", value)}
            value={form.smsNumber}
          />
          <InputBlock
            label="Message"
            multiline
            onChangeText={(value) => updateField("smsMessage", value)}
            value={form.smsMessage}
          />
        </View>
      );
    case "wifi":
      return (
        <View style={styles.fieldStack}>
          <InputBlock
            label="Network name"
            onChangeText={(value) => updateField("wifiSsid", value)}
            value={form.wifiSsid}
          />
          <InputBlock
            label="Password"
            onChangeText={(value) => updateField("wifiPassword", value)}
            value={form.wifiPassword}
          />
        </View>
      );
    case "vcard":
      return (
        <View style={styles.fieldStack}>
          <InputBlock
            label="Full name"
            onChangeText={(value) => updateField("vcardName", value)}
            value={form.vcardName}
          />
          <InputBlock
            label="Email"
            keyboardType="email-address"
            onChangeText={(value) => updateField("vcardEmail", value)}
            value={form.vcardEmail}
          />
          <InputBlock
            label="Phone"
            keyboardType="phone-pad"
            onChangeText={(value) => updateField("vcardPhone", value)}
            value={form.vcardPhone}
          />
        </View>
      );
    case "location":
      return (
        <View style={styles.fieldStack}>
          <InputBlock
            label="Latitude"
            keyboardType="decimal-pad"
            onChangeText={(value) => updateField("latitude", value)}
            value={form.latitude}
          />
          <InputBlock
            label="Longitude"
            keyboardType="decimal-pad"
            onChangeText={(value) => updateField("longitude", value)}
            value={form.longitude}
          />
          <InputBlock
            label="Label"
            onChangeText={(value) => updateField("locationLabel", value)}
            value={form.locationLabel}
          />
        </View>
      );
    case "crypto-address":
      return (
        <View style={styles.fieldStack}>
          <InputBlock
            label="Currency"
            onChangeText={(value) =>
              updateField("cryptoCurrency", value as FormState["cryptoCurrency"])
            }
            value={form.cryptoCurrency}
          />
          <InputBlock
            label="Address"
            onChangeText={(value) => updateField("cryptoAddress", value)}
            value={form.cryptoAddress}
          />
        </View>
      );
  }
}

type InputBlockProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "url" | "email-address" | "phone-pad" | "decimal-pad";
  multiline?: boolean;
  placeholder?: string;
};

function InputBlock({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  multiline = false,
  placeholder,
}: InputBlockProps) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
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
  fieldStack: {
    gap: spacing.md,
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
  multilineInput: {
    minHeight: 92,
    textAlignVertical: "top",
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
  errorCopy: {
    color: "#b42318",
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
