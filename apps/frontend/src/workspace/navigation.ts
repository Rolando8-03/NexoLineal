import type { OperationSpec } from "../contracts";
import { searchable } from "./project";
export const AREAS = [
  {
    name: "Sistemas",
    alias: "Sistemas estelares",
    icon: "◎",
    copy: "De las ecuaciones a todas sus soluciones.",
    terms: "gauss gauss jordan cramer lu plu ecuaciones",
  },
  {
    name: "Matrices",
    alias: "Álgebra en órbita",
    icon: "▦",
    copy: "Operaciones, propiedades y bloques.",
    terms: "producto suma multiplicar transpuesta escalonada rango rref ref",
  },
  {
    name: "Determinantes e inversas",
    alias: "Gravedad e inversas",
    icon: "◉",
    copy: "Métodos, condiciones y comprobaciones.",
    terms: "determinante sarrus adjugata cofactores invertir",
  },
  {
    name: "Vectores y espacios",
    alias: "Constelaciones vectoriales",
    icon: "↗",
    copy: "Generados, bases y coordenadas.",
    terms:
      "vector independencia dependiente nucleo imagen espacio interseccion dimension",
  },
  {
    name: "Transformaciones",
    alias: "Transformaciones cósmicas",
    icon: "⤨",
    copy: "Matrices que transforman el espacio.",
    terms: "lineal composicion dominio codominio representacion",
  },
  {
    name: "Métodos numéricos",
    alias: "Aterrizaje en raíces",
    icon: "⌁",
    copy: "Aproximaciones con criterios explícitos.",
    terms:
      "biseccion newton secante falsa posicion jacobi seidel raices funcion",
  },
  {
    name: "Herramientas",
    alias: "Caja de misión",
    icon: "◇",
    copy: "Cálculo, errores, bases y conjuntos.",
    terms:
      "calculadora integral derivada primitiva conversion binario octal hexadecimal conjunto errores porcentaje",
  },
] as const;
export function areaFor(category: string) {
  return AREAS.find((a) => a.name === category);
}
export function matches(op: OperationSpec, query: string) {
  const q = searchable(query).trim();
  return (
    !q ||
    q.split(/\s+/).every((term) =>
      searchable(
        [
          op.title,
          op.id,
          op.category,
          op.description,
          (
            {
              "sistemas.resolver": "gauss gauss jordan ecuaciones",
              "espacios.fundamentales": "núcleo columnas filas rango nulidad",
              "matrices.ref": "gauss forma escalonada",
              "matrices.rref": "gauss jordan forma escalonada reducida",
            } as Record<string, string>
          )[op.id],
        ].join(" "),
      ).includes(term),
    )
  );
}

export const systemMethods = [
  ["sistemas.resolver", "Gauss / Gauss-Jordan"],
  ["iterativos.jacobi", "Jacobi"],
  ["iterativos.gauss_seidel", "Gauss-Seidel"],
  ["sistemas.cramer", "Cramer"],
  ["sistemas.inversa", "Inversa"],
  ["factorizacion.lu", "LU"],
  ["factorizacion.plu", "PLU"],
] as const;
export const isSystemMethod = (id: string) =>
  systemMethods.some(([key]) => key === id);
export function familyOf(op: OperationSpec) {
  if (isSystemMethod(op.id)) return "Sistemas";
  if (op.id.startsWith("calculo.")) return "Cálculo";
  if (op.id.startsWith("calculadora.")) return "Calculadora";
  return op.category;
}
