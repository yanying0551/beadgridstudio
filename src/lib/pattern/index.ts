export const PATTERN_DOCUMENT_SCHEMA_VERSION = 1 as const;
export const MAX_GRID_DIMENSION = 500;
export const MAX_GRID_CELLS = 250_000;

export type HexRgb = `#${string}`;
export type QuantizationMethod = "nearest-color" | "floyd-steinberg";
export type ExportFormat = "png" | "pdf" | "csv";
export type ExportScope = "pattern" | "sections" | "counts";

export interface GridDimensions { width: number; height: number }
export interface GridRect { x: number; y: number; width: number; height: number }
export interface PaletteColor { id: string; name: string; hex: HexRgb; sortOrder: number }
/** A V1 palette contains generic color labels only, never brand or SKU metadata. */
export type GenericPaletteColor = PaletteColor;
export interface PatternCell { paletteColorId: string }
export interface SourceImageMetadata {
  mimeType: "image/jpeg" | "image/png";
  originalFileName?: string;
  width: number;
  height: number;
}
export interface PatternSettings {
  grid: GridDimensions;
  requestedColorCount: number;
  quantizationMethod: QuantizationMethod;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
  sourceImage?: SourceImageMetadata;
}
export interface PaletteColorCount { paletteColorId: string; beadCount: number }
export interface PatternCounts { byPaletteColor: PaletteColorCount[]; totalBeads: number }
export interface SectionLayoutSettings {
  maxColumnsPerSection: number;
  maxRowsPerSection: number;
  overlapCells: 0 | 1;
}
export interface PatternSection { id: string; order: number; rect: GridRect; printRect: GridRect }
export interface PatternSections { layout: SectionLayoutSettings; items: PatternSection[] }
export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  rasterScale?: number;
  includeLegend: boolean;
  includeZeroCountColors: boolean;
}
export interface ExportRecord {
  id: string;
  options: ExportOptions;
  exportedAt: string;
  exporterVersion: string;
  suggestedFileName: string;
  artifactCount: number;
}
export interface PatternDocument {
  schemaVersion: 1;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settings: PatternSettings;
  palette: GenericPaletteColor[];
  cells: PatternCell[];
  counts: PatternCounts;
  sections: PatternSections;
  exports: { latest?: ExportRecord; history: ExportRecord[] };
}

export interface PatternValidationIssue { code: string; path: string; message: string }
export type PatternValidationResult =
  | { ok: true; value: PatternDocument }
  | { ok: false; issues: PatternValidationIssue[] };

export function cellIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

export function derivePatternCounts(
  input: Pick<PatternDocument, "palette" | "cells" | "settings">,
): PatternCounts {
  const counts = new Map(input.palette.map((color) => [color.id, 0]));
  for (const cell of input.cells) counts.set(cell.paletteColorId, (counts.get(cell.paletteColorId) ?? 0) + 1);
  return {
    byPaletteColor: input.palette.map((color) => ({ paletteColorId: color.id, beadCount: counts.get(color.id) ?? 0 })),
    totalBeads: input.cells.length,
  };
}

/**
 * Split a grid into deterministic, row-major owned sections. Print rectangles
 * include the configured surrounding overlap where that overlap remains in
 * bounds; owned rectangles always cover the grid exactly once.
 */
export function derivePatternSections(grid: GridDimensions, layout: SectionLayoutSettings): PatternSections {
  if (!isPositiveSafeInteger(grid.width, MAX_GRID_DIMENSION) || !isPositiveSafeInteger(grid.height, MAX_GRID_DIMENSION) || grid.width * grid.height > MAX_GRID_CELLS) {
    throw new RangeError("Grid dimensions must be positive safe integers within the supported grid limits.");
  }
  if (!isPositiveSafeInteger(layout.maxColumnsPerSection) || !isPositiveSafeInteger(layout.maxRowsPerSection) || (layout.overlapCells !== 0 && layout.overlapCells !== 1)) {
    throw new RangeError("Section layout must use positive dimensions and zero or one overlap cell.");
  }

  const items: PatternSection[] = [];
  for (let y = 0; y < grid.height; y += layout.maxRowsPerSection) {
    const height = Math.min(layout.maxRowsPerSection, grid.height - y);
    for (let x = 0; x < grid.width; x += layout.maxColumnsPerSection) {
      const width = Math.min(layout.maxColumnsPerSection, grid.width - x);
      const rect = { x, y, width, height };
      const overlap = layout.overlapCells;
      const printX = Math.max(0, x - overlap);
      const printY = Math.max(0, y - overlap);
      const printRight = Math.min(grid.width, x + width + overlap);
      const printBottom = Math.min(grid.height, y + height + overlap);
      const order = items.length;
      items.push({
        id: `section-${order + 1}`,
        order,
        rect,
        printRect: { x: printX, y: printY, width: printRight - printX, height: printBottom - printY },
      });
    }
  }
  return { layout: { ...layout }, items };
}

