"use client";

import type { CSSProperties } from "react";
import type { PatternDocument } from "../lib/pattern";

const FALLBACK_COLOR = "#CBD5E1";

export function PatternPreview({ document }: { document: PatternDocument }) {
  const { width, height } = document.settings.grid;
  const palette = new Map(document.palette.map((color) => [color.id, color]));
  const previewSections = document.sections.items.length > 0
    ? document.sections.items
    : [{ id: "full-pattern", order: 0, rect: { x: 0, y: 0, width, height } }];
  const method = document.settings.quantizationMethod === "floyd-steinberg" ? "Floyd–Steinberg" : "Nearest color";
  const mirror = document.settings.mirrorHorizontal && document.settings.mirrorVertical ? "Horizontal and vertical mirror" : document.settings.mirrorHorizontal ? "Horizontal mirror" : document.settings.mirrorVertical ? "Vertical mirror" : "No mirror";

  return <>
    <section aria-labelledby="pattern-preview-title" className="print-hidden min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{document.title}</p>
      <h2 id="pattern-preview-title" className="mt-1 text-2xl font-bold text-slate-950">Pattern preview</h2>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
        <span className="rounded-full bg-slate-100 px-3 py-1">{width} × {height}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{method}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{mirror}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{document.sections.items.length} {document.sections.items.length === 1 ? "section" : "sections"}</span>
      </div>
      <div className="mt-5 grid min-w-0 gap-6">
        {previewSections.map((section) => {
          const rect = section.rect;
          return (
            <article className="min-w-0" key={`preview-${section.id}`}>
              <h3 className="font-bold text-slate-950">Section {section.order + 1}</h3>
              <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs font-semibold tabular-nums text-slate-600"><span>Columns {rect.x + 1}–{rect.x + rect.width}</span><span>Rows {rect.y + 1}–{rect.y + rect.height}</span></div>
              <div className="mt-2 w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-3" tabIndex={0} aria-label={`${document.title} section ${section.order + 1} grid, ${bounds(rect)}`}>
                <div className="mx-auto grid min-w-[18rem] max-w-3xl gap-px bg-slate-300" style={{ gridTemplateColumns: `repeat(${rect.width}, minmax(0, 1fr))` }}>
                  {visibleCells(document, rect).map(({ cell, row, column }) => {
                    const color = palette.get(cell.paletteColorId);
                    const style: CSSProperties = { backgroundColor: color?.hex ?? FALLBACK_COLOR };
                    return <div key={`${section.id}-${row}-${column}-${cell.paletteColorId}`} role="img" aria-label={`Row ${row}, column ${column}: ${color?.name ?? "Unknown color"}`} className="aspect-square min-w-3 rounded-[2px]" style={style} />;
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-6">
        <h3 className="font-bold text-slate-950">Section overview</h3>
        <ul aria-label="Pattern sections" className="mt-3 grid gap-2 sm:grid-cols-2">
          {document.sections.items.map((section) => <li key={section.id} className="rounded-lg border border-slate-200 p-3 text-sm"><strong>Section {section.order + 1}</strong><span className="mt-1 block text-slate-600">{bounds(section.rect, true)}</span></li>)}
        </ul>
      </div>
    </section>
    <section className="pattern-print-area" aria-hidden="true">
      <h1>{document.title}</h1>
      {document.sections.items.map((section) => {
        const rect = section.printRect;
        return (
          <article className="pattern-print-section" key={`print-${section.id}`}>
            <h2>Section {section.order + 1}</h2>
            <p className="pattern-print-bounds">{bounds(rect, true)}</p>
            <div className="pattern-print-grid" style={{ gridTemplateColumns: `repeat(${rect.width}, minmax(0, 1fr))` }}>
              {visibleCells(document, rect).map(({ cell, row, column }) => {
                const color = palette.get(cell.paletteColorId);
                return (
                  <div
                    className="pattern-print-cell"
                    data-print-cell
                    data-row={row}
                    data-column={column}
                    data-color-name={color?.name ?? "Unknown color"}
                    key={`print-${section.id}-${row}-${column}`}
                    style={{ backgroundColor: color?.hex ?? FALLBACK_COLOR }}
                  >
                    <span>{column},{row}</span>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  </>;
}

function visibleCells(document: PatternDocument, rect?: { x: number; y: number; width: number; height: number }) {
  const area = rect ?? { x: 0, y: 0, width: document.settings.grid.width, height: document.settings.grid.height };
  const result: Array<{ cell: PatternDocument["cells"][number]; row: number; column: number }> = [];
  for (let y = area.y; y < area.y + area.height; y += 1) {
    for (let x = area.x; x < area.x + area.width; x += 1) {
      const cell = document.cells[y * document.settings.grid.width + x];
      if (cell) result.push({ cell, row: y + 1, column: x + 1 });
    }
  }
  return result;
}

function bounds(rect: { x: number; y: number; width: number; height: number }, titleCase = false): string {
  const columns = `${rect.x + 1}–${rect.x + rect.width}`;
  const rows = `${rect.y + 1}–${rect.y + rect.height}`;
  return titleCase ? `Columns ${columns} · Rows ${rows}` : `columns ${columns}, rows ${rows}`;
}
