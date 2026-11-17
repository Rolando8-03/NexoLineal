/** Conversión exclusivamente para píxeles: los valores exactos permanecen en el resultado.
 * No se usa Number("p/q") ni se pasan enteros arbitrarios a float antes de dividir.
 */
export function coordinate(value: string | number): number {
  if (typeof value !== "number" && typeof value !== "string") return NaN;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))
    return Number(value);
  const match = value.match(/^(-?)(\d+)\/(\d+)$/);
  if (!match) return NaN;
  const numerator = match[2].replace(/^0+/, "") || "0",
    denominator = match[3].replace(/^0+/, "") || "0";
  if (denominator === "0") return NaN;
  if (numerator === "0") return 0;
  const leading = (digits: string) =>
    Number(digits.slice(0, 16)) / 10 ** (Math.min(16, digits.length) - 1);
  return (
    (((match[1] ? -1 : 1) * leading(numerator)) / leading(denominator)) *
    10 ** (numerator.length - denominator.length)
  );
}
