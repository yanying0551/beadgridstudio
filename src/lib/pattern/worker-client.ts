import type { PatternDocument } from ".";
import type { ConvertPatternRequest, PatternWorkerError, WorkerResponse } from "../../workers/pattern-worker.protocol";

export interface WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
}
export type WorkerFactory = () => WorkerLike;
export interface ConvertPatternOptions {
  /** Phase updates are qualitative because worker conversion is synchronous. */
  onProgress?: (phase: "quantizing" | "deriving" | "validating") => void;
}
export class PatternWorkerClientError extends Error {
  constructor(public readonly code: PatternWorkerError["code"], message: string, public readonly issues?: PatternWorkerError["issues"]) {
    super(message); this.name = "PatternWorkerClientError";
  }
}

/** One conversion at a time; cancel terminates its worker and makes it unusable. */
export class PatternWorkerClient {
  private worker: WorkerLike | undefined;
  private pending: { requestId: string; resolve: (document: PatternDocument) => void; reject: (error: PatternWorkerClientError) => void; onProgress?: ConvertPatternOptions["onProgress"] } | undefined;
  private nextRequest = 0;
  constructor(private readonly createWorker: WorkerFactory) {}

  convert(input: Omit<ConvertPatternRequest, "requestId">, options: ConvertPatternOptions = {}): Promise<PatternDocument> {
    // All setup lives in the Promise executor: factory/clone failures are typed rejections, never throws.
    return new Promise((resolve, reject) => {
      if (this.pending) this.cancel();
      let worker: WorkerLike;
      try {
        worker = this.ensureWorker();
      } catch (cause) {
        reject(this.workerError(cause));
        return;
      }
      const requestId = `pattern-${++this.nextRequest}`;
      const request: ConvertPatternRequest = { ...input, requestId };
      this.pending = { requestId, resolve, reject, onProgress: options.onProgress };
      try {
        worker.postMessage(request, [request.image.data]);
      } catch (cause) {
        this.discardWorker(worker);
        this.fail("worker_failed", this.workerError(cause).message);
      }
    });
  }

  cancel(): void {
    if (this.pending) {
      this.pending.reject(new PatternWorkerClientError("cancelled", "Pattern conversion was cancelled."));
      this.pending = undefined;
    }
    this.worker?.terminate();
    this.worker = undefined;
  }
  dispose(): void { this.cancel(); }

  private ensureWorker(): WorkerLike {
    if (this.worker) return this.worker;
    const worker = this.createWorker();
    worker.onmessage = (event) => {
      if (this.worker === worker) this.handleResponse(event.data);
    };
    worker.onerror = () => {
      // Termination does not guarantee that an already queued error event is discarded.
      // Only the active worker is allowed to affect the active request.
      if (this.worker !== worker) return;
      // A Worker that raised an unhandled error cannot be safely reused.
      this.discardWorker(worker);
      this.fail("worker_failed", "Pattern conversion worker failed.");
    };
    this.worker = worker;
    return worker;
  }
  private handleResponse(response: WorkerResponse): void {
    if (!this.pending || response.requestId !== this.pending.requestId) return;
    if (response.type === "pattern-progress") { this.pending.onProgress?.(response.progress.phase); return; }
    const pending = this.pending; this.pending = undefined;
    if (response.type === "pattern-success") pending.resolve(response.document);
    else pending.reject(new PatternWorkerClientError(response.error.code, response.error.message, response.error.issues));
  }
  private fail(code: PatternWorkerError["code"], message: string): void {
    if (!this.pending) return;
    const pending = this.pending; this.pending = undefined;
    pending.reject(new PatternWorkerClientError(code, message));
  }
  private discardWorker(worker: WorkerLike): void {
    try { worker.terminate(); } catch { /* disposal must not change the conversion result */ }
    if (this.worker === worker) this.worker = undefined;
  }
  private workerError(cause: unknown): PatternWorkerClientError {
    return new PatternWorkerClientError("worker_failed", cause instanceof Error && cause.message ? cause.message : "Pattern conversion worker failed.");
  }
}

/** Browser-only factory kept out of the testable client lifecycle. */
export function createBrowserPatternWorker(): WorkerLike {
  return new Worker(new URL("../../workers/pattern.worker.ts", import.meta.url), { type: "module" }) as unknown as WorkerLike;
}
