import type { FieldSpec, OperationSpec } from "./contracts";
import { visible, required, normalizePaste } from "./workspace/validation";
export { visible } from "./workspace/validation";
import { supports, type SavedObject } from "./workspace/project";
import type { ResultObject } from "./workspace/WorkspacePanel";
const ids: Record<string, string> = {
  A: "matriz-a",
  B: "matriz-b",
  expresion: "expresion",
  inferior: "inferior",
  superior: "superior",
  punto: "punto",
};
export function fieldId(name: string) {
  return ids[name] || "dato-" + name;
}
export function initialValues(spec: OperationSpec): Record<string, string> {
  return Object.fromEntries(
    spec.fields.map((f) => [
      f.name,
      f.kind === "index" ? String(Number(f.default) + 1) : f.default,
    ]),
  );
}
export function payload(
  spec: OperationSpec,
  values: Record<string, string>,
): Record<string, unknown> {
  const entries: [string, unknown][] = [];
  for (const f of spec.fields) {
    if (!visible(f, values)) continue;
    const text = values[f.name] ?? "";
    if (!f.required && !text.trim()) continue;
    // Solo los índices de navegación se convierten; las magnitudes conservan su texto.
    const value =
      f.kind === "index" &&
      /^[0-9]+$/.test(text) &&
      Number.isSafeInteger(Number(text))
        ? Number(text) - 1
        : f.kind === "boolean"
          ? text === "true"
          : text;
    entries.push([f.name, value]);
  }
  return Object.fromEntries(entries);
}
function dimensions(text: string) {
  if (text.trim() === "[]") return "Familia vacía";
  const rows = text.split(/[;\n]/).filter((x) => x.trim());
  const width = rows.reduce(
    (max, row) => Math.max(max, row.trim().split(/\s+/).length),
    0,
  );
  return rows.length ? `${rows.length} × ${width}` : "Sin datos";
}
export function FormFields({
  spec,
  values,
  busy,
  change,
  errors = {},
  objects = [],
  onSave,
  onReuse,
}: {
  spec: OperationSpec;
  values: Record<string, string>;
  busy: boolean;
  change: (name: string, value: string) => void;
  errors?: Record<string, string>;
  objects?: SavedObject[];
  onSave?: (object: ResultObject) => void;
  onReuse?: (field: string, object: SavedObject) => void;
}) {
  return (
    <>
      {spec.fields
        .filter((f) => visible(f, values))
        .map((f) => {
          const id = fieldId(f.name),
            text = values[f.name] ?? "",
            multiline = ["matrix", "vectors", "set"].includes(f.kind);
          return (
            <div className="input-field" key={f.name}>
              <div className="field-heading">
                <label htmlFor={id}>
                  {f.label}
                  {!required(f, values) && !f.label.includes("opcional") && (
                    <small> · opcional</small>
                  )}
                </label>
                {multiline && f.kind !== "set" && (
                  <span>{dimensions(text)}</span>
                )}
              </div>
              {!!objects.filter((o) => supports(f.kind, o)).length && (
                <div className="field-tools">
                  <label className="sr-only" htmlFor={id + "-reuse"}>
                    Usar un objeto en {f.label}
                  </label>
                  <select
                    id={id + "-reuse"}
                    value=""
                    disabled={busy}
                    onChange={(e) => {
                      const o = objects.find((o) => o.id === e.target.value);
                      if (o) onReuse?.(f.name, o);
                    }}
                  >
                    <option value="">Usar un objeto guardado…</option>
                    {objects
                      .filter((o) => supports(f.kind, o))
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {f.kind === "select" || f.kind === "boolean" ? (
                <select
                  id={id}
                  value={text}
                  disabled={busy}
                  onChange={(e) => change(f.name, e.target.value)}
                >
                  {(f.choices || ["false", "true"]).map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              ) : multiline ? (
                <textarea
                  id={id}
                  value={text}
                  rows={4}
                  onPaste={(e) => {
                    const raw = e.clipboardData.getData("text");
                    if (raw.includes("\t") || raw.includes("−")) {
                      e.preventDefault();
                      const el = e.currentTarget;
                      change(
                        f.name,
                        el.value.slice(0, el.selectionStart) +
                          normalizePaste(raw) +
                          el.value.slice(el.selectionEnd),
                      );
                    }
                  }}
                  disabled={busy}
                  spellCheck={false}
                  onChange={(e) => change(f.name, e.target.value)}
                  aria-invalid={!!errors[f.name]}
                  aria-describedby={
                    id + "-ayuda" + (errors[f.name] ? " " + id + "-error" : "")
                  }
                />
              ) : (
                <input
                  id={id}
                  value={text}
                  disabled={busy}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => change(f.name, e.target.value)}
                  aria-invalid={!!errors[f.name]}
                  aria-describedby={
                    id + "-ayuda" + (errors[f.name] ? " " + id + "-error" : "")
                  }
                />
              )}
              {errors[f.name] && (
                <p className="field-error" id={id + "-error"} role="alert">
                  {errors[f.name]}
                </p>
              )}
              {["matrix", "vector", "vectors", "expression"].includes(
                f.kind,
              ) && (
                <button
                  className="text-button save-input"
                  type="button"
                  disabled={busy || !text.trim()}
                  onClick={() =>
                    onSave?.({
                      name: f.label,
                      kind:
                        f.kind === "expression"
                          ? "function"
                          : f.kind === "vectors"
                            ? "base"
                            : (f.kind as "matrix" | "vector"),
                      text,
                    })
                  }
                >
                  ＋ Guardar como objeto
                </button>
              )}
              <p className="help" id={id + "-ayuda"}>
                {f.kind === "set"
                  ? "Una etiqueta de texto por línea, sin duplicados. [] representa el conjunto vacío."
                  : f.kind === "matrix"
                    ? "Una fila por línea; números separados por espacios. Se admiten decimales y fracciones."
                    : f.kind === "vectors"
                      ? "Un vector por fila; componentes separadas por espacios. Usá [] para la familia vacía."
                      : f.kind === "index"
                        ? "Numeración desde 1."
                        : f.kind === "cuts"
                          ? "Posiciones después de las que se corta. Vacío conserva un único bloque."
                          : f.kind === "expression"
                            ? "Usá * para multiplicar, ^ para potencias y funciones como sin, cos, exp o ln."
                            : ""}
              </p>
            </div>
          );
        })}
    </>
  );
}
