/** Persistencia local por destino; nunca sube problemas a un servicio externo. */
import { MAX_BYTES } from "./project";
const target = import.meta.env.VITE_TARGET || "web";
const KEY = "nexolineal.project.v1";
interface NativeFiles {
  load_state(): Promise<{ content: string | null }>;
  save_state(data: { content: string }): Promise<unknown>;
  export_project(data: { content: string }): Promise<{ cancelled?: boolean }>;
  import_project(): Promise<{ content?: string; cancelled?: boolean }>;
}
async function native(): Promise<NativeFiles> {
  if (target === "android") {
    const { registerPlugin } = await import("@capacitor/core");
    return registerPlugin<NativeFiles>("NexoEngine");
  }
  for (let i = 0; i < 200; i++) {
    const api = (window as unknown as { pywebview?: { api?: NativeFiles } })
      .pywebview?.api;
    if (api) return api;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(
    "No se pudo conectar con el almacenamiento de la aplicación.",
  );
}
export const storageName =
  target === "web"
    ? "este navegador"
    : target === "windows"
      ? "esta instalación de Windows"
      : "esta instalación de Android";
export async function loadState(): Promise<string | null> {
  return target === "web"
    ? localStorage.getItem(KEY)
    : (await (await native()).load_state()).content;
}
export async function saveState(content: string): Promise<void> {
  if (new TextEncoder().encode(content).length > MAX_BYTES)
    throw new Error("El proyecto supera 2 MiB.");
  if (target === "web") localStorage.setItem(KEY, content);
  else await (await native()).save_state({ content });
}
export async function exportFile(
  content: string,
  name = "NexoLineal-proyecto.json",
): Promise<boolean> {
  if (target !== "web") {
    const r = await (await native()).export_project({ content });
    return !r.cancelled;
  }
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export async function importNativeFile(): Promise<string | null> {
  const r = await (await native()).import_project();
  return r.cancelled ? null : (r.content ?? null);
}
export function isWeb() {
  return target === "web";
}
