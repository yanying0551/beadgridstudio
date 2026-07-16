import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatternPreview } from "../../src/components/PatternPreview";
import type { PatternDocument } from "../../src/lib/pattern";
import { calculatePrintCellSizeMm } from "../../src/lib/pattern/print-layout";

function makeDocument(): PatternDocument {
  return {
    schemaVersion: 1,
    id: "preview-test",
    title: "Sunset test",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    settings: {
      grid: { width: 4, height: 2 },
      requestedColorCount: 3,
      quantizationMethod: "floyd-steinberg",
      mirrorHorizontal: true,
      mirrorVertical: false,
    },
    palette: [
      { id: "red", name: "Warm Red", hex: "#CC1122", sortOrder: 0 },
      { id: "blue", name: "Ocean Blue", hex: "#1133CC", sortOrder: 1 },
      { id: "unused", name: "Unused Green", hex: "#11CC55", sortOrder: 2 },
    ],
    cells: Array.from({ length: 8 }, (_, index) => ({ paletteColorId: index % 2 ? "blue" : "red" })),
    counts: {
      byPaletteColor: [
        { paletteColorId: "red", beadCount: 4 },
        { paletteColorId: "blue", beadCount: 4 },
        { paletteColorId: "unused", beadCount: 0 },
      ],
      totalBeads: 8,
    },
    sections: {
      layout: { maxColumnsPerSection: 2, maxRowsPerSection: 2, overlapCells: 0 },
      items: [
        { id: "section-1", order: 0, rect: { x: 0, y: 0, width: 2, height: 2 }, printRect: { x: 0, y: 0, width: 2, height: 2 } },
        { id: "section-2", order: 1, rect: { x: 2, y: 0, width: 2, height: 2 }, printRect: { x: 2, y: 0, width: 2, height: 2 } },
      ],
    },
    exports: { history: [] },
  };
}

