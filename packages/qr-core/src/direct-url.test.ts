import { describe, expect, it } from "vitest";

import { createDirectUrlPayload, encodeDirectQrPayload, normalizeDirectUrl } from "./index";

describe("direct URL QR payloads", () => {
  it("encodes the destination URL directly without redirects, tracking, or mutation", () => {
    const input = "https://example.com/path?x=1";

    const config = createDirectUrlPayload(input);
    const encoded = encodeDirectQrPayload(config);

    expect(encoded).toBe("https://example.com/path?x=1");
    expect(encoded).not.toContain("qurl");
  });

  it("preserves a valid direct URL after trimming surrounding whitespace", () => {
    expect(normalizeDirectUrl("  https://example.com/path?x=1  ")).toEqual({
      destinationUrl: "https://example.com/path?x=1",
    });
  });

  it("rejects non-web protocols for direct URL QR payloads", () => {
    expect(() => createDirectUrlPayload("mailto:hello@example.com")).toThrow("http or https");
  });
});
