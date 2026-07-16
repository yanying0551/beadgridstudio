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
  it("removes the temporary anchor synchronously but waits 1000ms before revoking the object URL", () => {
    let clickedAnchor: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clickedAnchor = document.querySelector<HTMLAnchorElement>('a[download="pattern.csv"]') ?? undefined;
      expect(clickedAnchor).toBe(this);
      expect(this.isConnected).toBe(true);
    });
    const blob = new Blob(["pattern"]);

    downloadBlobInBrowser(blob, "pattern.csv");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickedAnchor).toMatchObject({ href: objectUrl, download: "pattern.csv" });
    expect(clickedAnchor?.isConnected).toBe(false);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(999);

    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it("removes the anchor and revokes synchronously when clicking fails", () => {
    let clickedAnchor: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clickedAnchor = document.querySelector<HTMLAnchorElement>('a[download="pattern.png"]') ?? undefined;
      expect(clickedAnchor).toBe(this);
      expect(this.isConnected).toBe(true);
      throw new Error("click failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.png")).toThrow("click failed");

    expect(clickedAnchor?.isConnected).toBe(false);
    expect(document.body.contains(clickedAnchor ?? null)).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it("revokes synchronously when creating the anchor fails", () => {
    vi.spyOn(document, "createElement").mockImplementation(() => {
      throw new Error("createElement failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.csv")).toThrow(
      "createElement failed",
    );
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it("revokes synchronously without removing the anchor when appending fails", () => {
    const anchor = document.createElement("a");
    const remove = vi.spyOn(anchor, "remove");
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(document.body, "append").mockImplementation(() => {
      throw new Error("append failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.csv")).toThrow("append failed");
    expect(remove).not.toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it("still delays revocation when clicking succeeds but removing the anchor fails", () => {
    const anchor = document.createElement("a");
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(anchor, "click").mockImplementation(() => undefined);
    vi.spyOn(anchor, "remove").mockImplementation(() => {
      anchor.parentNode?.removeChild(anchor);
      throw new Error("remove failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.csv")).toThrow("remove failed");
    expect(anchor.isConnected).toBe(false);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(999);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it("preserves the original click error when removing the anchor also fails", () => {
    const anchor = document.createElement("a");
    const clickError = new Error("click failed");
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(anchor, "click").mockImplementation(() => {
      throw clickError;
    });
    vi.spyOn(anchor, "remove").mockImplementation(() => {
      anchor.parentNode?.removeChild(anchor);
      throw new Error("remove failed");
    });

    expect(() => downloadBlobInBrowser(new Blob(["pattern"]), "pattern.csv")).toThrow(clickError);
    expect(revokeObjectURL).toHaveBeenCalledOnce();

    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });
});
