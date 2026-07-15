export const MAX_LOCAL_IMAGE_BYTES = 20 * 1024 * 1024;
export type LocalImageFileErrorCode = "unsupported_type" | "empty_file" | "invalid_size" | "file_too_large";
export interface LocalImageFileError { code: LocalImageFileErrorCode; message: string }
export type LocalImageFileValidationResult = { ok: true } | { ok: false; error: LocalImageFileError };

/** Metadata-only guard. It does not read, fetch, upload, or retain the selected file. */
export function validateLocalImageFile(file: Pick<File, "type" | "size"> | null | undefined): LocalImageFileValidationResult {
  if (!file || (file.type !== "image/jpeg" && file.type !== "image/png")) {
    return { ok: false, error: { code: "unsupported_type", message: "Choose a JPEG or PNG image." } };
  }
  if (!Number.isFinite(file.size) || file.size < 0) {
    return { ok: false, error: { code: "invalid_size", message: "This image has an invalid file size." } };
  }
  if (file.size === 0) return { ok: false, error: { code: "empty_file", message: "Choose a non-empty image file." } };
  if (file.size > MAX_LOCAL_IMAGE_BYTES) {
    return { ok: false, error: { code: "file_too_large", message: `Choose an image smaller than ${MAX_LOCAL_IMAGE_BYTES / 1024 / 1024} MB.` } };
  }
  return { ok: true };
}
