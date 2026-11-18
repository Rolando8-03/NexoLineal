import { useState } from "react";
import { cellError, matrixRows, normalizePaste } from "./validation";

export const SYSTEM_RESULTS = [
  ["clasificacion", "Clasificación"],
  ["rangos", "Rangos y pivotes"],
  ["gauss", "Gauss"],
  ["jordan", "Gauss-Jordan"],
  ["solucion", "Solución"],
  ["comprobacion", "Comprobación"],
] as const;
export const ALL_RESULTS = SYSTEM_RESULTS.map(([key]) => key).join(" ");

export function SystemInput({
  method,
  values,
  busy,
  change,
  errors,
}: {
  method: string;
  values: Record<string, string>;
  busy: boolean;
  change: (name: string, value: string) => void;
  errors: Record<string, string>;
}) {
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");
  const iterative = method.startsWith("iterativos.");
  const A = matrixRows(values.A || "□ □\n□ □");
  const b = (values.b || "").trim().split(/\s+/);
  const width = Math.max(1, ...A.map((row) => row.length));
  const encode = (cell: string) =>
    cell.replace(/[%\s;]/g, (char) => encodeURIComponent(char));
  const decode = (cell: string) =>
    cell.replace(/%(?:25|20|3B|09|0A|0D)/gi, decodeURIComponent);
  const selected = (values.resultados ?? ALL_RESULTS)
    .split(" ")
    .filter(Boolean);
  function store(rows: string[][]) {
    if (iterative && values.referencia) change("referencia", "");
    change(
      "A",
      rows
        .map((row) =>
          row
            .slice(0, -1)
            .map((x) => encode(x) || "□")
            .join(" "),
        )
        .join("\n"),
    );
    change("b", rows.map((row) => encode(row.at(-1) || "") || "□").join(" "));
  }
  const rows = A.map((row, i) => [
    ...Array.from({ length: width }, (_, j) => decode(row[j] || "□")),
    decode(b[i] || ""),
  ]);
  function resize(m: number, n: number) {
    store(
      Array.from({ length: m }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) =>
          j === n ? rows[i]?.at(-1) || "" : j < width ? rows[i]?.[j] || "" : "",
        ),
      ),
    );
  }
  function applyPaste(raw: string) {
    const parsed = matrixRows(normalizePaste(raw.replace(/[│|]/g, " ")));
    const count = parsed[0]?.length || 0;
    const incomplete = parsed.findIndex((row) => row.length !== count);
    if (
      incomplete >= 0 ||
      !parsed.length ||
      parsed.length > 20 ||
      count < 2 ||
      count > 21
    ) {
      setPasteError(
        incomplete >= 0
          ? `Revisá la fila ${incomplete + 1}. Se esperaban ${count} columnas, incluida b.`
          : "Usá de 1 a 20 ecuaciones e incógnitas e incluí la columna b.",
      );
      return;
    }
    store(parsed);
    setPasteError("");
  }
  return (
    <fieldset className="system-input" disabled={busy}>
      <legend>Matriz aumentada [A | b]</legend>
      <div className="matrix-tools">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            if (iterative) {
              store([
                ["10", "-1", "2", "0", "6"],
                ["-1", "11", "-1", "3", "25"],
                ["2", "-1", "10", "-1", "-11"],
                ["0", "3", "-1", "8", "15"],
              ]);
              change("inicial", "");
              change("referencia", "1 2 -1 1");
              return;
            }
            if (method !== "sistemas.resolver") {
              store([
                ["3", "-7", "-2", "-7"],
                ["-3", "5", "1", "5"],
                ["6", "-4", "0", "2"],
              ]);
              return;
            }
            store([
              ["1", "1", "3"],
              ["1", "-1", "1"],
            ]);
          }}
        >
          Cargar ejemplo
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            store(rows.map((row) => row.map(() => "")));
            if (iterative) {
              change("inicial", "");
              change("referencia", "");
            }
          }}
        >
          Limpiar
        </button>
      </div>
      <div className="matrix-dimensions">
        <label>
          Ecuaciones{" "}
          <input
            type="number"
            min="1"
            max="20"
            value={rows.length}
            onChange={(e) => {
              const m = Number(e.target.value);
              if (m >= 1 && m <= 20) resize(m, width);
            }}
          />
        </label>
        <label>
          Incógnitas{" "}
          <input
            type="number"
            min="1"
            max="20"
            value={width}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= 20) resize(rows.length, n);
            }}
          />
        </label>
      </div>
      <div
        className="augmented-scroll"
        role="group"
        aria-label="Matriz aumentada editable"
        tabIndex={0}
      >
        <table className="augmented-grid">
          <thead>
            <tr>
              {Array.from({ length: width }, (_, j) => (
                <th key={j} scope="col">
                  {width <= 3 ? ["x", "y", "z"][j] : "x" + (j + 1)}
                </th>
              ))}
              <th className="b-cell" scope="col">
                b
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  const value = cell === "□" ? "" : cell;
                  const invalid = !value.trim() || !!cellError(value.trim());
                  return (
                    <td key={j} className={j === width ? "b-cell" : ""}>
                      <input
                        aria-label={
                          j === width
                            ? `Término b, fila ${i + 1}`
                            : `Fila ${i + 1}, columna ${j + 1}`
                        }
                        aria-invalid={invalid && !!(errors.A || errors.b)}
                        value={value}
                        onPaste={(e) => {
                          const raw = e.clipboardData.getData("text");
                          if (/[\t\n;│|]|\S\s+\S/.test(raw.trim())) {
                            e.preventDefault();
                            setPaste(raw);
                            applyPaste(raw);
                          }
                        }}
                        inputMode="text"
                        autoComplete="off"
                        placeholder="—"
                        onChange={(e) => {
                          const next = rows.map((r) => [...r]);
                          next[i][j] = e.target.value;
                          store(next);
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(errors.A || errors.b) && (
        <p role="alert" className="error">
          {errors.A || errors.b}
        </p>
      )}
      <details className="paste-matrix">
        <summary>Pegar matriz desde texto o Excel</summary>
        <label htmlFor="matriz-aumentada">
          Una fila por ecuación. La última columna es b.
        </label>
        <textarea
          id="matriz-aumentada"
          rows={4}
          value={paste}
          placeholder={"1 1 3\n1 -1 1"}
          onChange={(e) => setPaste(e.target.value)}
        />
        <button
          type="button"
          className="secondary"
          onClick={() => applyPaste(paste)}
        >
          Usar matriz
        </button>
      </details>
      {pasteError && (
        <p role="alert" className="error">
          {pasteError}
        </p>
      )}
      {method === "sistemas.resolver" && (
        <div className="system-selection">
          <h3>¿Qué querés calcular?</h3>
          <label className="check-line">
            <input
              type="checkbox"
              checked={selected.length === SYSTEM_RESULTS.length}
              onChange={(e) =>
                change("resultados", e.target.checked ? ALL_RESULTS : "")
              }
            />
            Análisis completo
          </label>
          <details>
            <summary>
              Elegir resultados · {selected.length} seleccionados
            </summary>
            <div className="check-grid">
              {SYSTEM_RESULTS.map(([key, title]) => (
                <label className="check-line" key={key}>
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={(e) =>
                      change(
                        "resultados",
                        (e.target.checked
                          ? [...selected, key]
                          : selected.filter((k) => k !== key)
                        ).join(" "),
                      )
                    }
                  />
                  {title}
                </label>
              ))}
            </div>
          </details>
          {!selected.length && (
            <p role="alert" className="error">
              Elegí al menos un resultado o activá Análisis completo.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
