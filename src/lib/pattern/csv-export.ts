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

/** Serialize the complete generic palette as a materials list using counts derived from cells. */
export function materialsToCsv(document: Pick<PatternDocument, "palette" | "cells">): string {
  const counts = new Map(document.palette.map((color) => [color.id, 0]));
  for (const cell of document.cells) {
    if (counts.has(cell.paletteColorId)) {
      counts.set(cell.paletteColorId, (counts.get(cell.paletteColorId) ?? 0) + 1);
    }
  }

  const rows = ["color,color_hex,palette_id,bead_count"];
  for (const color of document.palette) {
    rows.push([
      color.name,
      color.hex,
      color.id,
      counts.get(color.id) ?? 0,
    ].map(csvField).join(","));
  }
  rows.push(["TOTAL", "", "", document.cells.length].map(csvField).join(","));
  return rows.join("\n");
}

function csvField(value: string | number): string {
  const text = typeof value === "string" && /^\s*[=+@-]/.test(value)
    ? `'${value}`
    : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
