import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatternMaterials } from "../../src/components/PatternMaterials";
import type { PatternDocument } from "../../src/lib/pattern";

const document: PatternDocument = {
  schemaVersion: 1,
  id: "materials-test",
  title: "Garden",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  settings: { grid: { width: 2, height: 2 }, requestedColorCount: 3, quantizationMethod: "nearest-color", mirrorHorizontal: false, mirrorVertical: false },
  palette: [
    { id: "generic-coral", name: "Coral", hex: "#EA6A5A", sortOrder: 0 },
    { id: "generic-navy", name: "Navy", hex: "#17324D", sortOrder: 1 },
    { id: "generic-mint", name: "Mint", hex: "#8FD5B5", sortOrder: 2 },
  ],
  cells: [{ paletteColorId: "generic-coral" }, { paletteColorId: "generic-navy" }, { paletteColorId: "generic-coral" }, { paletteColorId: "generic-navy" }],
  counts: { byPaletteColor: [{ paletteColorId: "generic-coral", beadCount: 2 }, { paletteColorId: "generic-navy", beadCount: 2 }, { paletteColorId: "generic-mint", beadCount: 0 }], totalBeads: 4 },
  sections: { layout: { maxColumnsPerSection: 2, maxRowsPerSection: 2, overlapCells: 0 }, items: [{ id: "section-1", order: 0, rect: { x: 0, y: 0, width: 2, height: 2 }, printRect: { x: 0, y: 0, width: 2, height: 2 } }] },
  exports: { history: [] },
};

describe("PatternMaterials", () => {
  it("renders every document palette entry, including zero counts, with textual identity", () => {
    render(<PatternMaterials document={document} />);

    const list = screen.getByRole("list", { name: "Pattern materials" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(document.palette.length);
    expect(items[0]).toHaveTextContent("Coral");
    expect(items[0]).toHaveTextContent("#EA6A5A");
    expect(items[0]).toHaveTextContent("generic-coral");
    expect(items[0]).toHaveTextContent("2 beads");
    expect(items[2]).toHaveTextContent("Mint");
    expect(items[2]).toHaveTextContent("0 beads");
  });

  it("uses the PatternDocument exact total", () => {
    render(<PatternMaterials document={document} />);
    expect(screen.getByText("4 total beads")).toBeInTheDocument();
  });
});
