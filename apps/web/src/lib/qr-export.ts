import {
  createDirectUrlPayload,
  createQrPngDataUrlFromPayload,
  createQrProjectConfig,
  createQrSvgFromPayload,
  type QrDesignConfigV1,
  type QrPayloadConfigV1,
  type QrProjectConfigV1,
} from "@qurl/qr-core";

const EXPORT_PATH = "/api/v1/qr/export";

export type QrExportSource = "backend" | "local";

export type QrDownloadArtifact = {
  fileName: string;
  mimeType: string;
  source: QrExportSource;
  content: string;
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

function buildProjectConfig(
  payload: QrPayloadConfigV1,
  format: "svg" | "png",
  design?: Partial<QrDesignConfigV1>,
): QrProjectConfigV1 {
  const projectConfig = createQrProjectConfig(payload, design);

  return {
    ...projectConfig,
    export: {
      ...projectConfig.export,
      format,
    },
  };
}

export async function resolveQrDownloadArtifact(
  payload: QrPayloadConfigV1,
  format: "svg" | "png",
  design?: Partial<QrDesignConfigV1>,
): Promise<QrDownloadArtifact> {
  const projectConfig = buildProjectConfig(payload, format, design);
  const exportUrl = resolvePreviewUrl(EXPORT_PATH);

  if (exportUrl) {
    try {
      const response = await fetch(exportUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: format === "png" ? "image/png, */*" : "image/svg+xml, */*",
        },
        body: JSON.stringify(projectConfig),
      });

      if (response.ok) {
        const content =
          format === "png" ? await blobToDataUrl(await response.blob()) : await response.text();
        if (content.length > 0) {
          return {
            fileName: `${projectConfig.export.fileName}.${format}`,
            mimeType: format === "png" ? "image/png" : "image/svg+xml;charset=utf-8",
            source: "backend",
            content,
          };
        }
      }
    } catch {
      // Local fallback below keeps the export action usable offline or before the API is ready.
    }
  }

  if (format === "png") {
    return {
      fileName: `${projectConfig.export.fileName}.png`,
      mimeType: "image/png",
      source: "local",
      content: await createQrPngDataUrlFromPayload(payload),
    };
  }

  return {
    fileName: `${projectConfig.export.fileName}.svg`,
    mimeType: "image/svg+xml;charset=utf-8",
    source: "local",
    content: createQrSvgFromPayload(payload),
  };
}

export function triggerDownload({ fileName, mimeType, content }: QrDownloadArtifact): void {
  const blob =
    mimeType === "image/png" && content.startsWith("data:")
      ? dataUrlToBlob(content)
      : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, base64] = dataUrl.split(",");
  const mimeType = metadata.match(/^data:(.*?);base64$/)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export function buildDirectUrlPayload(destination: string): QrPayloadConfigV1<"url"> {
  return createDirectUrlPayload(destination);
}
