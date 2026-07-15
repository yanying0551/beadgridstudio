import { describe, expect, it } from "vitest";
import { MAX_LOCAL_IMAGE_BYTES, validateLocalImageFile } from "../../src/lib/pattern/file-validation";

describe("validateLocalImageFile", () => {
  it("accepts a nonempty JPEG or PNG without reading or uploading it", () => {
    expect(validateLocalImageFile(new File(["x"], "photo.png", { type: "image/png" }))).toEqual({ ok: true });
    expect(validateLocalImageFile(new File(["x"], "photo.jpg", { type: "image/jpeg" }))).toEqual({ ok: true });
  });

  it.each([
    [new File(["x"], "photo.gif", { type: "image/gif" }), "unsupported_type"],
    [new File([], "empty.png", { type: "image/png" }), "empty_file"],
    [{ type: "image/png", size: Infinity, name: "bad.png" }, "invalid_size"],
    [{ type: "image/png", size: MAX_LOCAL_IMAGE_BYTES + 1, name: "large.png" }, "file_too_large"],
  ])("rejects invalid local files with a UI-safe code", (file, code) => {
    const result = validateLocalImageFile(file as File);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code);
  });
});
