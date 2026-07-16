import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlobInBrowser } from "../../src/lib/pattern/browser-download";

const objectUrl = "blob:pattern-export";
let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  createObjectURL = vi.fn(() => objectUrl);
  revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("downloadBlobInBrowser", () => {
  it("removes the temporary anchor synchronously but defers object URL revocation", () => {
    let clickedAnchor: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      clickedAnchor = document.querySelector('a[download="pattern.csv"]') ?? undefined;
      expect(clickedAnchor).toBe(this);
      expect(this.isConnected).toBe(true);
    });
    const blob = new Blob(["pattern"]);

    downloadBlobInBrowser(blob, "pattern.csv");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickedAnchor).toMatchObject({ href: objectUrl, download: "pattern.csv" });
    expect(clickedAnchor?.isConnected).toBe(false);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it("removes the anchor and schedules deferred revocation when clicking fails", () => {
    let clickedAnchor: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      clickedAnchor = document.querySelector('a[download="pattern.png"]') ?? undefined;
      expect(clickedAnchor).toBe(this);
      expect(this.isConnected).toBe(true);
      throw new Error("click failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.png")).toThrow("click failed");

    expect(clickedAnchor?.isConnected).toBe(false);
    expect(document.body.contains(clickedAnchor ?? null)).toBe(false);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it("schedules deferred revocation when creating the anchor fails", () => {
    vi.spyOn(document, "createElement").mockImplementation(() => {
      throw new Error("createElement failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.csv")).toThrow(
      "createElement failed",
    );
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it("schedules deferred revocation without removing the anchor when appending fails", () => {
    const anchor = document.createElement("a");
    const remove = vi.spyOn(anchor, "remove");
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(document.body, "append").mockImplementation(() => {
      throw new Error("append failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.csv")).toThrow("append failed");
    expect(remove).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });
});
