import { describe, expect, it, vi } from "vitest";
import { drawPatternToCanvas } from "../../src/lib/pattern/png-export";
import type { PatternDocument } from "../../src/lib/pattern";

const document = {
  settings: { grid: { width: 2, height: 1 } },
  palette: [{ id: "red", name: "Warm Red", hex: "#CC1122", sortOrder: 0 }],
  cells: [{ paletteColorId: "red" }, { paletteColorId: "missing" }],
} as unknown as PatternDocument;

describe("drawPatternToCanvas", () => {
  it("sets canvas dimensions and paints each cell with its palette color", () => {
    const fillRect = vi.fn();
    const context = { fillStyle: "", fillRect } as unknown as CanvasRenderingContext2D;
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => context) } as unknown as HTMLCanvasElement;

    drawPatternToCanvas(document, canvas, 10);

    expect(canvas.width).toBe(20);
    expect(canvas.height).toBe(10);
    expect(fillRect).toHaveBeenNthCalledWith(1, 0, 0, 10, 10);
    expect(fillRect).toHaveBeenNthCalledWith(2, 10, 0, 10, 10);
  });
});
