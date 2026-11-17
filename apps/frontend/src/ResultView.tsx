import { IterationSelection } from "./exploration/selection";
import { useState, useContext, useEffect } from "react";
import katex from "katex";
import type { Step } from "./contracts";

export function rationalTex(value: string): string {
  const f = value.match(/^(-?)([0-9]+)\/([0-9]+)$/);
  if (f) return `${f[1]}\\frac{${f[2]}}{${f[3]}}`;
  const scientific = value.match(/^(-?[0-9.]+)[eE]([+-]?[0-9]+)$/);
  if (scientific) return `${scientific[1]}\\times 10^{${scientific[2]}}`;
  const radical = value.match(/^sqrt\(([-0-9/]+)\)$/);
  return radical ? `\\sqrt{${rationalTex(radical[1])}}` : value;
}
export function Formula({ tex }: { tex: string }) {
  return (
    <div
      className="formula"
      tabIndex={0}
      role="region"
      aria-label="Fórmula matemática desplazable"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, {
          displayMode: true,
          throwOnError: false,
          trust: false,
          maxExpand: 1000,
        }),
      }}
    />
  );
}
function matrixTex(matrix: string[][]): string {
  return (
    "\\begin{pmatrix}" +
    matrix.map((row) => row.map(rationalTex).join("&")).join("\\\\") +
    "\\end{pmatrix}"
  );
}
const labels: Record<string, string> = {
  matrix: "Matriz resultado",
  iteracion: "Iteración",
  x_decimal: "xₖ (decimal redondeado)",
  fx: "f(xₖ)",
  aproximacion_decimal: "Aproximación decimal (14 cifras, redondeada)",
  aproximacion: "Aproximación utilizada por el método",
  cota_decimal: "Cota que incluye el redondeo del decimal mostrado",
  convergencia: "¿Se satisfizo el criterio?",
  motivo_parada: "Motivo de parada",
  residual: "Residual (distinto del error verdadero)",
  error_verdadero: "Error verdadero (requiere referencia)",
  cota_garantizada: "Cota garantizada, cuando existe",
  tabla: "Tabla de iteraciones",
  error_aproximado_absoluto: "Cambio absoluto entre aproximaciones",
  particular: "Solución particular xp",
  direcciones: "Direcciones de la solución",
  familia: "Familia de soluciones",
  clasificacion: "Clasificación",
  valor: "Valor",
  vector: "Vector resultado",
  base_columna: "Base del espacio columna",
  base_fila: "Base del espacio fila",
  base_nucleo: "Base del núcleo",
  base_imagen: "Base de la imagen",
  base_generado: "Base del generado",
  base_suma: "Base de la suma",
  base_interseccion: "Base de la intersección",
  relaciones_dependencia: "Relaciones de dependencia",
  es_base: "¿Es base del espacio objetivo?",
  independiente: "¿Es linealmente independiente?",
  genera_objetivo: "¿Genera el espacio objetivo?",
  pertenece: "¿Pertenece al generado?",
  inyectiva: "¿Es inyectiva?",
  sobreyectiva: "¿Es sobreyectiva?",
  biyectiva: "¿Es biyectiva?",
  coordenadas: "Coordenadas en la base",
  coordenadas_origen: "Coordenadas de origen",
  coordenadas_destino: "Coordenadas de destino",
  variables_libres: "Variables libres",
  pivotes: "Columnas pivote",
  P: "Matriz de permutación P",
  L: "Factor inferior L",
  U: "Factor escalonado U",
  reversible: "¿Es una operación reversible?",
  antes: "Matriz antes del paso",
  matriz: "Matriz después del paso",
  norma: "Norma exacta",
  norma_cuadrada: "Norma al cuadrado",
  proyeccion: "Proyección ortogonal",
  componente_ortogonal: "Componente ortogonal",
  coeficiente: "Coeficiente de proyección",
  coeficientes: "Coeficientes de la combinación",
  passed: "Comprobación",
  comparaciones_no_generales: "Comparaciones que no son leyes generales",
};
function label(key: string) {
  return (
    labels[key] ||
    key.replaceAll("_", " ").replace(/^./, (s) => s.toUpperCase())
  );
}
const numeric = (value: unknown): value is string =>
  typeof value === "string" &&
  /^-?(?:[0-9]+(?:\/[0-9]+)?|[0-9.]+(?:[eE][+-]?[0-9]+)?)$/.test(value);
