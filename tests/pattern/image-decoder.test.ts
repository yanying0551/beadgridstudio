import { describe, expect, it, vi } from "vitest";
import { decodeLocalImageFile, MAX_DECODED_SOURCE_DIMENSION, type BrowserImageDecoder } from "../../src/lib/pattern/image-decoder";

function decoder(width: number, height: number): BrowserImageDecoder {
  return {
    decode: vi.fn().mockResolvedValue({ width, height, close: vi.fn() }),
    readDimensions: vi.fn().mockResolvedValue({ width, height }),
    readRgba: vi.fn().mockImplementation((_source, outputWidth, outputHeight) =>
      new Uint8ClampedArray(outputWidth * outputHeight * 4).fill(255),
    ),
  };
}

describe("decodeLocalImageFile", () => {
  it("uses an injected browser-only decoder and resamples to the safe conversion grid", async () => {
    const browser = decoder(2_000, 1_000);
    const file = new File(["pixels"], "holiday.png", { type: "image/png" });

    const decoded = await decodeLocalImageFile(file, browser);

    expect(browser.decode).toHaveBeenCalledWith(file, { resizeWidth: 500, resizeHeight: 250 });
    expect(browser.readRgba).toHaveBeenCalledWith(expect.objectContaining({ width: 2_000, height: 1_000 }), 500, 250);
    expect(decoded.image).toMatchObject({ width: 500, height: 250 });
    expect(new Uint8ClampedArray(decoded.image.data)).toHaveLength(500 * 250 * 4);
    expect(decoded.source).toEqual({ mimeType: "image/png", originalFileName: "holiday.png", width: 2_000, height: 1_000 });
  });

  it("uses explicit target grid dimensions for the decoded raster", async () => {
    const browser = decoder(2_000, 1_000);
    const file = new File(["pixels"], "holiday.png", { type: "image/png" });

    const decoded = await decodeLocalImageFile(file, browser, { width: 24, height: 32 });

    expect(browser.decode).toHaveBeenCalledWith(file, { resizeWidth: 24, resizeHeight: 32 });
    expect(browser.readRgba).toHaveBeenCalledWith(expect.objectContaining({ width: 2_000, height: 1_000 }), 24, 32);
    expect(decoded.image).toMatchObject({ width: 24, height: 32 });
  });

  it("rejects target grid dimensions outside the supported 1 to 500 range", async () => {
    const browser = decoder(1, 1);

    await expect(decodeLocalImageFile(new File(["pixels"], "holiday.png", { type: "image/png" }), browser, { width: 501, height: 1 })).rejects.toThrow(/target grid/i);
    expect(browser.decode).not.toHaveBeenCalled();
  });

  it("rejects unsafe header dimensions before invoking the full-resolution decoder", async () => {
    const browser: BrowserImageDecoder = {
      ...decoder(1, 1),
      readDimensions: vi.fn().mockResolvedValue({ width: MAX_DECODED_SOURCE_DIMENSION + 1, height: 1 }),
    };

    await expect(decodeLocalImageFile(new File(["x"], "bomb.png", { type: "image/png" }), browser)).rejects.toThrow(/dimensions/i);
    expect(browser.decode).not.toHaveBeenCalled();
  });

  it("fails closed without a local dimension reader before invoking decode", async () => {
    const browser = decoder(1, 1);
    delete browser.readDimensions;

    await expect(decodeLocalImageFile(new File(["x"], "bad.jpg", { type: "image/jpeg" }), browser)).rejects.toMatchObject({ code: "invalid_header" });
    expect(browser.decode).not.toHaveBeenCalled();
  });

  it("fails closed for an unknown local header before invoking decode", async () => {
    const browser: BrowserImageDecoder = { ...decoder(1, 1), readDimensions: vi.fn().mockResolvedValue(undefined) };

    await expect(decodeLocalImageFile(new File(["x"], "bad.jpg", { type: "image/jpeg" }), browser)).rejects.toMatchObject({ code: "invalid_header" });
    expect(browser.decode).not.toHaveBeenCalled();
  });

  it("reads JPEG SOF markers beyond 128KiB and rejects unsafe dimensions before decode", async () => {
    const decode = vi.fn();
    vi.stubGlobal("createImageBitmap", decode);
    const app = new Uint8Array(65_537); app.set([0xff, 0xe0, 0xff, 0xff]);
    const sof = new Uint8Array([0xff, 0xc0, 0x00, 0x08, 0x08, 0x27, 0x11, 0x00, 0x01, 0x03]);
    const bytes = new Uint8Array(2 + app.length * 2 + sof.length);
    bytes.set([0xff, 0xd8]); bytes.set(app, 2); bytes.set(app, 2 + app.length); bytes.set(sof, 2 + app.length * 2);
    const file = {
      name: "bomb.jpg", type: "image/jpeg",
      slice: () => ({ arrayBuffer: async () => bytes.buffer }),
    } as unknown as File;

    await expect(decodeLocalImageFile(file)).rejects.toMatchObject({ code: "unsafe_dimensions" });
    expect(decode).not.toHaveBeenCalled();
  });
});
