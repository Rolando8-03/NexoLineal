// Ejecuta las conversiones de presentación y exportadores reales de TypeScript.
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  assert = require("node:assert/strict");
const ts = require(path.resolve("apps/frontend/node_modules/typescript"));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "nexo-datos07-"));
function moduleFrom(name) {
  let source = fs.readFileSync(
    "apps/frontend/src/exploration/" + name + ".ts",
    "utf8",
  );
  // Solo se sustituyen IO no utilizados en estas funciones puras; no se replica lógica.
  source = source
    .replace(
      /import \{ saveDocument \} from [^;]+;/,
      'const saveDocument = () => { throw new Error("IO no solicitado"); };',
    )
    .replace(
      /import fontUrl from [^;]+;/,
      'const fontUrl = "no-se-carga-en-pruebas-puras";',
    );
  const file = path.join(temporary, name + ".cjs");
  fs.writeFileSync(
    file,
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
  );
  return require(file);
}
let checks = 0;
function check(fn) {
  fn();
  checks++;
}
try {
  const { coordinate } = moduleFrom("geometry"),
    { tableCsv, procedureLines } = moduleFrom("exports");
  for (const [input, expected] of [
    ["1/2", 0.5],
    ["-9/4", -2.25],
    ["0/3", 0],
    ["1e-20", 1e-20],
    [3, 3],
    ["1" + "0".repeat(400) + "/" + ("2" + "0".repeat(400)), 0.5],
  ])
    check(() => assert.equal(coordinate(input), expected));
  for (const input of ["1/0", "not-a-number", "", {}, Infinity])
    check(() => assert.ok(!Number.isFinite(coordinate(input))));
  const rows = [
    { x: "9007199254740993/2", fx: "-1/3", formula: "=SUM(A1)" },
    { x: "1", fx: 'a,"b"\nc', vector: ["1/2", "3"] },
  ];
  const csv = tableCsv(rows);
  check(() =>
    assert.ok(csv.startsWith('\ufeff"x","fx","formula","vector"\r\n')),
  );
  check(() => assert.ok(csv.includes('"9007199254740993/2"')));
  check(() => assert.ok(csv.includes('"-1/3"')));
  check(() => assert.ok(csv.includes('"\'=SUM(A1)"')));
  check(() => assert.ok(csv.includes('"a,""b""\nc"')));
  check(() => assert.ok(csv.includes('"[""1/2"",""3""]"')));
  const response = {
    operation_id: "ejemplo",
    status: "ok",
    input: { x: "9007199254740993/2" },
    result: { tabla: rows },
    steps: [
      {
        description: "Conservar fracción",
        formula: "x=1/3",
        data: { x: "1/3" },
      },
    ],
    verification: { passed: true },
    warnings: ["La aproximación no sustituye el valor exacto."],
    metadata: {
      exact: true,
      visualization: { secret: "no-exportar-muestras" },
    },
    error: null,
  };
  const lines = procedureLines(response, "Ejercicio exacto").join("\n");
  check(() => assert.ok(lines.includes("9007199254740993/2")));
  check(() => assert.ok(lines.includes("Paso 1: Conservar fracción")));
  check(() => assert.ok(lines.includes("x=1/3")));
  check(() => assert.ok(lines.includes("Comprobaciones")));
  check(() => assert.ok(lines.includes("La aproximación no sustituye")));
  check(() => assert.ok(!lines.includes("no-exportar-muestras")));
  const report = {
    approved: true,
    checks,
    coordinate_conversion: "solo presentación",
    csv: "UTF-8 BOM; todas las columnas; escape RFC4180 y protección de fórmulas",
    pdf: "mismo resultado y procedimiento; lectura PDF en prueba de navegador",
  };
  fs.mkdirSync("evidencia-fase07", { recursive: true });
  fs.writeFileSync(
    "evidencia-fase07/datos.json",
    JSON.stringify(report, null, 2),
  );
  console.log("NEXO_FASE07_DATA_REPORT=" + JSON.stringify(report));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
