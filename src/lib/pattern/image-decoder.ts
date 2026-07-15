import { MAX_GRID_CELLS, MAX_GRID_DIMENSION, type SourceImageMetadata } from ".";
import type { TransferableRgbaImage } from "../../workers/pattern-worker.protocol";

/** Hard ceiling after browser decode; protects the canvas/readback step from image bombs. */
export const MAX_DECODED_SOURCE_DIMENSION = 10_000;
export const MAX_DECODED_SOURCE_PIXELS = 40_000_000;

export interface DecodedBrowserImage { width: number; height: number; close?: () => void }
export interface ImageDecodeResizeOptions { resizeWidth: number; resizeHeight: number }
export interface ImageDimensions { width: number; height: number }
/** Explicit output raster dimensions selected locally by the user. */
export type TargetGridDimensions = ImageDimensions;
export type LocalImageDecodeErrorCode = "invalid_header" | "unsafe_dimensions";
export class LocalImageDecodeError extends Error {
  constructor(public readonly code: LocalImageDecodeErrorCode, message: string) {
    super(message); this.name = "LocalImageDecodeError";
  }
}

/** Browser API boundary is injectable so Node tests never need ImageBitmap, canvas, URLs, or network requests. */
export interface BrowserImageDecoder {
  /** Implementations must apply these bounds before allocating decoded pixels. */
  decode(file: File, options: ImageDecodeResizeOptions): Promise<DecodedBrowserImage>;
  /** Reads local container metadata only; it must not decode pixels or use a URL/network request. */
  readDimensions?(file: File): Promise<ImageDimensions | undefined>;
  readRgba(source: DecodedBrowserImage, outputWidth: number, outputHeight: number): Uint8ClampedArray;
}
export interface DecodedLocalImage { image: TransferableRgbaImage; source: SourceImageMetadata }

/** Decode a JPEG/PNG entirely in-browser and retain only resampled RGBA plus permitted metadata. */
export async function decodeLocalImageFile(file: File, browser: BrowserImageDecoder = browserImageDecoder, targetGrid?: TargetGridDimensions): Promise<DecodedLocalImage> {
  if (file.type !== "image/jpeg" && file.type !== "image/png") throw new TypeError("Choose a JPEG or PNG image.");
  let declared: ImageDimensions | undefined;
  try { declared = await browser.readDimensions?.(file); }
  catch { throw new LocalImageDecodeError("invalid_header", "Image dimensions could not be read safely from the local file header."); }
  if (!declared) throw new LocalImageDecodeError("invalid_header", "Image dimensions could not be read safely from the local file header.");
  assertSafeSourceDimensions(declared.width, declared.height);
  const resize = targetGrid ? assertTargetGridDimensions(targetGrid) : fitGrid(declared.width, declared.height);
  const source = await browser.decode(file, { resizeWidth: resize.width, resizeHeight: resize.height });
  try {
    // Retain this defense: headers can be malformed and decoders must never bypass size validation.
    assertSafeSourceDimensions(source.width, source.height);
    const original = declared;
    const { width, height } = resize;
    const rgba = browser.readRgba(source, width, height);
    if (rgba.length !== width * height * 4) throw new Error("Decoded image pixels have an invalid length.");
    return {
      image: { width, height, data: new Uint8ClampedArray(rgba).buffer },
      source: { mimeType: file.type, originalFileName: file.name || undefined, width: original.width, height: original.height },
    };
  } finally { source.close?.(); }
}

/** Convert browser ImageData to a detached transferable copy without retaining File, Blob, URL, or source bytes. */
export function imageDataToTransferable(image: Pick<ImageData, "width" | "height" | "data">): TransferableRgbaImage {
  return { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data).buffer };
}
function assertSafeSourceDimensions(width: number, height: number): void {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > MAX_DECODED_SOURCE_DIMENSION || height > MAX_DECODED_SOURCE_DIMENSION || width * height > MAX_DECODED_SOURCE_PIXELS) throw new LocalImageDecodeError("unsafe_dimensions", "Image dimensions are unsafe for local conversion.");
}
function assertTargetGridDimensions({ width, height }: TargetGridDimensions): TargetGridDimensions {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > MAX_GRID_DIMENSION || height > MAX_GRID_DIMENSION || width * height > MAX_GRID_CELLS) throw new RangeError("Target grid dimensions must be integers between 1 and 500.");
  return { width, height };
}
function fitGrid(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_GRID_DIMENSION / width, MAX_GRID_DIMENSION / height, Math.sqrt(MAX_GRID_CELLS / (width * height)));
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}

const browserImageDecoder: BrowserImageDecoder = {
  async decode(file, options) {
    if (typeof createImageBitmap !== "function") throw new Error("This browser cannot decode images locally.");
    return createImageBitmap(file, options);
  },
  readDimensions: readLocalImageDimensions,
  readRgba(source, outputWidth, outputHeight) {
    const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(outputWidth, outputHeight) : createHtmlCanvas(outputWidth, outputHeight);
    const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) throw new Error("This browser cannot read image pixels locally.");
    context.drawImage(source as unknown as CanvasImageSource, 0, 0, outputWidth, outputHeight);
    return context.getImageData(0, 0, outputWidth, outputHeight).data;
  },
};

/** A bounded local read is enough for PNG IHDR and valid JPEG marker chains. */
export const MAX_IMAGE_HEADER_BYTES = 1024 * 1024;
async function readLocalImageDimensions(file: File): Promise<ImageDimensions | undefined> {
  const bytes = new Uint8Array(await file.slice(0, MAX_IMAGE_HEADER_BYTES).arrayBuffer());
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  for (let offset = 2; offset + 9 < bytes.length;) {
    if (bytes[offset] !== 0xff) { offset++; continue; }
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) return undefined;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) return undefined;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) return { height: (bytes[offset + 3] << 8) | bytes[offset + 4], width: (bytes[offset + 5] << 8) | bytes[offset + 6] };
    offset += length;
  }
  return undefined;
}
function createHtmlCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === "undefined") throw new Error("This browser cannot decode images locally.");
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; return canvas;
}
