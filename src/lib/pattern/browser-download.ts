export interface BlobDownloadAdapter {
  downloadBlob(blob: Blob, fileName: string): void;
}

/** Trigger a browser-local file download and release the temporary object URL. */
export function downloadBlobInBrowser(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  let anchor: HTMLAnchorElement | undefined;
  let appended = false;
  try {
    anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.append(anchor);
    appended = true;
    anchor.click();
  } finally {
    try {
      if (appended) anchor?.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    }
  }
}
