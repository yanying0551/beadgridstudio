import { MAX_GRID_CELLS, MAX_GRID_DIMENSION, derivePatternCounts, derivePatternSections, quantizeRgb, validatePatternDocument, type PatternCell } from "../lib/pattern";
import type { ConvertPatternRequest, PatternWorkerProgress, WorkerResponse } from "./pattern-worker.protocol";

export type PatternConversionPhase = PatternWorkerProgress["phase"];

/** V1 print layout ceiling: 50 by 50 sections is the smallest practical supported grid split. */
const MAX_PATTERN_SECTIONS = 2_500;

/** Pure worker operation; exported so it can be tested without Worker or browser APIs. */
export function convertPattern(request: ConvertPatternRequest, onProgress?: (phase: PatternConversionPhase) => void): WorkerResponse {
  if (!request || request.type !== "convert-pattern" || typeof request.requestId !== "string" || !request.requestId) {
    return error(request?.requestId ?? "", "invalid_request", "Conversion request is malformed.");
  }
  const inputError = validateWorkerInput(request);
  if (inputError) return error(request.requestId, "invalid_request", inputError);

  let quantized;
  try {
    onProgress?.("quantizing");
    const rgba = new Uint8ClampedArray(request.image.data);
    quantized = quantizeRgb({ width: request.image.width, height: request.image.height, rgba: Array.from(rgba) }, {
      palette: request.palette,
      colorLimit: request.settings.requestedColorCount,
      method: request.settings.quantizationMethod,
    });
  } catch (cause) {
    return error(request.requestId, cause instanceof RangeError ? "invalid_request" : "conversion_failed", errorMessage(cause));
  }

  try {
    const cells = mirrorCells(quantized.cells, quantized.width, quantized.height, request.settings.mirrorHorizontal, request.settings.mirrorVertical);
    onProgress?.("deriving");
    const settings = {
      grid: { width: quantized.width, height: quantized.height },
      requestedColorCount: request.settings.requestedColorCount,
      quantizationMethod: request.settings.quantizationMethod,
      mirrorHorizontal: request.settings.mirrorHorizontal,
      mirrorVertical: request.settings.mirrorVertical,
      ...(request.settings.sourceImage ? { sourceImage: request.settings.sourceImage } : {}),
    };
    const document = {
      schemaVersion: 1 as const,
      id: request.document.id,
      title: request.document.title,
      createdAt: request.document.createdAt,
      updatedAt: request.document.createdAt,
      settings,
      palette: quantized.palette,
      cells,
      counts: derivePatternCounts({ palette: quantized.palette, cells, settings }),
      sections: derivePatternSections(settings.grid, request.sectionLayout),
      exports: { history: [] },
    };
    onProgress?.("validating");
    const validation = validatePatternDocument(document);
    if (validation.ok === false) return error(request.requestId, "validation_failed", "Generated pattern did not satisfy the document contract.", validation.issues);
    return { type: "pattern-success", requestId: request.requestId, document: validation.value };
  } catch (cause) {
    return error(request.requestId, "conversion_failed", errorMessage(cause));
  }
}

/** Validates hostile Worker messages before allocating or copying pixel data. */
function validateWorkerInput(request: ConvertPatternRequest): string | undefined {
  const image = request.image;
  if (!image || typeof image !== "object"
    || !Number.isSafeInteger(image.width) || !Number.isSafeInteger(image.height)
    || image.width < 1 || image.height < 1
    || image.width > MAX_GRID_DIMENSION || image.height > MAX_GRID_DIMENSION
    || image.width * image.height > MAX_GRID_CELLS) {
    return "Image dimensions exceed V1 limits or are malformed.";
  }
  if (!(image.data instanceof ArrayBuffer) || image.data.byteLength !== image.width * image.height * 4) {
    return "Transferred RGBA data must exactly match image dimensions.";
  }

  const layout = request.sectionLayout;
  if (!layout || typeof layout !== "object"
    || !Number.isSafeInteger(layout.maxColumnsPerSection) || layout.maxColumnsPerSection < 1
    || !Number.isSafeInteger(layout.maxRowsPerSection) || layout.maxRowsPerSection < 1
    || (layout.overlapCells !== 0 && layout.overlapCells !== 1)) {
    return "Section layout is malformed.";
  }
  const sectionCount = Math.ceil(image.width / layout.maxColumnsPerSection) * Math.ceil(image.height / layout.maxRowsPerSection);
  if (sectionCount > MAX_PATTERN_SECTIONS) return "Section layout exceeds the V1 section limit.";
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Pattern conversion failed.";
}

function mirrorCells(cells: PatternCell[], width: number, height: number, horizontal: boolean, vertical: boolean): PatternCell[] {
  if (!horizontal && !vertical) return cells;
  return cells.map((_, index) => {
    const x = index % width; const y = Math.floor(index / width);
    const sourceX = horizontal ? width - 1 - x : x;
    const sourceY = vertical ? height - 1 - y : y;
    return cells[sourceY * width + sourceX];
  });
}
function error(requestId: string, code: "invalid_request" | "conversion_failed" | "validation_failed", message: string, issues?: Array<{ code: string; path: string; message: string }>): WorkerResponse {
  return { type: "pattern-error", requestId, error: { code, message, ...(issues ? { issues } : {}) } };
}

// Register only in an actual Worker global scope; importing this module in tests remains side-effect free.
type WorkerScope = {
  importScripts?: unknown;
  onmessage: ((event: MessageEvent<ConvertPatternRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};
const possibleWorkerScope = globalThis as unknown as WorkerScope;
if (typeof possibleWorkerScope.importScripts === "function") {
  const scope = possibleWorkerScope;
  scope.onmessage = (event: MessageEvent<ConvertPatternRequest>) => {
    const response = convertPattern(event.data, (phase) => {
      scope.postMessage({ type: "pattern-progress", requestId: event.data.requestId, progress: { phase } });
    });
    scope.postMessage(response);
  };
}
