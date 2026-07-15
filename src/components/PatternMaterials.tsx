import type { PatternDocument } from "../lib/pattern";

export function PatternMaterials({ document }: { document: PatternDocument }) {
  const counts = new Map(document.counts.byPaletteColor.map((entry) => [entry.paletteColorId, entry.beadCount]));
  return (
    <section aria-labelledby="materials-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="materials-title" className="text-xl font-bold text-slate-950">Materials</h2>
        <p className="text-sm font-semibold tabular-nums text-teal-800">{document.counts.totalBeads} total beads</p>
      </div>
      <ul aria-label="Pattern materials" className="mt-4 space-y-3">
        {document.palette.map((color) => {
          const count = counts.get(color.id) ?? 0;
          return (
            <li key={color.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 p-3">
              <span aria-hidden="true" className="h-7 w-7 rounded-md border border-slate-300" style={{ backgroundColor: color.hex }} />
              <span className="min-w-0">
                <span className="block font-medium text-slate-900">{color.name}</span>
                <span className="block break-all text-xs text-slate-500">{color.hex} · {color.id}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-700">{count} {count === 1 ? "bead" : "beads"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
