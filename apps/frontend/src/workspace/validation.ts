/** Valida sintaxis y forma para ubicar errores. La matemática la decide Python. */
import type { FieldSpec, OperationSpec } from "../contracts";
export function visible(field: FieldSpec, values: Record<string, string>) {
  return (
    !field.when ||
    Object.entries(field.when).every(([key, choices]) =>
      choices.includes(values[key]),
    )
  );
}
const number =
  /^[+-]?(?:\d+\/\d+|(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?)$/;
export function required(f: FieldSpec, values: Record<string, string>) {
  return (
    f.required ||
    (!!f.required_when &&
      Object.entries(f.required_when).every(([key, choices]) =>
        choices.includes(values[key]),
      ))
  );
}
export function normalizePaste(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/−/g, "-")
    .split("\n")
    .map((row) =>
      row.includes("\t")
        ? row
            .split("\t")
            .map((cell) => cell.trim() || "□")
            .join(" ")
        : row,
    )
    .join("\n");
}
export function matrixRows(text: string) {
  return text
    .replace(/;/g, "\n")
    .split("\n")
    .filter((row) => row.trim())
    .map((row) => row.trim().split(/\s+/));
}
function cellError(value: string) {
  return !number.test(value)
    ? "no es un número admitido"
    : /\/0+$/.test(value)
      ? "tiene denominador cero"
      : null;
}
export function validateFields(
  spec: OperationSpec,
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of spec.fields.filter((f) => visible(f, values))) {
    const v = values[f.name] ?? "";
    if (!v.trim()) {
      if (required(f, values))
        errors[f.name] = "Completá este dato; vacío no significa cero.";
      continue;
    }
    if (f.kind === "matrix" || f.kind === "vectors") {
      if (f.kind === "vectors" && v.trim() === "[]") continue;
      const rows = matrixRows(v);
      if (!rows.length) {
        errors[f.name] = "Escribí al menos una fila.";
        continue;
      }
      for (let i = 0; i < rows.length && !errors[f.name]; i++) {
        if (rows[i].length !== rows[0].length) {
          errors[f.name] =
            `La fila ${i + 1} tiene ${rows[i].length} componentes; se esperaban ${rows[0].length}.`;
          break;
        }
        for (let j = 0; j < rows[i].length; j++) {
          const issue = cellError(rows[i][j]);
          if (issue) {
            errors[f.name] = `Fila ${i + 1}, columna ${j + 1}: ${issue}.`;
            break;
          }
        }
      }
    } else if (f.kind === "vector") {
      const cells = v.replace(/;/g, " ").trim().split(/\s+/);
      const index = cells.findIndex((x) => cellError(x));
      if (index >= 0)
        errors[f.name] = `Componente ${index + 1}: ${cellError(cells[index])}.`;
    } else if (f.kind === "scalar") {
      const issue = cellError(v.trim());
      if (issue) errors[f.name] = "Este dato " + issue + ".";
    } else if (
      ["integer", "index"].includes(f.kind) &&
      !/^[+-]?\d+$/.test(v.trim())
    )
      errors[f.name] = "Escribí un entero.";
  }
  return errors;
}
