import type { DirectUrlPayloadConfigV1 } from "./direct-url";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export type QrDesignConfigV1 = {
  schemaVersion: "qurl.qr-design-config.v1";
  errorCorrectionLevel: QrErrorCorrectionLevel;
  quietZoneModules: number;
  foregroundColor: string;
  backgroundColor: string;
  backgroundTransparent: boolean;
  moduleStyle: "square";
  eyeStyle: "square";
  logo: { mode: "none" };
  frame: { enabled: false; style: "none" };
};

export type QrExportConfigV1 = {
  schemaVersion: "qurl.qr-export-config.v1";
  format: "svg";
  pixelSize: number;
  marginModules: number;
  transparentBackground: boolean;
  fileName: string;
};

export type QrProjectConfigV1 = {
  schemaVersion: "qurl.qr-project-config.v1";
  name: string;
  payload: DirectUrlPayloadConfigV1;
  design: QrDesignConfigV1;
  export: QrExportConfigV1;
};

const DEFAULT_PROJECT_NAME = "Direct QR";

function slugifyFileName(input: string): string {
  const hostname = new URL(input).hostname.replace(/^www\./, "");
  const slug = hostname
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? `qurl-${slug}` : "qurl-direct-qr";
}

export function createDirectUrlProjectConfig(payload: DirectUrlPayloadConfigV1): QrProjectConfigV1 {
  return {
    schemaVersion: "qurl.qr-project-config.v1",
    name: DEFAULT_PROJECT_NAME,
    payload,
    design: {
      schemaVersion: "qurl.qr-design-config.v1",
      errorCorrectionLevel: "L",
      quietZoneModules: 4,
      foregroundColor: "#142127",
      backgroundColor: "#ffffff",
      backgroundTransparent: false,
      moduleStyle: "square",
      eyeStyle: "square",
      logo: { mode: "none" },
      frame: { enabled: false, style: "none" },
    },
    export: {
      schemaVersion: "qurl.qr-export-config.v1",
      format: "svg",
      pixelSize: 1024,
      marginModules: 4,
      transparentBackground: false,
      fileName: slugifyFileName(payload.payload.destinationUrl),
    },
  };
}
