import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import {
  createQrMatrixFromPayload,
  createQrProjectConfig,
  encodeQrPayload,
  type QrDesignConfigV1,
  type QrPayloadConfigV1,
} from "@qurl/qr-core";
import { palette, radii, spacing } from "@qurl/ui";

import { resolveQrDownloadArtifact, triggerDownload, type QrExportFormat } from "../lib/qr-export";

const PREVIEW_PATH = "/api/v1/qr/preview";

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

type QrPreviewProps = {
  payload: QrPayloadConfigV1 | null;
  design?: Partial<QrDesignConfigV1>;
};

export function QrPreview({ payload, design }: QrPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<QrExportFormat | null>(null);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const [backendPreviewDataUrl, setBackendPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewNote, setPreviewNote] = useState<string | null>(null);

  const encodedPayload = useMemo(() => {
    try {
      return payload ? encodeQrPayload(payload) : null;
    } catch {
      return null;
    }
  }, [payload]);

  const previewModel = useMemo(() => {
    if (!payload) {
      return { matrix: null, issue: null };
    }

    try {
      return {
        matrix: createQrMatrixFromPayload(payload),
        issue: null,
      };
    } catch (error) {
      return {
        matrix: null,
        issue:
          error instanceof Error
            ? error.message
            : "The local preview renderer could not render this URL.",
      };
    }
  }, [payload]);

  const previewMatrix = previewModel.matrix;
  const canDownload = Boolean(payload) && !isDownloading;
  const validationNote = encodedPayload
    ? previewModel.issue
    : "Enter valid details to render the QR.";

  useEffect(() => {
    if (!payload) {
      setBackendPreviewDataUrl(null);
      setIsPreviewLoading(false);
      setPreviewNote(null);
      return;
    }

    const previewUrl = resolvePreviewUrl(PREVIEW_PATH);
    if (!previewUrl) {
      setBackendPreviewDataUrl(null);
      setIsPreviewLoading(false);
      setPreviewNote("Using local preview because no API base URL is available.");
      return;
    }

    const controller = new AbortController();
    setIsPreviewLoading(true);

    fetch(previewUrl, {
      body: JSON.stringify(createQrProjectConfig(payload, design)),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Preview request failed with status ${response.status}`);
        }

        return response.json() as Promise<{ dataUrl?: string }>;
      })
      .then((payload) => {
        if (typeof payload.dataUrl !== "string" || payload.dataUrl.length === 0) {
          throw new Error("Preview response did not include a data URL.");
        }

        setBackendPreviewDataUrl(payload.dataUrl);
        setPreviewNote(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setBackendPreviewDataUrl(null);
        setPreviewNote("Using local preview because the backend preview API is not reachable.");
      })
      .finally(() => {
        setIsPreviewLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [design, payload]);

  const handleDownload = async (format: QrExportFormat) => {
    if (!payload) {
      return;
    }

    setIsDownloading(true);
    setDownloadingFormat(format);
    setDownloadNote(null);

    try {
      const artifact = await resolveQrDownloadArtifact(payload, format, design);
      triggerDownload(artifact);
    } catch (error) {
      setDownloadNote(
        error instanceof Error ? error.message : "Unable to download the QR right now.",
      );
    } finally {
      setIsDownloading(false);
      setDownloadingFormat(null);
    }
  };

  return (
    <View accessibilityLabel="Live QR preview" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Live preview</Text>
        <Text style={styles.title}>Direct QR payload encoded</Text>
        <Text style={styles.subtitle}>No redirects, no hidden tracking, no surprises.</Text>
      </View>

      <View style={styles.previewFrame}>
        {backendPreviewDataUrl ? (
          <Image
            accessibilityLabel="Generated QR code"
            resizeMode="contain"
            source={{ uri: backendPreviewDataUrl }}
            style={styles.previewImage}
          />
        ) : previewMatrix ? (
          <View
            accessibilityLabel="Generated QR code"
            accessibilityRole="image"
            style={styles.matrix}
          >
            {previewMatrix.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.map((cell, cellIndex) => (
                  <View
                    key={`cell-${rowIndex}-${cellIndex}`}
                    style={[styles.cell, cell ? styles.cellOn : styles.cellOff]}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Preview paused</Text>
            <Text style={styles.emptyCopy}>{validationNote}</Text>
            {encodedPayload ? (
              <Text style={styles.emptyHint}>
                Backend rendering will still be attempted when the API is reachable.
              </Text>
            ) : null}
          </View>
        )}

        {isPreviewLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.loadingText}>Rendering QR</Text>
          </View>
        ) : null}
      </View>

      {previewNote ? <Text style={styles.previewNote}>{previewNote}</Text> : null}

      <View style={styles.footer}>
        <View style={styles.downloadRow}>
          {(["png", "jpg", "svg", "eps"] as const).map((format) => (
            <Pressable
              key={format}
              disabled={!canDownload}
              onPress={() => handleDownload(format)}
              style={({ pressed }) => [
                styles.downloadButton,
                !canDownload && styles.downloadButtonDisabled,
                pressed && canDownload && styles.buttonPressed,
              ]}
            >
              <Text style={styles.downloadButtonText}>
                {downloadingFormat === format ? "..." : format.toUpperCase()}
              </Text>
            </Pressable>
          ))}

          <Pressable
            disabled={!canDownload}
            onPress={() => {
              const url = backendPreviewDataUrl || "";
              if (!url) return;
              const win = window.open("");
              if (win) {
                win.document.write(
                  `<img src="${url}" style="width:100%; height:auto;" onload="window.print();window.close()">`,
                );
                win.document.close();
              }
            }}
            style={({ pressed }) => [
              styles.printButton,
              !canDownload && styles.downloadButtonDisabled,
              pressed && canDownload && styles.buttonPressed,
            ]}
          >
            <Text style={styles.printIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </Text>
          </Pressable>
        </View>

        {downloadNote ? <Text style={styles.downloadNote}>{downloadNote}</Text> : null}
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
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: palette.surface,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#d8dee2",
    fontSize: 14,
    lineHeight: 20,
  },
  previewFrame: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    position: "relative",
    padding: spacing.md,
  },
  matrix: {
    aspectRatio: 1,
    backgroundColor: palette.surface,
    overflow: "hidden",
    width: "100%",
  },
  previewImage: {
    aspectRatio: 1,
    width: "100%",
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    flex: 1,
  },
  cellOn: {
    backgroundColor: palette.ink,
  },
  cellOff: {
    backgroundColor: "#f7f4ef",
  },
  emptyState: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  emptyCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  emptyHint: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  loadingOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(255, 253, 249, 0.8)",
    borderRadius: radii.md,
    bottom: spacing.md,
    gap: spacing.sm,
    justifyContent: "center",
    left: spacing.md,
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0,
  },
  previewNote: {
    color: "#d8dee2",
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  footerCopy: {
    gap: spacing.xs,
  },
  footerLabel: {
    color: palette.highlight,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  footerValue: {
    color: palette.surface,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0,
  },
  footerPreview: {
    color: "#d8dee2",
    fontSize: 12,
    lineHeight: 18,
  },
  downloadRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
  },
  downloadButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: radii.sm,
    justifyContent: "center",
    minWidth: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: 32,
  },
  printButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radii.sm,
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  printIcon: {
    color: palette.surface,
  },
  downloadButtonDisabled: {
    opacity: 0.55,
  },
  downloadButtonText: {
    color: palette.surface,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
  },
  downloadNote: {
    color: "#d8dee2",
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
});
