import type { FieldSpec, OperationSpec } from "./contracts";
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
export function visible(field: FieldSpec, values: Record<string, string>) {
  return (
    !field.when ||
    Object.entries(field.when).every(([key, choices]) =>
      choices.includes(values[key]),
    )
  );
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
}: {
  spec: OperationSpec;
  values: Record<string, string>;
  busy: boolean;
  change: (name: string, value: string) => void;
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
                  {!f.required && !f.label.includes("opcional") && (
                    <small> · opcional</small>
                  )}
                </label>
                {multiline && f.kind !== "set" && (
                  <span>{dimensions(text)}</span>
                )}
              </div>
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
                  disabled={busy}
                  spellCheck={false}
                  onChange={(e) => change(f.name, e.target.value)}
                  aria-describedby={id + "-ayuda"}
                />
              ) : (
                <input
                  id={id}
                  value={text}
                  disabled={busy}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => change(f.name, e.target.value)}
                  aria-describedby={id + "-ayuda"}
                />
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
