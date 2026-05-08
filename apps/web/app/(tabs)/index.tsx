import { createElement, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  createQrPayload,
  encodeQrPayload,
  QR_FRAME_OPTIONS,
  QR_TYPE_REGISTRY_V1,
  type QrDesignConfigV1,
  type QrStickerStyle,
  type QrPayloadConfigV1,
  type QrPayloadKind,
} from "@qurl/qr-core";
import { layout, palette, radii, spacing } from "@qurl/ui";

import { QrPreview } from "../../src/components/qr-preview";
import { SectionCard } from "../../src/components/section-card";

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

const CURATED_COLORS = [
  "#000000",
  "#355f5d",
  "#005244",
  "#737373",
  "#b91c1c",
  "#ef4444",
  "#9d174d",
  "#c026d3",
  "#6d28d9",
  "#3b82f6",
  "#1d4ed8",
  "#1e3a8a",
  "#0f766e",
  "#15803d",
  "#f97316",
  "#78350f",
  "#ffffff",
  "#fff7e8",
];

const MIN_LOGO_SIZE_PX = 10;
const MAX_LOGO_SIZE_PX = 28;
const DEFAULT_LOGO_SIZE_PX = 22;

function clampLogoSizePx(size: number): number {
  return Math.min(MAX_LOGO_SIZE_PX, Math.max(MIN_LOGO_SIZE_PX, Math.round(size)));
}

function logoSizeRatioToPx(ratio?: number): number {
  return clampLogoSizePx((ratio ?? DEFAULT_LOGO_SIZE_PX / 100) * 100);
}

function logoSizePxToRatio(size: number): number {
  return clampLogoSizePx(size) / 100;
}

const PRESET_LOGOS = [
  { id: "none", name: "None", asset: null },
  { id: "scan-me-focused", name: "Scan Me Focused", asset: "/assets/images/scan-me-focused.svg" },
  { id: "scan-me-simple", name: "Scan Me Simple", asset: "/assets/images/scan-me-simple.svg" },
  { id: "scan-me-rounded", name: "Scan Me Rounded", asset: "/assets/images/scan-me-rounded.svg" },
  { id: "scan-me-italic", name: "Scan Me Italic", asset: "/assets/images/scan-me-italic.svg" },
  { id: "rating", name: "Star", asset: "/assets/images/rating.svg" },
  { id: "business", name: "Shop", asset: "/assets/images/business.svg" },
  { id: "vcard", name: "Card", asset: "/assets/images/vcard.svg" },
  { id: "pdf", name: "PDF", asset: "/assets/images/pdf.svg" },
  { id: "percent", name: "Percent", asset: "/assets/images/percent.svg" },
  { id: "facebook", name: "Facebook", asset: "/assets/images/facebook.svg" },
  { id: "instagram", name: "Instagram", asset: "/assets/images/instagram.svg" },
  { id: "linkedin", name: "LinkedIn", asset: "/assets/images/linkedin.svg" },
  { id: "x", name: "X", asset: "/assets/images/x.svg" },
  { id: "youtube", name: "YouTube", asset: "/assets/images/youtube.svg" },
  { id: "tiktok", name: "TikTok", asset: "/assets/images/tiktok.svg" },
  { id: "pinterest", name: "Pinterest", asset: "/assets/images/pinterest.svg" },
  { id: "app-store", name: "App Store", asset: "/assets/images/app-store.svg" },
  { id: "gmail", name: "Gmail", asset: "/assets/images/gmail.svg" },
  { id: "behance", name: "Behance", asset: "/assets/images/behance.svg" },
  { id: "wifi", name: "Wifi", asset: "/assets/images/wifi.svg" },
  { id: "power-point", name: "PowerPoint", asset: "/assets/images/power-point.svg" },
  { id: "spotify", name: "Spotify", asset: "/assets/images/spotify.svg" },
  { id: "pdf-icon", name: "PDF Red", asset: "/assets/images/pdf-icon.svg" },
];

