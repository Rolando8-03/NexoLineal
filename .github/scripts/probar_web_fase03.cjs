// Pruebas del frontend compilado y del Worker real, sin módulos matemáticos JS.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const root = process.cwd();
const output = path.join(root, "evidencia-fase03");
fs.mkdirSync(output, { recursive: true });
const cases = JSON.parse(
  fs.readFileSync(path.join(output, "platform-cases.json"), "utf8"),
);
const dist = path.join(root, "apps/frontend/dist");
const workerName = fs
  .readdirSync(path.join(dist, "assets"))
  .find((name) => name.startsWith("python-worker-") && name.endsWith(".js"));
assert.ok(workerName);
const server = spawn(
  "python",
  ["-m", "http.server", "8085", "--bind", "127.0.0.1", "--directory", dist],
  { stdio: "ignore" },
);
const report = { approved: false, cases: [], errors: [] };
(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await context.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      return host === "127.0.0.1" ? route.continue() : route.abort();
    });
    let failFirstManifest = true;
    await context.route("**/runtime/core-manifest.json", (route) => {
      if (failFirstManifest) {
        failFirstManifest = false;
        return route.fulfill({ status: 503, body: "Prueba de recuperación" });
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    let served = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        await page.goto("http://127.0.0.1:8085");
        served = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    assert.ok(served);
    await page.locator("#calcular").waitFor({ state: "visible" });
    await page
      .locator("#reintentar-motor")
      .waitFor({ state: "visible", timeout: 180000 });
    await page.locator("#reintentar-motor").click();
    report.cases.push({
      name: "recuperación tras fallo al cargar el motor",
      passed: true,
    });
    await page.waitForFunction(
      () => !document.querySelector("#calcular").disabled,
      null,
      { timeout: 180000 },
    );
    await page.locator("#calcular").click();
    await page.waitForFunction(
      () => document.querySelector("#resultado").dataset.status === "ok",
    );
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#exportar").click();
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    assert.deepEqual(exported.result.matrix, [["7"]]);
    await page.locator("#modo-explorador").click();
    assert.equal(
      await page.locator(".app").getAttribute("data-mode"),
      "explorador",
    );
    assert.match(await page.locator("#resultado").innerText(), /7/);
    await page.screenshot({
      path: path.join(output, "web-explorador.png"),
      fullPage: true,
    });
    await page.locator("#modo-serio").click();
    await page.screenshot({
      path: path.join(output, "web-serio.png"),
      fullPage: true,
    });
    report.cases.push({
      name: "interfaz, exportación y presentaciones",
      passed: true,
    });

    const responses = await page.evaluate(
      ({ workerPath, requests }) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(workerPath, { type: "module" });
          const responses = [];
          let current = 0;
          const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error("Tiempo del Worker agotado"));
          }, 180000);
          worker.onerror = (error) => {
            clearTimeout(timeout);
            worker.terminate();
            reject(new Error(error.message));
          };
          worker.onmessage = (event) => {
            const message = event.data;
            if (message.type === "failure") {
              clearTimeout(timeout);
              worker.terminate();
              reject(new Error(message.error));
              return;
            }
            if (message.type === "result") {
              responses.push(message.result);
              current++;
              if (current === requests.length) {
                clearTimeout(timeout);
                worker.terminate();
                resolve(responses);
                return;
              }
            }
            if (message.type === "ready" || message.type === "result") {
              worker.postMessage({
                type: "execute",
                id: String(current),
                problem: requests[current],
              });
            }
          };
          worker.postMessage({ type: "initialize", baseURL: location.href });
        }),
      {
        workerPath: "/assets/" + workerName,
        requests: cases.map((item) => item.request),
      },
    );
    for (let i = 0; i < cases.length; i++) {
      assert.deepEqual(responses[i], cases[i].expected);
      report.cases.push({
        name: cases[i].request.operation_id,
        response: responses[i],
        passed: true,
      });
    }

    // Los formularios se construyen con el mismo catálogo obtenido del motor.
    const uiCases = JSON.parse(
      fs.readFileSync(
        path.join(root, "tests/fixtures/fase05_defaults.json"),
        "utf8",
      ),
    );
    const ids = {
      A: "matriz-a",
      B: "matriz-b",
      expresion: "expresion",
      inferior: "inferior",
      superior: "superior",
      punto: "punto",
    };
    for (const mode of ["serio", "explorador"]) {
      await page.locator("#modo-" + mode).click();
      for (const request of uiCases) {
        await page.locator("#operacion").selectOption(request.operation_id);
        for (const [key, value] of Object.entries(request.input)) {
          const input = page.locator("#" + (ids[key] || "dato-" + key));
          if (!(await input.count()) || !(await input.isVisible())) continue;
          const tag = await input.evaluate((element) => element.tagName);
          let text = String(value);
          if (["indice", "otro"].includes(key))
            text = String(Number(value) + 1);
          if (tag === "SELECT") await input.selectOption(text);
          else await input.fill(text);
        }
        await page.locator("#calcular").click();
        await page.waitForFunction(
          () => !document.querySelector("#calcular").disabled,
        );
        assert.equal(
          await page.locator("#resultado").getAttribute("data-status"),
          "ok",
          request.operation_id,
        );
        const pendingDownload = page.waitForEvent("download");
        await page.locator("#exportar").click();
        const result = JSON.parse(
          fs.readFileSync(await (await pendingDownload).path(), "utf8"),
        );
        // El transporte conserva la solicitud generada por el formulario para contrastarla con Python.
        fs.writeFileSync(
          path.join(output, "ui-last-request.json"),
          JSON.stringify({
            schema_version: "1.0",
            operation_id: result.operation_id,
            input: result.input,
          }),
        );
        const { execFileSync } = require("node:child_process");
        const expected = JSON.parse(
          execFileSync(
            "python",
            [
              "-c",
              "import json; from nexolineal.application.service import execute; print(json.dumps(execute(json.load(open('evidencia-fase03/ui-last-request.json')))))",
            ],
            { cwd: root, encoding: "utf8" },
          ),
        );
        assert.deepEqual(result, expected);
      }
    }
    report.cases.push({
      name: uiCases.length + " formularios en Serio y Explorador",
      passed: true,
      operations: uiCases.length,
      modes: 2,
    });

    await page.locator("#operacion").selectOption("raices.biseccion");
    await page.locator("#calcular").click();
    await page.waitForFunction(
      () => document.querySelector("#resultado").dataset.status === "ok",
    );
    await page.locator(".table-pagination button").last().click();
    assert.match(
      await page.locator(".table-pagination").innerText(),
      /11[–-]20/,
    );
    await page.locator("#modo-serio").click();
    assert.match(
      await page.locator(".table-pagination").innerText(),
      /11[–-]20/,
    );
    assert.equal(await page.locator("#expresion").inputValue(), "x^2-2");
    await page.setViewportSize({ width: 390, height: 844 });
    if (
      !(await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ))
    )
      console.log(
        "NEXO_OVERFLOW=" +
          JSON.stringify(
            await page.evaluate(() =>
              [...document.querySelectorAll("*")]
                .filter(
                  (e) =>
                    e.getBoundingClientRect().right > innerWidth + 1 &&
                    getComputedStyle(e).display !== "none",
                )
                .map((e) => ({
                  tag: e.tagName,
                  cls: e.className,
                  id: e.id,
                  right: e.getBoundingClientRect().right,
                  width: e.getBoundingClientRect().width,
                }))
                .slice(0, 15),
            ),
          ),
      );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.locator(".iteration-table").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, "numerica-movil.png") });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(output, "numerica-serio.png") });
    await page.locator("#modo-explorador").click();
    await page.screenshot({
      path: path.join(output, "numerica-explorador.png"),
    });
    report.cases.push({
      name: "tabla numérica paginada, modo conservado y móvil sin desbordamiento",
      passed: true,
    });

    await page.locator("#operacion").selectOption("matrices.producto");
    await page.locator("#matriz-a").fill("1 2\n3 4");
    await page.locator("#matriz-b").fill("1 0\n0 1");
    await page.locator("#calcular").click();
    await page.waitForFunction(
      () => document.querySelector("#resultado").dataset.status === "ok",
    );
    await page.locator(".steps summary").click();
    await page.locator("#paso").selectOption("2");
    await page.locator("#modo-explorador").click();
    assert.equal(await page.locator("#paso").inputValue(), "2");
    await page.locator("#modo-serio").click();
    assert.equal(await page.locator("#paso").inputValue(), "2");
    report.cases.push({
      name: "cambio de presentación conserva el paso seleccionado",
      passed: true,
    });

    const row = Array(60)
      .fill("1/" + "9".repeat(180))
      .join(" ");
    const matrix = Array(60).fill(row).join("\n");
    await page.locator("#matriz-a").fill(matrix);
    await page.locator("#matriz-b").fill(matrix);
    await page.locator("#calcular").click();
    await page.locator("#cancelar").waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Inicio", exact: true }).click();
    await page.locator("#modo-explorador").click();
    assert.equal(
      await page.locator(".app").getAttribute("data-mode"),
      "explorador",
    );
    await page.locator("#cancelar").click();
    await page.waitForFunction(
      () => document.querySelector("#resultado").dataset.status === "cancelled",
    );
    await page.locator("#matriz-a").fill("2");
    await page.locator("#matriz-b").fill("3");
    await page.locator("#calcular").click();
    await page.waitForFunction(
      () => document.querySelector("#resultado").dataset.status === "ok",
      null,
      { timeout: 180000 },
    );
    const recoveryDownload = page.waitForEvent("download");
    await page.locator("#exportar").click();
    const recovered = JSON.parse(
      fs.readFileSync(await (await recoveryDownload).path(), "utf8"),
    );
    assert.deepEqual(recovered.result.matrix, [["6"]]);
    report.cases.push({
      name: "navegación durante cálculo, cancelación y recuperación",
      passed: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    if (
      !(await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ))
    )
      console.log(
        "NEXO_OVERFLOW=" +
          JSON.stringify(
            await page.evaluate(() =>
              [...document.querySelectorAll("*")]
                .filter(
                  (e) =>
                    e.getBoundingClientRect().right > innerWidth + 1 &&
                    getComputedStyle(e).display !== "none",
                )
                .map((e) => ({
                  tag: e.tagName,
                  cls: e.className,
                  id: e.id,
                  right: e.getBoundingClientRect().right,
                  width: e.getBoundingClientRect().width,
                }))
                .slice(0, 15),
            ),
          ),
      );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: path.join(output, "web-movil.png"),
      fullPage: true,
    });
    assert.deepEqual(report.errors, []);
    report.approved = true;
    console.log("NEXO_WEB_REPORT=" + JSON.stringify(report));
  } catch (error) {
    report.error = error.message;
    throw error;
  } finally {
    fs.writeFileSync(
      path.join(output, "web.json"),
      JSON.stringify(report, null, 2),
    );
    await browser.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  server.kill();
  process.exitCode = 1;
});
