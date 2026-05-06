import { encodeQrPayload, type QrPayloadConfigV1 } from "./payloads";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type QrBodyStyle =
  | "square"
  | "rounded"
  | "dot"
  | "heart"
  | "diamond"
  | "spade"
  | "club"
  | "star"
  | "triangle"
  | "hexagon"
  | "pentagon"
  | "x"
  | "o"
  | "twinkle";
export type QrEyeStyle =
  | "square"
  | "rounded"
  | "circle"
  | "dot"
  | "leaf"
  | "diamond"
  | "dotted-square"
  | "round-top-left"
  | "round-top-right"
  | "round-bottom-right"
  | "round-bottom-left"
  | "leaf-top-left"
  | "leaf-top-right"
  | "leaf-bottom-right"
  | "leaf-bottom-left"
  | "cut-top-left"
  | "cut-top-right"
  | "cut-bottom-right"
  | "cut-bottom-left";
export type QrStickerStyle =
  | "none"
  | "circle"
  | "rounded-square"
  | "scan-me-bottom"
  | "badge"
  | "scan-me-speech-bubble"
  | "storefront"
  | "coffee-cup"
  | "mobile-phone"
  | "gift-box"
  | "clipboard"
  | "dashed-border-hearts"
  | "ticket-pass"
  | "shopping-bag"
  | "classic-bottom-banner"
  | "acorn";

export type QrDesignConfigV1 = {
  schemaVersion: "qurl.qr-design-config.v1";
  errorCorrectionLevel: QrErrorCorrectionLevel;
  quietZoneModules: number;
  foregroundColor: string;
  backgroundColor: string;
  backgroundTransparent: boolean;
  moduleStyle: QrBodyStyle;
  eyeStyle: QrEyeStyle;
  eyeColorOuter?: string;
  eyeColorInner?: string;
  eyeTopLeftStyle?: QrEyeStyle;
  eyeTopRightStyle?: QrEyeStyle;
  eyeBottomLeftStyle?: QrEyeStyle;
  eyeTopLeftOuterColor?: string;
  eyeTopLeftInnerColor?: string;
  eyeTopRightOuterColor?: string;
  eyeTopRightInnerColor?: string;
  eyeBottomLeftOuterColor?: string;
  eyeBottomLeftInnerColor?: string;
  logo:
  | { mode: "none" }
  | {
    mode: "text" | "image";
    assetRef?: string;
    text?: string;
    fit?: "contain" | "cover";
    sizeRatio?: number;
    backgroundColor?: string;
    foregroundColor?: string;
    shape?: "circle" | "rounded-square" | "none";
  };
  frame: {
    enabled: boolean;
    style?: "none" | "square" | "rounded" | "pill" | "circle";
    label?: string;
    labelPosition?: "top" | "bottom";
    color?: string;
  };
  sticker?: {
    style: QrStickerStyle;
    text?: string;
    color?: string;
  };
  templateId?: string;
};

export type QrExportConfigV1 = {
  schemaVersion: "qurl.qr-export-config.v1";
  format: "svg" | "png";
  pixelSize: number;
  marginModules: number;
  transparentBackground: boolean;
  fileName: string;
};

export type QrProjectConfigV1 = {
  schemaVersion: "qurl.qr-project-config.v1";
  name: string;
  payload: QrPayloadConfigV1;
  design: QrDesignConfigV1;
  export: QrExportConfigV1;
};

const DEFAULT_PROJECT_NAME = "Direct QR";

function slugifyFileName(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? `qurl-${slug.slice(0, 48)}` : "qurl-qr";
}

export function createQrProjectConfig(
  payload: QrPayloadConfigV1,
  designOverride?: Partial<QrDesignConfigV1>,
): QrProjectConfigV1 {
  const encodedPayload = encodeQrPayload(payload);

  return {
    schemaVersion: "qurl.qr-project-config.v1",
    name: DEFAULT_PROJECT_NAME,
    payload,
    design: {
      schemaVersion: "qurl.qr-design-config.v1",
      errorCorrectionLevel: "H",
      quietZoneModules: 4,
      foregroundColor: "#355f5d",
      backgroundColor: "#ffffff",
      backgroundTransparent: false,
      moduleStyle: "dot",
      eyeStyle: "leaf",
      eyeColorOuter: "#355f5d",
      eyeColorInner: "#355f5d",
      logo: { mode: "none" },
      frame: { enabled: true, style: "circle", color: "#005244" },
      sticker: { style: "circle", color: "#005244" },
      ...designOverride,
    },
    export: {
      schemaVersion: "qurl.qr-export-config.v1",
      format: "svg",
      pixelSize: 1024,
      marginModules: 4,
      transparentBackground: false,
      fileName: slugifyFileName(encodedPayload),
    },
  };
}

export function createDirectUrlProjectConfig(payload: QrPayloadConfigV1<"url">): QrProjectConfigV1 {
  return createQrProjectConfig(payload);
}