const HEX_RGB = /^#[0-9A-F]{6}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const UNSAFE_FILENAME = /[\\/\0]|\.\./;
const NON_GENERIC_LABEL = /\b(?:perler|hama|artkal|nabbi|mard|dmc|miyuki|toho|brand|collection|sku|catalog(?:ue)?)\b|\b[A-Z]{1,4}[- ]?\d{2,}\b/i;

type RecordValue = Record<string, unknown>;
function isRecord(value: unknown): value is RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function hasExactKeys(value: RecordValue, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);
}
function isPositiveSafeInteger(value: unknown, maximum?: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && (maximum === undefined || value <= maximum);
}
function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function isSafeBasename(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !UNSAFE_FILENAME.test(value);
}

export function validatePatternDocument(value: unknown): PatternValidationResult {
  const issues: PatternValidationIssue[] = [];
  const issue = (code: string, path: string, message: string) => issues.push({ code, path, message });
  if (!isRecord(value)) return { ok: false, issues: [{ code: "invalid_type", path: "", message: "Pattern document must be a plain object." }] };
  if (!hasExactKeys(value, ["schemaVersion", "id", "title", "createdAt", "updatedAt", "settings", "palette", "cells", "counts", "sections", "exports"])) issue("unexpected_shape", "", "Pattern document has missing or unexpected fields.");
  if (value.schemaVersion !== PATTERN_DOCUMENT_SCHEMA_VERSION) issue("invalid_schema_version", "schemaVersion", "schemaVersion must be 1.");
  for (const key of ["id", "title"] as const) if (typeof value[key] !== "string" || !value[key].trim()) issue("invalid_string", key, `${key} must be a non-empty string.`);
  for (const key of ["createdAt", "updatedAt"] as const) if (typeof value[key] !== "string" || !ISO_UTC.test(value[key])) issue("invalid_timestamp", key, `${key} must be an ISO 8601 UTC timestamp.`);

  const settings = value.settings;
  let width = 0; let height = 0; let requestedColorCount = 0;
  if (!isRecord(settings) || !hasExactKeys(settings, ["grid", "requestedColorCount", "quantizationMethod", "mirrorHorizontal", "mirrorVertical", "sourceImage"])) {
    // sourceImage is optional, so permit its absence while forbidding other fields.
    if (!isRecord(settings) || !Object.keys(settings).every((key) => ["grid", "requestedColorCount", "quantizationMethod", "mirrorHorizontal", "mirrorVertical", "sourceImage"].includes(key)) || !["grid", "requestedColorCount", "quantizationMethod", "mirrorHorizontal", "mirrorVertical"].every((key) => key in (settings ?? {}))) issue("unexpected_shape", "settings", "settings has missing or unexpected fields.");
  }
  if (isRecord(settings)) {
    const grid = settings.grid;
    if (!isRecord(grid) || !hasExactKeys(grid, ["width", "height"])) issue("unexpected_shape", "settings.grid", "grid has missing or unexpected fields.");
    if (isRecord(grid)) {
      if (!isPositiveSafeInteger(grid.width, MAX_GRID_DIMENSION)) issue("invalid_dimension", "settings.grid.width", `width must be a positive safe integer no greater than ${MAX_GRID_DIMENSION}.`); else width = grid.width;
      if (!isPositiveSafeInteger(grid.height, MAX_GRID_DIMENSION)) issue("invalid_dimension", "settings.grid.height", `height must be a positive safe integer no greater than ${MAX_GRID_DIMENSION}.`); else height = grid.height;
    }
    if (!isPositiveSafeInteger(settings.requestedColorCount)) issue("invalid_requested_color_count", "settings.requestedColorCount", "requestedColorCount must be a positive safe integer."); else requestedColorCount = settings.requestedColorCount;
    if (settings.quantizationMethod !== "nearest-color" && settings.quantizationMethod !== "floyd-steinberg") issue("invalid_quantization_method", "settings.quantizationMethod", "Unsupported quantization method.");
    for (const key of ["mirrorHorizontal", "mirrorVertical"] as const) if (typeof settings[key] !== "boolean") issue("invalid_boolean", `settings.${key}`, `${key} must be boolean.`);
    if ("sourceImage" in settings && settings.sourceImage !== undefined) validateSourceImage(settings.sourceImage, issue);
  }
  if (width && height && width * height > MAX_GRID_CELLS) issue("grid_too_large", "settings.grid", `Grid area must not exceed ${MAX_GRID_CELLS} cells.`);

  const paletteIds = new Set<string>();
  if (!Array.isArray(value.palette)) issue("invalid_type", "palette", "palette must be an array.");
  else {
    if (value.palette.length < 1) issue("invalid_palette_length", "palette", "palette must include at least one color.");
    if (requestedColorCount && value.palette.length > requestedColorCount) issue("invalid_palette_length", "palette", "palette cannot exceed requestedColorCount.");
    value.palette.forEach((color, index) => {
      const path = `palette[${index}]`;
      if (!isRecord(color) || !hasExactKeys(color, ["id", "name", "hex", "sortOrder"])) { issue("unexpected_shape", path, "Palette color has missing or unexpected fields."); return; }
      if (typeof color.id !== "string" || !color.id.trim()) issue("invalid_palette_id", `${path}.id`, "Palette ID must be a non-empty string.");
      else if (paletteIds.has(color.id)) issue("duplicate_palette_id", `${path}.id`, "Palette IDs must be unique."); else paletteIds.add(color.id);
      if (typeof color.name !== "string" || !color.name.trim() || NON_GENERIC_LABEL.test(color.name)) issue("invalid_palette_name", `${path}.name`, "Palette name must be a generic color label without brand, collection, SKU, or catalog references.");
      if (typeof color.hex !== "string" || !HEX_RGB.test(color.hex)) issue("invalid_hex", `${path}.hex`, "Palette hex must be uppercase #RRGGBB.");
      if (color.sortOrder !== index) issue("invalid_sort_order", `${path}.sortOrder`, "Palette sortOrder must be contiguous from 0.");
    });
  }

  if (!Array.isArray(value.cells)) issue("invalid_type", "cells", "cells must be an array.");
  else {
    if (width && height && value.cells.length !== width * height) issue("invalid_cell_length", "cells", "cells length must equal width × height.");
    value.cells.forEach((cell, index) => {
      if (!isRecord(cell) || !hasExactKeys(cell, ["paletteColorId"]) || typeof cell.paletteColorId !== "string" || !paletteIds.has(cell.paletteColorId)) issue("unknown_palette_id", `cells[${index}].paletteColorId`, "Each cell must reference an existing palette ID.");
    });
  }

  validateCounts(value.counts, Array.isArray(value.palette) ? value.palette : [], Array.isArray(value.cells) ? value.cells : [], issue);
  validateSections(value.sections, width, height, issue);
  validateExports(value.exports, issue);
  return issues.length ? { ok: false, issues } : { ok: true, value: value as unknown as PatternDocument };
}

