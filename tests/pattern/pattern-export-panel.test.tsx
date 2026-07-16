import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatternExportPanel, type PatternExportActions } from "../../src/components/PatternExportPanel";
import type { PatternDocument } from "../../src/lib/pattern";

const document = {
  title: "Export test",
} as PatternDocument;

function actions(overrides: Partial<PatternExportActions> = {}): PatternExportActions {
  return {
    downloadCsv: vi.fn().mockResolvedValue(undefined),
    downloadPng: vi.fn().mockResolvedValue(undefined),
    printPattern: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("PatternExportPanel", () => {
  it("disables every export action when there is no document", () => {
    render(<PatternExportPanel exportActions={actions()} />);

    expect(screen.getByRole("button", { name: "Print or save PDF" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeDisabled();
    expect(screen.getByText("Create a pattern to export files.")).toBeInTheDocument();
  });

  it("requests CSV and PNG downloads locally without claiming that browser saving completed", async () => {
    const exportActions = actions();
    render(<PatternExportPanel document={document} exportActions={exportActions} />);

    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));
    await waitFor(() => expect(exportActions.downloadCsv).toHaveBeenCalledWith(document));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("CSV download requested locally."));
    expect(screen.getByRole("status")).not.toHaveTextContent("downloaded");

    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    await waitFor(() => expect(exportActions.downloadPng).toHaveBeenCalledWith(document));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("PNG download requested locally."));
    expect(screen.getByRole("status")).not.toHaveTextContent("downloaded");
  });

  it.each([
    ["Download PNG", "png", "downloadPng"],
    ["Download CSV", "csv", "downloadCsv"],
  ] as const)("notifies consumers when %s is prepared", async (buttonName, format, actionName) => {
    const exportActions = actions();
    const onPrepare = vi.fn();
    render(<PatternExportPanel document={document} exportActions={exportActions} onPrepare={onPrepare} />);

    fireEvent.click(screen.getByRole("button", { name: buttonName }));

    await waitFor(() => expect(exportActions[actionName]).toHaveBeenCalledWith(document));
    expect(onPrepare).toHaveBeenCalledTimes(1);
    expect(onPrepare).toHaveBeenCalledWith(format, document);
  });

  it("announces an accessible error without claiming success when a local export fails", async () => {
    const exportActions = actions({ downloadPng: vi.fn().mockRejectedValue(new Error("Canvas is unavailable")) });
    const onPrepare = vi.fn();
    render(<PatternExportPanel document={document} exportActions={exportActions} onPrepare={onPrepare} />);

    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Canvas is unavailable");
    expect(onPrepare).toHaveBeenCalledTimes(1);
    expect(onPrepare).toHaveBeenCalledWith("png", document);
    expect(screen.queryByText("PNG downloaded locally.")).not.toBeInTheDocument();
  });

  it("opens the browser print dialog through the injected PDF adapter", async () => {
    const exportActions = actions();
    const onPrepare = vi.fn();
    render(<PatternExportPanel document={document} exportActions={exportActions} onPrepare={onPrepare} />);

    fireEvent.click(screen.getByRole("button", { name: "Print or save PDF" }));
    await waitFor(() => expect(exportActions.printPattern).toHaveBeenCalledWith(document));
    expect(onPrepare).toHaveBeenCalledWith("pdf", document);
    expect(screen.getByRole("status")).toHaveTextContent("Print dialog opened. Choose Save as PDF to create a PDF.");
  });

  it("uses a synchronous lock so rapid clicks only start one pending export", async () => {
    let resolveDownload!: () => void;
    const pending = new Promise<void>((resolve) => { resolveDownload = resolve; });
    const exportActions = actions({ downloadPng: vi.fn(() => pending) });
    render(<PatternExportPanel document={document} exportActions={exportActions} />);
    const button = screen.getByRole("button", { name: "Download PNG" });

    act(() => {
      button.click();
      button.click();
    });

    expect(exportActions.downloadPng).toHaveBeenCalledTimes(1);
    resolveDownload();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("PNG download requested locally."));
  });
});
