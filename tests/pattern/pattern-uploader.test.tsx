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

  it("calls back with a valid file and exposes loading state", () => {
    const accepted = vi.fn();
    render(<PatternUploader loading onAcceptedFile={accepted} />);
    const input = screen.getByLabelText(/choose a jpg or png/i);
    fireEvent.change(input, { target: { files: [new File(["x"], "photo.png", { type: "image/png" })] } });
    expect(accepted).toHaveBeenCalledWith(expect.objectContaining({ name: "photo.png" }));
    expect(screen.getByRole("status")).toHaveTextContent(/processing/i);
  });
});
