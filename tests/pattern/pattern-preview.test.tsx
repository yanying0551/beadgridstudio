import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatternPreview } from "../../src/components/PatternPreview";
import type { PatternDocument } from "../../src/lib/pattern";

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
  it("renders row-major cells with accessible labels and grid coordinate context", () => {
    render(<PatternPreview document={makeDocument()} />);

    expect(screen.getByRole("heading", { name: "Pattern preview", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("4 × 2")).toBeInTheDocument();
    expect(screen.getByText("Columns 1–4")).toBeInTheDocument();
    expect(screen.getByText("Rows 1–2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 1, column 1: Warm Red" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 1, column 2: Ocean Blue" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Row 2, column 4: Ocean Blue" })).toBeInTheDocument();
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
    expect(screen.getByText("Current section bounds: columns 1–2, rows 1–2")).toBeInTheDocument();
  });

  it("falls back safely for an unknown cell palette reference", () => {
    const document = makeDocument();
    document.cells[0] = { paletteColorId: "missing" };
    render(<PatternPreview document={document} />);

    expect(screen.getByRole("img", { name: "Row 1, column 1: Unknown color" })).toHaveStyle({ backgroundColor: "rgb(203, 213, 225)" });
  });
});
