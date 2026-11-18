/** Formato portable: guarda problemas y vuelve a calcular, nunca confía en resultados importados. */
import type { OperationSpec } from "../contracts";
export type Mode = "serio" | "explorador";
export type Theme = "claro" | "oscuro";
export type ObjectKind = "matrix" | "vector" | "base" | "function";
export interface SavedObject {
  id: string;
  name: string;
  kind: ObjectKind;
  text: string;
  ambient?: number;
}
export interface HistoryEntry {
  id: string;
  date: string;
  operation: string;
  values: Record<string, string>;
  label: string;
  status: string;
  favorite: boolean;
}
export interface Project {
  format: "NexoLineal.Project";
  version: 1;
  name: string;
  updatedAt: string;
  preferences: { mode: Mode; theme: Theme };
  active: {
    operation: string;
    inputs: Record<string, Record<string, string>>;
    step: number;
    stepsOpen: boolean;
    verificationOpen: boolean;
    resumeResult: boolean;
  };
  objects: SavedObject[];
  history: HistoryEntry[];
}
export const MAX_BYTES = 2 * 1024 * 1024;
export function id() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) +
        "-" +
        Array.from(crypto.getRandomValues(new Uint32Array(2))).join("-");
}
export function emptyProject(): Project {
  return {
    format: "NexoLineal.Project",
    version: 1,
    name: "Mi cuaderno de álgebra",
    updatedAt: new Date().toISOString(),
    preferences: { mode: "explorador", theme: "oscuro" },
    active: {
      operation: "sistemas.resolver",
      inputs: {},
      step: 0,
      stepsOpen: false,
      verificationOpen: false,
      resumeResult: false,
    },
    objects: [],
    history: [],
  };
}
function object(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function fail(message: string): never {
  throw new Error("Proyecto no válido: " + message);
}
function text(x: unknown, name: string, max = MAX_BYTES): string {
  if (typeof x !== "string" || x.length > max)
    fail(name + " debe ser texto de hasta " + max + " caracteres.");
  return x as string;
}
function record(x: unknown, name: string): Record<string, unknown> {
  if (!object(x)) fail("falta " + name + ".");
  return x as Record<string, unknown>;
}
function allowed(x: Record<string, unknown>, keys: string[]) {
  if (Object.keys(x).some((k) => !keys.includes(k)))
    fail("hay campos desconocidos o una versión no admitida.");
}
export function encodeProject(project: Project): string {
  const raw = JSON.stringify(project, null, 2);
  if (new TextEncoder().encode(raw).length > MAX_BYTES)
    throw new Error(
      "El proyecto supera 2 MiB. Eliminá entradas que ya hayas exportado antes de guardar.",
    );
  return raw;
}
export function decodeProject(
  raw: string,
  operations: OperationSpec[],
): Project {
  if (new TextEncoder().encode(raw).length > MAX_BYTES)
    fail("el límite es 2 MiB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail("el archivo no contiene JSON válido.");
  }
  const p = record(parsed, "proyecto");
  allowed(p, [
    "format",
    "version",
    "name",
    "updatedAt",
    "preferences",
    "active",
    "objects",
    "history",
  ]);
  if (p.format !== "NexoLineal.Project" || p.version !== 1)
    fail("formato o versión incompatibles.");
  const specs = new Map(operations.map((s) => [s.id, s]));
  function operation(x: unknown) {
    const op = text(x, "operación", 120);
    if (!specs.has(op))
      fail("la operación " + op + " no está disponible en esta versión.");
    return op;
  }
  function values(x: unknown, op: string) {
    const data = record(x, "entradas");
    const names = specs.get(op)!.fields.map((f) => f.name);
    allowed(data, names);
    const entries = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, text(v, "entrada " + k)]),
    );
    if (op === "sistemas.resolver" && entries.resultados === undefined) {
      entries.resultados = specs.get(op)!.fields.find((f) => f.name === "resultados")!.default;
    }
    return entries;
  }
  const prefs = record(p.preferences, "preferencias");
  allowed(prefs, ["mode", "theme"]);
  if (
    !["serio", "explorador"].includes(String(prefs.mode)) ||
    !["claro", "oscuro"].includes(String(prefs.theme))
  )
    fail("presentación o tema desconocidos.");
  const a = record(p.active, "trabajo activo");
  allowed(a, [
    "operation",
    "inputs",
    "step",
    "stepsOpen",
    "verificationOpen",
    "resumeResult",
  ]);
  const op = operation(a.operation),
    inputs = record(a.inputs, "entradas por operación");
  const restored = Object.fromEntries(
    Object.entries(inputs).map(([key, v]) => [operation(key), values(v, key)]),
  );
  if (
    !Number.isSafeInteger(a.step) ||
    Number(a.step) < 0 ||
    Number(a.step) > 250000
  )
    fail("paso fuera del intervalo admitido.");
  for (const key of ["stepsOpen", "verificationOpen", "resumeResult"])
    if (typeof a[key] !== "boolean") fail("falta el estado " + key + ".");
  if (
    !Array.isArray(p.objects) ||
    p.objects.length > 100 ||
    !Array.isArray(p.history) ||
    p.history.length > 100
  )
    fail("máximo 100 objetos y 100 entradas de historial.");
  const objects = p.objects.map((value: unknown) => {
    const v = record(value, "objeto");
    allowed(v, ["id", "name", "kind", "text", "ambient"]);
    if (!["matrix", "vector", "base", "function"].includes(String(v.kind)))
      fail("tipo de objeto desconocido.");
    if (
      v.ambient !== undefined &&
      (!Number.isInteger(v.ambient) ||
        Number(v.ambient) < 1 ||
        Number(v.ambient) > 20)
    )
      fail("dimensión ambiente inválida.");
    return {
      id: text(v.id, "id", 100),
      name: text(v.name, "nombre", 100),
      kind: v.kind as ObjectKind,
      text: text(v.text, "objeto"),
      ...(v.ambient === undefined ? {} : { ambient: Number(v.ambient) }),
    };
  });
  const history = p.history.map((value: unknown) => {
    const h = record(value, "historial");
    allowed(h, [
      "id",
      "date",
      "operation",
      "values",
      "label",
      "status",
      "favorite",
    ]);
    const op = operation(h.operation);
    if (typeof h.favorite !== "boolean") fail("favorito inválido.");
    const date = text(h.date, "fecha", 50);
    if (!Number.isFinite(Date.parse(date))) fail("fecha inválida.");
    return {
      id: text(h.id, "id", 100),
      date,
      operation: op,
      values: values(h.values, op),
      label: text(h.label, "etiqueta", 150),
      status: text(h.status, "estado", 100),
      favorite: h.favorite,
    };
  });
  for (const group of [objects, history])
    if (new Set(group.map((x) => x.id)).size !== group.length)
      fail("identificadores duplicados.");
  const updated = text(p.updatedAt, "fecha", 50);
  if (!Number.isFinite(Date.parse(updated)))
    fail("fecha de actualización inválida.");
  return {
    format: "NexoLineal.Project",
    version: 1,
    name: text(p.name, "nombre", 100),
    updatedAt: updated,
    preferences: prefs as unknown as Project["preferences"],
    active: {
      operation: op,
      inputs: restored,
      step: Number(a.step),
      stepsOpen: a.stepsOpen as boolean,
      verificationOpen: a.verificationOpen as boolean,
      resumeResult: a.resumeResult as boolean,
    },
    objects,
    history,
  };
}
export function addHistory(project: Project, entry: HistoryEntry): Project {
  if (project.history.length >= 100)
    throw new Error(
      "El historial llegó a 100 cálculos. Exportá el proyecto y eliminá entradas para guardar más.",
    );
  const next = { ...project, history: [entry, ...project.history] };
  encodeProject(next);
  return next;
}
export function searchable(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function supports(kind: string, obj: SavedObject) {
  return kind === "matrix"
    ? obj.kind === "matrix"
    : kind === "vector"
      ? obj.kind === "vector"
      : kind === "vectors"
        ? obj.kind === "base"
        : kind === "expression"
          ? obj.kind === "function"
          : false;
}
