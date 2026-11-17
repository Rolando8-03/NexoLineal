import type { CalculationResult } from "../contracts";
import { saveDocument } from "../workspace/storage";
import fontUrl from "katex/dist/fonts/KaTeX_Main-Regular.ttf?url";
export function base64Bytes(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 32768)
    text += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(text);
}
function jsonLines(value: unknown) {
  return JSON.stringify(value, null, 2).split("\n");
}
export function procedureLines(
  response: CalculationResult,
  title: string,
): string[] {
  return [
    "NexoLineal · Procedimiento",
    title,
    "Operación: " + response.operation_id,
    "Estado: " + response.status,
    "Entradas",
    ...jsonLines(response.input),
    "Resultado",
    ...jsonLines(response.result),
    ...response.steps.flatMap((s, i) => [
      "Paso " + (i + 1) + ": " + s.description,
      ...(s.formula ? ["Fórmula (notación LaTeX): " + s.formula] : []),
      ...jsonLines(s.data),
    ]),
    "Comprobaciones",
    ...jsonLines(response.verification),
    "Advertencias",
    ...response.warnings,
    ...(response.error ? [response.error.message] : []),
    "Exactitud y método",
    ...jsonLines(
      Object.fromEntries(
        Object.entries(response.metadata).filter(
          ([key]) => !["visualization"].includes(key),
        ),
      ),
    ),
  ];
}
export function tableCsv(rows: Record<string, unknown>[]): string {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  function cell(value: unknown) {
    let text =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : value == null
          ? ""
          : String(value);
    // Evita fórmulas de hojas de cálculo sin convertir valores racionales a números JS.
    if (
      /^[\t\r\n ]*[=+@]/.test(text) ||
      (/^\s*-/.test(text) &&
        !/^\s*-[0-9]+(?:\/[0-9]+|\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\s*$/.test(text))
    )
      text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return (
    "\ufeff" +
    [
      keys.map(cell).join(","),
      ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
    ].join("\r\n") +
    "\r\n"
  );
}
export async function pdfBytes(
  response: CalculationResult,
  title: string,
): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ compress: true, putOnlyUsedFonts: true });
  const font = await fetch(fontUrl);
  if (!font.ok) throw new Error("No se pudo cargar la fuente del PDF.");
  doc.addFileToVFS(
    "NexoMain.ttf",
    base64Bytes(new Uint8Array(await font.arrayBuffer())),
  );
  doc.addFont("NexoMain.ttf", "NexoMain", "normal");
  doc.setFont("NexoMain");
  doc.setFontSize(10);
  // Los caracteres ajenos a la fuente se escriben con su escape Unicode visible:
  // no se pierde el dato ni se sustituye silenciosamente por un glifo vacío.
  const fontData = doc.getFont() as unknown as {
    metadata: { cmap: { unicode: { codeMap: Record<number, number> } } };
  };
  const map = fontData.metadata.cmap.unicode.codeMap;
  const visible = (text: string) =>
    Array.from(text, (c) =>
      map[c.codePointAt(0)!] || c === " "
        ? c
        : "\\u{" + c.codePointAt(0)!.toString(16) + "}",
    ).join("");
  let y = 18;
  for (const line of procedureLines(response, title)) {
    const wrapped = doc.splitTextToSize(visible(line), 176) as string[];
    for (const row of wrapped) {
      if (y > 278) {
        doc.addPage();
        y = 18;
      }
      doc.text(row, 17, y);
      y += 5;
    }
  }
  const count = doc.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`NexoLineal · ${i}/${count}`, 17, 290);
  }
  doc.setProperties({
    title: "NexoLineal · " + title,
    author: "NexoLineal",
    subject:
      "Entradas, resultado, procedimiento y comprobaciones de la misma ejecución",
  });
  return new Uint8Array(doc.output("arraybuffer"));
}
export async function exportPdf(response: CalculationResult, title: string) {
  return saveDocument(await pdfBytes(response, title), "pdf");
}
export async function exportCsv(response: CalculationResult) {
  const rows = response.result?.tabla;
  if (!Array.isArray(rows) || !rows.length)
    throw new Error("Este resultado no contiene una tabla con filas.");
  return saveDocument(
    new TextEncoder().encode(tableCsv(rows as Record<string, unknown>[])),
    "csv",
  );
}
