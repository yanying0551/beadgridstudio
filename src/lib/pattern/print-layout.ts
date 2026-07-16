const PRINT_GRID_MAX_WIDTH_MM = 180;
const PRINT_ROW_AXIS_WIDTH_MM = 6;
const PRINT_COLUMN_AXIS_HEIGHT_MM = 3;
const PRINT_PAGE_CONTENT_HEIGHT_MM = 273;
// Includes the complete header, inter-block spacing, legend, and a safety
// margin for browser grid-border rounding. A smaller allowance can push the
// legend of a narrow 50-row section onto an otherwise empty extra page.
const PRINT_FIXED_PAGE_CONTENT_MM = 50;
const PRINT_LEGEND_ROW_HEIGHT_MM = 4;
const PRINT_LEGEND_COLUMNS = 3;
const CSS_PIXEL_MM = 25.4 / 96;
const PRINT_GRID_OUTER_BORDER_MM = CSS_PIXEL_MM;

/**
 * Compute one square cell size for an A4 portrait section without browser measurements.
 * The fixed page allowance covers the title, bounds, guidance, legend heading,
 * spacing, and a small pagination safety margin. Each additional legend row
 * reduces the height left for the grid.
 */
export function calculatePrintCellSizeMm(
  columns: number,
  rows: number,
  paletteColorCount: number,
): number {
  if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1) {
    throw new RangeError("Print grid dimensions must be positive integers");
  }
  if (!Number.isInteger(paletteColorCount) || paletteColorCount < 0) {
    throw new RangeError("Print palette color count must be a non-negative integer");
  }

  const legendRows = Math.max(1, Math.ceil(paletteColorCount / PRINT_LEGEND_COLUMNS));
  const cellWidthBudget = (
    PRINT_GRID_MAX_WIDTH_MM
    - PRINT_GRID_OUTER_BORDER_MM
    - PRINT_ROW_AXIS_WIDTH_MM
  ) / columns;
  const gridHeightBudget = PRINT_PAGE_CONTENT_HEIGHT_MM
    - PRINT_FIXED_PAGE_CONTENT_MM
    - legendRows * PRINT_LEGEND_ROW_HEIGHT_MM;
  const cellHeightBudget = (
    gridHeightBudget
    - PRINT_GRID_OUTER_BORDER_MM
    - PRINT_COLUMN_AXIS_HEIGHT_MM
  ) / rows;

  // Round down so decimal serialization can never push the grid over a budget.
  const cellSizeMm = Math.floor(Math.min(cellWidthBudget, cellHeightBudget) * 100) / 100;
  if (cellSizeMm <= 0) {
    throw new RangeError("Print layout does not fit on one page");
  }
  return cellSizeMm;
}

/** Scale cell color codes for legibility while keeping dense grids usable. */
export function calculatePrintCodeSizeMm(cellSizeMm: number): number {
  if (!Number.isFinite(cellSizeMm) || cellSizeMm <= 0) {
    throw new RangeError("Print cell size must be a positive finite number");
  }

  const scaledSize = Math.floor(cellSizeMm * 0.65 * 100) / 100;
  return Math.min(cellSizeMm, 4, Math.max(2.4, scaledSize));
}
