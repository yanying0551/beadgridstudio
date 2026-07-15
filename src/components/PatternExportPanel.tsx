"use client";

import { useState } from "react";
import type { ExportFormat, PatternDocument } from "../lib/pattern";

export interface PatternExportPanelProps {
  document?: PatternDocument;
  onPrepare?: (format: ExportFormat, document: PatternDocument) => void;
}

export function PatternExportPanel({ document, onPrepare }: PatternExportPanelProps) {
  const [status, setStatus] = useState("");
  const prepare = (format: ExportFormat) => {
    if (!document) return;
    onPrepare?.(format, document);
    setStatus(`${format.toUpperCase()} preparation selected. Coming next: browser-local exporter.`);
  };
  return (
    <section aria-labelledby="exports-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="exports-title" className="text-xl font-bold text-slate-950">Export</h2>
      <p className="mt-1 text-sm text-slate-600">Coming next: browser-local exporters</p>
      <div className="mt-4 grid gap-3">
        {(["pdf", "png", "csv"] as const).map((format) => (
          <button key={format} type="button" disabled={!document} onClick={() => prepare(format)} className="min-h-11 rounded-xl border border-teal-700 px-4 py-2 text-left font-semibold text-teal-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">
            Prepare {format.toUpperCase()}
          </button>
        ))}
      </div>
      {!document && <p className="mt-3 text-sm text-slate-500">Create a pattern to prepare exports.</p>}
      {status && <p role="status" className="mt-3 text-sm text-teal-800">{status}</p>}
    </section>
  );
}
