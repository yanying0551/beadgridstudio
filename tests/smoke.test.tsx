import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../src/app/page";

describe("Bead Grid Studio homepage", () => {
  it("shows the required product heading, privacy reassurance, and image picker", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Fuse Bead Pattern Maker", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/processed locally in your browser/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/choose a jpg or png/i),
    ).toBeInTheDocument();
  });
});
