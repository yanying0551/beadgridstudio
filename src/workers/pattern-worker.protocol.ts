import type { GenericPaletteColor, PatternDocument, PatternSettings, SectionLayoutSettings } from "../lib/pattern";

/** Pixel-only representation passed across the Worker boundary. Never put a File, Blob, URL, or image bytes in PatternDocument. */
export interface TransferableRgbaImage {
  width: number;
  height: number;
  data: ArrayBuffer;
}

export type PatternConversionSettings = Omit<PatternSettings, "grid">;
export interface PatternDocumentIdentity {
  id: string;
  title: string;
  createdAt: string;
}

export interface ConvertPatternRequest {
  type: "convert-pattern";
  requestId: string;
  image: TransferableRgbaImage;
  settings: PatternConversionSettings;
  palette: GenericPaletteColor[];
  sectionLayout: SectionLayoutSettings;
  document: PatternDocumentIdentity;
}

export interface PatternWorkerError {
  code: "invalid_request" | "conversion_failed" | "validation_failed" | "cancelled" | "worker_failed";
  message: string;
  issues?: Array<{ code: string; path: string; message: string }>;
}

/** Phase-level updates only; no fabricated percentage is exposed for synchronous quantization. */
export interface PatternWorkerProgress { phase: "quantizing" | "deriving" | "validating" }

export type WorkerResponse =
  | { type: "pattern-progress"; requestId: string; progress: PatternWorkerProgress }
  | { type: "pattern-success"; requestId: string; document: PatternDocument }
  | { type: "pattern-error"; requestId: string; error: PatternWorkerError };
