import { describe, expect, it, vi } from "vitest";
import { downloadPatternPng, drawPatternToCanvas } from "../../src/lib/pattern/png-export";
import type { PatternDocument } from "../../src/lib/pattern";

const document = {
  title: "My Pattern",
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

  it("deterministically reduces cell size to keep a 500 by 500 export within the canvas budget", () => {
    const context = { fillStyle: "", fillRect: vi.fn() } as unknown as CanvasRenderingContext2D;
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => context) } as unknown as HTMLCanvasElement;
    const largeDocument = {
      settings: { grid: { width: 500, height: 500 } },
      palette: [],
      cells: [],
    } as unknown as PatternDocument;

    drawPatternToCanvas(largeDocument, canvas, 32);

    expect(canvas.width).toBe(4_000);
    expect(canvas.height).toBe(4_000);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(16_000_000);
    expect(canvas.width).toBeLessThanOrEqual(8_192);
    expect(canvas.height).toBeLessThanOrEqual(8_192);
  });

  it("fails clearly when even one pixel per cell exceeds the canvas budget", () => {
    const canvas = { width: 0, height: 0, getContext: vi.fn() } as unknown as HTMLCanvasElement;
    const impossibleDocument = {
      settings: { grid: { width: 8_193, height: 1 } },
      palette: [],
      cells: [],
    } as unknown as PatternDocument;

    expect(() => drawPatternToCanvas(impossibleDocument, canvas)).toThrow(/canvas export budget/i);
    expect(canvas.getContext).not.toHaveBeenCalled();
  });
});

describe("downloadPatternPng", () => {
  it("draws the complete pattern and downloads the encoded PNG through injected browser adapters", async () => {
    const fillRect = vi.fn();
    const context = { fillStyle: "", fillRect } as unknown as CanvasRenderingContext2D;
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => context) } as unknown as HTMLCanvasElement;
    const blob = new Blob(["png"], { type: "image/png" });
    const adapter = {
      createCanvas: vi.fn(() => canvas),
      canvasToBlob: vi.fn().mockResolvedValue(blob),
      downloadBlob: vi.fn(),
    };

    await downloadPatternPng(document, "my-pattern.png", adapter, 8);

    expect(canvas.width).toBe(16);
    expect(canvas.height).toBe(8);
    expect(fillRect).toHaveBeenCalledTimes(2);
    expect(adapter.canvasToBlob).toHaveBeenCalledWith(canvas);
    expect(adapter.downloadBlob).toHaveBeenCalledWith(blob, "my-pattern.png");
  });
});