function validateSourceImage(value: unknown, issue: (code: string, path: string, message: string) => void): void {
  if (!isRecord(value) || !Object.keys(value).every((key) => ["mimeType", "originalFileName", "width", "height"].includes(key)) || !["mimeType", "width", "height"].every((key) => key in (value ?? {}))) { issue("unexpected_shape", "settings.sourceImage", "sourceImage has missing or unexpected fields."); return; }
  if (value.mimeType !== "image/jpeg" && value.mimeType !== "image/png") issue("invalid_mime_type", "settings.sourceImage.mimeType", "Source image must be JPEG or PNG.");
  if ("originalFileName" in value && value.originalFileName !== undefined && !isSafeBasename(value.originalFileName)) issue("unsafe_filename", "settings.sourceImage.originalFileName", "originalFileName must be a safe basename.");
  for (const key of ["width", "height"] as const) if (!isPositiveSafeInteger(value[key])) issue("invalid_dimension", `settings.sourceImage.${key}`, `${key} must be a positive safe integer.`);
}

function validateCounts(value: unknown, palette: unknown[], cells: unknown[], issue: (code: string, path: string, message: string) => void): void {
  if (!isRecord(value) || !hasExactKeys(value, ["byPaletteColor", "totalBeads"])) { issue("unexpected_shape", "counts", "counts has missing or unexpected fields."); return; }
  if (!Array.isArray(value.byPaletteColor)) { issue("invalid_type", "counts.byPaletteColor", "byPaletteColor must be an array."); return; }
  const countEntries = value.byPaletteColor;
  const derived = derivePatternCounts({ palette: palette as PaletteColor[], cells: cells as PatternCell[], settings: { grid: { width: 1, height: 1 } } as PatternSettings });
  if (countEntries.length !== derived.byPaletteColor.length) issue("mismatched_counts", "counts.byPaletteColor", "Counts must include every palette color.");
  derived.byPaletteColor.forEach((expected, index) => {
    const actual = countEntries[index];
    if (!isRecord(actual) || actual.paletteColorId !== expected.paletteColorId || actual.beadCount !== expected.beadCount || !isNonNegativeSafeInteger(actual.beadCount)) issue("mismatched_counts", `counts.byPaletteColor[${index}]`, "Palette counts must match the cells and include zero-use colors.");
  });
  if (value.totalBeads !== cells.length || !isNonNegativeSafeInteger(value.totalBeads)) issue("mismatched_counts", "counts.totalBeads", "totalBeads must equal the grid area.");
}

