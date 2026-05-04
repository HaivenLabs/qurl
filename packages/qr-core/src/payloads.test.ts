import { describe, expect, it } from "vitest";

import { createQrPayload, encodeQrPayload, QR_TYPE_REGISTRY_V1 } from "./index";

describe("QR type registry", () => {
  it("defines the MVP static payload types from Slice 2", () => {
    expect(QR_TYPE_REGISTRY_V1.types.map((type) => type.kind)).toEqual([
      "url",
      "text",
      "email",
      "phone",
      "sms",
      "wifi",
      "vcard",
      "location",
      "crypto-address",
    ]);
  });

  it("marks every MVP type as direct encoding", () => {
    expect(QR_TYPE_REGISTRY_V1.types.every((type) => type.directEncoding)).toBe(true);
  });

  it("links every MVP type to an existing payload schema definition name", () => {
    expect(QR_TYPE_REGISTRY_V1.types.map((type) => type.payloadSchemaId)).toEqual([
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/urlPayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/textPayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/emailPayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/phonePayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/smsPayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/wifiPayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/vcardPayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/locationPayload",
      "https://qurl.dev/schemas/qr-payload-config.v1.schema.json#/$defs/cryptoAddressPayload",
    ]);
  });
});

describe("static QR payload encoding", () => {
  it("encodes each MVP QR type deterministically", () => {
    expect(encodeQrPayload(createQrPayload("url", { destinationUrl: "https://example.com" }))).toBe(
      "https://example.com",
    );
    expect(encodeQrPayload(createQrPayload("text", { text: "Hello qurl" }))).toBe("Hello qurl");
    expect(
      encodeQrPayload(createQrPayload("email", { to: "hi@example.com", subject: "Hello" })),
    ).toBe("mailto:hi@example.com?subject=Hello");
    expect(encodeQrPayload(createQrPayload("phone", { number: "+15551234567" }))).toBe(
      "tel:+15551234567",
    );
    expect(encodeQrPayload(createQrPayload("sms", { number: "+15551234567", message: "Hi" }))).toBe(
      "sms:+15551234567?body=Hi",
    );
    expect(
      encodeQrPayload(
        createQrPayload("wifi", { ssid: "Guest", security: "wpa2", password: "secret" }),
      ),
    ).toBe("WIFI:T:WPA2;S:Guest;P:secret;H:false;;");
    expect(encodeQrPayload(createQrPayload("vcard", { fullName: "Ada Lovelace" }))).toBe(
      "BEGIN:VCARD\nVERSION:3.0\nFN:Ada Lovelace\nEND:VCARD",
    );
    expect(
      encodeQrPayload(createQrPayload("location", { latitude: 47.6062, longitude: -122.3321 })),
    ).toBe("geo:47.6062,-122.3321");
    expect(
      encodeQrPayload(
        createQrPayload("crypto-address", { currency: "btc", address: "bc1qexample" }),
      ),
    ).toBe("bitcoin:bc1qexample");
  });

  it("rejects invalid inputs for each MVP QR type", () => {
    expect(() => createQrPayload("url", { destinationUrl: "ftp://example.com" })).toThrow(
      "http or https",
    );
    expect(() => createQrPayload("text", { text: " " })).toThrow("Text is required");
    expect(() => createQrPayload("email", { to: "not-email" })).toThrow("valid email");
    expect(() => createQrPayload("phone", { number: "" })).toThrow("Phone number");
    expect(() => createQrPayload("sms", { number: "" })).toThrow("SMS number");
    expect(() => createQrPayload("wifi", { ssid: "Guest", security: "wpa2" })).toThrow("password");
    expect(() =>
      createQrPayload("wifi", { ssid: "Guest", security: "banana" as "wpa2", password: "secret" }),
    ).toThrow("security");
    expect(() => createQrPayload("vcard", { fullName: "" })).toThrow("Contact name");
    expect(() => createQrPayload("location", { latitude: 100, longitude: 0 })).toThrow("Latitude");
    expect(() => createQrPayload("crypto-address", { currency: "btc", address: "" })).toThrow(
      "Crypto address",
    );
  });
});
