export type QrPayloadKind = "url";

export type DirectUrlPayloadConfigV1 = {
  schemaVersion: "qurl.qr-payload-config.v1";
  kind: "url";
  payload: {
    destinationUrl: string;
  };
};

export type NormalizedDirectUrl = {
  destinationUrl: string;
};

const DIRECT_URL_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeDirectUrl(input: string): NormalizedDirectUrl {
  const destinationUrl = input.trim();

  if (destinationUrl.length === 0) {
    throw new Error("Direct URL is required.");
  }

  const parsed = new URL(destinationUrl);
  if (!DIRECT_URL_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("Direct URL must use http or https.");
  }

  return { destinationUrl };
}

export function createDirectUrlPayload(input: string): DirectUrlPayloadConfigV1 {
  const normalized = normalizeDirectUrl(input);

  return {
    schemaVersion: "qurl.qr-payload-config.v1",
    kind: "url",
    payload: {
      destinationUrl: normalized.destinationUrl,
    },
  };
}

export function encodeDirectQrPayload(config: DirectUrlPayloadConfigV1): string {
  return normalizeDirectUrl(config.payload.destinationUrl).destinationUrl;
}
