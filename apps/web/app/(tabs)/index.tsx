import { createElement, useState, type Dispatch, type SetStateAction } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  createQrPayload,
  encodeQrPayload,
  QR_FRAME_OPTIONS,
  QR_TYPE_REGISTRY_V1,
  type QrBodyStyle,
  type QrDesignConfigV1,
  type QrErrorCorrectionLevel,
  type QrEyeStyle,
  type QrStickerStyle,
  type QrPayloadConfigV1,
  type QrPayloadKind,
} from "@qurl/qr-core";
import { layout, palette, radii, spacing } from "@qurl/ui";

import { PRESET_LOGOS_DATA } from "../../src/lib/preset-logos";
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

const MARKER_STYLES: QrEyeStyle[] = [
  "square",
  "rounded",
  "circle",
  "teardrop-top-right",
  "teardrop-bottom-right",
  "teardrop-bottom-left",
  "teardrop-top-left",
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
];

const ERROR_CORRECTION_OPTIONS: Array<{ label: string; value: QrErrorCorrectionLevel }> = [
  { label: "Very low", value: "L" },
  { label: "Low", value: "M" },
  { label: "Medium", value: "Q" },
  { label: "High", value: "H" },
];

type MarkerCorner = "top-left" | "top-right" | "bottom-left";

const MARKER_CORNERS: Array<{ id: MarkerCorner; label: string }> = [
  { id: "top-left", label: "Top left" },
  { id: "top-right", label: "Top right" },
  { id: "bottom-left", label: "Bottom left" },
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
  { id: "scan-me-focused", name: "Scan Me Focused", asset: PRESET_LOGOS_DATA["scan-me-focused"] },
  { id: "scan-me-simple", name: "Scan Me Simple", asset: PRESET_LOGOS_DATA["scan-me-simple"] },
  { id: "scan-me-rounded", name: "Scan Me Rounded", asset: PRESET_LOGOS_DATA["scan-me-rounded"] },
  { id: "scan-me-italic", name: "Scan Me Italic", asset: PRESET_LOGOS_DATA["scan-me-italic"] },
  { id: "rating", name: "Star", asset: PRESET_LOGOS_DATA["rating"] },
  { id: "business", name: "Shop", asset: PRESET_LOGOS_DATA["business"] },
  { id: "vcard", name: "Card", asset: PRESET_LOGOS_DATA["vcard"] },
  { id: "pdf", name: "PDF", asset: PRESET_LOGOS_DATA["pdf"] },
  { id: "percent", name: "Percent", asset: PRESET_LOGOS_DATA["percent"] },
  { id: "facebook", name: "Facebook", asset: PRESET_LOGOS_DATA["facebook"] },
  { id: "instagram", name: "Instagram", asset: PRESET_LOGOS_DATA["instagram"] },
  { id: "linkedin", name: "LinkedIn", asset: PRESET_LOGOS_DATA["linkedin"] },
  { id: "x", name: "X", asset: PRESET_LOGOS_DATA["x"] },
  { id: "youtube", name: "YouTube", asset: PRESET_LOGOS_DATA["youtube"] },
  { id: "tiktok", name: "TikTok", asset: PRESET_LOGOS_DATA["tiktok"] },
  { id: "pinterest", name: "Pinterest", asset: PRESET_LOGOS_DATA["pinterest"] },
  { id: "app-store", name: "App Store", asset: PRESET_LOGOS_DATA["app-store"] },
  { id: "gmail", name: "Gmail", asset: PRESET_LOGOS_DATA["gmail"] },
  { id: "behance", name: "Behance", asset: PRESET_LOGOS_DATA["behance"] },
  { id: "wifi", name: "Wifi", asset: PRESET_LOGOS_DATA["wifi"] },
  { id: "power-point", name: "PowerPoint", asset: PRESET_LOGOS_DATA["power-point"] },
  { id: "spotify", name: "Spotify", asset: PRESET_LOGOS_DATA["spotify"] },
  { id: "pdf-icon", name: "PDF Red", asset: PRESET_LOGOS_DATA["pdf-icon"] },
];