function validateSections(value: unknown, width: number, height: number, issue: (code: string, path: string, message: string) => void): void {
  if (!isRecord(value) || !hasExactKeys(value, ["layout", "items"])) { issue("unexpected_shape", "sections", "sections has missing or unexpected fields."); return; }
  const layout = value.layout;
  if (!isRecord(layout) || !hasExactKeys(layout, ["maxColumnsPerSection", "maxRowsPerSection", "overlapCells"])) issue("unexpected_shape", "sections.layout", "Section layout has missing or unexpected fields.");
  else {
    for (const key of ["maxColumnsPerSection", "maxRowsPerSection"] as const) if (!isPositiveSafeInteger(layout[key])) issue("invalid_section_layout", `sections.layout.${key}`, `${key} must be a positive safe integer.`);
    if (layout.overlapCells !== 0 && layout.overlapCells !== 1) issue("invalid_section_layout", "sections.layout.overlapCells", "overlapCells must be 0 or 1.");
  }
  if (!Array.isArray(value.items)) { issue("invalid_type", "sections.items", "items must be an array."); return; }
  const covered = width && height ? new Uint8Array(width * height) : undefined;
  let previousRect: GridRect | undefined;
  value.items.forEach((section, index) => {
    const path = `sections.items[${index}]`;
    if (!isRecord(section) || !hasExactKeys(section, ["id", "order", "rect", "printRect"])) { issue("unexpected_shape", path, "Section has missing or unexpected fields."); return; }
    if (typeof section.id !== "string" || !section.id.trim()) issue("invalid_section_id", `${path}.id`, "Section ID must be non-empty.");
    if (section.order !== index) issue("invalid_section_order", `${path}.order`, "Sections must be in deterministic reading order.");
    const rect = section.rect; const printRect = section.printRect;
    if (!isRectInGrid(rect, width, height)) { issue("invalid_section_rect", `${path}.rect`, "Section rect must be a positive rectangle inside the grid."); return; }
    if (previousRect && (rect.y < previousRect.y || (rect.y === previousRect.y && rect.x < previousRect.x))) issue("invalid_section_order", `${path}.order`, "Sections must be in deterministic top-to-bottom, left-to-right reading order.");
    previousRect = rect;
    if (!isRectInGrid(printRect, width, height)) issue("invalid_print_rect", `${path}.printRect`, "printRect must be clipped to the grid.");
    if (isRecord(layout) && isRectInGrid(printRect, width, height) && !isAllowedPrintRect(rect, printRect, layout.overlapCells)) issue("invalid_print_rect", `${path}.printRect`, "printRect may differ only by the allowed overlap.");
    if (covered) for (let y = rect.y; y < rect.y + rect.height; y += 1) for (let x = rect.x; x < rect.x + rect.width; x += 1) { const cell = cellIndex(x, y, width); if (covered[cell]) issue("overlapping_sections", "sections", "Owned section rectangles must not overlap."); covered[cell] = 1; }
  });
  if (covered && covered.some((cell) => cell === 0)) issue("uncovered_sections", "sections", "Owned section rectangles must cover the grid exactly once.");
}

