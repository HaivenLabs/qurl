export type QrPayloadKind =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "vcard"
  | "location"
  | "crypto-address";

export type UrlPayload = {
  destinationUrl: string;
};

export type TextPayload = {
  text: string;
};

export type EmailPayload = {
  to: string;
  subject?: string;
  body?: string;
};

export type PhonePayload = {
  number: string;
};

export type SmsPayload = {
  number: string;
  message?: string;
};

export type WifiPayload = {
  ssid: string;
  security?: "none" | "wpa" | "wpa2" | "wpa3";
  password?: string;
  hidden?: boolean;
};

export type VCardPayload = {
  fullName: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
};

export type LocationPayload = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type CryptoAddressPayload = {
  currency: "btc" | "eth" | "usdc" | "sol" | "ltc" | "other";
  address: string;
  amount?: string;
  label?: string;
};

export type QrPayloadByKind = {
  url: UrlPayload;
  text: TextPayload;
  email: EmailPayload;
  phone: PhonePayload;
  sms: SmsPayload;
  wifi: WifiPayload;
  vcard: VCardPayload;
  location: LocationPayload;
  "crypto-address": CryptoAddressPayload;
};

export type QrPayloadConfigV1<K extends QrPayloadKind = QrPayloadKind> = {
  schemaVersion: "qurl.qr-payload-config.v1";
  kind: K;
  payload: QrPayloadByKind[K];
};

export type QrTypeDefinitionV1 = {
  kind: QrPayloadKind;
  label: string;
  category: "direct" | "contact" | "communication" | "network" | "location" | "commerce";
  status: "mvp";
  directEncoding: true;
  payloadSchemaId: string;
};

export type QrTypeRegistryV1 = {
  schemaVersion: "qurl.qr-type-registry.v1";
  types: readonly QrTypeDefinitionV1[];
};

