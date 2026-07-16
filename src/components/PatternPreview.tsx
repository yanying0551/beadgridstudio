"use client";

import type { CSSProperties } from "react";
import type { PatternDocument } from "../lib/pattern";
import { calculatePrintCellSizeMm } from "../lib/pattern/print-layout";

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
                <div className="mx-auto grid w-max gap-px bg-slate-300" style={{ gridTemplateColumns: `repeat(${rect.width}, 0.75rem)` }}>
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
      {document.sections.items.map((section, pageIndex) => {
        const rect = section.printRect;
        const orientation = rect.width > rect.height ? "Landscape" : "Portrait";
        const printCellSizeMm = calculatePrintCellSizeMm(rect.width, rect.height, document.palette.length);
        const columnTemplate = `max-content repeat(${rect.width}, var(--print-cell-size-mm))`;
        return (
          <article
            className="pattern-print-section"
            key={`print-${section.id}`}
            style={{ "--print-cell-size-mm": `${printCellSizeMm}mm` } as CSSProperties}
          >
            <header className="pattern-print-header">
              <h1>{document.title}</h1>
              <p className="pattern-print-page">Page {pageIndex + 1} of {document.sections.items.length}</p>
              <h2>Section {section.order + 1}</h2>
              <p className="pattern-print-bounds">{bounds(rect, true)}</p>
              <p className="pattern-print-orientation">Choose {orientation} orientation; verify it in print preview.</p>
              <p className="pattern-print-guidance">Sections are ordered left to right, then top to bottom. Match the printed bounds when assembling; overlap: {document.sections.layout.overlapCells} cells.</p>
            </header>
            <div
              className="pattern-print-grid"
              style={{
                gridTemplateColumns: columnTemplate,
                "--pattern-print-columns": columnTemplate,
              } as CSSProperties}
            >
              <span className="pattern-print-axis-corner" aria-hidden="true" />
              {Array.from({ length: rect.width }, (_, index) => {
                const column = rect.x + index + 1;
                return <span className="pattern-print-axis-label pattern-print-column-label" data-column-label={column} key={`column-${column}`}>{column}</span>;
              })}
              {Array.from({ length: rect.height }, (_, rowIndex) => {
                const row = rect.y + rowIndex + 1;
                return [
                  <span className="pattern-print-axis-label pattern-print-row-label" data-row-label={row} key={`row-${row}`}>{row}</span>,
                  ...Array.from({ length: rect.width }, (_, columnIndex) => {
                    const column = rect.x + columnIndex + 1;
                    const cell = document.cells[(row - 1) * width + column - 1];
                    const color = cell ? palette.get(cell.paletteColorId) : undefined;
                    const code = cell ? colorCode(document, cell.paletteColorId) : "?";
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
                        <span className="pattern-print-cell-code">{code}</span>
                      </div>
                    );
                  }),
                ];
              })}
            </div>
            <div className="pattern-print-legend" aria-label="Color legend">
              <h3>Color legend</h3>
              <ul>
                {document.palette.map((color, index) => (
                  <li key={`legend-${section.id}-${color.id}`}>
                    <span className="pattern-print-legend-swatch" style={{ backgroundColor: color.hex }} aria-hidden="true" />
                    <strong>{index + 1}</strong> {color.name} {color.hex.toUpperCase()}
                  </li>
                ))}
              </ul>
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

function colorCode(document: PatternDocument, paletteColorId: string): string {
  const index = document.palette.findIndex((color) => color.id === paletteColorId);
  return index >= 0 ? String(index + 1) : "?";
}

function bounds(rect: { x: number; y: number; width: number; height: number }, titleCase = false): string {
  const columns = `${rect.x + 1}–${rect.x + rect.width}`;
  const rows = `${rect.y + 1}–${rect.y + rect.height}`;
  return titleCase ? `Columns ${columns} · Rows ${rows}` : `columns ${columns}, rows ${rows}`;
}
