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
    <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center" aria-label="Pattern image upload">
      <div aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-teal-50 text-2xl text-teal-800">↑</div>
      <label className="mt-4 text-lg font-bold tracking-tight text-slate-950" htmlFor={inputId}>Choose a JPG or PNG</label>
      <p className="mt-1 text-sm text-slate-600">Up to 20 MB · JPG or PNG</p>
      <input className="mt-4 max-w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-700 file:mr-3 file:min-h-11 file:cursor-pointer file:border-0 file:bg-teal-700 file:px-4 file:font-semibold file:text-white hover:file:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" id={inputId} type="file" accept="image/jpeg,image/png" onChange={onChange} aria-describedby={`${inputId}-privacy ${error ? `${inputId}-error` : ""}`} />
      <p className="mt-4 text-sm font-medium text-teal-800" id={`${inputId}-privacy`}>Processed locally in your browser — your photo is not uploaded.</p>
      {loading && <p className="mt-3 text-sm text-slate-700" role="status">Processing your image locally…</p>}
      {error && <p className="mt-3 text-sm font-semibold text-red-700" id={`${inputId}-error`} role="alert">{error}</p>}
    </section>
  );
}
