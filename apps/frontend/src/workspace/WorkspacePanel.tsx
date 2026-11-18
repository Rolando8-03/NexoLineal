import { SystemInput, ALL_RESULTS } from "./SystemInput";
import { IterativeAnswer } from "./IterativeAnswer";
import { familyOf, isSystemMethod, systemMethods } from "./navigation";
import { SystemNotes } from "./SystemNotes";
import { SystemAnswer } from "./SystemAnswer";
import { useEffect, useRef, useState } from "react";
import { TheoryCards, ModelResult } from "../exploration/Learning";
import { exportPdf, exportCsv } from "../exploration/exports";
import type { Theorem } from "../exploration/types";
import { GraphPanel } from "../exploration/GraphPanel";
import { IterationSelection } from "../exploration/selection";
import type { Scene } from "../exploration/types";
import type { FormEvent } from "react";
import type { CalculationResult, OperationSpec } from "../contracts";
import { FormFields } from "../FormFields";
import { DataView, ResultView, StepView } from "../ResultView";
import type { SavedObject, Project } from "./project";
export interface ResultObject {
  name: string;
  kind: SavedObject["kind"];
  text: string;
  ambient?: number;
}
interface Props {
  theorems: Theorem[];
  operations: OperationSpec[];
  spec?: OperationSpec;
  operation: string;
  values: Record<string, string>;
  ready: boolean;
  busy: boolean;
  progress: number;
  result: CalculationResult | null;
  error: string;
  errors: Record<string, string>;
  active: Project["active"];
  objects: SavedObject[];
  candidates: ResultObject[];
  choose: (id: string) => void;
  change: (name: string, value: string) => void;
  calculate: (event: FormEvent) => void;
  cancel: () => void;
  retry: () => void;
  setActive: (patch: Partial<Project["active"]>) => void;
  exportResult: () => void;
  saveObject: (object: ResultObject) => void;
  reuse: (field: string, object: SavedObject) => void;
}
export function WorkspacePanel(p: Props) {
  const [exporting, setExporting] = useState(false),
    [exportNotice, setExportNotice] = useState("");
  async function document(kind: "pdf" | "csv") {
    if (!p.result || exporting) return;
    setExporting(true);
    setExportNotice("");
    try {
      const saved = await (kind === "pdf"
        ? exportPdf(p.result, p.spec?.title || p.operation)
        : exportCsv(p.result));
      setExportNotice(
        saved ? "Documento exportado." : "Exportación cancelada.",
      );
    } catch (e) {
      setExportNotice((e as Error).message);
    } finally {
      setExporting(false);
    }
  }
  const isSystem = p.operation === "sistemas.resolver";
  const iterative = p.operation.startsWith("iterativos.");
  const systemFamily = isSystemMethod(p.operation);
  const grid = systemFamily && !p.operation.startsWith("factorizacion.");
  const family = p.spec ? familyOf(p.spec) : "Sistemas";
  const [editingResult, setEditingResult] = useState<CalculationResult | null>(
    null,
  );
  const editTitle = useRef<HTMLHeadingElement>(null);
  const answerTitle = useRef<HTMLHeadingElement>(null);
  const showInput =
    !systemFamily || !p.result?.result || editingResult === p.result;
  useEffect(() => {
    if (systemFamily && !showInput) answerTitle.current?.focus();
  }, [systemFamily, showInput, p.result]);
  const scene = p.result?.metadata.visualization as Scene | undefined;
  const frame = scene?.frames?.find((f) => f.step === p.active.step);
  const matrixStudy = p.operation === "matrices.analizar";
  const determinant = p.operation === "determinantes.calcular";
  const selected = (p.values.consultas || "").split(" ").filter(Boolean);
  const categories = [
    "Sistemas",
    "Vectores y espacios",
    "Matrices",
    "Determinantes e inversas",
    "Transformaciones",
    "Métodos numéricos",
    "Cálculo",
    "Calculadora",
    "Herramientas",
  ].filter((c) => p.operations.some((o) => familyOf(o) === c));
  return (
    <div className={"workspace" + (systemFamily ? " system-workspace" : "")}>
      <nav aria-label="Áreas de la calculadora" className="family-switch">
        {categories.map((c) => (
          <button
            key={c}
            disabled={p.busy}
            aria-pressed={family === c}
            onClick={() =>
              c !== family &&
              p.choose(
                c === "Sistemas"
                  ? "sistemas.resolver"
                  : c === "Matrices"
                    ? "matrices.analizar"
                    : c === "Métodos numéricos"
                      ? "raices.biseccion"
                      : p.operations.find((o) => familyOf(o) === c)!.id,
              )
            }
          >
            {c === "Vectores y espacios"
              ? "Vectores"
              : c === "Determinantes e inversas"
                ? "Determinantes"
                : c}
          </button>
        ))}
      </nav>
      <section
        hidden={!showInput}
        className="panel input-panel"
        aria-labelledby="operacion-titulo"
      >
        <div className="panel-heading">
          <div>
            <h2 ref={editTitle} id="operacion-titulo" tabIndex={-1}>
              {systemFamily
                ? "Resolver sistema"
                : p.spec?.title || "Preparando operaciones"}
            </h2>
          </div>
          {(!p.ready || p.busy) && (
            <span className="engine-status" role="status">
              <i className={p.ready ? "ready" : ""} />
              {p.busy
                ? "Calculando"
                : p.ready
                  ? "Motor listo"
                  : "Preparando el motor"}
            </span>
          )}
        </div>
        <form
          noValidate
          onSubmit={p.calculate}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
        >
          <label htmlFor="operacion">
            {systemFamily ? "Método" : "Operación"}
          </label>
          <select
            id="operacion"
            value={p.operation}
            disabled={p.busy || !p.ready}
            onChange={(e) => p.choose(e.target.value)}
          >
            {systemFamily
              ? systemMethods.map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))
              : p.operations
                  .filter((o) => familyOf(o) === family)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
          </select>
          {grid && (
            <SystemInput
              method={p.operation}
              values={p.values}
              busy={p.busy}
              change={p.change}
              errors={p.errors}
            />
          )}
          {p.spec && !grid && (
            <FormFields
              spec={{
                ...p.spec,
                fields: p.spec.fields.filter((f) => f.name !== "consultas"),
              }}
              values={p.values}
              busy={p.busy}
              change={p.change}
              errors={p.errors}
              objects={p.objects}
              onReuse={p.reuse}
            />
          )}
          {matrixStudy && (
            <fieldset className="study-outputs">
              <legend>Resultados</legend>
              {[
                ["rango", "Rango"],
                ["transpuesta", "Transpuesta"],
                ["traza", "Traza"],
                ["determinante", "Determinante"],
                ["inversa", "Inversa"],
              ].map(([id, label]) => (
                <label className="check-line" key={id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(id)}
                    onChange={(e) =>
                      p.change(
                        "consultas",
                        (e.target.checked
                          ? [...selected, id]
                          : selected.filter((k) => k !== id)
                        ).join(" "),
                      )
                    }
                  />
                  {label}
                </label>
              ))}
              {!selected.length && (
                <small>Sin selección se calcula el análisis general.</small>
              )}
            </fieldset>
          )}
          {determinant && (
            <label className="check-line">
              <input
                type="checkbox"
                checked={selected.includes("inversa")}
                onChange={(e) =>
                  p.change("consultas", e.target.checked ? "inversa" : "")
                }
              />
              Calcular también la inversa
            </label>
          )}
          {iterative && p.spec && (
            <details className="solver-settings" key={p.operation}>
              <summary>
                Opciones de iteración · tolerancia{" "}
                {p.values.tolerancia_absoluta || "1e-8"} · máximo{" "}
                {p.values.max_iteraciones || "100"}
              </summary>
              <FormFields
                spec={{
                  ...p.spec,
                  fields: p.spec.fields.filter(
                    (f) => !["A", "b"].includes(f.name),
                  ),
                }}
                values={p.values}
                busy={p.busy}
                change={p.change}
                errors={p.errors}
              />
            </details>
          )}
          <div className="actions">
            <button
              id="calcular"
              className="primary"
              disabled={
                !p.ready ||
                p.busy ||
                (isSystem && !(p.values.resultados ?? ALL_RESULTS).trim())
              }
              type="submit"
            >
              {p.busy ? "Calculando…" : systemFamily ? "Resolver" : "Calcular"}
              <span aria-hidden="true"> ↗</span>
            </button>
            {p.busy && (
              <button
                id="cancelar"
                className="secondary"
                type="button"
                onClick={p.cancel}
              >
                Cancelar
              </button>
            )}
          </div>

          {p.busy && (
            <progress
              max={100}
              value={p.progress || undefined}
              aria-label="Progreso del cálculo"
            />
          )}
        </form>
        {isSystem && <SystemNotes />}
      </section>
      <section
        hidden={
          !p.error &&
          (!p.result || (systemFamily && editingResult === p.result))
        }
        id="resultado"
        className="panel result-panel"
        aria-live="polite"
        aria-labelledby="resultado-titulo"
        data-status={p.result?.status || (p.error ? "transport_error" : "idle")}
      >
        <div className="panel-heading">
          <div>
            <h2 ref={answerTitle} id="resultado-titulo" tabIndex={-1}>
              {iterative ? p.spec?.title : "Resultado"}
            </h2>
          </div>
        </div>
        {systemFamily && p.result && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditingResult(p.result);
              requestAnimationFrame(() => editTitle.current?.focus());
            }}
          >
            Editar matriz
          </button>
        )}
        {p.error && (
          <>
            <p role="alert" className="error">
              {p.error}
            </p>
            {!p.ready && (
              <button
                id="reintentar-motor"
                className="secondary"
                type="button"
                onClick={p.retry}
              >
                Reintentar
              </button>
            )}
          </>
        )}
        {p.result?.error && (
          <p
            role={p.result.status === "cancelled" ? "status" : "alert"}
            className="outcome-message"
          >
            {p.result.error.message}
          </p>
        )}
        {p.result?.warnings.map((w, i) => (
          <p key={i} className="outcome-message">
            {w}
          </p>
        ))}
        {p.result?.result && (
          <>
            <IterationSelection.Provider
              value={{
                selected: frame?.row ?? null,
                select: (row) => {
                  const target = scene?.frames?.find((f) => f.row === row);
                  if (target?.step != null)
                    p.setActive({ step: target.step, stepsOpen: true });
                },
              }}
            >
              {iterative ? (
                <IterativeAnswer
                  key={p.result.operation_id + JSON.stringify(p.result.input)}
                  response={p.result}
                />
              ) : isSystem ? (
                <SystemAnswer response={p.result} />
              ) : (
                <ResultView value={p.result.result} compact />
              )}
            </IterationSelection.Provider>
            {scene &&
              scene.kind !== "unavailable" &&
              (!isSystem || scene.kind === "system") && (
                <details className="related-theory">
                  <summary>
                    {iterative ? "Gráfica del residual" : "Ver gráfica"}
                  </summary>
                  <GraphPanel
                    key={p.result.operation_id + JSON.stringify(p.result.input)}
                    scene={scene}
                    step={p.active.step}
                    select={(step) => p.setActive({ step, stepsOpen: true })}
                  />
                </details>
              )}
            {p.result.metadata.exact === true && (
              <p className="accuracy">Resultado exacto</p>
            )}
            {p.result.metadata.exact === false && (
              <p className="accuracy">Resultado aproximado</p>
            )}
          </>
        )}
        {!systemFamily && p.result?.verification.passed === true && (
          <p className="verified">
            ✓{" "}
            {String(
              p.result.verification.description || "Comprobación correcta",
            )}
          </p>
        )}
        {p.result && (
          <details className="document-actions">
            <summary>Exportar resultado</summary>
            <button
              id="exportar"
              type="button"
              className="secondary"
              onClick={p.exportResult}
            >
              JSON
            </button>
            <button
              type="button"
              id="exportar-pdf"
              className="secondary"
              disabled={exporting}
              onClick={() => void document("pdf")}
            >
              {exporting
                ? "Preparando documento…"
                : "Exportar procedimiento PDF"}
            </button>
            {Array.isArray(p.result.result?.tabla) &&
              p.result.result.tabla.length > 0 && (
                <button
                  type="button"
                  id="exportar-csv"
                  className="secondary"
                  disabled={exporting}
                  onClick={() => void document("csv")}
                >
                  Exportar tabla CSV
                </button>
              )}
            <p role="status">{exportNotice}</p>
          </details>
        )}
        {p.result?.metadata.application != null && (
          <ModelResult
            value={p.result.metadata.application as Record<string, unknown>}
          />
        )}
        {p.result && (
          <details className="related-theory">
            <summary>Teoría relacionada e hipótesis</summary>
            <TheoryCards
              theorems={p.theorems}
              operation={p.result.operation_id}
            />
          </details>
        )}
        {!iterative && !!p.result?.steps.length && (
          <details
            className="steps"
            open={p.active.stepsOpen}
            onToggle={(e) => {
              if (e.currentTarget.open !== p.active.stepsOpen)
                p.setActive({ stepsOpen: e.currentTarget.open });
            }}
          >
            <summary>
              Ver procedimiento <span>{p.result.steps.length} pasos</span>
            </summary>
            <label htmlFor="paso">Paso</label>
            <select
              id="paso"
              value={p.active.step}
              onChange={(e) => p.setActive({ step: Number(e.target.value) })}
            >
              {p.result.steps.map((s, i) => (
                <option key={s.id} value={i}>
                  Paso {i + 1}: {s.description}
                </option>
              ))}
            </select>
            {p.result.steps[p.active.step] && (
              <StepView step={p.result.steps[p.active.step]} />
            )}
          </details>
        )}
        {!systemFamily &&
          p.result &&
          Object.keys(p.result.verification).length > 0 && (
            <details
              className="verification-details"
              open={p.active.verificationOpen}
              onToggle={(e) => {
                if (e.currentTarget.open !== p.active.verificationOpen)
                  p.setActive({ verificationOpen: e.currentTarget.open });
              }}
            >
              <summary>Ver comprobación</summary>
              <DataView value={p.result.verification} />
            </details>
          )}
        {!!p.candidates.length && (
          <details className="reuse-results">
            <summary>Guardar un resultado como objeto reutilizable</summary>
            <div className="object-actions">
              {p.candidates.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  className="secondary"
                  onClick={() => p.saveObject(o)}
                >
                  Guardar {o.name}
                </button>
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
