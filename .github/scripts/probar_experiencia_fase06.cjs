// Recorridos reales de navegación, datos, persistencia y accesibilidad en Chromium.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const { spawn } = require("node:child_process");
const output = path.resolve("evidencia-fase06");
fs.mkdirSync(output, { recursive: true });
const server = spawn(
  "python",
  [
    "-m",
    "http.server",
    "8086",
    "--bind",
    "127.0.0.1",
    "--directory",
    "apps/frontend/dist",
  ],
  { stdio: "ignore" },
);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "nexo-browser06-"));
const cases = [],
  errors = [],
  a11y = [];
let context, page, extraBrowser;
const report = { approved: false, cases, errors, a11y };
function pass(name, details = {}) {
  cases.push({ name, passed: true, ...details });
  console.log("NEXO_UI_CASE=" + name);
}
async function connect() {
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 1440, height: 1000 },
  });
  await context.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1"
      ? r.continue()
      : r.abort(),
  );
  page = context.pages()[0] || (await context.newPage());
  page.on("pageerror", (e) => errors.push(e.message));
  let ok = false;
  for (let i = 0; i < 30; i++) {
    try {
      await page.goto("http://127.0.0.1:8086");
      ok = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  assert.ok(ok);
  await page.waitForFunction(
    () =>
      document.querySelector("#calcular") &&
      !document.querySelector("#calcular").disabled,
    null,
    { timeout: 180000 },
  );
}
async function navigate(name) {
  await page.locator("nav button").filter({ hasText: name }).click();
}
async function choose(id) {
  if (!(await page.locator("#operacion").isVisible()))
    await page.locator(".workspace-return").click();
  await page.locator("#operacion").selectOption(id);
}
async function calculate() {
  await page.locator("#calcular").click();
  await page.waitForFunction(
    () => !document.querySelector("#calcular").disabled,
  );
  assert.equal(
    await page.locator("#resultado").getAttribute("data-status"),
    "ok",
  );
}
async function exportedResult() {
  const promise = page.waitForEvent("download");
  await page.locator("#exportar").click();
  return JSON.parse(fs.readFileSync(await (await promise).path(), "utf8"));
}
async function saveInput(id, name) {
  await page
    .locator("#" + id)
    .locator("..")
    .locator(".save-input")
    .click();
  await page.locator("#object-name").fill(name);
  await page.locator("#confirmar-objeto").click();
  await page.locator("dialog").waitFor({ state: "detached" });
}
async function paste(text) {
  await page.locator("#matriz-a").evaluate((el, text) => {
    el.focus();
    el.setSelectionRange(0, el.value.length);
    const data = new DataTransfer();
    data.setData("text/plain", text);
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
  }, text);
}
async function axe(label) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const result = await page.evaluate(async () => {
    const r = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
      },
    });
    return {
      violations: r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      passes: r.passes.length,
    };
  });
  a11y.push({ label, ...result });
  assert.deepEqual(
    result.violations,
    [],
    label + ": " + JSON.stringify(result.violations),
  );
}
(async () => {
  try {
    await connect();
    assert.equal(await page.locator("nav button").count(), 10);
    const inventory = await page
      .locator("#operacion option")
      .evaluateAll((els) => els.map((e) => e.value));
    assert.equal(inventory.length, 56);
    for (const area of [
      "Sistemas",
      "Matrices",
      "Determinantes e inversas",
      "Vectores y espacios",
      "Transformaciones",
      "Métodos numéricos",
      "Herramientas",
    ]) {
      await navigate(area);
      assert.ok(await page.locator(".operation-choice").count());
      assert.ok(await page.locator(".active-problem").isVisible());
    }
    await navigate("Historial y proyectos");
    assert.ok(await page.locator("#project-name").isVisible());
    await navigate("Biblioteca y ayuda");
    assert.ok(await page.locator("#buscar-objetos").isVisible());
    pass("10 destinos reales y catálogo de 56 operaciones");
    await page.keyboard.press("Control+k");
    assert.equal(
      await page
        .locator("#buscar-operaciones")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await page.locator("#buscar-operaciones").fill("transpuesta");
    assert.ok(
      await page
        .locator(".operation-choice")
        .filter({ hasText: "Transponer" })
        .count(),
    );
    await page
      .locator(".operation-choice")
      .filter({ hasText: "Transponer" })
      .first()
      .click();
    assert.equal(await page.locator("#matriz-b").count(), 0);
    pass("Buscador matemático con atajo y formulario mínimo de transpuesta");
    await page.locator("#matriz-a").fill("");
    await page.locator("#calcular").click();
    assert.equal(
      await page.locator("#matriz-a").getAttribute("aria-invalid"),
      "true",
    );
    assert.match(
      await page.locator("#matriz-a-error").innerText(),
      /vacío no significa cero/,
    );
    assert.ok(
      await page
        .locator("#matriz-a")
        .evaluate((e) => e === document.activeElement),
    );
    await page.locator("#matriz-a").fill("0 0\n0 0");
    await calculate();
    assert.deepEqual((await exportedResult()).result.matrix, [
      ["0", "0"],
      ["0", "0"],
    ]);
    pass("Vacío y cero distintos, error localizado y foco correcto");
    await paste("1\t\t3\r\n0\t2\t4");
    await page.locator("#calcular").click();
    assert.match(
      await page.locator("#matriz-a-error").innerText(),
      /columna 2/,
    );
    assert.equal(await page.locator("#matriz-a").inputValue(), "1 □ 3\n0 2 4");
    await paste("1\t2\n3\t4");
    assert.equal(await page.locator("#matriz-a").inputValue(), "1 2\n3 4");
    assert.match(
      await page
        .locator("#matriz-a")
        .locator("..")
        .locator(".field-heading")
        .innerText(),
      /2 × 2/,
    );
    await calculate();
    pass("Pegado TSV conserva celdas vacías e infiere dimensiones");
    const big = "9007199254740993/2 0\n0 1";
    await page.locator("#matriz-a").fill(big);
    await calculate();
    await saveInput("matriz-a", "Mi matriz exacta");
    assert.ok(
      await page
        .locator(".save-input")
        .first()
        .evaluate((e) => e === document.activeElement),
    );
    await choose("matrices.producto");
    const objectId = await page
      .locator("#matriz-a-reuse option")
      .filter({ hasText: "Mi matriz exacta" })
      .getAttribute("value");
    await page.locator("#matriz-a-reuse").selectOption(objectId);
    await page.locator("#matriz-b").fill("1 0\n0 1");
    await calculate();
    const original = await exportedResult();
    assert.equal(original.result.matrix[0][0], "9007199254740993/2");
    pass("Objeto matriz reutilizado sin transcripción ni pérdida de fracción");
    await choose("espacios.fundamentales");
    await page.locator("#matriz-a").fill("1 2\n0 1");
    await calculate();
    await page.locator(".reuse-results summary").click();
    await page
      .locator(".reuse-results button")
      .filter({ hasText: "Base del espacio columna" })
      .click();
    await page.locator("#object-name").fill("Base del plano");
    await page.locator("#confirmar-objeto").click();
    await page.locator("dialog").waitFor({ state: "detached" });
    await choose("espacios.coordenadas");
    const baseId = await page
      .locator("#dato-base-reuse option")
      .filter({ hasText: "Base del plano" })
      .getAttribute("value");
    await page.locator("#dato-base-reuse").selectOption(baseId);
    await page.locator("#dato-v").fill("3 1");
    await calculate();
    assert.deepEqual((await exportedResult()).result.coordenadas, ["1", "1"]);
    pass(
      "Base calculada reutilizada para coordenadas en la orientación correcta",
    );
    await choose("raices.biseccion");
    await saveInput("expresion", "Función reutilizable");
    await choose("funciones.evaluar");
    const functionId = await page
      .locator("#expresion-reuse option")
      .filter({ hasText: "Función reutilizable" })
      .getAttribute("value");
    await page.locator("#expresion-reuse").selectOption(functionId);
    await page.locator("#punto").fill("2");
    await calculate();
    assert.equal((await exportedResult()).result.valor, "2");
    pass("Función reutilizable en otra operación");
    await choose("matrices.producto");
    await calculate();
    await page.locator(".steps summary").click();
    await page.locator("#paso").selectOption("2");
    const before = await exportedResult();
    for (const mode of ["serio", "explorador"])
      for (const theme of ["claro", "oscuro"]) {
        await page.locator("#modo-" + mode).click();
        await page.locator("#tema-" + theme).click();
        assert.equal(
          await page.locator(".app").getAttribute("data-mode"),
          mode,
        );
        assert.equal(
          await page.locator(".app").getAttribute("data-theme"),
          theme,
        );
        assert.equal(await page.locator("#paso").inputValue(), "2");
        assert.equal(await page.locator("#matriz-a").inputValue(), big);
        assert.deepEqual(
          await page
            .locator("#operacion option")
            .evaluateAll((els) => els.map((e) => e.value)),
          inventory,
        );
        assert.deepEqual(await exportedResult(), before);
        await axe(mode + "-" + theme);
      }
    pass(
      "Paridad de 56 operaciones, resultado y paso en cuatro combinaciones de modo y tema",
    );
    await navigate("Historial y proyectos");
    await page.locator("#project-name").fill("Álgebra portátil");
    await page.locator(".favorite-button").first().click();
    await page.locator("#solo-favoritos").check();
    assert.equal(await page.locator(".history-entry").count(), 1);
    await page.locator("#buscar-historial").fill("Producto");
    assert.equal(await page.locator(".history-entry").count(), 1);
    await page.locator("#buscar-historial").fill("zzzz");
    assert.equal(await page.locator(".history-entry").count(), 0);
    await page.locator("#buscar-historial").fill("");
    await page.locator("#solo-favoritos").uncheck();
    pass("Historial, búsqueda y favoritos persistibles");
    const exportPromise = page.waitForEvent("download");
    await page.locator("#exportar-proyecto").click();
    const projectText = fs.readFileSync(
      await (await exportPromise).path(),
      "utf8",
    );
    const project = JSON.parse(projectText);
    assert.equal(project.format, "NexoLineal.Project");
    assert.equal(project.version, 1);
    assert.equal(project.active.step, 2);
    assert.equal(project.active.inputs["matrices.producto"].A, big);
    assert.ok(project.history.some((h) => h.favorite));
    assert.equal(project.objects.length, 3);
    assert.ok(!("result" in project.active));
    fs.writeFileSync(path.join(output, "proyecto-ejemplo.json"), projectText);
    pass("Exportación de proyecto JSON versionado con valores exactos");
    await page.locator("#abrir-json").click();
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () =>
            Promise.reject(new Error("Permiso denegado de prueba")),
        },
      }),
    );
    await page
      .getByRole("button", { name: "Copiar JSON", exact: true })
      .click();
    assert.ok(
      await page
        .locator("#project-json")
        .evaluate(
          (e) =>
            e === document.activeElement &&
            e.selectionStart === 0 &&
            e.selectionEnd === e.value.length,
        ),
    );
    pass(
      "Portapapeles no disponible: JSON enfocado y seleccionado para copia manual",
    );
    await page
      .locator("#project-json")
      .fill(JSON.stringify({ ...project, version: 2 }));
    await page.locator("#importar-json").click();
    assert.match(
      await page.locator("dialog .error").innerText(),
      /versión incompatibles/,
    );
    assert.equal(
      await page.locator(".save-strip>span").first().innerText(),
      "Álgebra portátil",
    );
    await page
      .getByRole("button", { name: "Cerrar diálogo", exact: true })
      .click();
    pass("Proyecto incompatible rechazado sin reemplazar el trabajo");
    await page.locator("#nuevo-proyecto").click();
    await page.locator("#confirmar-nuevo").click();
    await navigate("Historial y proyectos");
    assert.equal(await page.locator(".history-entry").count(), 0);
    await page.locator("#importar-proyecto").setInputFiles({
      name: "proyecto.json",
      mimeType: "application/json",
      buffer: Buffer.from(projectText),
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#resultado").dataset.status === "ok" &&
        !document.querySelector("#calcular").disabled,
    );
    assert.equal(await page.locator("#paso").inputValue(), "2");
    assert.deepEqual(await exportedResult(), before);
    pass("Importación restaura trabajo y paso, recalculando el resultado");
    await navigate("Historial y proyectos");
    await page.locator(".edit-history").first().click();
    assert.equal(await page.locator("#matriz-a").inputValue(), big);
    assert.equal(
      await page.locator("#resultado").getAttribute("data-status"),
      "idle",
    );
    await calculate();
    await page.locator(".steps summary").click();
    await page.locator("#paso").selectOption("2");
    await page.keyboard.press("Control+s");
    await page.waitForFunction(() => {
      const p = JSON.parse(localStorage.getItem("nexolineal.project.v1"));
      return (
        p.active.step === 2 &&
        p.name === "Álgebra portátil" &&
        document
          .querySelector("#estado-guardado")
          .textContent.startsWith("Guardado en")
      );
    });
    await context.close();
    context = null;
    await connect();
    assert.equal(await page.locator("#matriz-a").inputValue(), big);
    assert.equal(await page.locator("#paso").inputValue(), "2");
    assert.equal(
      await page.locator(".app").getAttribute("data-mode"),
      "explorador",
    );
    assert.equal(
      await page.locator(".app").getAttribute("data-theme"),
      "oscuro",
    );
    assert.deepEqual(await exportedResult(), before);
    await navigate("Biblioteca y ayuda");
    assert.equal(await page.locator(".object-card").count(), 3);
    await navigate("Historial y proyectos");
    assert.ok(
      await page.locator(".favorite-button[aria-pressed=true]").count(),
    );
    pass(
      "Cierre y reapertura de Chromium conserva objetos, favoritos, problema y paso",
    );
    const entries = await page.locator(".history-entry").count();
    await page.locator(".repeat-history").first().click();
    await page.waitForFunction(
      () =>
        document.querySelector("#resultado").dataset.status === "ok" &&
        !document.querySelector("#calcular").disabled,
    );
    await navigate("Historial y proyectos");
    assert.equal(await page.locator(".history-entry").count(), entries + 1);
    pass("Editar y repetir son recorridos diferentes y funcionales");
    await navigate("Biblioteca y ayuda");
    await axe("biblioteca");
    await navigate("Historial y proyectos");
    await axe("historial");
    await navigate("Inicio");
    for (const mode of ["serio", "explorador"])
      for (const theme of ["claro", "oscuro"]) {
        await page.locator("#modo-" + mode).click();
        await page.locator("#tema-" + theme).click();
        await page.screenshot({
          path: path.join(output, "inicio-" + mode + "-" + theme + ".png"),
        });
      }
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page
        .locator(".astronaut")
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    pass("Movimiento reducido elimina las animaciones decorativas");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#menu-toggle").click();
    await page.locator(".sidebar .brand").focus();
    await page.keyboard.press("Shift+Tab");
    assert.ok(
      await page
        .locator('nav button[data-route="biblioteca"]')
        .evaluate((e) => e === document.activeElement),
    );
    await page.keyboard.press("Tab");
    assert.ok(
      await page
        .locator(".sidebar .brand")
        .evaluate((e) => e === document.activeElement),
    );
    assert.equal(
      await page.locator("#menu-toggle").getAttribute("aria-expanded"),
      "true",
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    assert.ok(
      await page
        .locator("#menu-toggle")
        .evaluate((e) => e === document.activeElement),
    );
    await page.locator("#menu-toggle").click();
    await page.locator('nav button[data-route="historial"]').click();
    assert.ok(await page.locator("#project-name").isVisible());
    assert.ok(
      await page
        .locator("#history-title")
        .evaluate((e) => e === document.activeElement),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: path.join(output, "historial-movil.png") });
    await axe("movil-historial");
    await page.locator("#menu-toggle").click();
    await page.locator('nav button[data-route="inicio"]').click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: path.join(output, "inicio-movil.png") });
    pass("Menú táctil, Escape, retorno de foco y ancho móvil de 390 px");
    extraBrowser = await chromium.launch();
    const quota = await extraBrowser.newContext();
    await quota.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException("Cuota agotada", "QuotaExceededError");
      };
    });
    const q = await quota.newPage();
    await q.goto("http://127.0.0.1:8086");
    await q.waitForFunction(
      () => !document.querySelector("#calcular").disabled,
      null,
      { timeout: 180000 },
    );
    await q.locator("#matriz-a").fill("7");
    await q.waitForFunction(() =>
      document
        .querySelector("#estado-guardado")
        .textContent.includes("No se pudo guardar"),
    );
    assert.equal(await q.locator("#matriz-a").inputValue(), "7");
    await quota.close();
    pass("Fallo de almacenamiento visible sin borrar la entrada activa");
    const corrupt = await extraBrowser.newContext();
    await corrupt.addInitScript(() =>
      localStorage.setItem("nexolineal.project.v1", '{"version":999}'),
    );
    const c = await corrupt.newPage();
    await c.goto("http://127.0.0.1:8086");
    await c.waitForFunction(
      () => !document.querySelector("#calcular").disabled,
      null,
      { timeout: 180000 },
    );
    await c.locator("#matriz-a").fill("8");
    await c.waitForTimeout(500);
    assert.equal(
      await c.evaluate(() => localStorage.getItem("nexolineal.project.v1")),
      '{"version":999}',
    );
    await corrupt.close();
    pass("Guardado incompatible conservado sin sobrescritura automática");
    assert.deepEqual(errors, []);
    report.approved = true;
    console.log(
      JSON.stringify({
        approved: true,
        cases: cases.length,
        a11y: a11y.map((x) => ({
          label: x.label,
          violations: x.violations.length,
          passes: x.passes,
        })),
      }),
    );
  } catch (error) {
    report.error = error.stack;
    try {
      if (page && !page.isClosed())
        await page.screenshot({
          path: path.join(output, "fallo.png"),
          fullPage: true,
        });
    } catch {}
    console.error(error);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(
      path.join(output, "ui.json"),
      JSON.stringify(report, null, 2),
    );
    if (context) await context.close();
    if (extraBrowser) await extraBrowser.close();
    server.kill();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})();
