import { Formula, rationalTex } from "../ResultView";
import type { CalculationResult } from "../contracts";

interface SystemSolution {
  particular?: string[] | null;
  direcciones?: string[][];
  certificado?: { yb: string; fila: number };
  clasificacion?: "unica" | "infinitas" | "incompatible";
  motivo?: string;
  rango_A?: number;
  rango_aumentada?: number;
  pivotes?: number[];
  variables_libres?: number[];
  gauss?: { matrix: string[][] };
  gauss_jordan?: { matrix: string[][] };
  comprobacion?: {
    particular?: string[];
    direcciones?: string[][];
    Axp?: string[];
    b?: string[];
    Av?: string[][];
    certificado?: { yb: string };
  };
}
function variable(index: number, n: number) {
  return n <= 3 ? ["x", "y", "z"][index] : "x_{" + (index + 1) + "}";
}
const vector = (v: string[]) =>
  "\\left(" + v.map(rationalTex).join(",\\,") + "\\right)";
function augmented(rows: string[][]) {
  const cols = "c".repeat(rows[0].length - 1) + "|c";
  return (
    "\\left[\\begin{array}{" +
    cols +
    "}" +
    rows.map((row) => row.map(rationalTex).join("&")).join("\\\\") +
    "\\end{array}\\right]"
  );
}
export function SystemAnswer({ response }: { response: CalculationResult }) {
  const data = response.result as SystemSolution;
  const x = data.particular;
  const classification = {
    unica: "Solución única",
    infinitas: "Infinitas soluciones",
    incompatible: "Sistema incompatible",
  };
  const check = data.comprobacion;
  const coefficients = String(response.input.A)
    .trim()
    .split(/[;\n]/)
    .filter((row) => row.trim())
    .map((row) => row.trim().split(/\s+/));
  const n = coefficients[0].length;
  function substitutions(values: string[], expected: string[]) {
    return (
      <ol>
        {coefficients.map((row, i) => (
          <li key={i}>
            {row.map((a, j) => `(${a}) · (${values[j]})`).join(" + ")} ={" "}
            {expected[i]}
          </li>
        ))}
      </ol>
    );
  }
  const vars = (indices: number[] = []) =>
    indices
      .map((i) => (n <= 3 ? ["x", "y", "z"][i] : "x" + (i + 1)))
      .join(", ") || "Ninguna";
  return (
    <div className="system-answer">
      {data.clasificacion && (
        <section>
          <h3>{classification[data.clasificacion]}</h3>
          <p>{data.motivo}</p>
        </section>
      )}
      {x && (
        <section>
          <h3>Solución</h3>
          <Formula
            tex={
              data.direcciones?.length
                ? "\\mathbf{x}=" +
                  vector(x) +
                  data.direcciones
                    .map((d, i) => "+t_{" + (i + 1) + "}" + vector(d))
                    .join("")
                : x
                    .map((v, i) => variable(i, x.length) + "=" + rationalTex(v))
                    .join(",\\quad ")
            }
          />
          {!!data.direcciones?.length && (
            <p>Cada parámetro puede tomar cualquier valor real.</p>
          )}
        </section>
      )}
      {data.certificado && (
        <section>
          <h3>Sin solución</h3>
          <p>
            La fila {data.certificado.fila + 1} exige que 0 ={" "}
            {data.certificado.yb}.
          </p>
        </section>
      )}
      {data.rango_A !== undefined && (
        <section>
          <h3>Rangos y pivotes</h3>
          <p>
            Rango de A = {data.rango_A} · Rango de [A | b] ={" "}
            {data.rango_aumentada}
          </p>
          <p>
            Columnas pivote en A · {vars(data.pivotes)}
            <br />
            {data.rango_A === data.rango_aumentada
              ? "Variables libres"
              : "Columnas sin pivote en A"}{" "}
            · {vars(data.variables_libres)}
          </p>
        </section>
      )}
      {(
        [
          ["Forma escalonada · Gauss", data.gauss],
          ["Forma reducida · Gauss-Jordan", data.gauss_jordan],
        ] as const
      ).map(
        ([heading, form]) =>
          form && (
            <section key={heading}>
              <h3>{heading}</h3>
              <Formula tex={augmented(form.matrix)} />
            </section>
          ),
      )}
      {check && (
        <section>
          <h3>Comprobación en el sistema original</h3>
          {check.Axp && <p>A · xₚ = ({check.Axp.join(", ")}) = b.</p>}
          {check.Av?.map((d, i) => (
            <p key={i}>
              Dirección {i + 1} · A · v{i + 1} = ({d.join(", ")}).
            </p>
          ))}
          {check.particular && check.Axp && (
            <details>
              <summary>Sustituir en cada ecuación</summary>
              <h4>Solución particular</h4>
              {substitutions(check.particular, check.Axp)}
              {check.direcciones?.map((d, i) => (
                <div key={i}>
                  <h4>Dirección {i + 1}</h4>
                  {substitutions(d, check.Av![i])}
                </div>
              ))}
            </details>
          )}
          {check.certificado && (
            <p>
              La combinación de las ecuaciones originales da 0 ={" "}
              {check.certificado.yb}. La contradicción certifica la
              incompatibilidad.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
