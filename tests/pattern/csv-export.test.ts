import { describe, expect, it } from "vitest";
import { materialsToCsv, patternToCsv } from "../../src/lib/pattern/csv-export";
import type { PatternDocument } from "../../src/lib/pattern";

const document = {
  settings: { grid: { width: 2, height: 2 } },
  palette: [
    { id: "red", name: "Warm Red", hex: "#CC1122", sortOrder: 0 },
    { id: "blue", name: "Ocean, Blue", hex: "#1133CC", sortOrder: 1 },
    { id: "unused", name: "Quote \"White\"", hex: "#FFFFFF", sortOrder: 2 },
  ],
  cells: [
    { paletteColorId: "red" },
    { paletteColorId: "blue" },
    { paletteColorId: "blue" },
    { paletteColorId: "red" },
  ],
  counts: {
    byPaletteColor: [
      { paletteColorId: "red", beadCount: 999 },
      { paletteColorId: "blue", beadCount: 0 },
      { paletteColorId: "unused", beadCount: 10 },
    ],
    totalBeads: 1009,
  },
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

  it.each([
    "=HYPERLINK(\"https://example.test\")",
    "+SUM(1,2)",
    "-2+3",
    "@SUM(1,2)",
    " \t=CMD|' /C calc'!A0",
  ])("neutralizes formula payloads in pattern text fields: %s", (payload) => {
    const unsafe = structuredClone(document);
    unsafe.palette[0].name = payload;
    (unsafe.palette[0] as { hex: string }).hex = payload;

    const csv = patternToCsv(unsafe);
    const neutralized = `'${payload}`;
    const escaped = /[",\n\r]/.test(neutralized)
      ? `"${neutralized.replaceAll('"', '""')}"`
      : neutralized;

    expect(csv.split("\n")[1]).toBe(`1,1,${escaped},${escaped}`);
    expect(csv.split("\n")[1]).not.toMatch(/(?:^|,)\s*[=+@-]/);
  });
});

describe("materialsToCsv", () => {
  it("quotes material labels and reconciles counts from the actual pattern cells", () => {
    expect(materialsToCsv(document)).toBe([
      "color,color_hex,palette_id,bead_count",
      "Warm Red,#CC1122,red,2",
      "\"Ocean, Blue\",#1133CC,blue,2",
      "\"Quote \"\"White\"\"\",#FFFFFF,unused,0",
      "TOTAL,,,4",
    ].join("\n"));
  });

  it.each([
    "=1+1",
    "+SUM(1,2)",
    "-2+3",
    "@SUM(1,2)",
    "  =HYPERLINK(\"https://example.test\")",
  ])("neutralizes formula payloads in every exported material text field: %s", (payload) => {
    const unsafe = structuredClone(document);
    unsafe.palette = [
      { id: payload, name: payload, hex: payload, sortOrder: 0 },
    ] as unknown as PatternDocument["palette"];
    unsafe.cells = [{ paletteColorId: payload }];

    const materialRow = materialsToCsv(unsafe).split("\n")[1];

    expect(materialRow.match(/'/g)).toHaveLength(3);
    expect(materialRow).not.toMatch(/(?:^|,)\s*[=+@-]/);
  });

  it("preserves ordinary text while retaining RFC CSV quote escaping", () => {
    const ordinary = structuredClone(document);
    ordinary.palette = [{ id: "safe-id", name: "Safe, \"quoted\" color", hex: "#123456", sortOrder: 0 }];
    ordinary.cells = [{ paletteColorId: "safe-id" }];

    expect(materialsToCsv(ordinary).split("\n")[1]).toBe(
      '"Safe, ""quoted"" color",#123456,safe-id,1',
    );
  });
});
