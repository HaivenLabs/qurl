import {
  createDirectUrlPayload,
  createDirectUrlProjectConfig,
  createDirectUrlQrSvg,
  type QrProjectConfigV1,
} from "@qurl/qr-core";

const EXPORT_PATH = "/api/v1/direct-url/export";

export type QrExportSource = "backend" | "local";

export type QrDownloadArtifact = {
  fileName: string;
  source: QrExportSource;
  svg: string;
};

function getApiBaseUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_QURL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) {
    return configured;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    const { hostname, protocol, port } = window.location;
    if ((hostname === "localhost" || hostname === "127.0.0.1") && port !== "8080") {
      return `${protocol}//${hostname}:8080`;
    }

    return window.location.origin;
  }

  return null;
}

function resolvePreviewUrl(path: string): string | null {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return null;
  }
}

function buildProjectConfig(destination: string): QrProjectConfigV1 {
  return createDirectUrlProjectConfig(createDirectUrlPayload(destination));
}

export async function resolveQrDownloadArtifact(destination: string): Promise<QrDownloadArtifact> {
  const projectConfig = buildProjectConfig(destination);
  const exportUrl = resolvePreviewUrl(EXPORT_PATH);

  if (exportUrl) {
    try {
      const response = await fetch(exportUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "image/svg+xml, */*",
        },
        body: JSON.stringify(projectConfig),
      });

      if (response.ok) {
        const svg = await response.text();
        if (svg.length > 0) {
          return {
            fileName: `${projectConfig.export.fileName}.svg`,
            source: "backend",
            svg,
          };
        }
      }
    } catch {
      // Local fallback below keeps the export action usable offline or before the API is ready.
    }
  }

  return {
    fileName: `${projectConfig.export.fileName}.svg`,
    source: "local",
    svg: createDirectUrlQrSvg(destination),
  };
}

export function triggerSvgDownload({ fileName, svg }: QrDownloadArtifact): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
