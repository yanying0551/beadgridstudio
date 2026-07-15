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

  return (
    <div className="mt-8">
      <fieldset>
        <legend>Conversion settings</legend>
        <label htmlFor={gridPresetId}>Grid preset</label>
        <select id={gridPresetId} value={gridPreset} onChange={(event) => setGridPreset(event.target.value as GridPreset)}>
          <option value="source">Source image dimensions</option>
          <option value="32">32 × 32</option>
          <option value="64">64 × 64</option>
          <option value="custom">Custom</option>
        </select>
        {gridPreset === "custom" && <div>
          <label htmlFor={customGridWidthId}>Custom grid width</label>
          <input id={customGridWidthId} type="number" min="1" max={MAX_GRID_DIMENSION} value={customGridWidth} onChange={(event) => setCustomGridWidth(safeGridDimension(event.target.value))} />
          <label htmlFor={customGridHeightId}>Custom grid height</label>
          <input id={customGridHeightId} type="number" min="1" max={MAX_GRID_DIMENSION} value={customGridHeight} onChange={(event) => setCustomGridHeight(safeGridDimension(event.target.value))} />
        </div>}
        <p>The generated pattern grid uses the selected dimensions. Grid choices control local image decoding and are not sent as UI-only worker fields.</p>
        <label htmlFor={colorCountId}>Color count</label>
        <input id={colorCountId} type="number" min="1" max={DEFAULT_PALETTE.length} value={requestedColorCount} onChange={(event) => setRequestedColorCount(Math.min(Math.max(1, safeGridDimension(event.target.value)), DEFAULT_PALETTE.length))} />
        <label htmlFor={ditheringId}>
          <input id={ditheringId} type="checkbox" checked={dithering} onChange={(event) => setDithering(event.target.checked)} />
          Use dithering
        </label>
      </fieldset>
      <PatternUploader onAcceptedFile={convertFile} loading={Boolean(phase)} />
      {phase && <p aria-live="polite">{phase === "decoding" ? "Decoding your image locally…" : `Locally ${phase} your pattern…`}</p>}
      {ready && <p role="status">Your pattern is ready.</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function createLocalPatternId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `pattern-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
