"use client";

import { useState } from "react";
import { PatternConversionUploader } from "../components/PatternConversionUploader";
import { PatternExportPanel } from "../components/PatternExportPanel";
import { PatternMaterials } from "../components/PatternMaterials";
import { PatternPreview } from "../components/PatternPreview";
import type { PatternDocument } from "../lib/pattern";

export default function Home() {
  const [pattern, setPattern] = useState<PatternDocument>();
  return (
    <main className="mx-auto min-h-screen max-w-7xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
      <header className="print-hidden max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Bead Grid Studio</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Fuse Bead Pattern Maker</h1>
        <p className="mt-5 max-w-xl text-lg text-slate-700">Turn an image into a clear fuse bead pattern.</p>
        <p className="mt-2 text-sm text-slate-600">Processed locally in your browser. Your image is never uploaded.</p>
      </header>
      <section aria-label="Pattern settings" className="print-hidden mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <PatternConversionUploader onConverted={setPattern} />
      </section>
      {pattern ? (
        <div className="pattern-workbench mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <PatternPreview document={pattern} />
          <aside className="print-hidden grid content-start gap-6"><PatternMaterials document={pattern} /><PatternExportPanel document={pattern} /></aside>
        </div>
      ) : <div className="print-hidden mt-8 max-w-sm"><PatternExportPanel /></div>}
    </main>
  );
}
