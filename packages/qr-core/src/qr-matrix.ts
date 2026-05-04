import QRCode from "qrcode";
import type { QRCode as QrCodeModel } from "qrcode";

import { normalizeDirectUrl } from "./direct-url";
import { encodeQrPayload, type QrPayloadConfigV1 } from "./payloads";

export type QrMatrix = readonly boolean[][];

const DEFAULT_QUIET_ZONE_MODULES = 4;

function createQrCodeModel(input: string): QrCodeModel {
  return QRCode.create(input, {
    errorCorrectionLevel: "M",
  });
}

function createMatrixFromModel(model: QrCodeModel): boolean[][] {
  const { size, data } = model.modules;

  return Array.from({ length: size }, (_row, rowIndex) =>
    Array.from({ length: size }, (_col, colIndex) => Boolean(data[rowIndex * size + colIndex])),
  );
}

function renderSvg(matrix: QrMatrix, quietZoneModules: number): string {
  const size = matrix.length;
  const svgSize = size + quietZoneModules * 2;
  const cells: string[] = [];

  matrix.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        return;
      }

      cells.push(
        `<rect x="${colIndex + quietZoneModules}" y="${rowIndex + quietZoneModules}" width="1" height="1"/>`,
      );
    });
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" shape-rendering="crispEdges" role="img" aria-label="QR code">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<g fill="#142127">${cells.join("")}</g>`,
    `</svg>`,
  ].join("");
}

export function createQrMatrix(input: string): boolean[][] {
  return createMatrixFromModel(createQrCodeModel(input));
}

export function createQrMatrixFromPayload(config: QrPayloadConfigV1): boolean[][] {
  return createQrMatrix(encodeQrPayload(config));
}

export function createQrSvg(input: string): string {
  return renderSvg(createQrMatrix(input), DEFAULT_QUIET_ZONE_MODULES);
}

export function createQrSvgFromPayload(config: QrPayloadConfigV1): string {
  return createQrSvg(encodeQrPayload(config));
}

export function createQrPngDataUrlFromPayload(config: QrPayloadConfigV1): Promise<string> {
  return QRCode.toDataURL(encodeQrPayload(config), {
    errorCorrectionLevel: "M",
    margin: DEFAULT_QUIET_ZONE_MODULES,
    scale: 12,
    type: "image/png",
  });
}

export function createDirectUrlQrMatrix(input: string): boolean[][] {
  const normalized = normalizeDirectUrl(input);
  return createQrMatrix(normalized.destinationUrl);
}

export function createDirectUrlQrSvg(input: string): string {
  return createQrSvg(normalizeDirectUrl(input).destinationUrl);
}

export function createDirectUrlQrMatrixWithQuietZone(
  input: string,
  quietZoneModules = DEFAULT_QUIET_ZONE_MODULES,
): boolean[][] {
  const matrix = createDirectUrlQrMatrix(input);
  const size = matrix.length;
  const paddedSize = size + quietZoneModules * 2;
  const padded = Array.from({ length: paddedSize }, () =>
    Array.from({ length: paddedSize }, () => false),
  );

  matrix.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      padded[rowIndex + quietZoneModules][colIndex + quietZoneModules] = cell;
    });
  });

  return padded;
}