function isMatrix(value: unknown): value is string[][] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (row) => Array.isArray(row) && row.length > 0 && row.every(numeric),
    )
  );
}
export function DataView({
  value,
  name = "",
}: {
  value: unknown;
  name?: string;
}) {
  if (value === null)
    return <span className="help">No existe en este caso.</span>;
  if (typeof value === "boolean")
    return (
      <span className={value ? "answer yes" : "answer"}>
        {value ? "Sí" : "No"}
      </span>
    );
  if (typeof value === "number")
    return (
      <span>
        {[
          "fila",
          "columna",
          "destino",
          "origen",
          "otra_fila",
          "indice",
          "otro",
          "componente",
        ].includes(name)
          ? value + 1
          : value}
      </span>
    );
  if (typeof value === "string") {
    if (name === "formula") return <Formula tex={value} />;
    if (numeric(value) || /^sqrt\(/.test(value))
      return <Formula tex={rationalTex(value)} />;
    return (
      <p className="expression">
        {value === "not_applicable" ? "No aplicable" : value}
      </p>
    );
  }
  if (Array.isArray(value)) {
    if (name === "tabla")
      return <NumericalTable rows={value as Record<string, unknown>[]} />;
    if (["conjunto", "universo"].includes(name))
      return (
        <p className="expression">
          {"{ " +
            value
              .map((x) =>
                Array.isArray(x)
                  ? "(" + x.map(String).join(", ") + ")"
                  : JSON.stringify(x),
              )
              .join(", ") +
            " }"}
        </p>
      );
    if (!value.length)
      return (
        <span className="help">
          {name.startsWith("base") || name === "direcciones"
            ? "Familia vacía · dimensión 0"
            : "Sin elementos"}
        </span>
      );
    if (["pivotes", "variables_libres"].includes(name))
      return (
        <p>
          {value.map((x) => (typeof x === "number" ? x + 1 : x)).join(", ")}{" "}
          <small>· numeración desde 1</small>
        </p>
      );
    if (isMatrix(value)) {
      if (
        [
          "base",
          "base_columna",
          "base_fila",
          "base_nucleo",
          "base_imagen",
          "base_generado",
          "base_suma",
          "base_interseccion",
          "direcciones",
          "relaciones_dependencia",
        ].includes(name)
      )
        return (
          <div className="vector-family">
            {value.map((v, i) => (
              <div key={i}>
                <span>v{i + 1}</span>
                <Formula tex={matrixTex(v.map((x) => [x]))} />
              </div>
            ))}
          </div>
        );
      return <Formula tex={matrixTex(value)} />;
    }
    if (value.every(numeric))
      return <Formula tex={matrixTex(value.map((x) => [x]))} />;
    if (value.every((x) => typeof x === "number"))
      return <p>{value.join(", ")}</p>;
    return (
      <div className="data-list">
        {value.map((item, i) => (
          <details key={i}>
            <summary>
              {typeof item === "object" && item && "nombre" in item
                ? String(item.nombre)
                : "Elemento " + (i + 1)}
            </summary>
            <DataView value={item} />
          </details>
        ))}
      </div>
    );
  }
  if (typeof value === "object")
    return (
      <div className="data-object">
        {Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !["nombre", "verification"].includes(key))
          .map(([key, item]) => (
            <section className="data-field" key={key}>
              <h3>{label(key)}</h3>
              <DataView value={item} name={key} />
            </section>
          ))}
      </div>
    );
  return null;
}
export function ResultView({
  value,
  compact = false,
}: {
  value: Record<string, unknown>;
  compact?: boolean;
}) {
  const first = [
    "aproximacion_decimal",
    "aproximacion",
    "convergencia",
    "motivo_parada",
    "clasificacion",
    "familia",
    "valor",
    "vector",
    "norma",
    "proyeccion",
    "componente_ortogonal",
    "particular",
    "direcciones",
    "coordenadas",
    "matrix",
    "P",
    "L",
    "U",
  ];
  const keys = [
    ...first.filter((k) => k in value),
    ...Object.keys(value).filter(
      (k) => !first.includes(k) && !["precision_bits", "exactitud"].includes(k),
    ),
  ];
  const important = [
    "aproximacion_decimal",
    "clasificacion",
    "familia",
    "matrix",
    "vector",
    "particular",
    "direcciones",
    "valor",
    "expresion",
    "coordenadas",
    "base",
    "base_nucleo",
    "base_imagen",
    "base_columna",
    "base_fila",
    "es_base",
    "independiente",
    "pertenece",
    "conjunto",
    "representacion",
    "tabla",
    "convergencia",
    "motivo_parada",
    "norma",
    "proyeccion",
    "componente_ortogonal",
    "P",
    "L",
    "U",
  ];
  const primary = compact ? keys.filter((k) => important.includes(k)) : keys;
  const extras = compact ? keys.filter((k) => !important.includes(k)) : [];
  return (
    <div className="result-data">
      {(primary.length ? primary : keys).map((key) => (
        <section className="data-field" key={key}>
          <h3>{label(key)}</h3>
          <DataView value={value[key]} name={key} />
        </section>
      ))}
      {primary.length > 0 && extras.length > 0 && (
        <details className="result-extras">
          <summary>Ver todos los datos del resultado</summary>
          {extras.map((key) => (
            <section className="data-field" key={key}>
              <h3>{label(key)}</h3>
              <DataView value={value[key]} name={key} />
            </section>
          ))}
        </details>
      )}
    </div>
  );
}
export function StepView({ step }: { step: Step }) {
  if (step.kind === "producto_fila_columna") {
    const d = step.data,
      terms = d.terminos as { a: string; b: string }[];
    const formula = terms
      .map(
        (t) =>
          `\\left(${rationalTex(t.a)}\\right)\\left(${rationalTex(t.b)}\\right)`,
      )
      .join("+");
    return (
      <Formula
        tex={`c_{${Number(d.fila) + 1},${Number(d.columna) + 1}}=${formula}=${rationalTex(String(d.resultado))}`}
      />
    );
  }
  return (
    <>
      <p>{step.description}</p>
      {step.formula && <Formula tex={step.formula} />}
      <DataView value={step.data} />
    </>
  );
}

