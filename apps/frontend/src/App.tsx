import { useEffect, useRef, useState } from "react";
import katex from "katex";
import { createEngine } from "./adapters";
import type { CalculationResult, Operation, Problem, Step } from "./contracts";

const operations: { id: Operation; title: string; description: string }[] = [
  { id: "matrices.producto", title: "Producto de matrices", description: "Pegá A y B. Reconocemos sus dimensiones." },
  { id: "calculadora.evaluar", title: "Evaluar una expresión", description: "Operaciones, fracciones y funciones elementales." },
  { id: "calculo.definida", title: "Integral definida", description: "Una función y los extremos de integración." },
  { id: "calculo.derivar", title: "Derivada", description: "Obtené la expresión y evaluá un punto si lo necesitás." },
];
function rationalTex(value: string): string {
  const fraction = value.match(/^(-?)([0-9]+)\/([0-9]+)$/);
  if (fraction) return `${fraction[1]}\\frac{${fraction[2]}}{${fraction[3]}}`;
  const scientific = value.match(/^(-?[0-9.]+)[eE]([+-]?[0-9]+)$/);
  if (scientific) return `${scientific[1]}\\times 10^{${scientific[2]}}`;
  return value;
}
function Formula({ tex }: { tex: string }) {
  return <div className="formula" dangerouslySetInnerHTML={{
    __html: katex.renderToString(tex, { displayMode: true, throwOnError: false, trust: false }),
  }} />;
}
function matrixTex(matrix: string[][]): string {
  return "\\begin{pmatrix}" + matrix.map(row => row.map(rationalTex).join("&")).join("\\\\") + "\\end{pmatrix}";
}
function stepTex(step: Step): string {
  const d = step.data;
  const terms = (d.terminos || []).map(term => "\\left(" + rationalTex(term.a) + "\\right)\\left(" + rationalTex(term.b) + "\\right)").join("+");
  return "c_{" + ((d.fila || 0) + 1) + "," + ((d.columna || 0) + 1) + "}=" + terms + "=" + rationalTex(d.resultado || "0");
}
function dimensions(text: string): string {
  const rows = text.split(/[;\n]/).filter(row => row.trim());
  const columns = rows.map(row => row.trim().split(/\s+/).length);
  return rows.length ? rows.length + " × " + columns.reduce((maximum, count) => Math.max(maximum, count), 0) : "Sin datos";
}

