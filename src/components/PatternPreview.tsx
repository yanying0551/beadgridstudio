"use client";

import type { CSSProperties } from "react";
import type { PatternDocument } from "../lib/pattern";

const FALLBACK_COLOR = "#CBD5E1";

export function PatternPreview({ document }: { document: PatternDocument }) {
  const { width, height } = document.settings.grid;
  const palette = new Map(document.palette.map((color) => [color.id, color]));
  const first = document.sections.items[0];
  const method = document.settings.quantizationMethod === "floyd-steinberg" ? "Floyd–Steinberg" : "Nearest color";
  const mirror = document.settings.mirrorHorizontal && document.settings.mirrorVertical ? "Horizontal and vertical mirror" : document.settings.mirrorHorizontal ? "Horizontal mirror" : document.settings.mirrorVertical ? "Vertical mirror" : "No mirror";

  return (
    <section aria-labelledby="pattern-preview-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{document.title}</p>
      <h2 id="pattern-preview-title" className="mt-1 text-2xl font-bold text-slate-950">Pattern preview</h2>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
        <span className="rounded-full bg-slate-100 px-3 py-1">{width} × {height}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{method}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{mirror}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{document.sections.items.length} {document.sections.items.length === 1 ? "section" : "sections"}</span>
      </div>
      <div className="mt-5 flex justify-between text-xs font-semibold tabular-nums text-slate-600"><span>Columns 1–{width}</span><span>Rows 1–{height}</span></div>
      <div className="mt-2 max-w-full overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-3" tabIndex={0} aria-label={`${document.title} grid, ${width} columns by ${height} rows`}>
        <div className="mx-auto grid min-w-[18rem] max-w-3xl gap-px bg-slate-300" style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}>
          {document.cells.map((cell, index) => {
            const color = palette.get(cell.paletteColorId);
            const row = Math.floor(index / width) + 1;
            const column = index % width + 1;
            const style: CSSProperties = { backgroundColor: color?.hex ?? FALLBACK_COLOR };
            return <div key={`${index}-${cell.paletteColorId}`} role="img" aria-label={`Row ${row}, column ${column}: ${color?.name ?? "Unknown color"}`} className="aspect-square min-w-3 rounded-[2px]" style={style} />;
          })}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-bold text-slate-950">Section overview</h3>
        {first && <p className="mt-1 text-sm text-slate-600">Current section bounds: {bounds(first.rect)}</p>}
        <ul aria-label="Pattern sections" className="mt-3 grid gap-2 sm:grid-cols-2">
          {document.sections.items.map((section) => <li key={section.id} className="rounded-lg border border-slate-200 p-3 text-sm"><strong>Section {section.order + 1}</strong><span className="mt-1 block text-slate-600">{bounds(section.rect, true)}</span></li>)}
        </ul>
      </div>
    </section>
  );
}

function bounds(rect: { x: number; y: number; width: number; height: number }, titleCase = false): string {
  const columns = `${rect.x + 1}–${rect.x + rect.width}`;
  const rows = `${rect.y + 1}–${rect.y + rect.height}`;
  return titleCase ? `Columns ${columns} · Rows ${rows}` : `columns ${columns}, rows ${rows}`;
}
