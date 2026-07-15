import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatternExportPanel } from "../../src/components/PatternExportPanel";
import type { PatternDocument } from "../../src/lib/pattern";

const document = {
  title: "Export test",
} as PatternDocument;

describe("PatternExportPanel", () => {
  it("disables every export action when there is no document", () => {
    render(<PatternExportPanel />);

    expect(screen.getByRole("button", { name: "Prepare PDF" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Prepare PNG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Prepare CSV" })).toBeDisabled();
    expect(screen.getByText("Create a pattern to prepare exports.")).toBeInTheDocument();
  });

  it("is an honest scaffold that delegates preparation without claiming a download", () => {
    const onPrepare = vi.fn();
    render(<PatternExportPanel document={document} onPrepare={onPrepare} />);

    expect(screen.getByText("Coming next: browser-local exporters")).toBeInTheDocument();
    expect(screen.queryByText(/download complete/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Prepare PDF" }));
    fireEvent.click(screen.getByRole("button", { name: "Prepare PNG" }));
    fireEvent.click(screen.getByRole("button", { name: "Prepare CSV" }));
    expect(onPrepare).toHaveBeenNthCalledWith(1, "pdf", document);
    expect(onPrepare).toHaveBeenNthCalledWith(2, "png", document);
    expect(onPrepare).toHaveBeenNthCalledWith(3, "csv", document);
    expect(screen.getByRole("status")).toHaveTextContent("CSV preparation selected. Coming next: browser-local exporter.");
  });
});
