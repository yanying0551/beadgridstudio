import { describe, expect, it } from "vitest";
import { patternToCsv } from "../../src/lib/pattern/csv-export";
import type { PatternDocument } from "../../src/lib/pattern";

const document = {
  settings: { grid: { width: 2, height: 2 } },
  palette: [
    { id: "red", name: "Warm Red", hex: "#CC1122", sortOrder: 0 },
    { id: "blue", name: "Ocean, Blue", hex: "#1133CC", sortOrder: 1 },
  ],
  cells: [
    { paletteColorId: "red" },
    { paletteColorId: "blue" },
    { paletteColorId: "blue" },
    { paletteColorId: "red" },
  ],
} as unknown as PatternDocument;

describe("patternToCsv", () => {
  it("exports a row-major grid with coordinates and generic color labels", () => {
    expect(patternToCsv(document)).toBe([
      "row,column,color,color_hex",
      "1,1,Warm Red,#CC1122",
      "1,2,\"Ocean, Blue\",#1133CC",
      "2,1,\"Ocean, Blue\",#1133CC",
      "2,2,Warm Red,#CC1122",
    ].join("\n"));
  });

  it("uses a safe fallback for an unknown palette reference", () => {
    const unknown = structuredClone(document);
    unknown.cells[0] = { paletteColorId: "missing" };
    expect(patternToCsv(unknown)).toContain("1,1,Unknown color,");
  });
});
