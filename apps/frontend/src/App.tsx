import { useEffect, useRef, useState, type FormEvent } from "react";
import { createEngine } from "./adapters";
import type { CalculationResult, OperationSpec } from "./contracts";
import { FormFields, initialValues, payload } from "./FormFields";
import { DataView, ResultView, StepView } from "./ResultView";

export function App() {
  const [engine] = useState(createEngine);
  const [operations, setOperations] = useState<OperationSpec[]>([]);
  const [ready, setReady] = useState(false),
    [home, setHome] = useState(true);
  const [mode, setMode] = useState<"serio" | "explorador">("serio");
  const [operation, setOperation] = useState("matrices.producto");
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>(
    {},
  );
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState(""),
    [selectedStep, setSelectedStep] = useState(0);
  const running = useRef(false),
    alive = useRef(true);
  const spec = operations.find((item) => item.id === operation);
  const values = spec ? inputs[operation] || initialValues(spec) : {};
  const categories = [...new Set(operations.map((item) => item.category))];
  async function initialize() {
    setReady(false);
    setError("");
    try {
      await engine.initialize();
      const catalog = await engine.execute({
        schema_version: "1.0",
        operation_id: "catalogo.operaciones",
        input: {},
      });
      if (catalog.status !== "ok" || !Array.isArray(catalog.result?.operations))
        throw new Error("No se pudo cargar el catálogo de operaciones.");
      if (alive.current) {
        setOperations(catalog.result.operations as OperationSpec[]);
        setReady(true);
      }
    } catch (reason) {
      if (alive.current)
        setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  useEffect(() => {
    alive.current = true;
    void initialize();
    return () => {
      alive.current = false;
      engine.dispose();
    };
  }, [engine]);
  function choose(id: string) {
    if (running.current) return;
    setOperation(id);
    setResult(null);
    setError("");
    setHome(false);
    setSelectedStep(0);
  }
  function change(name: string, value: string) {
    if (!spec) return;
    setInputs((current) => ({
      ...current,
      [operation]: {
        ...initialValues(spec),
        ...current[operation],
        [name]: value,
      },
    }));
    setResult(null);
    setError("");
  }
  async function calculate(event: FormEvent) {
    event.preventDefault();
    if (!ready || !spec || running.current) return;
    running.current = true;
    setBusy(true);
    setProgress(0);
    setResult(null);
    setError("");
    try {
      const response = await engine.execute(
        {
          schema_version: "1.0",
          operation_id: operation,
          input: payload(spec, values),
        },
        (value) => {
          if (alive.current) setProgress(value);
        },
      );
      if (alive.current) {
        setResult(response);
        setSelectedStep(0);
      }
    } catch (reason) {
      if (alive.current)
        setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      running.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function cancel() {
    try {
      await engine.cancel();
    } catch (reason) {
      if (alive.current) setError(String(reason));
    }
  }
  function exportResult() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexolineal-resultado.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const status = busy
    ? "Calculando"
    : ready
      ? "Motor listo"
      : "Preparando el motor";
  return (
    <div className={"app " + mode} data-mode={mode}>
      <header className="topbar">
        <a
          href="#inicio"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setHome(true);
          }}
        >
          <img src="./icono.ico" alt="" />
          NexoLineal
        </a>
        <nav aria-label="Menú principal">
          <button
            type="button"
            aria-pressed={home}
            onClick={() => setHome(true)}
          >
            Inicio
          </button>
          <button
            type="button"
            aria-pressed={!home}
            onClick={() => setHome(false)}
          >
            Área de trabajo
          </button>
        </nav>
        <div className="mode" aria-label="Presentación">
          <button
            id="modo-serio"
            type="button"
            aria-pressed={mode === "serio"}
            onClick={() => setMode("serio")}
          >
            Serio
          </button>
          <button
            id="modo-explorador"
            type="button"
            aria-pressed={mode === "explorador"}
            onClick={() => setMode("explorador")}
          >
            Explorador
          </button>
        </div>
      </header>
      <main id="inicio">
        {home && (
          <section className="welcome" aria-labelledby="objetivo">
            <h1 id="objetivo">¿Qué querés calcular?</h1>
            <div className="operation-grid">
              {categories.map((category) => {
                const group = operations.filter(
                  (op) => op.category === category,
                );
                return (
                  <button
                    type="button"
                    className="operation-card"
                    key={category}
                    disabled={busy}
                    onClick={() => choose(group[0].id)}
                  >
                    <strong>{category}</strong>
                    <span>{group.length} operaciones disponibles</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
        <div className="workspace">
          <section
            className="panel input-panel"
            aria-labelledby="operacion-titulo"
          >
            <div className="panel-heading">
              <h2 id="operacion-titulo">{spec?.title || "Calculadora"}</h2>
              <span className="engine-status" role="status">
                <i className={ready ? "ready" : ""} />
                {status}
              </span>
            </div>
            <form
              noValidate
              onSubmit={calculate}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
                  e.currentTarget.requestSubmit();
              }}
            >
              <label htmlFor="operacion">Operación</label>
              <select
                id="operacion"
                value={operation}
                disabled={busy || !ready}
                onChange={(e) => choose(e.target.value)}
              >
                {!operations.length && (
                  <option value="matrices.producto">
                    Cargando operaciones…
                  </option>
                )}
                {categories.map((category) => (
                  <optgroup key={category} label={category}>
                    {operations
                      .filter((op) => op.category === category)
                      .map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.title}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {spec?.description && <p className="help">{spec.description}</p>}
              {spec && (
                <FormFields
                  spec={spec}
                  values={values}
                  busy={busy}
                  change={change}
                />
              )}
              <div className="actions">
                <button
                  id="calcular"
                  type="submit"
                  className="primary"
                  disabled={!ready || busy}
                >
                  {busy ? "Calculando…" : "Calcular"}
                </button>
                {busy && (
                  <button
                    id="cancelar"
                    type="button"
                    className="secondary"
                    onClick={() => void cancel()}
                  >
                    Cancelar
                  </button>
                )}
              </div>
              {busy && (
                <progress
                  max={100}
                  value={progress || undefined}
                  aria-label="Progreso del cálculo"
                />
              )}
            </form>
          </section>
          <section
            id="resultado"
            className="panel result-panel"
            aria-live="polite"
            aria-labelledby="resultado-titulo"
            data-status={result?.status || (error ? "transport_error" : "idle")}
          >
            <div className="panel-heading">
              <h2 id="resultado-titulo">Resultado</h2>
              {result && (import.meta.env.VITE_TARGET || "web") === "web" && (
                <button
                  id="exportar"
                  className="secondary"
                  type="button"
                  onClick={exportResult}
                >
                  Exportar JSON
                </button>
              )}
            </div>
            {error && (
              <>
                <p className="error" role="alert">
                  {error}
                </p>
                {!ready && (
                  <button
                    id="reintentar-motor"
                    type="button"
                    className="secondary"
                    onClick={() => void initialize()}
                  >
                    Reintentar
                  </button>
                )}
              </>
            )}
            {result?.error && (
              <p
                className={
                  ["infinite", "inconsistent", "cancelled"].includes(
                    result.status,
                  )
                    ? "outcome-message"
                    : "error"
                }
                role={result.status === "cancelled" ? "status" : "alert"}
              >
                {result.error.message}
              </p>
            )}
            {!result && !error && (
              <p className="empty">
                {busy
                  ? "Podés seguir navegando mientras calculamos."
                  : "El resultado y su procedimiento aparecerán aquí."}
              </p>
            )}
            {result?.warnings.map((message, i) => (
              <p className="outcome-message" key={i}>
                {message}
              </p>
            ))}
            {result?.result && <ResultView value={result.result} />}
            {result?.metadata.exact === true && result.result && (
              <p className="accuracy">Resultado exacto</p>
            )}
            {result?.metadata.exact === false && result.result && (
              <p className="accuracy">Resultado aproximado</p>
            )}
            {result?.verification.passed === true && (
              <p className="verified">
                {String(
                  result.verification.description ||
                    "Comprobación de los pasos correcta",
                )}
              </p>
            )}
            {!!result?.steps.length && (
              <details className="steps">
                <summary>Ver procedimiento</summary>
                <label htmlFor="paso">Paso</label>
                <select
                  id="paso"
                  value={selectedStep}
                  onChange={(e) => setSelectedStep(Number(e.target.value))}
                >
                  {result.steps.map((step, i) => (
                    <option key={step.id} value={i}>
                      Paso {i + 1}: {step.description}
                    </option>
                  ))}
                </select>
                <StepView step={result.steps[selectedStep]} />
              </details>
            )}
            {result && Object.keys(result.verification).length > 0 && (
              <details className="verification-details">
                <summary>Ver comprobación</summary>
                <DataView value={result.verification} />
              </details>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