function isRectInGrid(value: unknown, width: number, height: number): value is GridRect {
  return isRecord(value) && hasExactKeys(value, ["x", "y", "width", "height"]) && typeof value.x === "number" && Number.isSafeInteger(value.x) && value.x >= 0 && typeof value.y === "number" && Number.isSafeInteger(value.y) && value.y >= 0 && isPositiveSafeInteger(value.width) && isPositiveSafeInteger(value.height) && value.x + value.width <= width && value.y + value.height <= height;
}
function isAllowedPrintRect(rect: GridRect, printRect: GridRect, overlap: unknown): boolean {
  const allowance = overlap === 1 ? 1 : 0;
  return printRect.x >= rect.x - allowance && printRect.y >= rect.y - allowance && printRect.x + printRect.width <= rect.x + rect.width + allowance && printRect.y + printRect.height <= rect.y + rect.height + allowance && printRect.x <= rect.x && printRect.y <= rect.y && printRect.x + printRect.width >= rect.x + rect.width && printRect.y + printRect.height >= rect.y + rect.height;
}

function validateExports(value: unknown, issue: (code: string, path: string, message: string) => void): void {
  if (!isRecord(value) || !Object.keys(value).every((key) => ["latest", "history"].includes(key)) || !("history" in (value ?? {})) || !Array.isArray(value.history)) { issue("unexpected_shape", "exports", "exports has missing or unexpected fields."); return; }
  if ("latest" in value && value.latest !== undefined) validateExportRecord(value.latest, "exports.latest", issue);
  value.history.forEach((record, index) => validateExportRecord(record, `exports.history[${index}]`, issue));
}
function validateExportRecord(value: unknown, path: string, issue: (code: string, path: string, message: string) => void): void {
  if (!isRecord(value) || !hasExactKeys(value, ["id", "options", "exportedAt", "exporterVersion", "suggestedFileName", "artifactCount"])) { issue("unexpected_shape", path, "Export record has missing or unexpected fields."); return; }
  for (const key of ["id", "exporterVersion"] as const) if (typeof value[key] !== "string" || !value[key].trim()) issue("invalid_string", `${path}.${key}`, `${key} must be non-empty.`);
  if (typeof value.exportedAt !== "string" || !ISO_UTC.test(value.exportedAt)) issue("invalid_timestamp", `${path}.exportedAt`, "exportedAt must be an ISO 8601 UTC timestamp.");
  if (!isNonNegativeSafeInteger(value.artifactCount) || value.artifactCount < 1) issue("invalid_artifact_count", `${path}.artifactCount`, "artifactCount must be a positive safe integer.");
  const options = value.options;
  if (!isRecord(options) || !Object.keys(options).every((key) => ["format", "scope", "rasterScale", "includeLegend", "includeZeroCountColors"].includes(key)) || !["format", "scope", "includeLegend", "includeZeroCountColors"].every((key) => key in (options ?? {}))) { issue("unexpected_shape", `${path}.options`, "Export options have missing or unexpected fields."); return; }
  if (options.format !== "png" && options.format !== "pdf" && options.format !== "csv") issue("invalid_export_format", `${path}.options.format`, "Unsupported export format.");
  if (options.scope !== "pattern" && options.scope !== "sections" && options.scope !== "counts") issue("invalid_export_scope", `${path}.options.scope`, "Unsupported export scope.");
  for (const key of ["includeLegend", "includeZeroCountColors"] as const) if (typeof options[key] !== "boolean") issue("invalid_boolean", `${path}.options.${key}`, `${key} must be boolean.`);
  if (options.format === "png" ? !isPositiveSafeInteger(options.rasterScale) : "rasterScale" in options) issue("invalid_raster_scale", `${path}.options.rasterScale`, "PNG requires a positive rasterScale; PDF and CSV must omit it.");
  const expectedExtension = typeof options.format === "string" ? `.${options.format}` : "";
  if (!isSafeBasename(value.suggestedFileName) || !value.suggestedFileName.endsWith(expectedExtension)) issue("unsafe_filename", `${path}.suggestedFileName`, "Export filename must be a safe basename with the requested format extension.");
}

export * from "./quantize";
