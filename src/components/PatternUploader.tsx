"use client";

import { useId, useState, type ChangeEvent } from "react";
import { validateLocalImageFile } from "../lib/pattern/file-validation";

export interface PatternUploaderProps {
  onAcceptedFile: (file: File) => void;
  loading?: boolean;
}

/** File picker only: validation is local and the File is handed to the caller for local decoding. */
export function PatternUploader({ onAcceptedFile, loading = false }: PatternUploaderProps) {
  const inputId = useId();
  const [error, setError] = useState<string>();
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    const validation = validateLocalImageFile(file);
    if (!validation.ok) { setError(validation.error.message); return; }
    setError(undefined);
    // A successful metadata validation implies a selected File.
    onAcceptedFile(file as File);
  };
  return (
    <section aria-label="Pattern image upload">
      <label htmlFor={inputId}>Choose a JPG or PNG</label>
      <input id={inputId} type="file" accept="image/jpeg,image/png" onChange={onChange} aria-describedby={`${inputId}-privacy ${error ? `${inputId}-error` : ""}`} />
      <p id={`${inputId}-privacy`}>Processed locally in your browser — your photo is not uploaded.</p>
      {loading && <p role="status">Processing your image locally…</p>}
      {error && <p id={`${inputId}-error`} role="alert">{error}</p>}
    </section>
  );
}
