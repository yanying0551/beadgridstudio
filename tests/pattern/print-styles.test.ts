import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(`${process.cwd()}/src/app/globals.css`, "utf8");

describe("pattern print styles", () => {
  it("hides ordinary page UI and reveals only the dedicated print area with page breaks", () => {
    expect(css).toMatch(/\.pattern-print-area\s*\{\s*display:\s*none/);
    const printCss = css.slice(css.indexOf("@media print"));
    expect(printCss).toMatch(/body:has\(\.pattern-print-area\) \.print-hidden\s*\{\s*display:\s*none\s*!important/);
    expect(printCss).toMatch(/body:has\(\.pattern-print-area\) main\s*\{[^}]*overflow:\s*visible/);
    expect(printCss).toMatch(/\.pattern-print-area\s*\{[^}]*display:\s*block[^}]*position:\s*static/);
    expect(printCss).toMatch(/\.pattern-print-section\s*\{[^}]*break-after:\s*page/);
  });

  it("keeps 50-column grids and large axis labels legible independently of cell fill color", () => {
    const printCss = css.slice(css.indexOf("@media print"));
    expect(printCss).toMatch(/\.pattern-print-grid\s*\{[^}]*grid-template-columns:\s*var\(--pattern-print-columns\)/);
    expect(printCss).toMatch(/\.pattern-print-axis-label\s*\{[^}]*overflow:\s*visible[^}]*font-size:\s*5pt/);
    expect(printCss).toMatch(/\.pattern-print-cell-code\s*\{[^}]*background:\s*#fff[^}]*color:\s*#000/);
    expect(printCss).toMatch(/\.pattern-print-cell-code\s*\{[^}]*font-size:\s*5pt[^}]*line-height:\s*1/);
    expect(printCss).toMatch(/\.pattern-print-legend\s*\{[^}]*break-inside:\s*avoid/);
  });

  it("uses the per-section cell size for square tracks instead of width-only fractional tracks", () => {
    const printCss = css.slice(css.indexOf("@media print"));
    expect(printCss).toMatch(/\.pattern-print-grid\s*\{[^}]*width:\s*max-content[^}]*max-width:\s*180mm/);
    expect(printCss).toMatch(/\.pattern-print-cell\s*\{[^}]*width:\s*var\(--print-cell-size-mm\)[^}]*height:\s*var\(--print-cell-size-mm\)/);
  });
});
