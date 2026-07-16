export interface BlobDownloadAdapter {
  downloadBlob(blob: Blob, fileName: string): void;
}

/**
 * Trigger a browser-local file download and release the temporary object URL.
 *
 * After a successful click, revocation is delayed because browsers may consume the
 * object URL asynchronously. Failed attempts revoke it synchronously.
 */
export function downloadBlobInBrowser(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  let anchor: HTMLAnchorElement | undefined;
  let appended = false;
  let clickCompleted = false;
  let downloadError: unknown;
  let cleanupError: unknown;

  try {
    anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.append(anchor);
    appended = true;
    anchor.click();
    clickCompleted = true;
  } catch (error) {
    downloadError = error;
  }

  if (appended) {
    try {
      anchor?.remove();
    } catch (error) {
      cleanupError = error;
    }
  }

  if (clickCompleted) {
    // A completed click may hand the URL to the browser asynchronously. Anchor
    // cleanup failure does not change that download state.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  } else {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      cleanupError ??= error;
    }
  }

  // Cleanup must never hide the error that prevented the download attempt.
  if (downloadError !== undefined) throw downloadError;
  if (cleanupError !== undefined) throw cleanupError;
}
