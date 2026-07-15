import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatternConversionUploader } from "../../src/components/PatternConversionUploader";
import type { BrowserImageDecoder, DecodedBrowserImage } from "../../src/lib/pattern/image-decoder";
import type { WorkerLike } from "../../src/lib/pattern/worker-client";
import type { ConvertPatternRequest, WorkerResponse } from "../../src/workers/pattern-worker.protocol";

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  posted: ConvertPatternRequest[] = [];
  terminated = false;
  postMessage(message: unknown) { this.posted.push(message as ConvertPatternRequest); }
  terminate() { this.terminated = true; }
  success(request: ConvertPatternRequest, id = "local-pattern") { this.onmessage?.({ data: { type: "pattern-success", requestId: request.requestId, document: { id } as never } } as unknown as MessageEvent<WorkerResponse>); }
}

const decoder: BrowserImageDecoder = {
  decode: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
  readDimensions: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
  readRgba: vi.fn().mockReturnValue(new Uint8ClampedArray([255, 0, 0, 255])),
};
const image = { width: 1, height: 1 };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
  return { promise, resolve, reject };
}
function select(name: string) {
  fireEvent.change(screen.getByLabelText(/choose a jpg or png/i), { target: { files: [new File(["x"], name, { type: "image/png" })] } });
}

