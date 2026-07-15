import { describe, expect, it } from "vitest";
import {
  derivePatternCounts,
  derivePatternSections,
  validatePatternDocument,
} from "../../src/lib/pattern";
import { DEFAULT_PALETTE } from "../../src/lib/pattern/default-palette";

describe("DEFAULT_PALETTE", () => {
  it("is contiguous, uppercase hexadecimal, and compatible with generic palette-label validation", () => {
    expect(DEFAULT_PALETTE.length).toBeGreaterThan(1);
    expect(DEFAULT_PALETTE.map((color) => color.sortOrder)).toEqual(DEFAULT_PALETTE.map((_, index) => index));
    expect(DEFAULT_PALETTE.every((color) => /^#[0-9A-F]{6}$/.test(color.hex))).toBe(true);

    const cells = [{ paletteColorId: DEFAULT_PALETTE[0].id }];
    const document = {
      schemaVersion: 1 as const,
      id: "default-palette-check",
      title: "Default palette check",
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
      settings: {
        grid: { width: 1, height: 1 },
        requestedColorCount: DEFAULT_PALETTE.length,
        quantizationMethod: "nearest-color" as const,
        mirrorHorizontal: false,
        mirrorVertical: false,
      },
      palette: DEFAULT_PALETTE,
      cells,
      counts: derivePatternCounts({ palette: DEFAULT_PALETTE, cells, settings: { grid: { width: 1, height: 1 } } as never }),
      sections: derivePatternSections({ width: 1, height: 1 }, { maxColumnsPerSection: 1, maxRowsPerSection: 1, overlapCells: 0 }),
      exports: { history: [] },
    };

    expect(validatePatternDocument(document)).toEqual({ ok: true, value: document });
  });
});
