// Prueba el artefacto real bajo la ruta de GitHub Pages, con Chromium persistente.
const { chromium } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  os = require("node:os");
const root = path.resolve("apps/frontend/dist"),
  out = path.resolve("evidencia-fase08");
fs.mkdirSync(out, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "nexo08-"));
let server,
  context,
  page,
  override = null,
  bad = false;
const cases = [];
const report = {
  approved: false,
  platform: process.platform,
  architecture: process.arch,
  cases,
  source: JSON.parse(fs.readFileSync(path.join(root, "version.json"))),
};
function pass(name, detail = {}) {
  cases.push({ name, passed: true, ...detail });
  console.log("NEXO_DISTRIBUTION_CASE=" + name);
}
async function start() {
  server = http.createServer((req, res) => {
    let file = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (!file.startsWith("/NexoLineal/")) {
      res.writeHead(404).end();
      return;
    }
    file = file.slice("/NexoLineal/".length) || "index.html";
    const dest = path.resolve(root, file);
    if (!dest.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    if (file === "sw.js" && override) {
      res.setHeader("Content-Type", "text/javascript");
      res.setHeader("Cache-Control", "no-store");
      res.end(override);
      return;
    }
    if (bad && file === "icon.svg") {
      res.writeHead(503).end();
      return;
    }
    try {
      const mime = {
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".wasm": "application/wasm",
        ".json": "application/json",
        ".html": "text/html",
        ".css": "text/css",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
      };
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-store");
      res.end(fs.readFileSync(dest));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(8088, "127.0.0.1", r));
  return "http://127.0.0.1:" + server.address().port + "/NexoLineal/";
}
async function open(url) {
  context = await chromium.launchPersistentContext(profile, { headless: true });
  page = context.pages()[0];
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  console.log("Opening", url);
  await page.goto(url);
  console.log("Opened");
  await ready();
  console.log("Engine ready");
}
async function ready() {
  await page.waitForFunction(
    () =>
      document.querySelector("#calcular") &&
      !document.querySelector("#calcular").disabled,
    null,
    { timeout: 180000 },
  );
}
async function result() {
  await page.locator("#calcular").click();
  await ready();
  assert.equal(
    await page.locator("#resultado").getAttribute("data-status"),
    "ok",
  );
}
(async () => {
  try {
    console.log("Starting local server");
    const url = await start();
    console.log("Server ready", url);
    const began = performance.now();
    await open(url);
    report.startup_ms = performance.now() - began;
    await result();
    pass("Ruta /NexoLineal/ y cálculo con Worker Python");
    const client = await context.newCDPSession(page);
    await client.send("Performance.enable");
    const installability = await client.send("Page.getInstallabilityErrors");
    report.installability = installability.installabilityErrors;
    assert.deepEqual(report.installability, []);
    pass("Manifiesto instalable reconocido por Chromium");
    await page.locator("#preparar-offline").click();
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      null,
      { timeout: 180000 },
    );
    await page.waitForFunction(() =>
      document
        .querySelector("#offline-status")
        .textContent.includes("Disponible sin conexión"),
    );
    pass("Descarga íntegra con hashes antes de activación");
    const data = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open("nexolineal.workspace", 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("projects");
        const r = tx.objectStore("projects").get("active");
        tx.oncomplete = () => {
          db.close();
          resolve(r.result);
        };
        tx.onerror = () => reject(tx.error);
      });
    });
    assert.equal(JSON.parse(data).format, "NexoLineal.Project");
    fs.writeFileSync(path.join(out, "proyecto-web.json"), data);
    // Una segunda sesión migra el documento portable exportado desde la web.
    const migration = await context.browser().newContext();
    await migration.addInitScript((raw) => {
      if (!localStorage.getItem("nexo08-seeded")) {
        localStorage.setItem("nexolineal.project.v1", raw);
        localStorage.setItem("nexo08-seeded", "1");
      }
    }, data);
    const migrated = await migration.newPage();
    await migrated.goto(url);
    await migrated.waitForFunction(
      () =>
        document.querySelector("#calcular") &&
        !document.querySelector("#calcular").disabled,
      null,
      { timeout: 180000 },
    );
    assert.equal(
      await migrated.evaluate(() =>
        localStorage.getItem("nexolineal.project.v1"),
      ),
      data,
    );
    const migratedRaw = await migrated.evaluate(async () => {
      const db = await new Promise((resolve) => {
        const r = indexedDB.open("nexolineal.workspace", 1);
        r.onsuccess = () => resolve(r.result);
      });
      return new Promise((resolve) => {
        const t = db.transaction("projects");
        const r = t.objectStore("projects").get("active");
        t.oncomplete = () => {
          db.close();
          resolve(r.result);
        };
      });
    });
    assert.equal(
      JSON.parse(migratedRaw).active.operation,
      JSON.parse(data).active.operation,
    );
    await migration.close();
    pass("Migración localStorage a IndexedDB conserva el documento original");
    pass("Proyecto confirmado en IndexedDB");
    // Volver a abrir el proceso de Chromium, antes de desconectar la red.
    await context.close();
    await open(url);
    await context.setOffline(true);
    await page.reload();
    await ready();
    const calc = performance.now();
    await result();
    report.calculation_offline_ms = performance.now() - calc;
    await page.screenshot({
      path: path.join(out, "web-offline.png"),
      fullPage: true,
    });
    pass("Cierre del navegador, reapertura, recarga y cálculo sin red");
    const memorySession = await context.newCDPSession(page);
    await memorySession.send("Performance.enable");
    const metrics = await memorySession.send("Performance.getMetrics");
    report.chromium_metrics = metrics.metrics;
    report.chromium_version =
      context.browser()?.version() || "persistent Chromium";
    await context.setOffline(false);
    // Una actualización incompleta no reemplaza la versión operativa.
    const original = fs.readFileSync(path.join(root, "sw.js"), "utf8");
    override = original.replace(
      report.source.build_id,
      report.source.build_id + "-failed",
    );
    bad = true;
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r.update();
    });
    await page.waitForFunction(
      async () => {
        const r = await navigator.serviceWorker.getRegistration();
        return !r.installing;
      },
      null,
      { timeout: 180000 },
    );
    assert.equal(
      await page.evaluate(
        async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
      ),
      false,
    );
    await context.setOffline(true);
    await page.reload();
    await ready();
    await result();
    pass("Actualización fallida conserva versión y datos anteriores");
    await context.setOffline(false);
    bad = false;
    override = original.replace(
      report.source.build_id,
      report.source.build_id + "-update",
    );
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r.update();
    });
    await page.waitForFunction(
      async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
      null,
      { timeout: 180000 },
    );
    const old = await page.evaluate(
      () => navigator.serviceWorker.controller.scriptURL,
    );
    await page.reload();
    await ready();
    assert.equal(
      await page.evaluate(
        async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
      ),
      true,
    );
    pass("Actualización completa espera al cierre de las pestañas");
    await page.goto("about:blank");
    await context.close();
    await open(url);
    await page.waitForFunction(
      async () => !(await navigator.serviceWorker.getRegistration()).waiting,
    );
    await context.setOffline(true);
    await page.reload();
    await ready();
    await result();
    const content = await page.evaluate(async () => {
      const db = await new Promise((r) => {
        const q = indexedDB.open("nexolineal.workspace", 1);
        q.onsuccess = () => r(q.result);
      });
      return new Promise((r) => {
        const q = db
          .transaction("projects")
          .objectStore("projects")
          .get("active");
        q.onsuccess = () => {
          db.close();
          r(q.result);
        };
      });
    });
    assert.ok(JSON.parse(content).history.length >= 1);
    pass("Nueva versión activa offline conserva historial");
    const pre = JSON.parse(fs.readFileSync(path.join(root, "precache.json")));
    report.offline_resources = pre.files.length;
    report.offline_bytes = pre.files.reduce((n, f) => n + f.bytes, 0);
    report.approved = true;
  } catch (error) {
    report.error = error.stack;
    process.exitCode = 1;
  } finally {
    if (context) await context.close();
    if (server) await new Promise((r) => server.close(r));
    fs.rmSync(profile, { recursive: true, force: true });
    fs.writeFileSync(
      path.join(out, "web-distribucion.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("NEXO_WEB_DISTRIBUTION_REPORT=" + JSON.stringify(report));
    console.log(
      JSON.stringify({
        approved: report.approved,
        cases: cases.length,
        error: report.error,
      }),
    );
  }
})();
