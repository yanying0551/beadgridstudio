"use client";

import { useRef, useState } from "react";
import type { ExportFormat, PatternDocument } from "../lib/pattern";
import { downloadBlobInBrowser } from "../lib/pattern/browser-download";
import { materialsToCsv } from "../lib/pattern/csv-export";
import { downloadPatternPng } from "../lib/pattern/png-export";

export interface PatternExportActions {
  downloadCsv(document: PatternDocument): void | Promise<void>;
  downloadPng(document: PatternDocument): void | Promise<void>;
  printPattern(document: PatternDocument): void | Promise<void>;
}

export interface PatternExportPanelProps {
  document?: PatternDocument;
  onPrepare?: (format: ExportFormat, document: PatternDocument) => void;
  /** Injectable browser boundary used by tests; defaults never make a network request. */
  exportActions?: PatternExportActions;
}

const browserExportActions: PatternExportActions = {
  downloadCsv(document) {
    const csv = `\uFEFF${materialsToCsv(document)}`;
    downloadBlobInBrowser(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${exportBaseName(document.title)}-materials.csv`);
  },
  downloadPng(document) {
    return downloadPatternPng(document, `${exportBaseName(document.title)}-pattern.png`);
  },
  printPattern() {
    window.print();
  },
};

export function PatternExportPanel({ document, onPrepare, exportActions = browserExportActions }: PatternExportPanelProps) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<ExportFormat>();
  const busyRef = useRef(false);

  const preparePdf = async () => {
    if (!document || busyRef.current) return;
    busyRef.current = true;
    setBusy("pdf");
    setStatus("");
    setError("");
    try {
      onPrepare?.("pdf", document);
      await exportActions.printPattern(document);
      setStatus("Print dialog opened. Choose Save as PDF to create a PDF.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the print dialog.");
    } finally {
      busyRef.current = false;
      setBusy(undefined);
    }
  };

  const download = async (format: "png" | "csv") => {
    if (!document || busyRef.current) return;
    busyRef.current = true;
    setBusy(format);
    setStatus("");
    setError("");
    try {
      onPrepare?.(format, document);
      if (format === "png") await exportActions.downloadPng(document);
      else await exportActions.downloadCsv(document);
      setStatus(`${format.toUpperCase()} download requested locally.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not export ${format.toUpperCase()} locally.`);
    } finally {
      busyRef.current = false;
      setBusy(undefined);
    }
  };

  const disabled = !document || Boolean(busy);
  return (
    <section aria-labelledby="exports-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="exports-title" className="text-xl font-bold text-slate-950">Export</h2>
      <p className="mt-1 text-sm text-slate-600">PNG and CSV files are created locally in your browser.</p>
      <div className="mt-4 grid gap-3">
        <button type="button" disabled={disabled} onClick={() => void preparePdf()} className="min-h-11 rounded-xl border border-teal-700 px-4 py-2 text-left font-semibold text-teal-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">
          {busy === "pdf" ? "Opening print dialog…" : "Print or save PDF"}
        </button>
        <button type="button" disabled={disabled} onClick={() => void download("png")} className="min-h-11 rounded-xl border border-teal-700 px-4 py-2 text-left font-semibold text-teal-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">
          {busy === "png" ? "Creating PNG…" : "Download PNG"}
        </button>
        <button type="button" disabled={disabled} onClick={() => void download("csv")} className="min-h-11 rounded-xl border border-teal-700 px-4 py-2 text-left font-semibold text-teal-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">
          {busy === "csv" ? "Creating CSV…" : "Download CSV"}
        </button>
      </div>
      {!document && <p className="mt-3 text-sm text-slate-500">Create a pattern to export files.</p>}
      {status && <p role="status" className="mt-3 text-sm text-teal-800">{status}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}

function exportBaseName(title: string): string {
  const safe = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safe || "bead-pattern";
}
