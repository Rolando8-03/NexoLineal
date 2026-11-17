import { waitForWindowsMethods } from "../nativeBridge";
import { loadWebState, saveWebState } from "./webStore";
/** Persistencia local por destino; nunca sube problemas a un servicio externo. */
import { MAX_BYTES } from "./project";
const target = import.meta.env.VITE_TARGET || "web";
interface NativeFiles {
  export_document(data: {
    kind: string;
    content: string;
  }): Promise<{ cancelled?: boolean }>;
  load_state(): Promise<{ content: string | null }>;
  save_state(data: { content: string }): Promise<unknown>;
  export_project(data: { content: string }): Promise<{ cancelled?: boolean }>;
  import_project(): Promise<{ content?: string; cancelled?: boolean }>;
}
// El proxy de Capacitor fabrica un método para cualquier propiedad, incluso «then».
// Devolverlo desde async lo convertiría en un thenable y dejaría la carga pendiente.
function bindFiles(api: NativeFiles): NativeFiles {
  return {
    export_document: (data) => api.export_document(data),
    load_state: () => api.load_state(),
    save_state: (data) => api.save_state(data),
    export_project: (data) => api.export_project(data),
    import_project: () => api.import_project(),
  };
}
async function native(): Promise<NativeFiles> {
  if (target === "android") {
    const { registerPlugin } = await import("@capacitor/core");
    return bindFiles(registerPlugin<NativeFiles>("NexoEngine"));
  }
  const { api } = await waitForWindowsMethods<NativeFiles>([
    "load_state",
    "save_state",
    "export_project",
    "import_project",
    "export_document",
  ]);
  return bindFiles(api);
}
export const storageName =
  target === "web"
    ? "este navegador"
    : target === "windows"
      ? "esta instalación de Windows"
      : "esta instalación de Android";
export async function loadState(): Promise<string | null> {
  return target === "web"
    ? await loadWebState()
    : (await (await native()).load_state()).content;
}
export async function saveState(content: string): Promise<void> {
  if (new TextEncoder().encode(content).length > MAX_BYTES)
    throw new Error("El proyecto supera 2 MiB.");
  if (target === "web") await saveWebState(content);
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

/** Un único formato binario se guarda con el selector propio de cada destino. */
export async function saveDocument(
  bytes: Uint8Array,
  kind: "pdf" | "csv",
): Promise<boolean> {
  if (bytes.length > 16 * 1024 * 1024)
    throw new Error(
      "El documento supera 16 MiB; exportá el resultado JSON o reducí el procedimiento.",
    );
  const name =
    kind === "pdf" ? "NexoLineal-procedimiento.pdf" : "NexoLineal-tabla.csv";
  if (target !== "web") {
    let content = "";
    for (let i = 0; i < bytes.length; i += 32768)
      content += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return !(
      await (await native()).export_document({ kind, content: btoa(content) })
    ).cancelled;
  }
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], {
      type: kind === "pdf" ? "application/pdf" : "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
