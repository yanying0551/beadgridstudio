import type { GenericPaletteColor } from ".";

/** Generic, non-brand color choices used for browser-local V1 conversion. */
export const DEFAULT_PALETTE: GenericPaletteColor[] = [
  { id: "black", name: "Black", hex: "#202020", sortOrder: 0 },
  { id: "white", name: "White", hex: "#FFFFFF", sortOrder: 1 },
  { id: "red", name: "Red", hex: "#D62828", sortOrder: 2 },
  { id: "orange", name: "Orange", hex: "#F77F00", sortOrder: 3 },
  { id: "yellow", name: "Yellow", hex: "#FCBF49", sortOrder: 4 },
  { id: "green", name: "Green", hex: "#2A9D8F", sortOrder: 5 },
  { id: "blue", name: "Blue", hex: "#277DA1", sortOrder: 6 },
  { id: "purple", name: "Purple", hex: "#6A4C93", sortOrder: 7 },
];
