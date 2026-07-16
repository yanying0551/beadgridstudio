import { describe, expect, it, vi } from "vitest";
import { createBrowserPatternWorker, PatternWorkerClient, type WorkerLike } from "../../src/lib/pattern/worker-client";
import type { ConvertPatternRequest, WorkerResponse } from "../../src/workers/pattern-worker.protocol";

const request: Omit<ConvertPatternRequest, "requestId"> = {
  type: "convert-pattern",
  image: { width: 1, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255]).buffer },
  settings: { requestedColorCount: 1, quantizationMethod: "nearest-color", mirrorHorizontal: false, mirrorVertical: false },
  palette: [{ id: "red", name: "Red", hex: "#FF0000", sortOrder: 0 }],
  sectionLayout: { maxColumnsPerSection: 10, maxRowsPerSection: 10, overlapCells: 0 },
  document: { id: "pattern-1", title: "Pattern", createdAt: "2026-01-01T00:00:00.000Z" },
};

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  posted: unknown[] = [];
  transferred: Transferable[][] = [];
  terminated = false;
  postMessage(message: unknown, transfer?: Transferable[]) { this.posted.push(message); this.transferred.push(transfer ?? []); }
  terminate() { this.terminated = true; }
  emit(response: WorkerResponse) { this.onmessage?.({ data: response } as MessageEvent<WorkerResponse>); }
}

describe("PatternWorkerClient", () => {
  it("loads the precompiled public worker asset in browsers", () => {
    const worker = { terminate: vi.fn() };
    const WorkerConstructor = vi.fn(() => worker);
    vi.stubGlobal("Worker", WorkerConstructor);

    expect(createBrowserPatternWorker()).toBe(worker);
    expect(WorkerConstructor).toHaveBeenCalledWith("/pattern.worker.js", { type: "module" });

    vi.unstubAllGlobals();
  });

  it("posts only pixel buffer/settings and resolves a matching completion", async () => {
    const worker = new FakeWorker();
    const client = new PatternWorkerClient(() => worker);
    const progress = vi.fn();
    const pending = client.convert(request, { onProgress: progress });
    const sent = worker.posted[0] as ConvertPatternRequest;
    expect(sent.requestId).toBeTruthy();
    expect(worker.transferred[0]).toEqual([request.image.data]);
    worker.emit({ type: "pattern-progress", requestId: sent.requestId, progress: { phase: "quantizing" } });
    expect(progress).toHaveBeenCalledWith("quantizing");
    worker.emit({ type: "pattern-success", requestId: sent.requestId, document: { id: "pattern-1" } as never });
    await expect(pending).resolves.toEqual({ id: "pattern-1" });
  });

  it("rejects typed worker errors and terminates/rejects on cancellation", async () => {
    const worker = new FakeWorker();
    const client = new PatternWorkerClient(() => worker);
    const failed = client.convert(request);
    const sent = worker.posted[0] as ConvertPatternRequest;
    worker.emit({ type: "pattern-error", requestId: sent.requestId, error: { code: "invalid_request", message: "Bad pixels" } });
    await expect(failed).rejects.toMatchObject({ code: "invalid_request", message: "Bad pixels" });

    const cancelled = client.convert(request);
    client.cancel();
    await expect(cancelled).rejects.toMatchObject({ code: "cancelled" });
    expect(worker.terminated).toBe(true);
  });

  it("rejects factory and postMessage failures as typed errors without synchronously throwing", async () => {
    const factoryFailure = new PatternWorkerClient(() => { throw new Error("CSP blocked worker"); });
    const factoryConversion = factoryFailure.convert(request);
    await expect(factoryConversion).rejects.toMatchObject({ code: "worker_failed", message: "CSP blocked worker" });

    const worker = new FakeWorker();
    worker.postMessage = () => { throw new Error("clone failed"); };
    const postFailure = new PatternWorkerClient(() => worker);
    const postConversion = postFailure.convert(request);
    await expect(postConversion).rejects.toMatchObject({ code: "worker_failed", message: "clone failed" });
    expect(worker.terminated).toBe(true);
  });

  it("discards a worker that raises an error so the next conversion uses a fresh worker", async () => {
    const first = new FakeWorker();
    const second = new FakeWorker();
    const createWorker = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const client = new PatternWorkerClient(createWorker);

    const failed = client.convert(request);
    first.onerror?.({} as ErrorEvent);
    await expect(failed).rejects.toMatchObject({ code: "worker_failed" });
    expect(first.terminated).toBe(true);

    const next = client.convert(request);
    expect(createWorker).toHaveBeenCalledTimes(2);
    expect(second.posted).toHaveLength(1);
    const sent = second.posted[0] as ConvertPatternRequest;
    second.emit({ type: "pattern-success", requestId: sent.requestId, document: { id: "pattern-2" } as never });
    await expect(next).resolves.toEqual({ id: "pattern-2" });
  });

  it("ignores a late error from a cancelled worker while a newer conversion is pending", async () => {
    const first = new FakeWorker();
    const second = new FakeWorker();
    const createWorker = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const client = new PatternWorkerClient(createWorker);

    const cancelled = client.convert(request);
    client.cancel();
    await expect(cancelled).rejects.toMatchObject({ code: "cancelled" });

    const next = client.convert(request);
    const sent = second.posted[0] as ConvertPatternRequest;
    first.onerror?.({} as ErrorEvent);

    second.emit({ type: "pattern-success", requestId: sent.requestId, document: { id: "pattern-2" } as never });
    await expect(next).resolves.toEqual({ id: "pattern-2" });
  });
});
