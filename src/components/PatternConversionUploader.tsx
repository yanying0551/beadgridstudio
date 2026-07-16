"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PatternUploader } from "./PatternUploader";
import { decodeLocalImageFile, type BrowserImageDecoder } from "../lib/pattern/image-decoder";
import { DEFAULT_PALETTE } from "../lib/pattern/default-palette";
import { createBrowserPatternWorker, PatternWorkerClient, type WorkerFactory } from "../lib/pattern/worker-client";
import type { PatternDocument } from "../lib/pattern";

const MAX_GRID_DIMENSION = 500;
type GridPreset = "source" | "32" | "64" | "custom";

function safeGridDimension(value: string): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= MAX_GRID_DIMENSION ? parsed : 1;
}

export interface PatternConversionUploaderProps {
  /** Injectable only for tests; production always creates a module Worker in this browser. */
  decoder?: BrowserImageDecoder;
  createWorker?: WorkerFactory;
  onConverted?: (document: PatternDocument) => void;
}

/** Local-only picker/decode/Worker pipeline. No File, Blob, or image bytes leave this component except transferred worker pixels. */
export function PatternConversionUploader({ decoder, createWorker = createBrowserPatternWorker, onConverted }: PatternConversionUploaderProps) {
  const [client] = useState(() => new PatternWorkerClient(createWorker));
  const [phase, setPhase] = useState<string>();
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);
  const [gridPreset, setGridPreset] = useState<GridPreset>("source");
  const [customGridWidth, setCustomGridWidth] = useState(32);
  const [customGridHeight, setCustomGridHeight] = useState(32);
  const [requestedColorCount, setRequestedColorCount] = useState(4);
  const [dithering, setDithering] = useState(false);
  const gridPresetId = useId();
  const customGridWidthId = useId();
  const customGridHeightId = useId();
  const colorCountId = useId();
  const ditheringId = useId();
  const selection = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    const mountedRef = mounted;
    const selectionRef = selection;
    mountedRef.current = true;
    return () => { mountedRef.current = false; selectionRef.current++; client.dispose(); };
  }, [client]);

  const convertFile = async (file: File) => {
    const token = ++selection.current;
    client.cancel();
    setReady(false);
    setError(undefined);
    setPhase("decoding");
    try {
      const targetGrid = gridPreset === "source"
        ? undefined
        : gridPreset === "custom"
          ? { width: customGridWidth, height: customGridHeight }
          : { width: Number(gridPreset), height: Number(gridPreset) };
      const decoded = await decodeLocalImageFile(file, decoder, targetGrid);
      if (!mounted.current || token !== selection.current) return;
      const now = new Date().toISOString();
      const colorCount = Math.min(Math.max(1, requestedColorCount), DEFAULT_PALETTE.length);
      const document = await client.convert({
        type: "convert-pattern",
        image: decoded.image,
        settings: {
          requestedColorCount: colorCount,
          quantizationMethod: dithering ? "floyd-steinberg" : "nearest-color",
          mirrorHorizontal: false,
          mirrorVertical: false,
          sourceImage: decoded.source,
        },
        palette: DEFAULT_PALETTE.slice(0, colorCount),
        sectionLayout: { maxColumnsPerSection: 50, maxRowsPerSection: 50, overlapCells: 0 },
        document: { id: createLocalPatternId(), title: "Untitled pattern", createdAt: now },
      }, { onProgress: (nextPhase) => {
        if (mounted.current && token === selection.current) setPhase(nextPhase);
      } });
      if (!mounted.current || token !== selection.current) return;
      setPhase(undefined);
      setReady(true);
      onConverted?.(document);
    } catch (cause) {
      if (!mounted.current || token !== selection.current) return;
      setPhase(undefined);
      setError(cause instanceof Error ? cause.message : "Pattern conversion failed locally.");
    }
  };

  const controlClass = "mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";
  const labelClass = "block text-sm font-semibold text-slate-800";

  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-1 text-lg font-bold tracking-tight text-slate-950">Conversion settings</legend>
        <div className="mt-2">
          <label className={labelClass} htmlFor={gridPresetId}>Grid preset</label>
          <select className={controlClass} id={gridPresetId} value={gridPreset} onChange={(event) => setGridPreset(event.target.value as GridPreset)}>
            <option value="source">Source image dimensions</option>
            <option value="32">32 × 32</option>
            <option value="64">64 × 64</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {gridPreset === "custom" && <div className="mt-4 grid grid-cols-2 gap-3">
          <label className={labelClass} htmlFor={customGridWidthId}>Custom grid width
            <input className={controlClass} id={customGridWidthId} type="number" min="1" max={MAX_GRID_DIMENSION} value={customGridWidth} onChange={(event) => setCustomGridWidth(safeGridDimension(event.target.value))} />
          </label>
          <label className={labelClass} htmlFor={customGridHeightId}>Custom grid height
            <input className={controlClass} id={customGridHeightId} type="number" min="1" max={MAX_GRID_DIMENSION} value={customGridHeight} onChange={(event) => setCustomGridHeight(safeGridDimension(event.target.value))} />
          </label>
        </div>}
        <p className="mt-2 text-xs leading-5 text-slate-600">Choose source dimensions, a preset, or a custom grid up to {MAX_GRID_DIMENSION} × {MAX_GRID_DIMENSION}.</p>
        <div className="mt-4">
          <label className={labelClass} htmlFor={colorCountId}>Color count</label>
          <input className={controlClass} id={colorCountId} type="number" min="1" max={DEFAULT_PALETTE.length} value={requestedColorCount} onChange={(event) => setRequestedColorCount(Math.min(Math.max(1, safeGridDimension(event.target.value)), DEFAULT_PALETTE.length))} />
        </div>
        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800" htmlFor={ditheringId}>
          <input className="size-4 accent-teal-700" id={ditheringId} type="checkbox" checked={dithering} onChange={(event) => setDithering(event.target.checked)} />
          Use dithering
        </label>
      </fieldset>
      <div className="min-w-0">
        <PatternUploader onAcceptedFile={convertFile} loading={Boolean(phase)} />
        {phase && <p className="mt-3 text-sm font-medium text-teal-800" aria-live="polite">{phase === "decoding" ? "Decoding your image locally…" : `Locally ${phase} your pattern…`}</p>}
        {ready && <p className="mt-3 text-sm font-semibold text-green-800" role="status">Your pattern is ready.</p>}
        {error && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      </div>
    </div>
  );
}

function createLocalPatternId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `pattern-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