const PAYLOAD_SCHEMA_ID = "https://qurl.dev/schemas/qr-payload-config.v1.schema.json";
const WEB_PROTOCOLS = new Set(["http:", "https:"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const QR_TYPE_REGISTRY_V1: QrTypeRegistryV1 = {
  schemaVersion: "qurl.qr-type-registry.v1",
  types: [
    registryEntry("url", "Website URL", "direct"),
    registryEntry("text", "Plain text", "direct"),
    registryEntry("email", "Email", "communication"),
    registryEntry("phone", "Phone", "communication"),
    registryEntry("sms", "SMS", "communication"),
    registryEntry("wifi", "Wi-Fi", "network"),
    registryEntry("vcard", "Contact card", "contact"),
    registryEntry("location", "Location", "location"),
    registryEntry("crypto-address", "Crypto address", "commerce"),
  ],
};

function registryEntry(
  kind: QrPayloadKind,
  label: string,
  category: QrTypeDefinitionV1["category"],
): QrTypeDefinitionV1 {
  return {
    kind,
    label,
    category,
    status: "mvp",
    directEncoding: true,
    payloadSchemaId: `${PAYLOAD_SCHEMA_ID}#/$defs/${kind}`,
  };
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} is required.`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeWebUrl(input: string, label: string): string {
  const value = requiredString(input, label);
  const parsed = new URL(value);

  if (!WEB_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`${label} must use http or https.`);
  }

  return value;
}

function validateEmail(input: string, label = "Email"): string {
  const email = requiredString(input, label);
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error(`${label} must be a valid email address.`);
  }

  return email;
}

function encodeQuery(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params.toString();
}

function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,":])/g, "\\$1");
}

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function createQrPayload<K extends QrPayloadKind>(
  kind: K,
  payload: QrPayloadByKind[K],
): QrPayloadConfigV1<K> {
  return {
    schemaVersion: "qurl.qr-payload-config.v1",
    kind,
    payload: normalizePayload(kind, payload),
  };
}

export function normalizePayload<K extends QrPayloadKind>(
  kind: K,
  payload: QrPayloadByKind[K],
): QrPayloadByKind[K] {
  switch (kind) {
    case "url":
      return {
        destinationUrl: normalizeWebUrl((payload as UrlPayload).destinationUrl, "Direct URL"),
      } as QrPayloadByKind[K];
    case "text":
      return { text: requiredString((payload as TextPayload).text, "Text") } as QrPayloadByKind[K];
    case "email":
      return {
        to: validateEmail((payload as EmailPayload).to),
        subject: optionalString((payload as EmailPayload).subject),
        body: optionalString((payload as EmailPayload).body),
      } as QrPayloadByKind[K];
    case "phone":
      return {
        number: requiredString((payload as PhonePayload).number, "Phone number"),
      } as QrPayloadByKind[K];
    case "sms":
      return {
        number: requiredString((payload as SmsPayload).number, "SMS number"),
        message: optionalString((payload as SmsPayload).message),
      } as QrPayloadByKind[K];
    case "wifi": {
      const wifi = payload as WifiPayload;
      const security = wifi.security ?? "wpa2";
      if (security !== "none" && optionalString(wifi.password) === undefined) {
        throw new Error("Wi-Fi password is required unless security is none.");
      }

      return {
        ssid: requiredString(wifi.ssid, "Wi-Fi network name"),
        security,
        password: security === "none" ? undefined : optionalString(wifi.password),
        hidden: Boolean(wifi.hidden),
      } as QrPayloadByKind[K];
    }
    case "vcard": {
      const card = payload as VCardPayload;
      return {
        fullName: requiredString(card.fullName, "Contact name"),
        organization: optionalString(card.organization),
        title: optionalString(card.title),
        phone: optionalString(card.phone),
        email: card.email ? validateEmail(card.email) : undefined,
        url: card.url ? normalizeWebUrl(card.url, "Contact URL") : undefined,
      } as QrPayloadByKind[K];
    }
    case "location": {
      const { latitude, longitude, label } = payload as LocationPayload;
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new Error("Latitude must be between -90 and 90.");
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error("Longitude must be between -180 and 180.");
      }

      return { latitude, longitude, label: optionalString(label) } as QrPayloadByKind[K];
    }
    case "crypto-address": {
      const crypto = payload as CryptoAddressPayload;
      if (!["btc", "eth", "usdc", "sol", "ltc", "other"].includes(crypto.currency)) {
        throw new Error("Crypto currency is not supported.");
      }

      return {
        currency: crypto.currency,
        address: requiredString(crypto.address, "Crypto address"),
        amount: optionalString(crypto.amount),
        label: optionalString(crypto.label),
      } as QrPayloadByKind[K];
    }
  }

  throw new Error(`Unsupported QR payload kind: ${kind satisfies never}`);
}

export function encodeQrPayload(config: QrPayloadConfigV1): string {
  const payload = normalizePayload(config.kind, config.payload);

  switch (config.kind) {
    case "url":
      return (payload as UrlPayload).destinationUrl;
    case "text":
      return (payload as TextPayload).text;
    case "email": {
      const email = payload as EmailPayload;
      const query = encodeQuery({ subject: email.subject, body: email.body });
      return `mailto:${email.to}${query ? `?${query}` : ""}`;
    }
    case "phone":
      return `tel:${(payload as PhonePayload).number}`;
    case "sms": {
      const sms = payload as SmsPayload;
      const query = encodeQuery({ body: sms.message });
      return `sms:${sms.number}${query ? `?${query}` : ""}`;
    }
    case "wifi": {
      const wifi = payload as WifiPayload;
      const auth = wifi.security === "none" ? "nopass" : (wifi.security ?? "wpa2").toUpperCase();
      return `WIFI:T:${auth};S:${escapeWifiValue(wifi.ssid)};P:${escapeWifiValue(wifi.password ?? "")};H:${wifi.hidden ? "true" : "false"};;`;
    }
    case "vcard": {
      const card = payload as VCardPayload;
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCardValue(card.fullName)}`];
      if (card.organization) lines.push(`ORG:${escapeVCardValue(card.organization)}`);
      if (card.title) lines.push(`TITLE:${escapeVCardValue(card.title)}`);
      if (card.phone) lines.push(`TEL:${escapeVCardValue(card.phone)}`);
      if (card.email) lines.push(`EMAIL:${card.email}`);
      if (card.url) lines.push(`URL:${card.url}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    case "location": {
      const loc = payload as LocationPayload;
      const base = `geo:${loc.latitude},${loc.longitude}`;
      return loc.label
        ? `${base}?q=${loc.latitude},${loc.longitude}(${encodeURIComponent(loc.label)})`
        : base;
    }
    case "crypto-address": {
      const crypto = payload as CryptoAddressPayload;
      if (crypto.currency === "btc") {
        const query = encodeQuery({ amount: crypto.amount, label: crypto.label });
        return `bitcoin:${crypto.address}${query ? `?${query}` : ""}`;
      }

      return crypto.address;
    }
  }

  throw new Error(`Unsupported QR payload kind: ${config.kind satisfies never}`);
}