export default function CreateScreen() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [activeKind, setActiveKind] = useState<QrPayloadKind>("url");

  const [design, setDesign] = useState<Partial<QrDesignConfigV1>>({
    errorCorrectionLevel: "H",
    foregroundColor: "#355f5d",
    backgroundColor: "#ffffff",
    eyeColorOuter: "#355f5d",
    eyeColorInner: "#355f5d",
    moduleStyle: "dot",
    eyeStyle: "leaf",
    backgroundTransparent: false,
    logo: { mode: "none" },
    frame: { enabled: true, style: "circle", color: "#005244" },
    sticker: { style: "circle", color: "#005244" },
    quietZoneModules: 4,
  });

  const [activeTab, setActiveTab] = useState<
    "payload" | "frames" | "logo" | "pattern" | "markers" | "color"
  >("payload");

  const colors = CURATED_COLORS;

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
              eyebrow="Core Design Studio"
              title="Customize your QR"
              subtitle="Tune payload, frames, color, patterns, and markers while preserving scan quality."
            >
              <View style={styles.designTab}>
                <View style={styles.tabsHeader}>
                  {(
                    [
                      ["payload", "Payload"],
                      ["frames", "Frames"],
                      ["logo", "Logo"],
                      ["pattern", "Data Pattern"],
                      ["markers", "Corner Markers"],
                      ["color", "Color"],
                    ] as const
                  ).map(([id, label]) => (
                    <Pressable
                      key={id}
                      style={[styles.tabBtn, activeTab === id && styles.tabBtnActive]}
                      onPress={() => setActiveTab(id)}
                    >
                      <Text
                        style={[styles.tabBtnText, activeTab === id && styles.tabBtnTextActive]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {activeTab === "payload" && (
                  <View style={styles.tabPanel}>
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
                  </View>
                )}

                {activeTab === "color" && (
                  <View style={styles.tabPanel}>
                    <View style={styles.swatchGrid}>
                      {colors.map((c) => (
                        <Pressable
                          key={c}
                          style={[
                            styles.swatchWrap,
                            design.foregroundColor === c && styles.swatchWrapActive,
                          ]}
                          onPress={() =>
                            setDesign((d) => ({
                              ...d,
                              foregroundColor: c,
                              eyeColorOuter: c,
                              eyeColorInner: c,
                            }))
                          }
                        >
                          <View style={[styles.swatchSquare, { backgroundColor: c }]} />
                        </Pressable>
                      ))}
                    </View>

                    <View style={styles.colorInputRow}>
                      <TinyColorInput
                        label="Data pattern color"
                        value={design.foregroundColor || ""}
                        onChange={(v) => setDesign((d) => ({ ...d, foregroundColor: v }))}
                      />
                      <TinyColorInput
                        label="Outer marker color"
                        value={design.eyeColorOuter || ""}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeColorOuter: v }))}
                      />
                      <TinyColorInput
                        label="Inner marker color"
                        value={design.eyeColorInner || ""}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeColorInner: v }))}
                      />
                      <TinyColorInput
                        label="Background color"
                        value={design.backgroundColor || ""}
                        onChange={(v) => setDesign((d) => ({ ...d, backgroundColor: v }))}
                      />
                    </View>
                  </View>
                )}

                {activeTab === "pattern" && (
                  <View style={styles.tabPanel}>
                    <Text style={styles.inputLabel}>Data Pattern</Text>
                    <View style={styles.swatchGrid}>
                      {(
                        [
                          "dot",
                          "square",
                          "rounded",
                          "heart",
                          "diamond",
                          "spade",
                          "club",
                          "star",
                          "triangle",
                          "hexagon",
                          "pentagon",
                          "x",
                          "o",
                          "twinkle",
                        ] as const
                      ).map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => setDesign((d) => ({ ...d, moduleStyle: s }))}
                          style={[
                            styles.shapeBox,
                            design.moduleStyle === s && styles.shapeBoxActive,
                          ]}
                        >
                          <Text style={styles.shapeText}>{labelize(s)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {activeTab === "markers" && (
                  <View style={styles.tabPanel}>
                    <Text style={styles.inputLabel}>Corner Markers</Text>
                    <View style={styles.swatchGrid}>
                      {(
                        [
                          "square",
                          "rounded",
                          "circle",
                          "round-top-left",
                          "round-top-right",
                          "round-bottom-right",
                          "round-bottom-left",
                          "leaf-top-left",
                          "leaf-top-right",
                          "leaf-bottom-right",
                          "leaf-bottom-left",
                          "cut-top-left",
                          "cut-top-right",
                          "cut-bottom-right",
                          "cut-bottom-left",
                          "diamond",
                          "dotted-square",
                        ] as const
                      ).map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => setDesign((d) => ({ ...d, eyeStyle: s }))}
                          style={[styles.shapeBox, design.eyeStyle === s && styles.shapeBoxActive]}
                        >
                          <Text style={styles.shapeText}>{labelize(s)}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <Text style={styles.inputLabel}>Custom marker colors</Text>
                    <View style={styles.colorInputRow}>
                      <TinyColorInput
                        label="Top left outer"
                        value={design.eyeTopLeftOuterColor || design.eyeColorOuter || "#355f5d"}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeTopLeftOuterColor: v }))}
                      />
                      <TinyColorInput
                        label="Top left inner"
                        value={design.eyeTopLeftInnerColor || design.eyeColorInner || "#355f5d"}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeTopLeftInnerColor: v }))}
                      />
                      <TinyColorInput
                        label="Top right outer"
                        value={design.eyeTopRightOuterColor || design.eyeColorOuter || "#355f5d"}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeTopRightOuterColor: v }))}
                      />
                      <TinyColorInput
                        label="Top right inner"
                        value={design.eyeTopRightInnerColor || design.eyeColorInner || "#355f5d"}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeTopRightInnerColor: v }))}
                      />
                      <TinyColorInput
                        label="Bottom left outer"
                        value={design.eyeBottomLeftOuterColor || design.eyeColorOuter || "#355f5d"}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeBottomLeftOuterColor: v }))}
                      />
                      <TinyColorInput
                        label="Bottom left inner"
                        value={design.eyeBottomLeftInnerColor || design.eyeColorInner || "#355f5d"}
                        onChange={(v) => setDesign((d) => ({ ...d, eyeBottomLeftInnerColor: v }))}
                      />
                    </View>
                  </View>
                )}

                {activeTab === "frames" && (
                  <View style={styles.tabPanel}>
                    <View style={styles.swatchGrid}>
                      {QR_FRAME_OPTIONS.map((option) => (
                        <Pressable
                          key={option.id}
                          onPress={() =>
                            setDesign((d) => ({
                              ...d,
                              frame: {
                                ...(d.frame ?? { enabled: false }),
                                enabled: option.id !== "none",
                                style: frameStyleForOption(option.id),
                                color: d.frame?.color ?? d.sticker?.color ?? "#005244",
                              },
                              sticker: {
                                ...(d.sticker ?? {}),
                                style: option.id,
                                color: d.sticker?.color ?? d.frame?.color ?? "#005244",
                              },
                            }))
                          }
                          style={[
                            styles.frameBox,
                            (design.sticker?.style ?? "none") === option.id &&
                              styles.shapeBoxActive,
                          ]}
                        >
                          <FrameSwatch
                            color={design.sticker?.color || design.frame?.color || "#005244"}
                            id={option.id}
                          />
                          <Text style={styles.frameText}>{option.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.colorInputRow}>
                      <TinyColorInput
                        label="Frame color"
                        value={design.sticker?.color || design.frame?.color || "#005244"}
                        onChange={(v) =>
                          setDesign((d) => ({
                            ...d,
                            frame: { ...(d.frame ?? { enabled: true, style: "circle" }), color: v },
                            sticker: { ...(d.sticker ?? { style: "circle" }), color: v },
                          }))
                        }
                      />
                    </View>
                  </View>
                )}

                {activeTab === "logo" && (
                  <View style={styles.tabPanel}>
                    <View style={styles.swatchGrid}>
                      {PRESET_LOGOS.map((option) => (
                        <Pressable
                          key={option.id}
                          onPress={() =>
                            setDesign((d) => ({
                              ...d,
                              errorCorrectionLevel: "H",
                              logo:
                                option.id === "none"
                                  ? { mode: "none" }
                                  : {
                                      mode: "image",
                                      assetRef: option.asset!,
                                      fit: "contain",
                                      sizeRatio:
                                        d.logo?.mode === "image"
                                          ? logoSizePxToRatio(logoSizeRatioToPx(d.logo.sizeRatio))
                                          : logoSizePxToRatio(DEFAULT_LOGO_SIZE_PX),
                                      shape:
                                        d.logo?.mode === "image"
                                          ? (d.logo.shape ?? "circle")
                                          : "circle",
                                    },
                            }))
                          }
                          style={[
                            styles.frameBox,
                            (design.logo?.mode === "image" &&
                              design.logo.assetRef === option.asset) ||
                            (design.logo?.mode === "none" && option.id === "none")
                              ? styles.shapeBoxActive
                              : null,
                          ]}
                        >
                          <View style={styles.logoSwatch}>
                            {option.asset ? (
                              createElement("img", {
                                src: option.asset,
                                style: { width: "100%", height: "100%", objectFit: "contain" },
                              })
                            ) : (
                              <View style={styles.noneIcon}>
                                <Text style={styles.noneIconText}>Ø</Text>
                              </View>
                            )}
                          </View>
                        </Pressable>
                      ))}
                    </View>

                    <View style={styles.imageSelector}>
                      <View style={styles.fileUploadBox}>
                        {design.logo?.mode === "image" && design.logo.assetRef ? (
                          createElement("img", {
                            alt: "Uploaded logo preview",
                            src: design.logo.assetRef,
                            style: {
                              height: "100%",
                              objectFit: "contain",
                              width: "100%",
                            },
                          })
                        ) : (
                          <Text style={styles.logoEmptyText}>No Logo</Text>
                        )}
                      </View>

                      <View style={styles.logoControls}>
                        <Text style={styles.inputLabel}>Upload Custom Logo</Text>
                        {createElement("input", {
                          accept: "image/*",
                          type: "file",
                          onChange: (event: { currentTarget: HTMLInputElement }) => {
                            const file = event.currentTarget.files?.[0];
                            if (!file) {
                              return;
                            }
                            if (
                              ![
                                "image/png",
                                "image/jpeg",
                                "image/webp",
                                "image/gif",
                                "image/svg+xml",
                              ].includes(file.type) &&
                              !file.name.toLowerCase().endsWith(".svg")
                            ) {
                              return;
                            }

                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result;
                              if (typeof result !== "string") {
                                return;
                              }
                              setDesign((d) => ({
                                ...d,
                                errorCorrectionLevel: "H",
                                logo: {
                                  mode: "image",
                                  assetRef: result,
                                  fit: "contain",
                                  sizeRatio:
                                    d.logo?.mode === "image"
                                      ? logoSizePxToRatio(logoSizeRatioToPx(d.logo.sizeRatio))
                                      : logoSizePxToRatio(DEFAULT_LOGO_SIZE_PX),
                                  shape:
                                    d.logo?.mode === "image"
                                      ? (d.logo.shape ?? "circle")
                                      : "circle",
                                },
                              }));
                            };
                            reader.readAsDataURL(file);
                          },
                          style: {
                            maxWidth: "100%",
                          },
                        })}

                        <View style={styles.logoActionRow}>
                          <Pressable
                            onPress={() =>
                              setDesign((d) => ({
                                ...d,
                                logo: { mode: "none" },
                              }))
                            }
                            style={styles.secondaryButton}
                          >
                            <Text style={styles.secondaryButtonText}>Remove Logo</Text>
                          </Pressable>
                        </View>

                        <View style={styles.logoSizeControl}>
                          <View style={styles.logoSizeHeader}>
                            <Text style={styles.inputLabel}>Logo size</Text>
                            <Text style={styles.logoSizeValue}>
                              {design.logo?.mode === "image"
                                ? logoSizeRatioToPx(design.logo.sizeRatio)
                                : DEFAULT_LOGO_SIZE_PX}
                              px
                            </Text>
                          </View>
                          {createElement("input", {
                            "aria-label": "Logo size",
                            disabled: design.logo?.mode !== "image",
                            max: MAX_LOGO_SIZE_PX,
                            min: MIN_LOGO_SIZE_PX,
                            step: 1,
                            type: "range",
                            value:
                              design.logo?.mode === "image"
                                ? logoSizeRatioToPx(design.logo.sizeRatio)
                                : DEFAULT_LOGO_SIZE_PX,
                            onChange: (event: { currentTarget: HTMLInputElement }) => {
                              const next = Number(event.currentTarget.value);
                              setDesign((d) => ({
                                ...d,
                                logo:
                                  d.logo?.mode === "image"
                                    ? {
                                        ...d.logo,
                                        sizeRatio: logoSizePxToRatio(next),
                                      }
                                    : { mode: "none" },
                              }));
                            },
                            style: {
                              accentColor: "#005244",
                              width: "100%",
                            },
                          })}
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </SectionCard>
          </View>

          <View style={styles.column}>
            <QrPreview payload={payloadResult.payload} design={design} />
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

function labelize(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeHexInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return prefixed.slice(0, 9);
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

function TinyColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <View style={styles.tinyCol}>
      <Text style={styles.tinyLabel}>{label}</Text>
      <View style={styles.tinyInputBox}>
        {createElement("input", {
          "aria-label": `${label} picker`,
          type: "color",
          value: pickerValue,
          onChange: (event: { currentTarget: { value: string } }) =>
            onChange(event.currentTarget.value),
          style: {
            background: "transparent",
            border: "0",
            cursor: "pointer",
            height: 28,
            padding: 0,
            width: 32,
          },
        })}
        <TextInput
          style={styles.tinyInput}
          value={value}
          onChangeText={(next) => onChange(normalizeHexInput(next))}
          autoCapitalize="none"
          placeholder="#000000"
          placeholderTextColor={palette.muted}
        />
      </View>
      <View style={styles.miniSwatchRow}>
        {CURATED_COLORS.slice(0, 8).map((color) => (
          <Pressable
            key={`${label}-${color}`}
            accessibilityLabel={`Use ${color}`}
            onPress={() => onChange(color)}
            style={[
              styles.miniSwatch,
              { backgroundColor: color },
              value.toLowerCase() === color.toLowerCase() && styles.miniSwatchActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function frameStyleForOption(id: QrStickerStyle): "none" | "circle" | "rounded" {
  if (id === "circle") {
    return "circle";
  }
  if (id === "rounded-square") {
    return "rounded";
  }
  return "none";
}

function FrameSwatch({ color, id }: { color: string; id: QrStickerStyle }) {
  const stroke = color || "#005244";
  const common = {
    fill: "none",
    stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 4,
  };

  const children: ReturnType<typeof createElement>[] = [];
  const add = (tag: string, props: Record<string, unknown>) => {
    children.push(createElement(tag, { key: children.length, ...props }));
  };

  switch (id) {
    case "none":
      add("path", { ...common, d: "M24 24L76 76M76 24L24 76" });
      break;
    case "circle":
      add("circle", { ...common, cx: 50, cy: 50, r: 36 });
      break;
    case "rounded-square":
      add("rect", { ...common, x: 18, y: 18, width: 64, height: 64, rx: 14 });
      break;
    case "scan-me-speech-bubble":
      add("path", {
        ...common,
        d: "M13 10H87Q94 10 94 17V68Q94 75 87 75H43L27 86V75H13Q6 75 6 68V17Q6 10 13 10Z",
      });
      break;
    case "storefront":
      add("path", {
        ...common,
        d: "M16 26H84L78 11H22ZM21 26V80H79V26M16 26A8.5 8 0 0 0 33 26A8.5 8 0 0 0 50 26A8.5 8 0 0 0 67 26A8.5 8 0 0 0 84 26",
      });
      break;
    case "coffee-cup":
      add("path", {
        ...common,
        d: "M20 21H70V60Q70 74 55 74H35Q20 74 20 60ZM70 34H78Q88 34 88 46Q88 58 78 58H70M31 12C27 7 33 5 29 1M47 12C43 7 49 5 45 1M63 12C59 7 65 5 61 1M18 83H72",
      });
      break;
    case "mobile-phone":
      add("rect", { ...common, x: 18, y: 5, width: 64, height: 80, rx: 10 });
      add("path", { ...common, d: "M39 12H61M46 76H54" });
      break;
    case "gift-box":
      add("path", {
        ...common,
        d: "M15 34H85V93H15ZM10 24H90V38H10ZM50 24V38M34 24C22 16 30 7 42 21M66 24C78 16 70 7 58 21",
      });
      break;
    case "clipboard":
      add("rect", { ...common, x: 18, y: 12, width: 64, height: 74, rx: 6 });
      add("path", { ...common, d: "M38 8H62Q65 8 65 12V19H35V12Q35 8 38 8ZM30 76H70" });
      break;
    case "dashed-border-hearts":
      add("rect", {
        ...common,
        x: 8,
        y: 8,
        width: 84,
        height: 84,
        rx: 16,
        strokeDasharray: "4 4",
      });
      add("path", {
        fill: stroke,
        d: "M20 18C15 13 8 20 20 29C32 20 25 13 20 18ZM80 18C75 13 68 20 80 29C92 20 85 13 80 18ZM20 78C15 73 8 80 20 89C32 80 25 73 20 78ZM80 78C75 73 68 80 80 89C92 80 85 73 80 78Z",
      });
      break;
    case "ticket-pass":
      add("path", {
        ...common,
        d: "M11 22H89V35Q79 35 79 50Q79 65 89 65V78H11V65Q21 65 21 50Q21 35 11 35Z",
      });
      add("path", { ...common, strokeDasharray: "3 4", strokeWidth: 2.4, d: "M26 28V72M74 28V72" });
      break;
    case "shopping-bag":
      add("path", { ...common, d: "M19 28H81L85 88H15ZM35 28Q35 12 50 12Q65 12 65 28" });
      break;
    case "acorn":
      add("path", {
        ...common,
        transform: "translate(-7.94, 4.85)",
        d: "M 84.45 43.08 C 88.62 42.05 88.62 21.76 64.15 19.67 C 63.74 18.62 61.84 14.07 58.00 12.41 C 57.52 12.21 57.03 12.07 56.52 12.00 C 56.22 11.96 56.00 12.33 56.19 12.57 C 57.10 13.68 57.90 17.62 56.45 19.62 C 31.44 21.45 31.42 42.04 35.62 43.08 L 38.25 47.21 C 38.05 47.17 37.85 47.17 37.65 47.22 C 37.45 47.26 37.27 47.35 37.11 47.47 C 36.95 47.59 36.82 47.75 36.72 47.93 C 36.62 48.11 36.57 48.31 36.55 48.51 C 36.15 54.12 36.44 71.75 56.52 75.25 C 57.59 76.18 59.38 78.31 60.03 78.30 C 60.67 78.31 62.46 76.18 63.53 75.25 C 83.46 71.37 83.86 54.08 83.49 48.52 C 83.48 48.32 83.42 48.12 83.32 47.94 C 83.23 47.76 83.10 47.60 82.94 47.48 C 82.77 47.35 82.59 47.26 82.39 47.22 C 82.20 47.17 81.99 47.17 81.79 47.21 Z",
      });
      break;
  }

  return createElement(
    "svg",
    {
      "aria-hidden": true,
      viewBox: "0 0 100 100",
      style: { height: 42, width: 42 },
    },
    ...children,
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
  designTab: {
    marginTop: spacing.xs,
  },
  tabsHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingBottom: spacing.sm,
    gap: spacing.lg,
    alignItems: "center",
  },
  tabBtn: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: palette.highlight,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.muted,
  },
  tabBtnTextActive: {
    color: palette.ink,
  },
  favBtn: {
    marginLeft: "auto",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#4db8a6",
    borderRadius: radii.sm,
  },
  favBtnText: {
    color: "#4db8a6",
    fontSize: 12,
    fontWeight: "600",
  },
  tabPanel: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatchWrap: {
    padding: 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  swatchWrapActive: {
    borderColor: "#16a34a",
  },
  swatchSquare: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  colorInputRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tinyCol: {
    gap: spacing.xs,
    flex: 1,
    minWidth: 120,
  },
  tinyLabel: {
    fontSize: 11,
    color: palette.muted,
  },
  tinyInputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.sm,
    padding: 4,
  },
  tinyInput: {
    flex: 1,
    fontSize: 13,
    color: palette.ink,
  },
  miniSwatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  miniSwatch: {
    borderColor: palette.border,
    borderRadius: 3,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  miniSwatchActive: {
    borderColor: palette.ink,
    borderWidth: 2,
  },
  shapeBox: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
  },
  frameBox: {
    width: 92,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    padding: spacing.xs,
  },
  shapeBoxActive: {
    borderColor: "#16a34a",
  },
  shapeText: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.ink,
  },
  frameText: {
    color: palette.ink,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  logoSwatch: {
    height: 32,
    width: 32,
  },
  imageSelector: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  fileUploadBox: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    padding: spacing.sm,
    width: 120,
  },
  logoPreviewBox: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    padding: spacing.sm,
    width: 120,
  },
  logoEmptyText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  logoControls: {
    flex: 1,
    gap: spacing.md,
    minWidth: 220,
  },
  logoActionRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  logoSizeControl: {
    gap: spacing.xs,
  },
  logoSizeHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoSizeValue: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  noneIcon: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  noneIconText: {
    color: palette.muted,
    fontSize: 24,
    opacity: 0.3,
  },
  secondaryButton: {
    borderColor: palette.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
  },
});
