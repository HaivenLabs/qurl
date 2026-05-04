import {
  createQrPayload,
  encodeQrPayload,
  normalizePayload,
  type QrPayloadConfigV1,
} from "./payloads";

export type DirectUrlPayloadConfigV1 = QrPayloadConfigV1<"url">;

export type NormalizedDirectUrl = {
  destinationUrl: string;
};

export function normalizeDirectUrl(input: string): NormalizedDirectUrl {
  return normalizePayload("url", { destinationUrl: input });
}

export function createDirectUrlPayload(input: string): DirectUrlPayloadConfigV1 {
  return createQrPayload("url", { destinationUrl: input });
}

export function encodeDirectQrPayload(config: DirectUrlPayloadConfigV1): string {
  return encodeQrPayload(config);
}
