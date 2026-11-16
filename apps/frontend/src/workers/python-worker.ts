interface Runtime {
  FS: { mkdirTree(path: string): void; writeFile(path: string, value: string): void };
  globals: { set(name: string, value: unknown): void; delete(name: string): void };
  runPython(code: string): string;
}
const scope = self as unknown as {
  postMessage(data: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
};
let runtime: Runtime | null = null;
scope.onmessage = async event => {
  const message = event.data;
  try {
    if (message.type === "initialize") {
      const runtimeURL = new URL("runtime/pyodide/", message.baseURL).href;
      const loader = await import(/* @vite-ignore */ runtimeURL + "pyodide.mjs");
      runtime = await loader.loadPyodide({ indexURL: runtimeURL }) as Runtime;
      const site = runtime.runPython("import sysconfig; sysconfig.get_path('purelib')");
      const response = await fetch(new URL("runtime/core-manifest.json", message.baseURL));
      if (!response.ok) throw new Error("No se encontró el paquete matemático.");
      const files = await response.json() as { path: string; sha256: string }[];
      for (const file of files) {
        const response = await fetch(new URL("runtime/python/" + file.path, message.baseURL));
        if (!response.ok) throw new Error("Falta " + file.path);
        const text = await response.text();
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        const hash = Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
        if (hash !== file.sha256) throw new Error("El archivo matemático no coincide con su versión.");
        const destination = site + "/" + file.path;
        runtime.FS.mkdirTree(destination.slice(0, destination.lastIndexOf("/")));
        runtime.FS.writeFile(destination, text);
      }
      runtime.runPython("from nexolineal.application.service import execute");
      scope.postMessage({ type: "ready" });
      return;
    }
    if (!runtime) throw new Error("El motor aún se está preparando.");
    runtime.globals.set("_nexo_payload", JSON.stringify(message.problem));
    runtime.globals.set("_nexo_progress", (progress: number) =>
      scope.postMessage({ type: "progress", id: message.id, progress }));
    try {
      const text = runtime.runPython("import json\njson.dumps(execute(json.loads(_nexo_payload), on_progress=_nexo_progress), ensure_ascii=False)");
      scope.postMessage({ type: "result", id: message.id, result: JSON.parse(text) });
    } finally {
      runtime.globals.delete("_nexo_payload");
      runtime.globals.delete("_nexo_progress");
    }
  } catch (error) {
    scope.postMessage({ type: "failure", id: message.id, error: error instanceof Error ? error.message : String(error) });
  }
};