describe("PatternPreview", () => {
  it.each([
    { width: 50, height: 50, expected: 3.47 },
    { width: 10, height: 50, expected: 4.61 },
    { width: 20, height: 50, expected: 4.61 },
  ])("fits a $width x $height print grid within both page dimensions", ({ width, height, expected }) => {
    const size = calculatePrintCellSizeMm(width, height, 3);
    const outerBorderMm = 25.4 / 96;

    expect(size).toBe(expected);
    expect(outerBorderMm + 6 + width * size).toBeLessThanOrEqual(180);
    expect(outerBorderMm + 3 + height * size).toBeLessThanOrEqual(234);
  });

  it("renders every section's row-major cells with accessible global coordinate labels", () => {
    render(<PatternPreview document={makeDocument()} />);

    expect(screen.getByRole("heading", { name: "Pattern preview", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("4 × 2")).toBeInTheDocument();
    expect(screen.getByText("Columns 1–2")).toBeInTheDocument();
    expect(screen.getAllByText("Rows 1–2")).toHaveLength(2);
    expect(screen.getByLabelText("Sunset test section 1 grid, columns 1–2, rows 1–2")).toBeInTheDocument();
    expect(screen.getByLabelText("Sunset test section 2 grid, columns 3–4, rows 1–2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 1, column 1: Warm Red" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 1, column 2: Ocean Blue" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 2, column 2: Ocean Blue" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 1, column 3: Warm Red" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 2, column 4: Ocean Blue" })).toBeInTheDocument();
  });

  it("bounds wide preview grids to a keyboard-scrollable region and lets range labels wrap", () => {
    render(<PatternPreview document={makeDocument()} />);

    const gridScroller = screen.getByLabelText("Sunset test section 1 grid, columns 1–2, rows 1–2");
    expect(gridScroller).toHaveAttribute("tabindex", "0");
    expect(gridScroller).toHaveClass("w-full", "min-w-0", "overflow-x-auto");

    const rangeHeader = screen.getByText("Columns 1–2").parentElement;
    expect(rangeHeader).toHaveClass("flex-wrap", "gap-x-4", "gap-y-1");
  });

  it("uses the same fixed bead track size for preview sections of different widths", () => {
    const document = makeDocument();
    document.sections.items[1].rect.width = 1;
    render(<PatternPreview document={document} />);

    const wideGrid = screen.getByLabelText("Sunset test section 1 grid, columns 1–2, rows 1–2").firstElementChild;
    const narrowGrid = screen.getByLabelText("Sunset test section 2 grid, columns 3–3, rows 1–2").firstElementChild;

    expect(wideGrid).toHaveStyle({ gridTemplateColumns: "repeat(2, 0.75rem)" });
    expect(narrowGrid).toHaveStyle({ gridTemplateColumns: "repeat(1, 0.75rem)" });
    expect(wideGrid).not.toHaveClass("min-w-[18rem]");
    expect(narrowGrid).not.toHaveClass("min-w-[18rem]");
  });

  it("summarizes document settings and section bounds", () => {
    render(<PatternPreview document={makeDocument()} />);

    expect(screen.getByText("Floyd–Steinberg")).toBeInTheDocument();
    expect(screen.getByText("Horizontal mirror")).toBeInTheDocument();
    expect(screen.getByText("2 sections")).toBeInTheDocument();

    const overview = screen.getByRole("list", { name: "Pattern sections" });
    expect(within(overview).getByText("Section 1")).toBeInTheDocument();
    expect(within(overview).getByText("Columns 1–2 · Rows 1–2")).toBeInTheDocument();
    expect(within(overview).getByText("Section 2")).toBeInTheDocument();
    expect(within(overview).getByText("Columns 3–4 · Rows 1–2")).toBeInTheDocument();
    expect(screen.queryByText(/Current section bounds/)).not.toBeInTheDocument();
  });

  it("renders every section as a dedicated print-only grid with titles and coordinates", () => {
    const { container } = render(<PatternPreview document={makeDocument()} />);

    const printArea = container.querySelector(".pattern-print-area");
    expect(printArea).not.toBeNull();
    expect(printArea).toHaveAttribute("aria-hidden", "true");
    const sections = printArea!.querySelectorAll(".pattern-print-section");
    expect(sections).toHaveLength(2);
    expect(sections[0]).toHaveTextContent("Section 1");
    expect(sections[0]).toHaveTextContent("Columns 1–2 · Rows 1–2");
    expect(sections[0].querySelectorAll("[data-print-cell]")).toHaveLength(4);
    expect(sections[1]).toHaveTextContent("Section 2");
    expect(sections[1]).toHaveTextContent("Columns 3–4 · Rows 1–2");
    expect(sections[1].querySelectorAll("[data-print-cell]")).toHaveLength(4);
    expect(sections[1].querySelector('[data-row="1"][data-column="4"]')).toHaveAttribute("data-color-name", "Ocean Blue");
    expect((sections[0] as HTMLElement).style.getPropertyValue("--print-cell-size-mm")).toBe("86.86mm");
  });

  it("prints complete page context, assembly guidance, and a color-code legend on every section page", () => {
    const { container } = render(<PatternPreview document={makeDocument()} />);
    const sections = Array.from(container.querySelectorAll(".pattern-print-section"));

    expect(sections).toHaveLength(2);
    sections.forEach((section, index) => {
      expect(section).toHaveTextContent("Sunset test");
      expect(section).toHaveTextContent(`Page ${index + 1} of 2`);
      expect(section).toHaveTextContent(/left to right, then top to bottom/i);
      expect(section).toHaveTextContent(/overlap: 0 cells/i);
      const legend = section.querySelector('[aria-label="Color legend"]');
      expect(legend).not.toBeNull();
      expect(legend).toHaveTextContent("1 Warm Red #CC1122");
      expect(legend).toHaveTextContent("2 Ocean Blue #1133CC");
    });
  });

  it("prints one A4 portrait orientation contract on every page", () => {
    const document = makeDocument();
    document.sections.items[1].printRect = { x: 2, y: 0, width: 2, height: 1 };
    const { container } = render(<PatternPreview document={document} />);
    const sections = Array.from(container.querySelectorAll(".pattern-print-section"));

    expect(sections).toHaveLength(2);
    sections.forEach((section) => {
      expect(section.querySelector(".pattern-print-header .pattern-print-orientation")).toHaveTextContent(/choose A4 paper and portrait orientation/i);
      expect(section.querySelector(".pattern-print-header .pattern-print-orientation")).toHaveTextContent(/verify.*print preview/i);
    });
  });

  it("uses compact color-independent cell codes and separate axis labels for dark colors and 3-digit coordinates", () => {
    const document = makeDocument();
    document.settings.grid = { width: 500, height: 1 };
    document.palette = [{ id: "dark", name: "Near Black", hex: "#010101", sortOrder: 0 }];
    document.cells = Array.from({ length: 500 }, () => ({ paletteColorId: "dark" }));
    document.counts = { byPaletteColor: [{ paletteColorId: "dark", beadCount: 500 }], totalBeads: 500 };
    document.sections = {
      layout: { maxColumnsPerSection: 50, maxRowsPerSection: 1, overlapCells: 0 },
      items: [{ id: "large", order: 0, rect: { x: 450, y: 0, width: 50, height: 1 }, printRect: { x: 450, y: 0, width: 50, height: 1 } }],
    };

    const { container } = render(<PatternPreview document={document} />);
    const printSection = container.querySelector(".pattern-print-section")!;
    const cell = printSection.querySelector('[data-row="1"][data-column="500"]')!;
    expect(cell).toHaveTextContent("1");
    expect(cell).not.toHaveTextContent("500,1");
    expect(cell.querySelector(".pattern-print-cell-code")).toHaveTextContent("1");
    expect(printSection.querySelector('[data-column-label="500"]')).toHaveTextContent("500");
    expect(printSection.querySelector('[data-row-label="1"]')).toHaveTextContent("1");
    expect((printSection.querySelector(".pattern-print-grid") as HTMLElement).style.gridTemplateColumns)
      .toBe("max-content repeat(50, var(--print-cell-size-mm))");
  });

  it("falls back safely for an unknown cell palette reference", () => {
    const document = makeDocument();
    document.cells[0] = { paletteColorId: "missing" };
    render(<PatternPreview document={document} />);

    expect(screen.getByRole("img", { name: "Row 1, column 1: Unknown color" })).toHaveStyle({ backgroundColor: "rgb(203, 213, 225)" });
  });
});
