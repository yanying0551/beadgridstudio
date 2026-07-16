const links = [
  ["How it works", "/how-it-works"], ["Print guide", "/print-guide"], ["Bead counts", "/bead-count-calculator"],
  ["FAQ", "/faq"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Disclaimer", "/disclaimer"], ["Contact", "/contact"],
] as const;

export function SiteFooter() {
  return <footer className="print-hidden border-t border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3">{links.map(([label, href]) => <a key={href} href={href} className="text-sm font-medium text-teal-800 underline-offset-4 hover:underline">{label}</a>)}</nav><p className="mt-5 max-w-3xl text-sm text-slate-600">Bead Grid Studio is an independent Fuse Bead Pattern Maker. References to Perler, Hama, and Artkal are descriptive only. Bead Grid Studio is not affiliated with, endorsed by, or sponsored by those brands.</p></div></footer>;
}
