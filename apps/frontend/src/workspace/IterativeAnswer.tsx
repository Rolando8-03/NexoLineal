import { useState } from "react";
import { Formula, rationalTex } from "../ResultView";
import type { CalculationResult } from "../contracts";
import { matrixRows } from "./validation";

type Row = {
  iteracion: number;
  vector: string[];
  anterior: string[];
  norma_residual: string;
  cambio_porcentual_maximo: string | null;
  error_verdadero?: string;
  cota_error_infinito: string | null;
};
type Answer = {
  vector: string[];
  tabla: Row[];
  norma_residual: string;
  motivo_parada: string;
  dominancia_por_fila: { diagonal: string; resto: string }[];
  omega: string;
  norma: string;
  error_verdadero: string | null;
};
const stops: Record<string, string> = {
  residual_inicial_suficiente:
    "El vector inicial cumple la tolerancia del residual.",
  paso_y_residual_suficientes:
    "El cambio y el residual cumplen sus tolerancias.",
  porcentaje_y_residual_suficientes:
    "El cambio porcentual y el residual cumplen sus tolerancias.",
  maximo_de_iteraciones: "Se alcanzó el límite de iteraciones.",
  ciclo_detectado: "Se repitió un vector anterior.",
  iterado_repetido_con_residual_no_suficiente:
    "El vector dejó de cambiar con un residual superior a la tolerancia.",
};
function approximate(text: string | null) {
  if (text == null) return "Indefinido";
  const [n, d = "1"] = String(text).split("/");
  const numerator = n.replace(/^[+-]/, "");
  const denominator = d.replace(/^[+-]/, "");
  const val =
    numerator.length > 290 || denominator.length > 290
      ? Number(
          (n.startsWith("-") ? "-" : "") +
            (
              Number(numerator.slice(0, 15)) /
              10 ** (Math.min(numerator.length, 15) - 1) /
              (Number(denominator.slice(0, 15)) /
                10 ** (Math.min(denominator.length, 15) - 1))
            ).toPrecision(10) +
            "e" +
            (numerator.length - denominator.length),
        )
      : Number(n) / Number(d);
  if (!Number.isFinite(val) || (val === 0 && n !== "0")) return text;
  return Number(val.toPrecision(7)).toString();
}
const tuple = (v: string[]) => "(" + v.map(approximate).join(", ") + ")";
export function IterativeAnswer({ response }: { response: CalculationResult }) {
  const data = response.result as unknown as Answer;
  const [index, setIndex] = useState(0);
  const row = data.tabla[index];
  const sequential = response.operation_id === "iterativos.gauss_seidel";
  const relaxed = sequential && data.omega !== "1";
  const A = matrixRows(String(response.input.A));
  const b = String(response.input.b).trim().split(/\s+/);
  return (
    <article className="iteration-answer">
      {relaxed && <p>Relajación sucesiva (SOR) · ω = {data.omega}</p>}
      <h3>
        {response.status === "ok"
          ? "Solución aproximada"
          : "Última aproximación"}
      </h3>
      <p className="iteration-vector">x ≈ {tuple(data.vector)}</p>
      <div className="iteration-metrics">
        <div>
          <small>Iteraciones</small>
          <strong>{data.tabla.length}</strong>
        </div>
        <div>
          <small>Norma del residual · {data.norma}</small>
          <strong>{approximate(data.norma_residual)}</strong>
        </div>
        {data.error_verdadero != null && (
          <div>
            <small>Error verdadero · {data.norma}</small>
            <strong>{approximate(data.error_verdadero)}</strong>
          </div>
        )}
      </div>
      <p>{stops[data.motivo_parada] || data.motivo_parada}</p>
      {row && (
        <details className="iteration-detail" open>
          <summary>Resolución paso a paso</summary>
          <label>
            Iteración{" "}
            <select
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
            >
              {data.tabla.map((r, i) => (
                <option value={i} key={r.iteracion}>
                  {r.iteracion} de {data.tabla.length}
                </option>
              ))}
            </select>
          </label>
          <p>
            {sequential
              ? "Gauss-Seidel usa cada componente nueva en las filas siguientes."
              : "Jacobi calcula todas las componentes con el vector de la iteración anterior."}
          </p>
          <p>Vector anterior ≈ {tuple(row.anterior)}</p>
          {A.map((coeffs, i) => {
            const terms = coeffs.flatMap((c, j) => {
              if (i === j || Number(c.replace(",", ".")) === 0) return [];
              const updated = sequential && j < i;
              const x = approximate((updated ? row.vector : row.anterior)[j]);
              const coeff = rationalTex(c.replace(",", "."));
              return [
                `-\\left(${coeff}\\right)\\underbrace{\\left(${rationalTex(x)}\\right)}_{x_{${j + 1}}^{(${updated ? row.iteracion : row.iteracion - 1})}}`,
              ];
            });
            const quotient = `\\frac{${rationalTex(b[i].replace(",", "."))}${terms.join("")}}{${rationalTex(coeffs[i].replace(",", "."))}}`;
            const w = rationalTex(data.omega);
            const rhs = relaxed
              ? `(1-${w})\\left(${rationalTex(approximate(row.anterior[i]))}\\right)+${w}\\left(${quotient}\\right)`
              : quotient;
            const tex = `x_{${i + 1}}^{(${row.iteracion})} \\approx ${rhs} \\approx ${rationalTex(approximate(row.vector[i]))}`;
            return <Formula key={i} tex={tex} />;
          })}
        </details>
      )}
      {!!data.tabla.length && (
        <details>
          <summary>Tabla de iteraciones</summary>
          <div className="numeric-scroll">
            <table>
              <thead>
                <tr>
                  <th>k</th>
                  <th>Vector aproximado</th>
                  <th>Residual · {data.norma}</th>
                  <th>Cambio máx. (%)</th>
                  {data.error_verdadero != null && <th>Error verdadero</th>}
                </tr>
              </thead>
              <tbody>
                {data.tabla.map((r) => (
                  <tr key={r.iteracion}>
                    <th>{r.iteracion}</th>
                    <td>{tuple(r.vector)}</td>
                    <td>{approximate(r.norma_residual)}</td>
                    <td>{approximate(r.cambio_porcentual_maximo)}</td>
                    {r.error_verdadero != null && (
                      <td>{approximate(r.error_verdadero)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Si una componente permanece en cero, aporta 0 %. Si llega a cero
            desde otro valor, el porcentaje queda indefinido.
          </p>
        </details>
      )}
      <details>
        <summary>Dominancia diagonal y cota de error</summary>
        <p>
          Hay dominancia estricta si el valor absoluto de la diagonal supera la
          suma de los demás valores absolutos en cada fila.
        </p>
        {data.dominancia_por_fila.map(({ diagonal, resto }, i) => (
          <div key={i}>
            Fila {i + 1} · diagonal {diagonal} · suma restante {resto}
          </div>
        ))}
        <p>
          {row?.cota_error_infinito != null
            ? `Iteración ${row.iteracion} · cota del error en norma infinito ≈ ${approximate(row.cota_error_infinito)}.`
            : "Sin cota de contracción para esta iteración."}
        </p>
      </details>
    </article>
  );
}
