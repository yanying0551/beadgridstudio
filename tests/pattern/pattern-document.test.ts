import { describe, expect, it } from "vitest";

import {
  PATTERN_DOCUMENT_SCHEMA_VERSION,
  derivePatternCounts,
  derivePatternSections,
  validatePatternDocument,
  type PatternDocument,
} from "../../src/lib/pattern";

function makeDocument(width = 2, height = 2): PatternDocument {
  const palette = [
    { id: "red", name: "Warm Red", hex: "#CC1122", sortOrder: 0 },
    { id: "blue", name: "Ocean Blue", hex: "#1144AA", sortOrder: 1 },
    { id: "white", name: "Snow White", hex: "#FFFFFF", sortOrder: 2 },
  ] as const;
  const cells = Array.from({ length: width * height }, (_, index) => ({
    paletteColorId: index % 2 === 0 ? "red" : "blue",
  }));

  return {
    schemaVersion: PATTERN_DOCUMENT_SCHEMA_VERSION,
    id: "pattern-1",
    title: "Sample pattern",
    createdAt: "2026-07-14T17:00:00.000Z",
    updatedAt: "2026-07-14T17:00:00.000Z",
    settings: {
      grid: { width, height },
      requestedColorCount: 3,
      quantizationMethod: "nearest-color",
      mirrorHorizontal: false,
      mirrorVertical: false,
      sourceImage: {
        mimeType: "image/png",
        originalFileName: "reference.png",
        width: 8,
        height: 6,
      },
    },
    palette: [...palette],
    cells,
    counts: derivePatternCounts({
      palette: [...palette],
      cells,
      settings: {
        grid: { width, height },
        requestedColorCount: 3,
        quantizationMethod: "nearest-color",
        mirrorHorizontal: false,
        mirrorVertical: false,
      },
    }),
    sections: {
      layout: { maxColumnsPerSection: width, maxRowsPerSection: height, overlapCells: 0 },
      items: [
        {
          id: "section-1",
          order: 0,
          rect: { x: 0, y: 0, width, height },
          printRect: { x: 0, y: 0, width, height },
        },
      ],
    },
    exports: { history: [] },
  };
}

function issuesFor(value: unknown) {
  const result = validatePatternDocument(value);
  expect(result.ok).toBe(false);
  return "issues" in result ? result.issues : [];
}

