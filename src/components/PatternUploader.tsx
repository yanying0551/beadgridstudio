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
  const [selectedFileName, setSelectedFileName] = useState<string>();
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    const validation = validateLocalImageFile(file);
    if (!validation.ok) {
      setSelectedFileName(undefined);
      setError(validation.error.message);
      return;
    }
    setError(undefined);
    setSelectedFileName(file?.name);
    // A successful metadata validation implies a selected File.
    onAcceptedFile(file as File);
  };
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center sm:p-6" aria-label="Pattern image upload">
      <div aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-teal-50 text-2xl text-teal-800">↑</div>
      <p className="mt-4 text-lg font-bold tracking-tight text-slate-950">Add your source image</p>
      <p className="mt-1 text-sm text-slate-600">Up to 20 MB · JPG or PNG</p>
      <input
        className="peer sr-only"
        id={inputId}
        type="file"
        accept="image/jpeg,image/png"
        onChange={onChange}
        aria-describedby={[`${inputId}-filename`, `${inputId}-privacy`, error ? `${inputId}-error` : undefined].filter(Boolean).join(" ")}
      />
      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-teal-700 px-5 py-2 font-semibold text-white transition hover:bg-teal-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600" htmlFor={inputId}>Choose a JPG or PNG</label>
      <p className="mt-2 max-w-full break-all text-sm text-slate-700" id={`${inputId}-filename`} aria-live="polite">{selectedFileName ?? "No file selected"}</p>
      <p className="mt-4 text-sm font-medium text-teal-800" id={`${inputId}-privacy`}>Processed locally in your browser — your photo is not uploaded.</p>
      {loading && <p className="mt-3 text-sm text-slate-700" role="status">Processing your image locally…</p>}
      {error && <p className="mt-3 text-sm font-semibold text-red-700" id={`${inputId}-error`} role="alert">{error}</p>}
    </section>
  );
}
