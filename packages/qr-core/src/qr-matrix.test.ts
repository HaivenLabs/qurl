import { describe, expect, it } from "vitest";

import { createDirectUrlQrMatrix, createDirectUrlQrSvg } from "./index";

describe("direct URL QR rendering", () => {
  it("renders a deterministic matrix for the same direct URL", () => {
    const first = createDirectUrlQrMatrix("https://example.com");
    const second = createDirectUrlQrMatrix("https://example.com");

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(21);
    expect(first.length).toBeLessThanOrEqual(33);
  });

  it("renders a quiet-zoned svg payload for download", () => {
    const svg = createDirectUrlQrSvg("https://example.com");

    expect(svg).toContain("<svg");
    expect(svg).toContain("<rect");
    expect(svg).toContain('aria-label="QR code"');
  });

  it("renders longer URLs without throwing an app-level error", () => {
    const url = `https://example.com/${"long-path-segment/".repeat(20)}?ref=${"abc123".repeat(20)}`;

    const matrix = createDirectUrlQrMatrix(url);

    expect(matrix.length).toBeGreaterThan(33);
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
  });
});
