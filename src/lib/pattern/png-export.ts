import type { PatternDocument } from ".";
import { downloadBlobInBrowser } from "./browser-download";

const FALLBACK_COLOR = "#CBD5E1";
export const MAX_PNG_CANVAS_PIXELS = 16_000_000;
export const MAX_PNG_CANVAS_SIDE = 8_192;

export interface PngExportAdapter {
  createCanvas(): HTMLCanvasElement;
  canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob>;
  downloadBlob(blob: Blob, fileName: string): void;
}

const browserPngExportAdapter: PngExportAdapter = {
  createCanvas: () => document.createElement("canvas"),
  canvasToBlob: (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode this pattern as PNG."));
    }, "image/png");
  }),
  downloadBlob: downloadBlobInBrowser,
};

/** Paint a pattern grid onto a caller-provided canvas without using network APIs. */
export function drawPatternToCanvas(
  document: Pick<PatternDocument, "settings" | "palette" | "cells">,
  canvas: HTMLCanvasElement,
  cellSize = 32,
): void {
  const { width, height } = document.settings.grid;
  if (!Number.isInteger(cellSize) || cellSize < 1) throw new RangeError("cellSize must be a positive integer.");
  const effectiveCellSize = canvasCellSize(width, height, cellSize);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable in this browser.");

  canvas.width = width * effectiveCellSize;
  canvas.height = height * effectiveCellSize;
  const paletteById = new Map(document.palette.map((color) => [color.id, color]));
  document.cells.forEach((cell, index) => {
    const color = paletteById.get(cell.paletteColorId);
    context.fillStyle = color?.hex ?? FALLBACK_COLOR;
    context.fillRect((index % width) * effectiveCellSize, Math.floor(index / width) * effectiveCellSize, effectiveCellSize, effectiveCellSize);
  });
}

function canvasCellSize(width: number, height: number, requested: number): number {
  if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
    throw new RangeError("Pattern dimensions must be positive integers for PNG export.");
  }
  const bySide = Math.min(
    Math.floor(MAX_PNG_CANVAS_SIDE / width),
    Math.floor(MAX_PNG_CANVAS_SIDE / height),
  );
  const byArea = Math.floor(Math.sqrt(MAX_PNG_CANVAS_PIXELS / (width * height)));
  const effective = Math.min(requested, bySide, byArea);
  if (effective < 1) {
    throw new RangeError(`Pattern exceeds the PNG canvas export budget (${MAX_PNG_CANVAS_SIDE}px per side and ${MAX_PNG_CANVAS_PIXELS} pixels total).`);
  }
  return effective;
}

/** Draw, encode, and download a PNG entirely inside the browser. */
export async function downloadPatternPng(
  document: Pick<PatternDocument, "settings" | "palette" | "cells">,
  fileName: string,
  adapter: PngExportAdapter = browserPngExportAdapter,
  cellSize = 32,
): Promise<void> {
  const canvas = adapter.createCanvas();
  drawPatternToCanvas(document, canvas, cellSize);
  const blob = await adapter.canvasToBlob(canvas);
  adapter.downloadBlob(blob, fileName);
}
