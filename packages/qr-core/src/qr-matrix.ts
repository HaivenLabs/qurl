import QRCode from "qrcode";
import type { QRCode as QrCodeModel } from "qrcode";

import { normalizeDirectUrl } from "./direct-url";
import { encodeQrPayload, type QrPayloadConfigV1 } from "./payloads";
import type { QrErrorCorrectionLevel } from "./project-config";

export type QrMatrix = readonly boolean[][];

const DEFAULT_QUIET_ZONE_MODULES = 4;

function createQrCodeModel(
  input: string,
  errorCorrectionLevel: QrErrorCorrectionLevel = "M",
): QrCodeModel {
  return QRCode.create(input, {
    errorCorrectionLevel,
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

export function createQrMatrix(
  input: string,
  errorCorrectionLevel?: QrErrorCorrectionLevel,
): boolean[][] {
  return createMatrixFromModel(createQrCodeModel(input, errorCorrectionLevel));
}

export function createQrMatrixFromPayload(
  config: QrPayloadConfigV1,
  errorCorrectionLevel?: QrErrorCorrectionLevel,
): boolean[][] {
  return createQrMatrix(encodeQrPayload(config), errorCorrectionLevel);
}

export function createQrSvg(input: string, errorCorrectionLevel?: QrErrorCorrectionLevel): string {
  return renderSvg(createQrMatrix(input, errorCorrectionLevel), DEFAULT_QUIET_ZONE_MODULES);
}

export function createQrSvgFromPayload(
  config: QrPayloadConfigV1,
  errorCorrectionLevel?: QrErrorCorrectionLevel,
): string {
  return createQrSvg(encodeQrPayload(config), errorCorrectionLevel);
}

export function createQrPngDataUrlFromPayload(
  config: QrPayloadConfigV1,
  errorCorrectionLevel: QrErrorCorrectionLevel = "M",
): Promise<string> {
  return QRCode.toDataURL(encodeQrPayload(config), {
    errorCorrectionLevel,
    margin: DEFAULT_QUIET_ZONE_MODULES,
    scale: 12,
    type: "image/png",
  });
}

export function createDirectUrlQrMatrix(
  input: string,
  errorCorrectionLevel?: QrErrorCorrectionLevel,
): boolean[][] {
  const normalized = normalizeDirectUrl(input);
  return createQrMatrix(normalized.destinationUrl, errorCorrectionLevel);
}

export function createDirectUrlQrSvg(
  input: string,
  errorCorrectionLevel?: QrErrorCorrectionLevel,
): string {
  return createQrSvg(normalizeDirectUrl(input).destinationUrl, errorCorrectionLevel);
}

export function createDirectUrlQrMatrixWithQuietZone(
  input: string,
  quietZoneModules = DEFAULT_QUIET_ZONE_MODULES,
  errorCorrectionLevel?: QrErrorCorrectionLevel,
): boolean[][] {
  const matrix = createDirectUrlQrMatrix(input, errorCorrectionLevel);
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