export function App() {
  const [engine] = useState(createEngine);
  const [ready, setReady] = useState(false);
  const [home, setHome] = useState(true);
  const [mode, setMode] = useState<"serio" | "explorador">("serio");
  const [operation, setOperation] = useState<Operation>("matrices.producto");
  const [A, setA] = useState("1/2 2");
  const [B, setB] = useState("2\n3");
  const [expression, setExpression] = useState("(8+2)/5");
  const [lower, setLower] = useState("-1");
  const [upper, setUpper] = useState("1");
  const [point, setPoint] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [selectedStep, setSelectedStep] = useState(0);
  const running = useRef(false);
  const alive = useRef(true);
  async function initialize() {
    setError(""); setReady(false);
    try { await engine.initialize(); if (alive.current) setReady(true); }
    catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : String(reason)); }
  }
  useEffect(() => {
    alive.current = true;
    void initialize();
    return () => { alive.current = false; engine.dispose(); };
  }, [engine]);

  function choose(id: Operation) {
    if (running.current) return;
    setOperation(id); setResult(null); setError(""); setHome(false);
  }
  function problem(): Problem {
    const input = operation === "matrices.producto" ? { A, B }
      : operation === "calculo.definida" ? { expresion: expression, inferior: lower, superior: upper }
      : operation === "calculo.derivar" ? { expresion: expression, ...(point ? { punto: point } : {}) }
      : { expresion: expression };
    return { schema_version: "1.0", operation_id: operation, input };
  }
  async function calculate(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || running.current) return;
    running.current = true; setBusy(true); setProgress(0); setError(""); setResult(null);
    try {
      const response = await engine.execute(problem(), value => { if (alive.current) setProgress(value); });
      if (alive.current) { setResult(response); setSelectedStep(0); }
    } catch (reason) {
      if (alive.current) setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      running.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function exportResult() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "nexolineal-resultado.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const title = operations.find(item => item.id === operation)!.title;
  const status = busy ? "Calculando" : ready ? "Motor listo" : "Preparando el motor";
  const value = result?.result;
  const successful = result?.status === "ok";

  return <div className={"app " + mode} data-mode={mode}>
    <header className="topbar">
      <a href="#inicio" className="brand" onClick={event => { event.preventDefault(); setHome(true); }}>
        <img src="./icono.ico" alt="" />NexoLineal
      </a>
      <nav aria-label="Menú principal">
        <button type="button" aria-pressed={home} onClick={() => setHome(true)}>Inicio</button>
        <button type="button" aria-pressed={!home} onClick={() => setHome(false)}>Área de trabajo</button>
      </nav>
      <div className="mode" aria-label="Presentación">
        <button id="modo-serio" type="button" aria-pressed={mode === "serio"} onClick={() => setMode("serio")}>Serio</button>
        <button id="modo-explorador" type="button" aria-pressed={mode === "explorador"} onClick={() => setMode("explorador")}>Explorador</button>
      </div>
    </header>
    <main id="inicio">
      {home && <section className="welcome" aria-labelledby="objetivo">
        <h1 id="objetivo">¿Qué querés calcular?</h1>
        <div className="operation-grid">{operations.map(item =>
          <button className="operation-card" type="button" key={item.id} disabled={busy} onClick={() => choose(item.id)}>
            <strong>{item.title}</strong><span>{item.description}</span>
          </button>
        )}</div>
      </section>}
      <div className="workspace">
        <section className="panel input-panel" aria-labelledby="operacion-titulo">
          <div className="panel-heading"><h2 id="operacion-titulo">{title}</h2>
            <span className="engine-status" role="status"><i className={ready ? "ready" : ""} />{status}</span></div>
          <form onSubmit={calculate} onKeyDown={event => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") event.currentTarget.requestSubmit();
          }}>
            <label htmlFor="operacion">Operación</label>
            <select id="operacion" value={operation} disabled={busy} onChange={event => choose(event.target.value as Operation)}>
              {operations.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
            </select>
            {operation === "matrices.producto" ? <>
              <div className="field-heading"><label htmlFor="matriz-a">Matriz A</label><span>{dimensions(A)}</span></div>
              <textarea id="matriz-a" value={A} disabled={busy} onChange={event => { setA(event.target.value); setResult(null); }} rows={4} spellCheck={false} aria-describedby="matriz-ayuda" />
              <div className="field-heading"><label htmlFor="matriz-b">Matriz B</label><span>{dimensions(B)}</span></div>
              <textarea id="matriz-b" value={B} disabled={busy} onChange={event => { setB(event.target.value); setResult(null); }} rows={4} spellCheck={false} aria-describedby="matriz-ayuda" />
              <p className="help" id="matriz-ayuda">Una fila por línea. Separá los números con espacios. Podés usar fracciones como 1/2.</p>
            </> : <>
              <label htmlFor="expresion">{operation === "calculadora.evaluar" ? "Expresión" : "Función de x"}</label>
              <input id="expresion" value={expression} disabled={busy} onChange={event => { setExpression(event.target.value); setResult(null); }} autoComplete="off" />
              {operation === "calculo.definida" && <div className="limits">
                <div><label htmlFor="inferior">Desde</label><input id="inferior" value={lower} disabled={busy} onChange={event => { setLower(event.target.value); setResult(null); }} /></div>
                <div><label htmlFor="superior">Hasta</label><input id="superior" value={upper} disabled={busy} onChange={event => { setUpper(event.target.value); setResult(null); }} /></div>
              </div>}
              {operation === "calculo.derivar" && <><label htmlFor="punto">Evaluar en x · opcional</label><input id="punto" value={point} disabled={busy} onChange={event => { setPoint(event.target.value); setResult(null); }} /></>}
              <p className="help">Usá * para multiplicar y ^ para potencias. También sin, cos, exp, ln y sqrt.</p>
            </>}
            <div className="actions">
              <button id="calcular" className="primary" type="submit" disabled={!ready || busy}>{busy ? "Calculando…" : "Calcular"}</button>
              {busy && <button id="cancelar" className="secondary" type="button" onClick={() => void engine.cancel()}>Cancelar</button>}
            </div>
            {busy && <progress max={100} value={progress || undefined} aria-label="Progreso del cálculo" />}
          </form>
        </section>
        <section id="resultado" className="panel result-panel" aria-live="polite" aria-labelledby="resultado-titulo" data-status={result?.status || (error ? "transport_error" : "idle")}>
          <div className="panel-heading"><h2 id="resultado-titulo">Resultado</h2>
            {successful && import.meta.env.VITE_TARGET === "web" && <button id="exportar" type="button" className="secondary" onClick={exportResult}>Exportar JSON</button>}
          </div>
          {error && <><p className="error" role="alert">{error}</p>
            {!ready && <button id="reintentar-motor" type="button" className="secondary" onClick={() => void initialize()}>Reintentar</button>}</>}
          {result && !successful && <p className={result.status === "cancelled" ? "help" : "error"} role={result.status === "cancelled" ? "status" : "alert"}>{result.error?.message}</p>}
          {!result && !error && <p className="empty">{busy ? "Podés seguir navegando mientras calculamos." : "El resultado y su procedimiento aparecerán aquí."}</p>}
          {successful && value && <>
            {value.matrix && <Formula tex={matrixTex(value.matrix)} />}
            {value.expresion && <p className="expression">{value.expresion}</p>}
            {value.valor !== undefined && <Formula tex={rationalTex(value.valor)} />}
            {(value.matrix || value.valor !== undefined) && <p className="accuracy">{result.metadata.exact ? "Resultado exacto" : "Resultado aproximado"}</p>}
            {result.verification.passed === true && <p className="verified">Comprobación de los pasos correcta</p>}
            {!!result.steps.length && <details className="steps">
              <summary>Ver procedimiento</summary>
              <label htmlFor="paso">Paso</label>
              <select id="paso" value={selectedStep} onChange={event => setSelectedStep(Number(event.target.value))}>
                {result.steps.map((step, i) => <option key={step.id} value={i}>Fila {(step.data.fila || 0) + 1}, columna {(step.data.columna || 0) + 1}</option>)}
              </select>
              <Formula tex={stepTex(result.steps[selectedStep])} />
            </details>}
          </>}
        </section>
      </div>
    </main>
  </div>;
}
