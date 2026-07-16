import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatternUploader } from "../../src/components/PatternUploader";

describe("PatternUploader", () => {
  it("has an accessible JPEG/PNG input, local-only copy, and reports validation errors", () => {
    const accepted = vi.fn();
    render(<PatternUploader onAcceptedFile={accepted} />);
    const input = screen.getByLabelText(/choose a jpg or png/i);
    expect(input).toHaveAttribute("accept", "image/jpeg,image/png");
    expect(screen.getByText(/processed locally in your browser.*not uploaded/i)).toBeInTheDocument();
    fireEvent.change(input, { target: { files: [new File([], "empty.png", { type: "image/png" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent(/empty/i);
    expect(accepted).not.toHaveBeenCalled();
  });

  it("calls back with a valid file, exposes loading state, and shows the selected filename separately", () => {
    const accepted = vi.fn();
    render(<PatternUploader loading onAcceptedFile={accepted} />);
    const input = screen.getByLabelText(/choose a jpg or png/i);
    expect(screen.getByText("No file selected")).toBeInTheDocument();
    fireEvent.change(input, { target: { files: [new File(["x"], "photo-with-a-readable-name.png", { type: "image/png" })] } });
    expect(accepted).toHaveBeenCalledWith(expect.objectContaining({ name: "photo-with-a-readable-name.png" }));
    expect(screen.getByText("photo-with-a-readable-name.png")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/processing/i);

    fireEvent.change(input, { target: { files: [new File([], "empty.png", { type: "image/png" })] } });
    expect(screen.getByText("No file selected")).toBeInTheDocument();
    expect(screen.queryByText("photo-with-a-readable-name.png")).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent(/empty/i);
  });
});