function NumericalTable({ rows }: { rows: Record<string, unknown>[] }) {
  const [page, setPage] = useState(0);
  const selection = useContext(IterationSelection);
  useEffect(() => {
    if (selection.selected !== null)
      setPage(Math.floor(selection.selected / 10));
  }, [selection.selected]);
  if (!rows.length)
    return <p className="help">El criterio se satisfizo antes de iterar.</p>;
  const candidates = [
    "iteracion",
    "subintervalos",
    "x_decimal",
    "vector",
    "fx",
    "norma_residual",
    "error_aproximado_absoluto",
    "valor",
    "estimacion_error_no_garantizada",
    "cota_garantizada",
  ];
  const keys = candidates.filter((k) => rows.some((r) => k in r));
  const current = Math.min(page, Math.floor((rows.length - 1) / 10));
  return (
    <div className="iteration-table">
      <div
        className="table-scroll"
        tabIndex={0}
        aria-label="Tabla de iteraciones desplazable"
      >
        <table>
          <caption>Iteraciones de la ejecución actual</caption>
          <thead>
            <tr>
              <th scope="col">Explorar</th>
              {keys.map((k) => (
                <th scope="col" key={k}>
                  {label(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * 10, current * 10 + 10).map((r, i) => (
              <tr
                key={i}
                data-row-index={current * 10 + i}
                aria-selected={selection.selected === current * 10 + i}
              >
                <td>
                  <button
                    type="button"
                    className="text-button select-iteration"
                    aria-pressed={selection.selected === current * 10 + i}
                    onClick={() => selection.select(current * 10 + i)}
                  >
                    Ver fila {current * 10 + i + 1}
                  </button>
                </td>
                {keys.map((k) => (
                  <td key={k}>
                    <DataView value={r[k] ?? null} name={k} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <button
          type="button"
          className="secondary"
          disabled={current === 0}
          onClick={() => setPage(current - 1)}
        >
          Anterior
        </button>
        <span>
          Filas {current * 10 + 1}–{Math.min(current * 10 + 10, rows.length)} de{" "}
          {rows.length}
        </span>
        <button
          type="button"
          className="secondary"
          disabled={(current + 1) * 10 >= rows.length}
          onClick={() => setPage(current + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