export default function CreateScreen() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [activeKind, setActiveKind] = useState<QrPayloadKind>("url");

  const [design, setDesign] = useState<Partial<QrDesignConfigV1>>({
    errorCorrectionLevel: "M",
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

  const [activeTab, setActiveTab] = useState<"payload" | "frames" | "logo" | "pattern" | "markers">(
    "payload",
  );
  const [markerMode, setMarkerMode] = useState<"all" | "custom">("all");

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
                          <PatternSwatch color={design.foregroundColor ?? "#355f5d"} id={s} />
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.logoSizeControl}>
                      <View style={styles.logoSizeHeader}>
                        <Text style={styles.inputLabel}>Error correction</Text>
                        <Text style={styles.logoSizeValue}>
                          {
                            ERROR_CORRECTION_OPTIONS.find(
                              (option) => option.value === (design.errorCorrectionLevel ?? "M"),
                            )?.label
                          }
                        </Text>
                      </View>
                      {createElement("input", {
                        "aria-label": "Error correction",
                        max: ERROR_CORRECTION_OPTIONS.length - 1,
                        min: 0,
                        step: 1,
                        type: "range",
                        value: Math.max(
                          0,
                          ERROR_CORRECTION_OPTIONS.findIndex(
                            (option) => option.value === (design.errorCorrectionLevel ?? "M"),
                          ),
                        ),
                        onChange: (event: { currentTarget: HTMLInputElement }) => {
                          const next = ERROR_CORRECTION_OPTIONS[Number(event.currentTarget.value)];
                          setDesign((d) => ({
                            ...d,
                            errorCorrectionLevel: next?.value ?? "M",
                          }));
                        },
                        style: {
                          accentColor: "#005244",
                          width: "100%",
                        },
                      })}
                      {(design.errorCorrectionLevel ?? "M") === "L" ? (
                        <Text style={styles.warningCopy}>
                          Very low reduces scan resilience. Avoid it for styled or logo QR codes.
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.colorInputRow}>
                      <TinyColorInput
                        label="Pattern color"
                        value={design.foregroundColor || ""}
                        onChange={(v) => setDesign((d) => ({ ...d, foregroundColor: v }))}
                      />
                    </View>
                  </View>
                )}

                {activeTab === "markers" && (
                  <View style={styles.tabPanel}>
                    <Text style={styles.inputLabel}>Corner Markers</Text>
                    <View style={styles.segmentedControl}>
                      {(["all", "custom"] as const).map((mode) => (
                        <Pressable
                          key={mode}
                          onPress={() => setMarkerMode(mode)}
                          style={[
                            styles.segmentButton,
                            markerMode === mode && styles.segmentButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.segmentButtonText,
                              markerMode === mode && styles.segmentButtonTextActive,
                            ]}
                          >
                            {mode === "all" ? "All" : "Custom"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {markerMode === "all" ? (
                      <>
                        <View style={styles.swatchGrid}>
                          {MARKER_STYLES.map((s) => (
                            <Pressable
                              key={s}
                              accessibilityLabel={labelize(s)}
                              onPress={() =>
                                setDesign((d) => ({
                                  ...d,
                                  eyeStyle: s,
                                  eyeTopLeftStyle: undefined,
                                  eyeTopRightStyle: undefined,
                                  eyeBottomLeftStyle: undefined,
                                }))
                              }
                              style={[
                                styles.shapeBox,
                                design.eyeStyle === s && styles.shapeBoxActive,
                              ]}
                            >
                              <MarkerSwatch
                                color={design.eyeColorOuter ?? design.foregroundColor ?? "#355f5d"}
                                id={s}
                              />
                            </Pressable>
                          ))}
                        </View>
                        <Text style={styles.inputLabel}>Marker colors</Text>
                        <View style={styles.colorInputRow}>
                          <TinyColorInput
                            label="Outer color"
                            value={design.eyeColorOuter || "#355f5d"}
                            onChange={(v) =>
                              setDesign((d) => ({
                                ...d,
                                eyeColorOuter: v,
                                eyeTopLeftOuterColor: undefined,
                                eyeTopRightOuterColor: undefined,
                                eyeBottomLeftOuterColor: undefined,
                              }))
                            }
                          />
                          <TinyColorInput
                            label="Inner color"
                            value={design.eyeColorInner || "#355f5d"}
                            onChange={(v) =>
                              setDesign((d) => ({
                                ...d,
                                eyeColorInner: v,
                                eyeTopLeftInnerColor: undefined,
                                eyeTopRightInnerColor: undefined,
                                eyeBottomLeftInnerColor: undefined,
                              }))
                            }
                          />
                        </View>
                      </>
                    ) : (
                      <View style={styles.markerCustomStack}>
                        {MARKER_CORNERS.map((corner) => (
                          <MarkerCornerEditor
                            key={corner.id}
                            corner={corner.id}
                            design={design}
                            label={corner.label}
                            setDesign={setDesign}
                          />
                        ))}
                      </View>
                    )}
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
                      <View style={styles.tinyCol}>
                        <Text style={styles.tinyLabel}>Transparency</Text>
                        <Pressable
                          onPress={() =>
                            setDesign((d) => ({
                              ...d,
                              backgroundTransparent: !d.backgroundTransparent,
                            }))
                          }
                          style={[
                            styles.modeChip,
                            design.backgroundTransparent && styles.modeChipActive,
                            { height: 38, justifyContent: "center", alignItems: "center" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modeText,
                              design.backgroundTransparent && styles.modeTextActive,
                            ]}
                          >
                            {design.backgroundTransparent ? "Transparent" : "Opaque"}
                          </Text>
                        </Pressable>
                      </View>
                      <TinyColorInput
                        label="Background color"
                        value={design.backgroundColor || ""}
                        disabled={design.backgroundTransparent}
                        onChange={(v) => setDesign((d) => ({ ...d, backgroundColor: v }))}
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <View style={[styles.tinyCol, disabled && { opacity: 0.5 }]}>
      <Text style={styles.tinyLabel}>{label}</Text>
      <View style={styles.tinyInputBox}>
        <View style={{ width: 32, height: 28, marginRight: 8 }}>
          {createElement("input", {
            "aria-label": `${label} picker`,
            disabled,
            type: "color",
            value: pickerValue,
            onChange: (event: { currentTarget: { value: string } }) =>
              onChange(event.currentTarget.value),
            style: {
              background: "transparent",
              border: "0",
              cursor: disabled ? "default" : "pointer",
              height: "100%",
              padding: 0,
              width: "100%",
            },
          })}
        </View>
        <TextInput
          style={styles.tinyInput}
          value={value}
          onChangeText={(next) => onChange(normalizeHexInput(next))}
          autoCapitalize="none"
          placeholder="#000000"
          placeholderTextColor={palette.muted}
          editable={!disabled}
        />
      </View>
      <View style={styles.miniSwatchRow}>
        {CURATED_COLORS.slice(0, 8).map((color) => (
          <Pressable
            key={`${label}-${color}`}
            accessibilityLabel={`Use ${color}`}
            disabled={disabled}
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

function PatternSwatch({ color, id }: { color: string; id: QrBodyStyle }) {
  const fill = color || "#355f5d";
  const stroke = fill;
  const common = {
    fill,
    shapeRendering: "geometricPrecision",
  };
  const children: ReturnType<typeof createElement>[] = [];
  const add = (tag: string, props: Record<string, unknown>) => {
    children.push(createElement(tag, { key: children.length, ...props }));
  };

  switch (id) {
    case "square":
      add("rect", { ...common, x: 24, y: 24, width: 52, height: 52 });
      break;
    case "rounded":
      add("rect", { ...common, x: 23, y: 23, width: 54, height: 54, rx: 13, ry: 13 });
      break;
    case "dot":
      add("circle", { ...common, cx: 50, cy: 50, r: 27 });
      break;
    case "heart":
      add("path", {
        ...common,
        d: "M50 78C26 59 20 40 31 29C40 20 48 25 50 37C52 25 60 20 69 29C80 40 74 59 50 78Z",
      });
      break;
    case "diamond":
      add("path", { ...common, d: "M50 18L82 50L50 82L18 50Z" });
      break;
    case "spade":
      add("path", {
        ...common,
        d: "M50 18C27 36 18 54 31 65C40 73 48 65 50 55C52 65 60 73 69 65C82 54 73 36 50 18Z",
      });
      add("path", { ...common, d: "M44 58H56L66 82H34Z" });
      break;
    case "club":
      add("circle", { ...common, cx: 50, cy: 32, r: 15 });
      add("circle", { ...common, cx: 34, cy: 56, r: 15 });
      add("circle", { ...common, cx: 66, cy: 56, r: 15 });
      add("path", { ...common, d: "M50 53L62 82H38Z" });
      break;
    case "star":
      add("path", {
        ...common,
        d: "M50 17L59 39H83L64 54L72 78L50 64L28 78L36 54L17 39H41Z",
      });
      break;
    case "triangle":
      add("path", { ...common, d: "M50 18L82 79H18Z" });
      break;
    case "hexagon":
      add("path", { ...common, d: "M33 18H67L85 50L67 82H33L15 50Z" });
      break;
    case "pentagon":
      add("path", { ...common, d: "M50 17L82 42L70 82H30L18 42Z" });
      break;
    case "x":
      add("path", {
        ...common,
        d: "M24 16L50 40L76 16L84 24L60 50L84 76L76 84L50 60L24 84L16 76L40 50L16 24Z",
      });
      break;
    case "o":
      add("circle", {
        cx: 50,
        cy: 50,
        fill: "none",
        r: 25,
        shapeRendering: "geometricPrecision",
        stroke,
        strokeWidth: 12,
      });
      break;
    case "twinkle":
      add("path", { ...common, d: "M50 12L60 40L88 50L60 60L50 88L40 60L12 50L40 40Z" });
      break;
  }

  return createElement(
    "svg",
    {
      "aria-hidden": true,
      focusable: false,
      viewBox: "0 0 100 100",
      style: { height: 42, width: 42 },
    },
    ...children,
  );
}

function MarkerCornerEditor({
  corner,
  design,
  label,
  setDesign,
}: {
  corner: MarkerCorner;
  design: Partial<QrDesignConfigV1>;
  label: string;
  setDesign: Dispatch<SetStateAction<Partial<QrDesignConfigV1>>>;
}) {
  const selectedStyle = markerStyleForCorner(design, corner);
  const outerColor = markerOuterColorForCorner(design, corner);
  const innerColor = markerInnerColorForCorner(design, corner);

  return (
    <View style={styles.markerCornerPanel}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.markerCornerGrid}>
        {MARKER_STYLES.map((style) => (
          <Pressable
            key={`${corner}-${style}`}
            accessibilityLabel={`${label} ${labelize(style)}`}
            onPress={() => setDesign((d) => setMarkerStyleForCorner(d, corner, style))}
            style={[styles.markerMiniBox, selectedStyle === style && styles.shapeBoxActive]}
          >
            <MarkerSwatch color={outerColor} id={style} size={30} />
          </Pressable>
        ))}
      </View>
      <View style={styles.colorInputRow}>
        <TinyColorInput
          label="Outer color"
          value={outerColor}
          onChange={(v) => setDesign((d) => setMarkerOuterColorForCorner(d, corner, v))}
        />
        <TinyColorInput
          label="Inner color"
          value={innerColor}
          onChange={(v) => setDesign((d) => setMarkerInnerColorForCorner(d, corner, v))}
        />
      </View>
    </View>
  );
}

function markerStyleForCorner(design: Partial<QrDesignConfigV1>, corner: MarkerCorner): QrEyeStyle {
  if (corner === "top-left") {
    return design.eyeTopLeftStyle ?? design.eyeStyle ?? "leaf";
  }
  if (corner === "top-right") {
    return design.eyeTopRightStyle ?? design.eyeStyle ?? "leaf";
  }
  return design.eyeBottomLeftStyle ?? design.eyeStyle ?? "leaf";
}

function markerOuterColorForCorner(
  design: Partial<QrDesignConfigV1>,
  corner: MarkerCorner,
): string {
  if (corner === "top-left") {
    return design.eyeTopLeftOuterColor ?? design.eyeColorOuter ?? "#355f5d";
  }
  if (corner === "top-right") {
    return design.eyeTopRightOuterColor ?? design.eyeColorOuter ?? "#355f5d";
  }
  return design.eyeBottomLeftOuterColor ?? design.eyeColorOuter ?? "#355f5d";
}

function markerInnerColorForCorner(
  design: Partial<QrDesignConfigV1>,
  corner: MarkerCorner,
): string {
  if (corner === "top-left") {
    return design.eyeTopLeftInnerColor ?? design.eyeColorInner ?? "#355f5d";
  }
  if (corner === "top-right") {
    return design.eyeTopRightInnerColor ?? design.eyeColorInner ?? "#355f5d";
  }
  return design.eyeBottomLeftInnerColor ?? design.eyeColorInner ?? "#355f5d";
}

function setMarkerStyleForCorner(
  design: Partial<QrDesignConfigV1>,
  corner: MarkerCorner,
  style: QrEyeStyle,
): Partial<QrDesignConfigV1> {
  if (corner === "top-left") {
    return { ...design, eyeTopLeftStyle: style };
  }
  if (corner === "top-right") {
    return { ...design, eyeTopRightStyle: style };
  }
  return { ...design, eyeBottomLeftStyle: style };
}

function setMarkerOuterColorForCorner(
  design: Partial<QrDesignConfigV1>,
  corner: MarkerCorner,
  color: string,
): Partial<QrDesignConfigV1> {
  if (corner === "top-left") {
    return { ...design, eyeTopLeftOuterColor: color };
  }
  if (corner === "top-right") {
    return { ...design, eyeTopRightOuterColor: color };
  }
  return { ...design, eyeBottomLeftOuterColor: color };
}

function setMarkerInnerColorForCorner(
  design: Partial<QrDesignConfigV1>,
  corner: MarkerCorner,
  color: string,
): Partial<QrDesignConfigV1> {
  if (corner === "top-left") {
    return { ...design, eyeTopLeftInnerColor: color };
  }
  if (corner === "top-right") {
    return { ...design, eyeTopRightInnerColor: color };
  }
  return { ...design, eyeBottomLeftInnerColor: color };
}

function MarkerSwatch({ color, id, size = 42 }: { color: string; id: QrEyeStyle; size?: number }) {
  const fill = color || "#355f5d";
  const bg = "#ffffff";
  const normalized = id === "dot" ? "circle" : id === "leaf" ? "leaf-top-left" : id;
  const children: ReturnType<typeof createElement>[] = [];
  const add = (tag: string, props: Record<string, unknown>) => {
    children.push(createElement(tag, { key: children.length, ...props }));
  };

  if (normalized === "dotted-square") {
    add("rect", { fill, height: 54, width: 54, x: 23, y: 23 });
    add("rect", { fill: bg, height: 34, width: 34, x: 33, y: 33 });
    add("rect", { fill, height: 18, width: 18, x: 41, y: 41 });
  } else if (normalized === "circle") {
    add("circle", { cx: 50, cy: 50, fill, r: 34 });
    add("circle", { cx: 50, cy: 50, fill: bg, r: 23 });
    add("circle", { cx: 50, cy: 50, fill, r: 13 });
  } else if (normalized === "diamond") {
    add("path", { d: "M50 14L86 50L50 86L14 50Z", fill });
    add("path", { d: "M50 28L72 50L50 72L28 50Z", fill: bg });
    add("path", { d: "M50 38L62 50L50 62L38 50Z", fill });
  } else if (normalized.startsWith("teardrop")) {
    add("path", { d: markerTeardropPath(normalized, 16, 16, 68, 68), fill });
    add("path", { d: markerTeardropPath(normalized, 29, 29, 42, 42), fill: bg });
    add("path", { d: markerTeardropPath(normalized, 40, 40, 20, 20), fill });
  } else {
    add("path", { d: markerOuterPath(normalized), fill });
    add("path", { d: markerMiddlePath(normalized), fill: bg });
    add("path", { d: markerInnerPath(normalized), fill });
  }

  return createElement(
    "svg",
    {
      "aria-hidden": true,
      focusable: false,
      viewBox: "0 0 100 100",
      style: { height: size, width: size },
    },
    ...children,
  );
}

function markerOuterPath(style: QrEyeStyle): string {
  return markerRoundedPath(style, 16, 16, 68, 68, 18);
}

function markerMiddlePath(style: QrEyeStyle): string {
  return markerRoundedPath(style, 29, 29, 42, 42, 11);
}

function markerInnerPath(style: QrEyeStyle): string {
  return markerRoundedPath(style, 40, 40, 20, 20, 6);
}

function markerTeardropPath(style: QrEyeStyle, x: number, y: number, w: number, h: number): string {
  const p = (n: number) => Number(n.toFixed(2));
  const direction = style === "teardrop" ? "teardrop-top-right" : style;
  const px = (unitX: number) =>
    direction === "teardrop-top-left" || direction === "teardrop-bottom-left"
      ? x + w * (1 - unitX)
      : x + w * unitX;
  const py = (unitY: number) =>
    direction === "teardrop-bottom-right" || direction === "teardrop-bottom-left"
      ? y + h * (1 - unitY)
      : y + h * unitY;
  return [
    `M${p(px(0.42))} ${p(py(0))}`,
    `L${p(px(1))} ${p(py(0))}`,
    `L${p(px(1))} ${p(py(0.58))}`,
    `C${p(px(1))} ${p(py(0.84))} ${p(px(0.82))} ${p(py(1))} ${p(px(0.52))} ${p(py(1))}`,
    `C${p(px(0.22))} ${p(py(1))} ${p(px(0))} ${p(py(0.78))} ${p(px(0))} ${p(py(0.5))}`,
    `C${p(px(0))} ${p(py(0.22))} ${p(px(0.2))} ${p(py(0))} ${p(px(0.42))} ${p(py(0))}`,
    "Z",
  ].join("");
}

function markerRoundedPath(
  style: QrEyeStyle,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  let tl = 4;
  let tr = 4;
  let br = 4;
  let bl = 4;
  switch (style) {
    case "rounded":
      tl = tr = br = bl = r;
      break;
    case "round-top-left":
      tl = r;
      break;
    case "round-top-right":
      tr = r;
      break;
    case "round-bottom-right":
      br = r;
      break;
    case "round-bottom-left":
      bl = r;
      break;
    case "leaf-top-left":
      tl = bl = r * 1.35;
      break;
    case "leaf-top-right":
      tr = br = r * 1.35;
      break;
    case "leaf-bottom-right":
      tl = br = r * 1.35;
      break;
    case "leaf-bottom-left":
      tr = bl = r * 1.35;
      break;
    case "cut-top-left":
      return `M${x} ${y + r}L${x + r} ${y}H${x + w}V${y + h}H${x}Z`;
    case "cut-top-right":
      return `M${x} ${y}H${x + w - r}L${x + w} ${y + r}V${y + h}H${x}Z`;
    case "cut-bottom-right":
      return `M${x} ${y}H${x + w}V${y + h - r}L${x + w - r} ${y + h}H${x}Z`;
    case "cut-bottom-left":
      return `M${x} ${y}H${x + w}V${y + h}H${x + r}L${x} ${y + h - r}Z`;
    case "square":
      tl = tr = br = bl = 0;
      break;
  }
  return `M${x + tl} ${y}H${x + w - tr}Q${x + w} ${y} ${x + w} ${y + tr}V${y + h - br}Q${x + w} ${y + h} ${x + w - br} ${y + h}H${x + bl}Q${x} ${y + h} ${x} ${y + h - bl}V${y + tl}Q${x} ${y} ${x + tl} ${y}Z`;
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
  warningCopy: {
    color: "#b54708",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
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
  segmentedControl: {
    alignSelf: "flex-start",
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 3,
  },
  segmentButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  segmentButtonActive: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
  },
  segmentButtonText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentButtonTextActive: {
    color: palette.accent,
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
  markerCustomStack: {
    gap: spacing.lg,
  },
  markerCornerPanel: {
    gap: spacing.md,
  },
  markerCornerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  markerMiniBox: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
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
