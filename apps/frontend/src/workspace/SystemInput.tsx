import { useState } from "react";
import { matrixRows, normalizePaste } from "./validation";

export const SYSTEM_RESULTS = [
  ["clasificacion", "Clasificación"], ["rangos", "Rangos y pivotes"],
  ["gauss", "Gauss"], ["jordan", "Gauss-Jordan"],
  ["solucion", "Solución"], ["comprobacion", "Comprobación"],
] as const;
export const ALL_RESULTS = SYSTEM_RESULTS.map(([key]) => key).join(" ");

export function SystemInput({ values, busy, change, errors }: {
  values: Record<string, string>; busy: boolean;
  change: (name: string, value: string) => void;
  errors: Record<string, string>;
}) {
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");
  const A = matrixRows(values.A || "□ □\n□ □");
  const b = (values.b || "").trim().split(/\s+/);
  const width = A[0]?.length || 2;
  const selected = (values.resultados ?? ALL_RESULTS).split(" ").filter(Boolean);
  function store(rows: string[][]) {
    change("A", rows.map(row => row.slice(0, -1).map(x => x || "□").join(" ")).join("\n"));
    change("b", rows.map(row => row.at(-1) || "□").join(" "));
  }
  const rows = A.map((row, i) => [...row, b[i] || ""]);
  function resize(m: number, n: number) {
    store(Array.from({ length: m }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) =>
        j === n ? rows[i]?.at(-1) || "" : A[i]?.[j] === "□" ? "" : A[i]?.[j] || "")));
  }
  const numeric = /^[+-]?(?:\d+\/\d+|(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?)$/;
  return <fieldset className="system-input" disabled={busy}>
    <legend>Matriz aumentada [A | b]</legend>
    <div className="matrix-tools">
      {[2, 3, 4].map(n => <button type="button" className="secondary" key={n}
        onClick={() => resize(n, n)}>{n}×{n}</button>)}
      <button type="button" className="secondary" onClick={() => {
        store([["1", "1", "3"], ["1", "-1", "1"]]);
      }}>Cargar ejemplo</button>
    </div>
    <div className="matrix-dimensions">
      <label>Ecuaciones <input type="number" min="1" max="20" value={rows.length}
        onChange={e => {const m = Number(e.target.value); if (m >= 1 && m <= 20) resize(m, width);}} /></label>
      <label>Incógnitas <input type="number" min="1" max="20" value={width}
        onChange={e => {const n = Number(e.target.value); if (n >= 1 && n <= 20) resize(rows.length, n);}} /></label>
    </div>
    <div className="augmented-scroll" role="group" aria-label="Matriz aumentada editable" tabIndex={0}>
      <table className="augmented-grid">
        <thead><tr>{Array.from({length: width}, (_, j) => <th key={j} scope="col">x{j+1}</th>)}<th className="b-cell" scope="col">b</th></tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => {
          const value = cell === "□" ? "" : cell;
          const invalid = !value.trim() || !numeric.test(value.trim()) || /\/0+$/.test(value.trim());
          return <td key={j} className={j === width ? "b-cell" : ""}><input
            aria-label={j === width ? `Término b, fila ${i+1}` : `Fila ${i+1}, columna ${j+1}`}
            aria-invalid={invalid && !!(errors.A || errors.b)} value={value}
            inputMode="decimal" autoComplete="off" placeholder="—"
            onChange={e => {const next = rows.map(r => [...r]); next[i][j] = e.target.value; store(next);}}
          /></td>;
        })}</tr>)}</tbody>
      </table>
    </div>
    {(errors.A || errors.b) && <p role="alert" className="error">{errors.A || errors.b}</p>}
    <details className="paste-matrix"><summary>Pegar matriz desde texto o Excel</summary>
      <label htmlFor="matriz-aumentada">Una fila por ecuación. La última columna es b.</label>
      <textarea id="matriz-aumentada" rows={4} value={paste} placeholder={"1 1 3\n1 -1 1"} onChange={e => setPaste(e.target.value)} />
      <button type="button" className="secondary" onClick={() => {
        const parsed = matrixRows(normalizePaste(paste.replace(/[│|]/g, " ")));
        const n = parsed[0]?.length || 0;
        if (!parsed.length || parsed.length > 20 || n < 2 || n > 21 || parsed.some(r => r.length !== n)) {
          setPasteError("Revisá las filas. Cada fila necesita la misma cantidad de columnas, incluida b. Máximo 20 ecuaciones e incógnitas.");
          return;
        }
        store(parsed); setPasteError("");
      }}>Usar matriz</button>
      {pasteError && <p role="alert" className="error">{pasteError}</p>}
    </details>
    <div className="system-selection">
      <h3>¿Qué querés calcular?</h3>
      <label className="check-line"><input type="checkbox" checked={selected.length === SYSTEM_RESULTS.length}
        onChange={e => change("resultados", e.target.checked ? ALL_RESULTS : "")} />Análisis completo</label>
      <details><summary>Elegir resultados · {selected.length} seleccionados</summary>
        <div className="check-grid">{SYSTEM_RESULTS.map(([key, title]) =>
          <label className="check-line" key={key}><input type="checkbox" checked={selected.includes(key)}
            onChange={e => change("resultados", (e.target.checked ? [...selected, key] : selected.filter(k => k !== key)).join(" "))} />{title}</label>)}</div>
      </details>
      {!selected.length && <p role="alert" className="error">Elegí al menos un resultado o activá Análisis completo.</p>}
    </div>
  </fieldset>;
}
