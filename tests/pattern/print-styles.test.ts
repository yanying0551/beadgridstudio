import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(`${process.cwd()}/src/app/globals.css`, "utf8");

describe("pattern print styles", () => {
  it("hides ordinary page UI and reveals only the dedicated print area with page breaks", () => {
    expect(css).toMatch(/\.pattern-print-area\s*\{\s*display:\s*none/);
    const printCss = css.slice(css.indexOf("@media print"));
    expect(printCss).toMatch(/body:has\(\.pattern-print-area\) \.print-hidden\s*\{\s*display:\s*none\s*!important/);
    expect(printCss).toMatch(/body:has\(\.pattern-print-area\) main\s*\{[^}]*overflow:\s*visible/s);
    expect(printCss).toMatch(/\.pattern-print-area\s*\{[^}]*display:\s*block[^}]*position:\s*static/s);
    expect(printCss).toMatch(/\.pattern-print-section\s*\{[^}]*break-after:\s*page/s);
  });
});