describe("PatternConversionUploader", () => {
  it("locally decodes a valid file, transfers RGBA through the worker client, and surfaces success", async () => {
    const converted = vi.fn();
    const worker = new FakeWorker();
    render(<PatternConversionUploader decoder={decoder} createWorker={() => worker} onConverted={converted} />);

    select("photo.png");
    await waitFor(() => expect(worker.posted).toHaveLength(1));
    worker.success(worker.posted[0]);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/pattern is ready/i));
    expect(decoder.decode).toHaveBeenCalled();
    expect(decoder.readRgba).toHaveBeenCalled();
    expect(converted).toHaveBeenCalledWith({ id: "local-pattern" });
  });

  it("surfaces local decode failures rather than only invoking a callback", async () => {
    render(<PatternConversionUploader decoder={{ ...decoder, decode: vi.fn().mockRejectedValue(new Error("Cannot decode photo")) }} createWorker={() => new FakeWorker()} />);
    select("photo.png");
    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot decode photo/i);
  });

  it("ignores an out-of-order stale decode result and stale error after a newer selection", async () => {
    const first = deferred<DecodedBrowserImage>();
    const second = deferred<DecodedBrowserImage>();
    const workers: FakeWorker[] = [];
    const converted = vi.fn();
    const localDecoder: BrowserImageDecoder = { decode: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise), readDimensions: vi.fn().mockResolvedValue({ width: 1, height: 1 }), readRgba: vi.fn().mockReturnValue(new Uint8ClampedArray([1, 2, 3, 4])) };
    render(<PatternConversionUploader decoder={localDecoder} createWorker={() => { const worker = new FakeWorker(); workers.push(worker); return worker; }} onConverted={converted} />);

    select("first.png");
    select("second.png");
    second.resolve(image);
    await waitFor(() => expect(workers[0]?.posted).toHaveLength(1));
    workers[0].success(workers[0].posted[0], "second");
    await waitFor(() => expect(converted).toHaveBeenCalledWith({ id: "second" }));

    first.reject(new Error("stale failure"));
    await Promise.resolve();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(converted).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale worker result after a newer selection cancels it", async () => {
    const workers: FakeWorker[] = [];
    const converted = vi.fn();
    render(<PatternConversionUploader decoder={{ ...decoder, decode: vi.fn().mockResolvedValue(image), readRgba: vi.fn().mockReturnValue(new Uint8ClampedArray([1, 2, 3, 4])) }} createWorker={() => { const worker = new FakeWorker(); workers.push(worker); return worker; }} onConverted={converted} />);

    select("first.png");
    await waitFor(() => expect(workers[0]?.posted).toHaveLength(1));
    select("second.png");
    await waitFor(() => expect(workers[1]?.posted).toHaveLength(1));
    expect(workers[0].terminated).toBe(true);
    workers[0].success(workers[0].posted[0], "stale");
    await Promise.resolve();
    expect(converted).not.toHaveBeenCalled();
    workers[1].success(workers[1].posted[0], "current");
    await waitFor(() => expect(converted).toHaveBeenCalledWith({ id: "current" }));
  });

  it("does not create a worker or update after unmount while decoding", async () => {
    const pending = deferred<DecodedBrowserImage>();
    const createWorker = vi.fn(() => new FakeWorker());
    const localDecoder: BrowserImageDecoder = { decode: vi.fn().mockReturnValue(pending.promise), readDimensions: vi.fn().mockResolvedValue({ width: 1, height: 1 }), readRgba: vi.fn().mockReturnValue(new Uint8ClampedArray([1, 2, 3, 4])) };
    const view = render(<PatternConversionUploader decoder={localDecoder} createWorker={createWorker} />);
    select("photo.png");
    view.unmount();
    pending.resolve(image);
    await Promise.resolve();
    await Promise.resolve();
    expect(createWorker).not.toHaveBeenCalled();
  });

  it("decodes a square preset as its exact selected dimensions", async () => {
    const worker = new FakeWorker();
    const localDecoder: BrowserImageDecoder = {
      ...decoder,
      decode: vi.fn().mockResolvedValue({ width: 64, height: 64 }),
      readRgba: vi.fn().mockImplementation((_source, width, height) => new Uint8ClampedArray(width * height * 4)),
    };
    render(<PatternConversionUploader decoder={localDecoder} createWorker={() => worker} />);

    fireEvent.change(screen.getByLabelText(/grid preset/i), { target: { value: "64" } });
    select("photo.png");

    await waitFor(() => expect(worker.posted).toHaveLength(1));
    expect(localDecoder.decode).toHaveBeenCalledWith(expect.any(File), { resizeWidth: 64, resizeHeight: 64 });
    expect(worker.posted[0]).toMatchObject({ image: { width: 64, height: 64 } });
  });

  it("decodes a custom grid selection into an exactly sized worker raster without UI-only request fields", async () => {
    const worker = new FakeWorker();
    const localDecoder: BrowserImageDecoder = {
      ...decoder,
      decode: vi.fn().mockResolvedValue({ width: 24, height: 32 }),
      readRgba: vi.fn().mockImplementation((_source, width, height) => new Uint8ClampedArray(width * height * 4)),
    };
    render(<PatternConversionUploader decoder={localDecoder} createWorker={() => worker} />);

    fireEvent.change(screen.getByLabelText(/grid preset/i), { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText(/custom grid width/i), { target: { value: "24" } });
    fireEvent.change(screen.getByLabelText(/custom grid height/i), { target: { value: "32" } });
    fireEvent.change(screen.getByLabelText(/color count/i), { target: { value: "4" } });
    fireEvent.click(screen.getByLabelText(/use dithering/i));
    select("photo.png");

    await waitFor(() => expect(worker.posted).toHaveLength(1));
    expect(localDecoder.decode).toHaveBeenCalledWith(expect.any(File), { resizeWidth: 24, resizeHeight: 32 });
    expect(worker.posted[0]).toMatchObject({ image: { width: 24, height: 32 } });
    expect(worker.posted[0].settings).toMatchObject({
      requestedColorCount: 4,
      quantizationMethod: "floyd-steinberg",
      mirrorHorizontal: false,
      mirrorVertical: false,
    });
    expect(worker.posted[0].settings).not.toHaveProperty("gridPreset");
    expect(worker.posted[0].settings).not.toHaveProperty("customGridWidth");
    expect(worker.posted[0].settings).not.toHaveProperty("customGridHeight");
    expect(worker.posted[0].palette).toHaveLength(4);
  });
});
