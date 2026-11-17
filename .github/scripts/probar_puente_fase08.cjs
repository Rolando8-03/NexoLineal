// Reproduce el puente parcial observado durante una reapertura real de WebView2.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const ts = require(path.resolve("apps/frontend/node_modules/typescript"));
function load(file, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      setTimeout,
      setInterval,
      clearInterval,
      ...globals,
    },
  );
  return module.exports;
}
(async () => {
  const window = { pywebview: { api: {} } };
  const bridge = load("apps/frontend/src/nativeBridge.ts", { window });
  let settled = false;
  const waiting = bridge
    .waitForWindowsMethods(["prepare", "execute", "cancel", "progress"])
    .then((v) => {
      settled = true;
      return v;
    });
  await new Promise((r) => setTimeout(r, 65));
  assert.equal(settled, false);
  const api = window.pywebview.api;
  api.prepare = async () => ({ ready: true });
  await new Promise((r) => setTimeout(r, 65));
  assert.equal(settled, false);
  Object.assign(api, {
    execute: async () => ({
      response: { status: "ok", result: { value: "7" } },
    }),
    cancel: async () => ({ cancelled: true }),
    progress: async () => ({ progress: 0 }),
  });
  assert.equal((await waiting).api, api);
  const { NativeEngine } = load("apps/frontend/src/adapters/native.ts", {
    window,
    require: (name) =>
      name === "@capacitor/core"
        ? { Capacitor: { isNativePlatform: () => false } }
        : name.includes("nativeBridge")
          ? bridge
          : { requestId: () => "late-bridge" },
  });
  const engine = new NativeEngine();
  assert.equal((await engine.execute({})).result.value, "7");
  // El transporte de archivos tampoco se anuncia antes de completar su contrato.
  let filesReady = false;
  const files = bridge
    .waitForWindowsMethods(["load_state", "save_state"])
    .then(() => (filesReady = true));
  await new Promise((r) => setTimeout(r, 65));
  assert.equal(filesReady, false);
  api.load_state = async () => ({ content: null });
  api.save_state = async () => ({ saved: true });
  await files;
  assert.equal(filesReady, true);
  const absent = load("apps/frontend/src/nativeBridge.ts", {
    window: {},
    setTimeout: (fn) => queueMicrotask(fn),
  });
  await assert.rejects(
    absent.waitForWindowsMethods(["prepare"]),
    /puente de Windows no está listo/,
  );
  console.log(
    JSON.stringify({
      approved: true,
      cases: 5,
      partial_bridge: true,
      ready_event_required: false,
      timeout_recoverable: true,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
