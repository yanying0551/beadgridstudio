import { describe, expect, it } from "vitest";

import {
  nearestPaletteColor,
  quantizeRgb,
  type RawRgbaImage,
} from "../../src/lib/pattern/quantize";
import type { PaletteColor } from "../../src/lib/pattern";

const palette: PaletteColor[] = [
  { id: "black", name: "Black", hex: "#000000", sortOrder: 0 },
  { id: "red", name: "Red", hex: "#FF0000", sortOrder: 1 },
  { id: "green", name: "Green", hex: "#00FF00", sortOrder: 2 },
  { id: "white", name: "White", hex: "#FFFFFF", sortOrder: 3 },
];

function source(width: number, height: number, rgba: number[]): RawRgbaImage {
  return { width, height, rgba };
}

describe("deterministic RGB quantization", () => {
  it("maps known RGB pixels to their nearest generic palette colors", () => {
    expect(nearestPaletteColor({ red: 240, green: 15, blue: 10 }, palette)).toMatchObject({ id: "red" });
    expect(nearestPaletteColor({ red: 20, green: 230, blue: 15 }, palette)).toMatchObject({ id: "green" });
    expect(nearestPaletteColor({ red: 220, green: 220, blue: 220 }, palette)).toMatchObject({ id: "white" });
  });

  it("preserves dimensions and emits row-major PatternCell-compatible palette IDs", () => {
    const result = quantizeRgb(source(2, 2, [
      255, 0, 0, 255, 0, 255, 0, 255,
      255, 255, 255, 255, 0, 0, 0, 255,
    ]), { palette, colorLimit: 4 });

    expect(result).toEqual({
      width: 2,
      height: 2,
      palette,
      cells: [
        { paletteColorId: "red" },
        { paletteColorId: "green" },
        { paletteColorId: "white" },
        { paletteColorId: "black" },
      ],
    });
  });

  it("resolves an equal RGB-distance tie to the first palette item", () => {
    expect(nearestPaletteColor({ red: 1, green: 0, blue: 0 }, [
      { id: "first", name: "First", hex: "#000000", sortOrder: 0 },
      { id: "second", name: "Second", hex: "#020000", sortOrder: 1 },
    ])).toMatchObject({ id: "first" });
  });

  it("limits use to the lowest sortOrder palette entries without inventing colors", () => {
    const result = quantizeRgb(source(2, 1, [
      0, 250, 0, 255, 250, 250, 250, 255,
    ]), { palette, colorLimit: 2 });

    expect(result.palette).toEqual(palette.slice(0, 2));
    expect(result.cells).toEqual([
      { paletteColorId: "black" },
      { paletteColorId: "red" },
    ]);
    expect(() => quantizeRgb(source(1, 1, [0, 0, 0, 255]), { palette, colorLimit: 0 })).toThrow(RangeError);
    expect(() => quantizeRgb(source(1, 1, [0, 0, 0, 255]), { palette, colorLimit: 5 })).toThrow(RangeError);
  });

  it("maps fully transparent pixels to the first allowed palette color in V1", () => {
    const result = quantizeRgb(source(2, 1, [
      255, 0, 0, 0, 0, 255, 0, 255,
    ]), { palette, colorLimit: 3 });

    expect(result.cells).toEqual([
      { paletteColorId: "black" },
      { paletteColorId: "green" },
    ]);
  });

  it("uses nearest-color by default and preserves its existing output when explicitly selected", () => {
    const image = source(3, 1, [
      127, 127, 127, 255, 127, 127, 127, 255, 127, 127, 127, 255,
    ]);
    const options = { palette: [palette[0], palette[3]], colorLimit: 2 };

    expect(quantizeRgb(image, options).cells).toEqual([
      { paletteColorId: "black" }, { paletteColorId: "black" }, { paletteColorId: "black" },
    ]);
    expect(quantizeRgb(image, { ...options, method: "nearest-color" }).cells).toEqual(
      quantizeRgb(image, options).cells,
    );
  });

  it("deterministically applies row-major Floyd-Steinberg error diffusion using only the allowed palette prefix", () => {
    const image = source(3, 1, [
      127, 127, 127, 255, 127, 127, 127, 255, 127, 127, 127, 255,
    ]);
    const options = {
      palette: [
        { ...palette[0], sortOrder: 0 },
        { ...palette[3], sortOrder: 1 },
        { ...palette[1], sortOrder: 2 },
      ],
      colorLimit: 2,
      method: "floyd-steinberg" as const,
    };

    const first = quantizeRgb(image, options);
    const second = quantizeRgb(image, options);

    expect(first.cells).toEqual([
      { paletteColorId: "black" }, { paletteColorId: "white" }, { paletteColorId: "black" },
    ]);
    expect(second).toEqual(first);
    expect(first.palette.map(({ id }) => id)).toEqual(["black", "white"]);
    expect(first.cells.every(({ paletteColorId }) => ["black", "white"].includes(paletteColorId))).toBe(true);
  });

  it("matches a compact 2D Floyd-Steinberg fixture", () => {
    const result = quantizeRgb(source(2, 2, [
      127, 127, 127, 255, 127, 127, 127, 255,
      127, 127, 127, 255, 127, 127, 127, 255,
    ]), { palette: [palette[0], palette[3]], colorLimit: 2, method: "floyd-steinberg" });

    expect(result.cells).toEqual([
      { paletteColorId: "black" }, { paletteColorId: "white" },
      { paletteColorId: "white" }, { paletteColorId: "black" },
    ]);
  });

  it("treats a transparent Floyd-Steinberg pixel as an error-diffusion barrier", () => {
    const result = quantizeRgb(source(2, 2, [
      127, 127, 127, 255, 127, 127, 127, 0,
      127, 127, 127, 255, 127, 127, 127, 255,
    ]), { palette: [palette[0], palette[3]], colorLimit: 2, method: "floyd-steinberg" });

    // Error from the top-left must not enter the transparent top-right pixel
    // or be emitted by it into the second row.
    expect(result.cells).toEqual([
      { paletteColorId: "black" }, { paletteColorId: "black" },
      { paletteColorId: "white" }, { paletteColorId: "black" },
    ]);
  });

  it("keeps fully transparent Floyd-Steinberg pixels mapped to the first allowed palette color", () => {
    const result = quantizeRgb(source(2, 1, [
      255, 255, 255, 0, 255, 255, 255, 255,
    ]), { palette: [palette[0], palette[3]], colorLimit: 2, method: "floyd-steinberg" });

    expect(result.cells).toEqual([
      { paletteColorId: "black" }, { paletteColorId: "white" },
    ]);
  });

  it("normalizes each allowed palette color once before converting all pixels", () => {
    let hexReads = 0;
    const measuredPalette: PaletteColor[] = [
      {
        id: "black",
        name: "Black",
        get hex(): `#${string}` {
          hexReads += 1;
          return "#000000";
        },
        sortOrder: 0,
      },
      {
        id: "white",
        name: "White",
        get hex(): `#${string}` {
          hexReads += 1;
          return "#FFFFFF";
        },
        sortOrder: 1,
      },
    ];

    quantizeRgb(source(3, 1, [
      0, 0, 0, 255, 128, 128, 128, 255, 255, 255, 255, 255,
    ]), { palette: measuredPalette, colorLimit: 2 });

    expect(hexReads).toBe(2);
  });

  it("rejects an invalid image height with a RangeError", () => {
    expect(() => quantizeRgb(source(1, 0, []), { palette, colorLimit: 1 })).toThrow(RangeError);
  });

  it.each([
    ["fractional", [0.5, 0, 0, 255]],
    ["out-of-range", [256, 0, 0, 255]],
    ["NaN", [Number.NaN, 0, 0, 255]],
  ])("rejects %s RGBA channel values with a RangeError", (_caseName, rgba) => {
    expect(() => quantizeRgb(source(1, 1, rgba), { palette, colorLimit: 1 })).toThrow(RangeError);
  });

  it.each([
    ["duplicate IDs", [
      { id: "same", name: "One", hex: "#000000", sortOrder: 0 },
      { id: "same", name: "Two", hex: "#FFFFFF", sortOrder: 1 },
    ]],
    ["blank names", [{ id: "black", name: " ", hex: "#000000", sortOrder: 0 }]],
    ["non-string names", [{ id: "black", name: 42, hex: "#000000", sortOrder: 0 }]],
    ["lowercase hex", [{ id: "black", name: "Black", hex: "#00000a", sortOrder: 0 }]],
    ["malformed hex", [{ id: "black", name: "Black", hex: "000000", sortOrder: 0 }]],
  ])("rejects palette colors with %s using RangeError", (_caseName, malformedPalette) => {
    expect(() => quantizeRgb(source(1, 1, [0, 0, 0, 255]), {
      palette: malformedPalette as PaletteColor[],
      colorLimit: 1,
    })).toThrow(RangeError);
  });

  it.each([
    ["negative", [{ id: "black", name: "Black", hex: "#000000", sortOrder: -1 }]],
    ["fractional", [{ id: "black", name: "Black", hex: "#000000", sortOrder: 0.5 }]],
    ["unsafe", [{ id: "black", name: "Black", hex: "#000000", sortOrder: Number.MAX_SAFE_INTEGER + 1 }]],
  ])("rejects %s palette sortOrder values with RangeError", (_caseName, malformedPalette) => {
    expect(() => quantizeRgb(source(1, 1, [0, 0, 0, 255]), {
      palette: malformedPalette as PaletteColor[],
      colorLimit: 1,
    })).toThrow("Palette color sortOrder values must be non-negative safe integers.");
  });

  it.each([
    ["a non-array palette", { id: "black", name: "Black", hex: "#000000", sortOrder: 0 }],
    ["an empty palette", []],
  ])("rejects %s with RangeError", (_caseName, malformedPalette) => {
    expect(() => quantizeRgb(source(1, 1, [0, 0, 0, 255]), {
      palette: malformedPalette as unknown as PaletteColor[],
      colorLimit: 1,
    })).toThrow(RangeError);
  });

  it.each([
    ["fractional", 1.5],
    ["negative", -1],
    ["infinite", Number.POSITIVE_INFINITY],
    ["non-number", "1"],
  ])("rejects a %s colorLimit with RangeError", (_caseName, colorLimit) => {
    expect(() => quantizeRgb(source(1, 1, [0, 0, 0, 255]), {
      palette,
      colorLimit: colorLimit as number,
    })).toThrow(RangeError);
  });

  it("sorts an unsorted palette before resolving ties by sortOrder then lexical ID", () => {
    const result = nearestPaletteColor({ red: 1, green: 0, blue: 0 }, [
      { id: "z-last", name: "Z Last", hex: "#020000", sortOrder: 1 },
      { id: "b-second", name: "B Second", hex: "#000000", sortOrder: 0 },
      { id: "a-first", name: "A First", hex: "#000000", sortOrder: 0 },
    ]);

    expect(result.id).toBe("a-first");
  });

  it("quantizes ties from an unsorted palette with duplicate sortOrder values by lexical ID", () => {
    const result = quantizeRgb(source(1, 1, [1, 0, 0, 255]), {
      palette: [
        { id: "z-last", name: "Z Last", hex: "#020000", sortOrder: 9 },
        { id: "red", name: "Red", hex: "#000000", sortOrder: 4 },
        { id: "blue", name: "Blue", hex: "#000000", sortOrder: 4 },
      ],
      colorLimit: 3,
    });

    expect(result.palette.map(({ id }) => id)).toEqual(["blue", "red", "z-last"]);
    expect(result.cells).toEqual([{ paletteColorId: "blue" }]);
  });

  it("reports consistent RangeErrors for malformed quantization inputs", () => {
    const validImage = source(1, 1, [0, 0, 0, 255]);

    expect(() => quantizeRgb(source(0, 1, []), { palette, colorLimit: 1 }))
      .toThrow("Image dimensions must be positive safe integers.");
    expect(() => quantizeRgb(source(1, 1, [0, 0, 0]), { palette, colorLimit: 1 }))
      .toThrow("RGBA data length must equal width × height × 4.");
    expect(() => quantizeRgb(validImage, {
      palette: [{ id: " ", name: "Broken", hex: "#000000", sortOrder: 0 }],
      colorLimit: 1,
    })).toThrow("Palette colors must have unique non-empty IDs.");
    expect(() => quantizeRgb(validImage, {
      palette: [{ id: "black", name: "Black", hex: "#000000", sortOrder: 0 }],
      colorLimit: Number.NaN,
    })).toThrow("colorLimit must be a positive safe integer no greater than the palette length.");
  });
});
