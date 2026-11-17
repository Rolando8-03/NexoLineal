import { waitForWindowsMethods } from "../nativeBridge";
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { CalculationResult, Engine, Problem } from "../contracts";
import { requestId } from "../contracts";
interface Transport {
  prepare(data: { requestId: string }): Promise<{ ready: boolean }>;
  execute(data: {
    requestId: string;
    problem: Problem;
  }): Promise<{ response: CalculationResult }>;
  cancel(data: { requestId: string }): Promise<{ cancelled: boolean }>;
  progress(data: { requestId: string }): Promise<{ progress: number }>;
}
declare global {
  interface Window {
    pywebview?: { api: Transport };
  }
}
export class NativeEngine implements Engine {
  private transport: Transport | null = null;
  private active: { id: string; prepared: boolean; cancelled: boolean } | null =
    null;

  async initialize(): Promise<void> {
    if (this.transport) return;
    if (Capacitor.isNativePlatform()) {
      this.transport = registerPlugin<Transport>("NexoEngine");
      return;
    }
    this.transport = (
      await waitForWindowsMethods<Transport>([
        "prepare",
        "execute",
        "cancel",
        "progress",
      ])
    ).api;
  }

  async execute(
    problem: Problem,
    onProgress?: (value: number) => void,
  ): Promise<CalculationResult> {
    await this.initialize();
    if (this.active) throw new Error("Espera a que termine el cálculo actual.");
    const job = { id: requestId(), prepared: false, cancelled: false };
    this.active = job;
    let timer: ReturnType<typeof setInterval> | undefined;
    try {
      await this.transport!.prepare({ requestId: job.id });
      job.prepared = true;
      if (job.cancelled) await this.transport!.cancel({ requestId: job.id });
      if (onProgress)
        timer = setInterval(() => {
          void this.transport!.progress({ requestId: job.id })
            .then((value) => {
              if (this.active === job) onProgress(value.progress);
            })
            .catch(() => {});
        }, 150);
      const response = await this.transport!.execute({
        requestId: job.id,
        problem,
      });
      return response.response;
    } finally {
      if (timer) clearInterval(timer);
      if (this.active === job) this.active = null;
    }
  }

  async cancel(): Promise<void> {
    if (this.active) {
      this.active.cancelled = true;
      if (this.active.prepared)
        await this.transport!.cancel({ requestId: this.active.id });
    }
  }

  dispose(): void {
    void this.cancel();
  }
}
