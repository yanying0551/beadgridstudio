import { describe, expect, it } from "vitest";
import { calculatePrintCellSizeMm } from "../../src/lib/pattern/print-layout";

describe("calculatePrintCellSizeMm boundary validation", () => {
  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid palette count %s",
    (paletteColorCount) => {
      expect(() => calculatePrintCellSizeMm(10, 10, paletteColorCount)).toThrow(
        new RangeError("Print palette color count must be a non-negative integer"),
      );
    },
  );

  it("keeps palette count 0 valid while reserving the minimum legend row", () => {
    expect(calculatePrintCellSizeMm(10, 10, 0)).toBe(
      calculatePrintCellSizeMm(10, 10, 1),
    );
  });

  it("keeps a maximum-width grid inside the A4 portrait budget including its outer border", () => {
    const cellSizeMm = calculatePrintCellSizeMm(50, 1, 1);
    const cssPixelMm = 25.4 / 96;

    expect(cssPixelMm + 6 + 50 * cellSizeMm).toBeLessThanOrEqual(180);
  });

  it("rejects a palette whose legend leaves no positive page budget", () => {
    expect(() => calculatePrintCellSizeMm(10, 10, 175)).toThrow(
      new RangeError("Print layout does not fit on one page"),
    );
  });

  it("rejects dimensions whose positive raw size rounds down to zero", () => {
    expect(() => calculatePrintCellSizeMm(1_000_000, 1, 0)).toThrow(
      new RangeError("Print layout does not fit on one page"),
    );
  });
});
