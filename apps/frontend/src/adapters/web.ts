import type { CalculationResult, Engine, Problem } from "../contracts";
import { cancelled, requestId } from "../contracts";
interface Pending { problem: Problem; resolve: (value: CalculationResult) => void; reject: (error: Error) => void; progress?: (value: number) => void }
export class WebEngine implements Engine {
  private worker: Worker | null = null;
  private initialization: Promise<void> | null = null;
  private rejectInitialization: ((error: Error) => void) | null = null;
  private pending = new Map<string, Pending>();
  private generation = 0;

  initialize(): Promise<void> {
    if (this.initialization) return this.initialization;
    const worker = new Worker(new URL("../workers/python-worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    this.initialization = new Promise<void>((resolve, reject) => {
      this.rejectInitialization = reject;
      worker.onmessage = event => {
        if (worker !== this.worker) return;
        const message = event.data;
        if (message.type === "ready") { this.rejectInitialization = null; resolve(); return; }
        if (message.type === "failure" && !message.id) { this.fail(new Error(message.error)); return; }
        const pending = this.pending.get(message.id);
        if (!pending) return;
        if (message.type === "progress") { pending.progress?.(message.progress); return; }
        this.pending.delete(message.id);
        if (message.type === "result") pending.resolve(message.result);
        else pending.reject(new Error(message.error || "El motor no pudo completar la operación."));
      };
      worker.onerror = event => {
        const error = new Error(event.message || "No se pudo cargar el motor.");
        this.fail(error);
      };
      worker.postMessage({ type: "initialize", baseURL: new URL(".", location.href).href });
    });
    return this.initialization;
  }

  private fail(error: Error): void {
    this.worker?.terminate();
    this.worker = null;
    this.rejectInitialization?.(error);
    this.rejectInitialization = null;
    this.initialization = null;
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  async execute(problem: Problem, onProgress?: (value: number) => void): Promise<CalculationResult> {
    const generation = this.generation;
    try { await this.initialize(); }
    catch (error) { if (generation !== this.generation) return cancelled(problem); throw error; }
    if (generation !== this.generation) return cancelled(problem);
    const id = requestId();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { problem, resolve, reject, progress: onProgress });
      this.worker!.postMessage({ type: "execute", id, problem });
    });
  }

  async cancel(): Promise<void> {
    this.generation++;
    this.worker?.terminate();
    this.worker = null;
    this.rejectInitialization?.(new Error("Cálculo cancelado."));
    this.rejectInitialization = null;
    this.initialization = null;
    for (const pending of this.pending.values()) pending.resolve(cancelled(pending.problem));
    this.pending.clear();
  }

  dispose(): void { void this.cancel(); }
}
