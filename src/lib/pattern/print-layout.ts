const PRINT_GRID_MAX_WIDTH_MM = 180;
const PRINT_ROW_AXIS_WIDTH_MM = 6;
const PRINT_COLUMN_AXIS_HEIGHT_MM = 3;
const PRINT_PAGE_CONTENT_HEIGHT_MM = 273;
const PRINT_FIXED_PAGE_CONTENT_MM = 35;
const PRINT_LEGEND_ROW_HEIGHT_MM = 4;
const PRINT_LEGEND_COLUMNS = 3;

/**
 * Compute one square cell size for a section without browser measurements.
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

  const legendRows = Math.max(1, Math.ceil(paletteColorCount / PRINT_LEGEND_COLUMNS));
  const cellWidthBudget = (PRINT_GRID_MAX_WIDTH_MM - PRINT_ROW_AXIS_WIDTH_MM) / columns;
  const gridHeightBudget = PRINT_PAGE_CONTENT_HEIGHT_MM
    - PRINT_FIXED_PAGE_CONTENT_MM
    - legendRows * PRINT_LEGEND_ROW_HEIGHT_MM;
  const cellHeightBudget = (gridHeightBudget - PRINT_COLUMN_AXIS_HEIGHT_MM) / rows;

  // Round down so decimal serialization can never push the grid over a budget.
  return Math.floor(Math.min(cellWidthBudget, cellHeightBudget) * 100) / 100;
}
