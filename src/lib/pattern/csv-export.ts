import type { PatternDocument } from ".";

/** Serialize the row-major pattern grid as a spreadsheet-friendly UTF-8 CSV string. */
export function patternToCsv(document: Pick<PatternDocument, "settings" | "palette" | "cells">): string {
  const { width } = document.settings.grid;
  const paletteById = new Map(document.palette.map((color) => [color.id, color]));
  const rows = ["row,column,color,color_hex"];

  document.cells.forEach((cell, index) => {
    const color = paletteById.get(cell.paletteColorId);
    const row = Math.floor(index / width) + 1;
    const column = (index % width) + 1;
    rows.push([
      row,
      column,
      color?.name ?? "Unknown color",
      color?.hex ?? "",
    ].map(csvField).join(","));
  });

  return rows.join("\n");
}

function csvField(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
