// Navegador real, Worker Python y archivos exportados; no se dibujan respuestas simuladas.
const { chromium } = require("playwright");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { spawn, execFileSync } = require("node:child_process");
const dir = path.resolve("evidencia-fase07");
fs.mkdirSync(dir, { recursive: true });
const server = spawn(
  "python",
  [
    "-m",
    "http.server",
    "8087",
    "--bind",
    "127.0.0.1",
    "--directory",
    "apps/frontend/dist",
  ],
  { stdio: "ignore" },
);
const report = { approved: false, cases: [], a11y: [], errors: [] };
let browser, page;
function pass(name) {
  report.cases.push({ name, passed: true });
  console.log("NEXO_P7_UI_CASE=" + name);
}
async function calculate(status = "ok") {
  await page.locator("#calcular").click();
  await page.waitForFunction(
    () => !document.querySelector("#calcular").disabled,
    null,
    { timeout: 90000 },
  );
  assert.equal(
    await page.locator("#resultado").getAttribute("data-status"),
    status,
  );
}
async function choose(op, values = {}) {
  if (!(await page.locator("#operacion").isVisible()))
    await page.locator(".workspace-return").click();
  await page.locator("#operacion").selectOption(op);
  for (const [id, value] of Object.entries(values))
    await page.locator("#" + id).fill(value);
}
async function audit(label) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const r = await page.evaluate(() =>
    axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    }),
  );
  report.a11y.push({
    label,
    violations: r.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    passes: r.passes.length,
  });
  assert.deepEqual(
    r.violations.map((v) => v.id),
    [],
    label,
  );
}
async function download(selector, name) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const d = await pending;
  const file = path.join(dir, name);
  await d.saveAs(file);
  assert.equal(await d.failure(), null);
  return file;
}
(async () => {
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    });
    await context.route("**/*", (r) =>
      new URL(r.request().url()).hostname === "127.0.0.1"
        ? r.continue()
        : r.abort(),
    );
    page = await context.newPage();
    page.on("pageerror", (e) => report.errors.push(e.message));
    for (let i = 0; i < 30; i++) {
      try {
        await page.goto("http://127.0.0.1:8087");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    await page.waitForFunction(
      () =>
        document.querySelector("#calcular") &&
        !document.querySelector("#calcular").disabled,
      null,
      { timeout: 180000 },
    );
    await choose("sistemas.resolver", {
      "matriz-a": "1 1;1 -1",
      "dato-b": "3 1",
    });
    await calculate();
    assert.equal(
      await page
        .locator(".graph-panel [data-graph-kind]")
        .getAttribute("data-graph-kind"),
      "system",
    );
    assert.equal(
      await page.locator('[data-series="Ecuación 1"] polyline').count(),
      1,
    );
    await audit("sistema-2d-serio-claro");
    await page.screenshot({
      path: path.join(dir, "sistema-2d.png"),
      fullPage: true,
    });
    pass("Rectas y solución del sistema original con alternativa textual");
    await choose("sistemas.resolver", {
      "matriz-a": "1 1 1;1 -1 0;0 1 -1",
      "dato-b": "6 0 0",
    });
    await calculate();
    assert.equal(await page.locator(".math-graph polygon").count(), 3);
    const old = await page
      .locator(".math-graph polygon")
      .first()
      .getAttribute("points");
    await page.getByLabel("Giro de cámara", { exact: true }).fill("55");
    assert.notEqual(
      await page.locator(".math-graph polygon").first().getAttribute("points"),
      old,
    );
    await page.locator("#ampliar-grafica").click();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    await audit("planos-3d-dialogo");
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "ampliar-grafica",
    );
    pass("Planos 3D, cámara, ampliación, Escape y retorno del foco");
    await choose("vectores.proyeccion", { "dato-u": "2 3", "dato-v": "1 2" });
    await calculate();
    assert.ok(await page.locator('[data-series="proyeccion"]').count());
    assert.match(await page.locator("#resultado").innerText(), /ortogonal/i);
    const perpendicular = await page.evaluate(() => {
      const ends = (label) =>
        document
          .querySelector(`[data-series="${label}"] polyline`)
          .getAttribute("points")
          .split(" ")
          .map((p) => p.split(",").map(Number));
      const p = ends("proyeccion"),
        d = ends("componente ortogonal");
      const a = p[1].map((x, i) => x - p[0][i]),
        b = d[1].map((x, i) => x - d[0][i]);
      return (
        Math.abs(a[0] * b[0] + a[1] * b[1]) /
        (Math.hypot(...a) * Math.hypot(...b))
      );
    });
    assert.ok(
      perpendicular < 1e-10,
      "Los ejes espaciales deben conservar la perpendicularidad visible.",
    );
    pass("Proyección ortogonal disponible y representada");
    await choose("vectores.generado", {
      "dato-vectores": "1 1;1 -1",
      "dato-v": "3 1",
    });
    await calculate();
    assert.equal(
      await page
        .locator('[data-series="Reconstrucción del objetivo"] polyline')
        .count(),
      1,
    );
    await choose("transformaciones.analizar", { "matriz-a": "1 2;0 -1" });
    await calculate();
    assert.equal(
      await page
        .locator('[data-series="Cuadrícula transformada"] polyline')
        .count(),
      14,
    );
    pass("Cuadrícula transformada con segmentos rectos");
    for (const method of ["biseccion", "falsa_posicion", "newton", "secante"]) {
      await choose("raices." + method, { expresion: "x^2-2" });
      await calculate();
      assert.equal(
        await page.locator(".graph-content").getAttribute("data-graph-kind"),
        "roots",
      );
      assert.ok(
        await page
          .locator(".math-graph polyline")
          .evaluateAll((nodes) =>
            nodes.every(
              (n) => !/(NaN|Infinity)/.test(n.getAttribute("points")),
            ),
          ),
        "Todas las coordenadas racionales se dibujan como números finitos.",
      );
      const row = (await page.locator(".select-iteration").nth(1).count())
        ? 1
        : 0;
      await page.locator(".select-iteration").nth(row).click();
      assert.equal(await page.locator("#paso").inputValue(), String(row));
      assert.equal(
        await page.locator(".graph-content").getAttribute("data-frame-row"),
        String(row),
      );
      await page.locator(".frame-controls button").last().click();
      assert.equal(await page.locator("#paso").inputValue(), String(row + 1));
      assert.equal(
        await page
          .locator("tr[aria-selected=true]")
          .getAttribute("data-row-index"),
        String(row + 1),
      );
    }
    pass(
      "Bisección, falsa posición, Newton y secante sincronizan fila, paso y geometría",
    );
    await choose("raices.biseccion", {
      expresion: "x^2-2",
      inferior: "1",
      superior: "2",
    });
    await calculate();
    await page.locator("details.steps").evaluate((e) => (e.open = true));
    await page.locator("#paso").selectOption("12");
    assert.match(await page.locator(".table-pagination").innerText(), /11.*20/);
    assert.equal(
      await page
        .locator("tr[aria-selected=true]")
        .getAttribute("data-row-index"),
      "12",
    );
    const before = await page
      .locator(".graph-content")
      .getAttribute("data-frame-row");
    await page.locator("#modo-explorador").click();
    await page.locator("#tema-oscuro").click();
    assert.equal(
      await page.locator(".graph-content").getAttribute("data-frame-row"),
      before,
    );
    await audit("raiz-explorador-oscuro");
    pass("Paso seleccionado cambia página y se conserva al cambiar modo/tema");
    const responseFile = await download("#exportar", "resultado-raiz.json");
    const response = JSON.parse(fs.readFileSync(responseFile, "utf8"));
    const csvFile = await download("#exportar-csv", "tabla.csv");
    const pdfFile = await download("#exportar-pdf", "procedimiento.pdf");
    assert.equal(fs.readFileSync(pdfFile).subarray(0, 5).toString(), "%PDF-");
    execFileSync(
      "python",
      [
        "-c",
        `import csv,json,sys\nfrom pypdf import PdfReader\nr=json.load(open(sys.argv[1],encoding='utf8'))\nrows=list(csv.DictReader(open(sys.argv[2],encoding='utf-8-sig',newline='')))\nassert len(rows)==len(r['result']['tabla'])\nfor expected,actual in zip(r['result']['tabla'],rows):\n for key,value in expected.items():\n  assert actual[key]==('' if value is None else json.dumps(value,separators=(',',':'),ensure_ascii=False) if isinstance(value,(dict,list)) else str(value)),(key,value,actual[key])\npdf=PdfReader(sys.argv[3]); text='\\n'.join(p.extract_text() for p in pdf.pages)\nfor term in ['NexoLineal','biseccion','x^2-2','Paso 1','Comprobaciones',r['result']['aproximacion_decimal']]: assert term in text,term\nassert len(pdf.pages)>1\nprint('CSV: todas las filas y celdas; PDF: cabecera, páginas, función, procedimiento, resultado y comprobaciones.')`,
        responseFile,
        csvFile,
        pdfFile,
      ],
      { stdio: "inherit" },
    );
    pass(
      "CSV leído con csv y PDF leído con pypdf coinciden con el mismo resultado",
    );
    await choose("iterativos.jacobi", {
      "matriz-a": "4 1;1 3",
      "dato-b": "1 2",
    });
    await calculate();
    assert.equal(
      await page.locator(".graph-content").getAttribute("data-graph-kind"),
      "residual",
    );
    await page.locator(".select-iteration").nth(2).click();
    assert.equal(
      await page.locator(".graph-content").getAttribute("data-frame-row"),
      "2",
    );
    pass("Norma residual e iteración seleccionada sincronizadas");
    await page.locator("nav button[data-route=biblioteca]").click();
    assert.equal(
      await page.locator(".learning-library .theorem-card").count(),
      12,
    );
    await page.locator("[data-theorem=bolzano] summary").click();
    assert.match(
      await page.locator("[data-theorem=bolzano]").innerText(),
      /continuidad/i,
    );
    await audit("biblioteca-teoria-aplicaciones");
    for (const id of [
      "red",
      "quimica",
      "economia",
      "recursos",
      "poblaciones",
    ]) {
      if (!(await page.locator(".learning-library").isVisible()))
        await page.locator("nav button[data-route=biblioteca]").click();
      await page.locator(`[data-application=${id}] .load-application`).click();
      await page.waitForFunction(
        () => !document.querySelector("#calcular").disabled,
      );
      await page.locator(`.model-result[data-model-id=${id}]`).waitFor();
      assert.match(
        await page.locator(".model-result").innerText(),
        /verificadas/,
      );
    }
    pass(
      "Doce fichas con hipótesis y cinco modelos resueltos con unidades y restricciones",
    );
    await choose("raices.newton", {
      expresion: "1/x",
      "dato-inicial": "1",
      "dato-max_iteraciones": "3",
    });
    await calculate("iteration_limit");
    const discontinuous = JSON.parse(
      fs.readFileSync(
        await download("#exportar", "discontinuidad.json"),
        "utf8",
      ),
    ).metadata.visualization;
    assert.ok(discontinuous.sampling_gaps > 0);
    for (const s of discontinuous.series) {
      const xs = s.points.map((p) => {
        const [a, b] = String(p[0]).split("/").map(Number);
        return b === undefined ? a : a / b;
      });
      assert.ok(xs.every(Number.isFinite));
      assert.ok(!(Math.min(...xs) < 0 && Math.max(...xs) > 0));
    }
    pass(
      "Curva racional separada en la discontinuidad, sin unir a través del polo",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    );
    await audit("grafica-movil");
    await page.screenshot({
      path: path.join(dir, "raices-movil.png"),
      fullPage: true,
    });
    pass(
      "Gráfica, controles y tabla accesibles a 390 px sin desbordar la página",
    );
    assert.deepEqual(report.errors, []);
    report.approved = true;
  } catch (e) {
    report.error = e.stack;
    if (page)
      await page
        .screenshot({ path: path.join(dir, "fallo.png"), fullPage: true })
        .catch(() => {});
    throw e;
  } finally {
    fs.writeFileSync(
      path.join(dir, "ui.json"),
      JSON.stringify(report, null, 2),
    );
    console.log("NEXO_FASE07_UI_REPORT=" + JSON.stringify(report));
    if (browser) await browser.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
