import type { PatternDocument } from ".";

const FALLBACK_COLOR = "#CBD5E1";

/** Paint a pattern grid onto a caller-provided canvas without using network APIs. */
export function drawPatternToCanvas(
  document: Pick<PatternDocument, "settings" | "palette" | "cells">,
  canvas: HTMLCanvasElement,
  cellSize = 32,
): void {
  const { width, height } = document.settings.grid;
  if (!Number.isInteger(cellSize) || cellSize < 1) throw new RangeError("cellSize must be a positive integer.");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable in this browser.");

  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  const paletteById = new Map(document.palette.map((color) => [color.id, color]));
  document.cells.forEach((cell, index) => {
    const color = paletteById.get(cell.paletteColorId);
    context.fillStyle = color?.hex ?? FALLBACK_COLOR;
    context.fillRect((index % width) * cellSize, Math.floor(index / width) * cellSize, cellSize, cellSize);
  });
}
