import { describe, expect, it, vi } from "vitest";
import { convertPattern } from "../../src/workers/pattern.worker";
import type { ConvertPatternRequest } from "../../src/workers/pattern-worker.protocol";
import * as patternLibrary from "../../src/lib/pattern";

const request: ConvertPatternRequest = {
  type: "convert-pattern", requestId: "request-1",
  image: { width: 2, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]).buffer },
  settings: { requestedColorCount: 2, quantizationMethod: "nearest-color", mirrorHorizontal: false, mirrorVertical: false, sourceImage: { mimeType: "image/png", originalFileName: "photo.png", width: 2, height: 1 } },
  palette: [{ id: "red", name: "Red", hex: "#FF0000", sortOrder: 0 }, { id: "blue", name: "Blue", hex: "#0000FF", sortOrder: 1 }],
  sectionLayout: { maxColumnsPerSection: 1, maxRowsPerSection: 1, overlapCells: 0 },
  document: { id: "pattern-1", title: "Pattern", createdAt: "2026-01-01T00:00:00.000Z" },
};

describe("pattern worker conversion", () => {
  it("builds a valid document from RGBA pixels without retaining image bytes", () => {
    const result = convertPattern(request);
    expect(result.type).toBe("pattern-success");
    if (result.type === "pattern-success") {
      expect(result.document.cells.map((cell) => cell.paletteColorId)).toEqual(["red", "blue"]);
      expect(result.document.counts.totalBeads).toBe(2);
      expect(result.document.sections.items).toHaveLength(2);
      expect(JSON.stringify(result.document)).not.toMatch(/Uint8|ArrayBuffer|data/);
    }
  });

  it("returns a typed error for malformed transferred pixel data", () => {
    const result = convertPattern({ ...request, image: { ...request.image, data: new ArrayBuffer(3) } });
    expect(result).toMatchObject({ type: "pattern-error", requestId: "request-1", error: { code: "invalid_request" } });
  });

  it.each([
    ["a dimension above the V1 maximum", 501, 1],
    ["an area above the V1 maximum", 500, 501],
  ])("rejects %s before quantization", (_caseName, width, height) => {
    const quantize = vi.spyOn(patternLibrary, "quantizeRgb");
    const result = convertPattern({ ...request, image: { width, height, data: new ArrayBuffer(0) } } as ConvertPatternRequest);

    expect(result).toMatchObject({ type: "pattern-error", error: { code: "invalid_request" } });
    expect(quantize).not.toHaveBeenCalled();
    quantize.mockRestore();
  });

  it("rejects layouts that would create more than the V1 section limit before quantization", () => {
    const quantize = vi.spyOn(patternLibrary, "quantizeRgb");
    const result = convertPattern({
      ...request,
      image: { width: 500, height: 500, data: new ArrayBuffer(500 * 500 * 4) },
      sectionLayout: { maxColumnsPerSection: 1, maxRowsPerSection: 1, overlapCells: 0 },
    });

    expect(result).toMatchObject({ type: "pattern-error", error: { code: "invalid_request" } });
    expect(quantize).not.toHaveBeenCalled();
    quantize.mockRestore();
  });

  it("accepts V1 maximum image dimensions when its layout stays within the section limit", () => {
    const result = convertPattern({
      ...request,
      image: { width: 500, height: 500, data: new ArrayBuffer(500 * 500 * 4) },
      sectionLayout: { maxColumnsPerSection: 500, maxRowsPerSection: 500, overlapCells: 0 },
    });

    expect(result).toMatchObject({ type: "pattern-success" });
  });

  it("classifies a quantization runtime failure as conversion_failed", () => {
    const quantize = vi.spyOn(patternLibrary, "quantizeRgb").mockImplementation(() => {
      throw new Error("quantizer failed");
    });

    const result = convertPattern(request);

    expect(result).toMatchObject({ type: "pattern-error", error: { code: "conversion_failed", message: "quantizer failed" } });
    quantize.mockRestore();
  });

  it("reports quantizing, deriving, and validating phases in order before success", () => {
    const phases: string[] = [];
    const result = convertPattern(request, (phase) => phases.push(phase));

    expect(result.type).toBe("pattern-success");
    expect(phases).toEqual(["quantizing", "deriving", "validating"]);
  });

  it("selects Floyd-Steinberg quantization from conversion settings", () => {
    const result = convertPattern({
      ...request,
      image: {
        width: 3,
        height: 1,
        data: new Uint8ClampedArray([
          127, 127, 127, 255, 127, 127, 127, 255, 127, 127, 127, 255,
        ]).buffer,
      },
      settings: { ...request.settings, quantizationMethod: "floyd-steinberg" },
      palette: [
        { id: "black", name: "Black", hex: "#000000", sortOrder: 0 },
        { id: "white", name: "White", hex: "#FFFFFF", sortOrder: 1 },
      ],
    });

    expect(result).toMatchObject({ type: "pattern-success" });
    if (result.type === "pattern-success") {
      expect(result.document.cells.map((cell) => cell.paletteColorId)).toEqual(["black", "white", "black"]);
    }
  });
});