describe("PatternDocument contract", () => {
  it("accepts valid 2×2 and 4×3 documents after structured-clone and JSON round trips", () => {
    for (const document of [makeDocument(), makeDocument(4, 3)]) {
      const clone = structuredClone(document);
      const jsonRoundTrip = JSON.parse(JSON.stringify(document));
      expect(validatePatternDocument(clone)).toEqual({ ok: true, value: clone });
      expect(validatePatternDocument(jsonRoundTrip)).toEqual({ ok: true, value: jsonRoundTrip });
    }
  });

  it("derives counts for every palette entry, including zero-use colors", () => {
    expect(makeDocument().counts).toEqual({
      byPaletteColor: [
        { paletteColorId: "red", beadCount: 2 },
        { paletteColorId: "blue", beadCount: 2 },
        { paletteColorId: "white", beadCount: 0 },
      ],
      totalBeads: 4,
    });
  });

  it("derives 4×3 sections in deterministic top-to-bottom, left-to-right order", () => {
    expect(derivePatternSections(
      { width: 4, height: 3 },
      { maxColumnsPerSection: 2, maxRowsPerSection: 2, overlapCells: 0 },
    )).toEqual({
      layout: { maxColumnsPerSection: 2, maxRowsPerSection: 2, overlapCells: 0 },
      items: [
        { id: "section-1", order: 0, rect: { x: 0, y: 0, width: 2, height: 2 }, printRect: { x: 0, y: 0, width: 2, height: 2 } },
        { id: "section-2", order: 1, rect: { x: 2, y: 0, width: 2, height: 2 }, printRect: { x: 2, y: 0, width: 2, height: 2 } },
        { id: "section-3", order: 2, rect: { x: 0, y: 2, width: 2, height: 1 }, printRect: { x: 0, y: 2, width: 2, height: 1 } },
        { id: "section-4", order: 3, rect: { x: 2, y: 2, width: 2, height: 1 }, printRect: { x: 2, y: 2, width: 2, height: 1 } },
      ],
    });
  });

  it("accepts clipped one-cell print overlap and rejects overlapping owned rectangles", () => {
    const document = makeDocument();
    document.sections = {
      layout: { maxColumnsPerSection: 1, maxRowsPerSection: 2, overlapCells: 1 },
      items: [
        { id: "left", order: 0, rect: { x: 0, y: 0, width: 1, height: 2 }, printRect: { x: 0, y: 0, width: 2, height: 2 } },
        { id: "right", order: 1, rect: { x: 1, y: 0, width: 1, height: 2 }, printRect: { x: 0, y: 0, width: 2, height: 2 } },
      ],
    };
    expect(validatePatternDocument(document).ok).toBe(true);

    document.sections.items[1].rect = { x: 0, y: 0, width: 1, height: 2 };
    expect(issuesFor(document).some((issue) => issue.code === "overlapping_sections")).toBe(true);
  });

  it("rejects complete non-overlapping sections that are not in reading order", () => {
    const document = makeDocument();
    document.sections = {
      layout: { maxColumnsPerSection: 1, maxRowsPerSection: 2, overlapCells: 0 },
      items: [
        { id: "right", order: 0, rect: { x: 1, y: 0, width: 1, height: 2 }, printRect: { x: 1, y: 0, width: 1, height: 2 } },
        { id: "left", order: 1, rect: { x: 0, y: 0, width: 1, height: 2 }, printRect: { x: 0, y: 0, width: 1, height: 2 } },
      ],
    };

    expect(issuesFor(document).some((issue) => issue.code === "invalid_section_order")).toBe(true);
  });

  it.each([
    ["schema version", (doc: PatternDocument) => { doc.schemaVersion = 2 as never; }, "schemaVersion"],
    ["unsafe dimensions", (doc: PatternDocument) => { doc.settings.grid.width = 0; }, "settings.grid.width"],
    ["incorrect row-major length", (doc: PatternDocument) => { doc.cells.pop(); }, "cells"],
    ["unknown palette cell", (doc: PatternDocument) => { doc.cells[0].paletteColorId = "missing"; }, "cells[0].paletteColorId"],
    ["duplicate palette id", (doc: PatternDocument) => { doc.palette[1].id = "red"; }, "palette[1].id"],
    ["lowercase hex", (doc: PatternDocument) => { doc.palette[0].hex = "#cc1122" as PatternDocument["palette"][number]["hex"]; }, "palette[0].hex"],
    ["invalid hex", (doc: PatternDocument) => { doc.palette[0].hex = "red" as PatternDocument["palette"][number]["hex"]; }, "palette[0].hex"],
    ["non-contiguous sort order", (doc: PatternDocument) => { doc.palette[2].sortOrder = 4; }, "palette[2].sortOrder"],
    ["brand/SKU palette label", (doc: PatternDocument) => { doc.palette[0].name = "Perler P80 Red"; }, "palette[0].name"],
    ["mismatched counts", (doc: PatternDocument) => { doc.counts.totalBeads = 3; }, "counts.totalBeads"],
    ["uncovered sections", (doc: PatternDocument) => { doc.sections.items[0].rect.width = 1; }, "sections"],
  ])("rejects %s", (_label, mutate, path) => {
    const document = makeDocument();
    mutate(document);
    expect(issuesFor(document).some((issue) => issue.path === path)).toBe(true);
  });

  it("rejects unsafe export metadata and accepts format-matched safe filenames", () => {
    const safe = makeDocument();
    safe.exports.latest = {
      id: "export-1",
      options: { format: "png", scope: "pattern", rasterScale: 2, includeLegend: true, includeZeroCountColors: false },
      exportedAt: "2026-07-14T17:01:00.000Z",
      exporterVersion: "1.0.0",
      suggestedFileName: "sample-pattern.png",
      artifactCount: 1,
    };
    safe.exports.history = [safe.exports.latest];
    expect(validatePatternDocument(safe).ok).toBe(true);

    const unsafe = structuredClone(safe);
    unsafe.exports.latest!.suggestedFileName = "../sample.png";
    expect(issuesFor(unsafe).some((issue) => issue.path === "exports.latest.suggestedFileName")).toBe(true);

    const missingScale = structuredClone(safe);
    delete missingScale.exports.latest!.options.rasterScale;
    expect(issuesFor(missingScale).some((issue) => issue.path === "exports.latest.options.rasterScale")).toBe(true);
  });
});
