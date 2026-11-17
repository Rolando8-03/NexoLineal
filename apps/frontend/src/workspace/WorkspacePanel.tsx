import { SystemInput, ALL_RESULTS } from "./SystemInput";
import { useState } from "react";
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
  const [editing, setEditing] = useState(true);
  const showInput = !isSystem || editing || !p.result;
  const scene = p.result?.metadata.visualization as Scene | undefined;
  const frame = scene?.frames?.find((f) => f.step === p.active.step);
  const categories = [...new Set(p.operations.map((o) => o.category))];
  return (
    <div className={"workspace" + (isSystem ? " system-workspace" : "")}>
      <section hidden={!showInput} className="panel input-panel" aria-labelledby="operacion-titulo">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">TU PROBLEMA</span>
            <h2 id="operacion-titulo" tabIndex={-1}>
              {p.spec?.title || "Preparando operaciones"}
            </h2>
          </div>
          <span className="engine-status" role="status">
            <i className={p.ready ? "ready" : ""} />
            {p.busy
              ? "Calculando"
              : p.ready
                ? "Motor listo"
                : "Preparando el motor"}
          </span>
        </div>
        <form
          noValidate
          onSubmit={(e) => { if (isSystem && !(p.values.resultados ?? ALL_RESULTS).trim()) {e.preventDefault(); return;} p.calculate(e); if (isSystem && !Object.keys(p.errors).length) setEditing(false); }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
        >
          <label htmlFor="operacion">¿Qué querés calcular?</label>
          <select
            id="operacion"
            value={p.operation}
            disabled={p.busy || !p.ready}
            onChange={(e) => p.choose(e.target.value)}
          >
            {!p.operations.length && (
              <option value="matrices.producto">Cargando operaciones…</option>
            )}
            {categories.map((c) => (
              <optgroup label={c} key={c}>
                {p.operations
                  .filter((o) => o.category === c)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {p.spec?.description && <p className="help">{p.spec.description}</p>}
          {isSystem ? <SystemInput values={p.values} busy={p.busy} change={p.change} errors={p.errors} /> : p.spec && (
            <FormFields
              spec={p.spec}
              values={p.values}
              busy={p.busy}
              change={p.change}
              errors={p.errors}
              objects={p.objects}
              onSave={p.saveObject}
              onReuse={p.reuse}
            />
          )}
          <div className="actions">
            <button
              id="calcular"
              className="primary"
              disabled={!p.ready || p.busy || (isSystem && !(p.values.resultados ?? ALL_RESULTS).trim())}
              type="submit"
            >
              {p.busy ? "Calculando…" : isSystem ? "Resolver" : "Calcular"}
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
          <p className="keyboard-hint">Ctrl / ⌘ + Enter para calcular</p>
          {p.busy && (
            <progress
              max={100}
              value={p.progress || undefined}
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
        data-status={p.result?.status || (p.error ? "transport_error" : "idle")}
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EL RESULTADO</span>
            <h2 id="resultado-titulo" tabIndex={-1}>
              Resultado
            </h2>
          </div>
          {p.result && (
            <button
              id="exportar"
              type="button"
              className="secondary"
              onClick={p.exportResult}
            >
              Exportar JSON
            </button>
          )}
        </div>
        {isSystem && p.result && <button type="button" className="secondary" onClick={() => {setEditing(true); window.document.getElementById("operacion-titulo")?.focus();}}>Editar matriz</button>}
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
        {!p.result && !p.error && (
          <div className="empty">
            <div className="empty-orbit" aria-hidden="true">
              ∑
            </div>
            <strong>Un espacio para entender.</strong>
            <p>
              {p.busy
                ? "Podés seguir navegando mientras calculamos."
                : "Ingresá tus datos. Aquí vas a ver el resultado, el procedimiento y su comprobación."}
            </p>
          </div>
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
              <ResultView value={p.result.result} compact={!isSystem} />
            </IterationSelection.Provider>
            {scene && !isSystem && (
              <GraphPanel
                key={p.result.operation_id + JSON.stringify(p.result.input)}
                scene={scene}
                step={p.active.step}
                select={(step) => p.setActive({ step, stepsOpen: true })}
              />
            )}
            {p.result.metadata.exact === true && (
              <p className="accuracy">Resultado exacto</p>
            )}
            {p.result.metadata.exact === false && (
              <p className="accuracy">Resultado aproximado</p>
            )}
          </>
        )}
        {p.result?.verification.passed === true && (
          <p className="verified">
            ✓{" "}
            {String(
              p.result.verification.description || "Comprobación correcta",
            )}
          </p>
        )}
        {p.result && (
          <div className="document-actions">
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
          </div>
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
        {!!p.result?.steps.length && (
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
        {p.result && Object.keys(p.result.verification).length > 0 && (
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
