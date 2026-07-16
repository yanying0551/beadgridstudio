import type { ReactNode } from "react";

export function StaticContentPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Bead Grid Studio</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-slate-700">{intro}</p>
      <div className="mt-10 space-y-8 text-base leading-7 text-slate-700">{children}</div>
    </main>
  );
}

export function ContentSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="text-2xl font-bold text-slate-950">{title}</h2><div className="mt-3 space-y-3">{children}</div></section>;
}
