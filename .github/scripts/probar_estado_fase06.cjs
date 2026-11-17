// Ejecuta el codec y la validación reales de TypeScript, sin espejar su implementación.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const ts = require(path.resolve("apps/frontend/node_modules/typescript"));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nexo-project-"));
for (const name of ["project", "validation", "navigation"])
  fs.writeFileSync(
    path.join(dir, name + ".js"),
    ts.transpileModule(
      fs.readFileSync("apps/frontend/src/workspace/" + name + ".ts", "utf8"),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
        },
      },
    ).outputText,
  );
const p = require(path.join(dir, "project.js")),
  v = require(path.join(dir, "validation.js")),
  n = require(path.join(dir, "navigation.js"));
const { execFileSync } = require("node:child_process");
const ops = JSON.parse(
  execFileSync(
    "python",
    [
      "-c",
      "import json; from nexolineal.application.catalog import CATALOG; print(json.dumps([x.to_dict() for x in CATALOG.values()]))",
    ],
    { encoding: "utf8" },
  ),
);
let checks = 0;
function check(fn) {
  fn();
  checks++;
}
const spec = (id) => ops.find((o) => o.id === id),
  base = p.emptyProject();
base.name = "Álgebra sin pérdidas";
base.preferences = { mode: "explorador", theme: "oscuro" };
base.active = {
  ...base.active,
  inputs: {
    "matrices.producto": { A: "9007199254740993/2 0\n0 1", B: "1 0\n0 1" },
  },
  step: 2,
  stepsOpen: true,
  resumeResult: true,
};
base.objects = [
  {
    id: "base",
    name: "Base del plano",
    kind: "base",
    text: "1 0\n0 1",
    ambient: 2,
  },
];
base.history = [
  {
    id: "h1",
    date: new Date().toISOString(),
    operation: "matrices.producto",
    values: base.active.inputs["matrices.producto"],
    label: "Producto guardado",
    status: "ok",
    favorite: true,
  },
];
check(() =>
  assert.deepEqual(p.decodeProject(p.encodeProject(base), ops), base),
);
for (const mutate of [
  (x) => (x.version = 2),
  (x) => (x.format = "otro"),
  (x) => (x.preferences.theme = "auto"),
  (x) => (x.active.operation = "desconocida"),
  (x) => (x.active.step = -1),
  (x) => x.objects.push({ ...x.objects[0] }),
  (x) => (x.history[0].values.A = 9007199254740993),
  (x) => (x.history[0].date = "sin fecha"),
  (x) => (x.active.inputs["constructor"] = {}),
  (x) => (x.calculatedResult = { verification: { passed: true } }),
]) {
  const edited = structuredClone(base);
  mutate(edited);
  check(() =>
    assert.throws(() => p.decodeProject(JSON.stringify(edited), ops)),
  );
  check(() =>
    assert.equal(
      base.active.inputs["matrices.producto"].A,
      "9007199254740993/2 0\n0 1",
    ),
  );
}
check(() => assert.throws(() => p.decodeProject("{no-json}", ops)));
check(() =>
  assert.throws(() => p.decodeProject(" ".repeat(p.MAX_BYTES + 1), ops)),
);
check(() =>
  assert.deepEqual(
    v.validateFields(spec("matrices.transpuesta"), { A: "0 0;0 0" }),
    {},
  ),
);
check(() =>
  assert.match(
    v.validateFields(spec("matrices.transpuesta"), { A: "" }).A,
    /vacío no significa cero/,
  ),
);
check(() =>
  assert.match(
    v.validateFields(spec("matrices.transpuesta"), { A: "1 2;3" }).A,
    /fila 2/,
  ),
);
check(() =>
  assert.match(
    v.validateFields(spec("matrices.transpuesta"), { A: "1 □ 3" }).A,
    /columna 2/,
  ),
);
check(() =>
  assert.match(
    v.validateFields(spec("matrices.transpuesta"), { A: "1/0" }).A,
    /denominador cero/,
  ),
);
check(() =>
  assert.equal(v.normalizePaste("1\t\t3\r\n0\t2\t4"), "1 □ 3\n0 2 4"),
);
check(() =>
  assert.deepEqual(
    v.validateFields(spec("vectores.analizar"), {
      vectores: "[]",
      dimension_ambiente: "2",
    }),
    {},
  ),
);
check(() =>
  assert.match(
    v.validateFields(spec("conjuntos.operar"), {
      A: "a",
      operacion: "complemento",
      universo: "",
    }).universo,
    /Completá/,
  ),
);
check(() =>
  assert.deepEqual(
    v.validateFields(spec("conjuntos.operar"), {
      A: "a",
      B: "b",
      operacion: "union",
    }),
    {},
  ),
);
check(() => assert.ok(n.matches(spec("matrices.transpuesta"), "transpuesta")));
check(() => assert.ok(n.matches(spec("espacios.fundamentales"), "núcleo")));
check(() => assert.ok(n.matches(spec("raices.biseccion"), "biseccion")));
check(() => assert.ok(!n.matches(spec("matrices.producto"), "zzzzzz")));
check(() => assert.ok(p.supports("vectors", base.objects[0])));
check(() => assert.ok(!p.supports("matrix", base.objects[0])));
const full = {
  ...base,
  history: Array.from({ length: 100 }, (_, i) => ({
    ...base.history[0],
    id: "h" + i,
  })),
};
check(() =>
  assert.throws(() => p.addHistory(full, { ...base.history[0], id: "h101" })),
);
check(() => assert.equal(full.history.length, 100));
// Prueba el adaptador real con un proxy como Capacitor: cualquier «then» sería nativo.
async function nativeAdapters() {
  let thenReads = 0;
  let saved = null;
  const proxy = new Proxy(
    {},
    {
      get(_target, key) {
        if (key === "then") {
          thenReads++;
          return () => {};
        }
        return async (data) => {
          if (key === "load_state") return { content: saved };
          if (key === "save_state") {
            saved = data.content;
            return {};
          }
          if (key === "export_project") return { cancelled: false };
          if (key === "import_project") return { content: saved };
          throw new Error("Método inesperado: " + String(key));
        };
      },
    },
  );
  globalThis.__nexoNative = { registerPlugin: () => proxy };
  globalThis.window = { pywebview: { api: proxy } };
  for (const target of ["android", "windows"]) {
    let source = fs
      .readFileSync("apps/frontend/src/workspace/storage.ts", "utf8")
      .replace("import.meta.env.VITE_TARGET", JSON.stringify(target))
      .replace(
        'import("@capacitor/core")',
        "Promise.resolve(globalThis.__nexoNative)",
      );
    const file = path.join(dir, "storage-" + target + ".js");
    fs.writeFileSync(
      file,
      ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
        },
      }).outputText,
    );
    const storage = require(file);
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("El proxy nativo quedó pendiente: " + target)),
        1500,
      );
    });
    try {
      await Promise.race([
        (async () => {
          await storage.saveState("proyecto-" + target);
          check(() => assert.equal(saved, "proyecto-" + target));
          const restored = await storage.loadState();
          check(() => assert.equal(restored, saved));
          const exported = await storage.exportFile(saved);
          check(() => assert.equal(exported, true));
          const imported = await storage.importNativeFile();
          check(() => assert.equal(imported, saved));
          check(() => assert.equal(thenReads, 0));
        })(),
        deadline,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  delete globalThis.__nexoNative;
  delete globalThis.window;
}
async function main() {
  await nativeAdapters();
  const report = {
    approved: true,
    checks,
    operations: ops.length,
    format: "NexoLineal.Project",
    version: 1,
    native_adapters: ["android-proxy", "windows-proxy"],
  };
  fs.mkdirSync("evidencia-fase06", { recursive: true });
  fs.writeFileSync(
    "evidencia-fase06/estado.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => fs.rmSync(dir, { recursive: true, force: true }));
