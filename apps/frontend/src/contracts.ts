export type Operation = "matrices.producto" | "calculadora.evaluar" | "calculo.definida" | "calculo.derivar";
export interface Problem {
  schema_version: "1.0";
  operation_id: Operation;
  input: Record<string, unknown>;
  options?: { include_steps?: boolean };
}
export interface Step {
  id: number;
  kind: string;
  description: string;
  data: { fila?: number; columna?: number; resultado?: string; terminos?: { a: string; b: string; producto: string }[] };
  formula: string;
}
export interface CalculationResult {
  schema_version: "1.0";
  operation_id: string;
  input: Record<string, unknown>;
  status: string;
  result: { matrix?: string[][]; valor?: string; expresion?: string; exactitud?: string } | null;
  steps: Step[];
  verification: Record<string, unknown>;
  warnings: string[];
  metadata: Record<string, unknown>;
  error: { code: string; message: string } | null;
}
export interface Engine {
  initialize(): Promise<void>;
  execute(problem: Problem, onProgress?: (value: number) => void): Promise<CalculationResult>;
  cancel(): Promise<void>;
  dispose(): void;
}
export function cancelled(problem: Problem): CalculationResult {
  return { schema_version: "1.0", operation_id: problem.operation_id, input: problem.input,
    status: "cancelled", result: null, steps: [], verification: {}, warnings: [],
    metadata: { index_base: 0 }, error: { code: "cancelled", message: "Cálculo cancelado." } };
}
export function requestId(): string {
  return Date.now() + "-" + Array.from(crypto.getRandomValues(new Uint32Array(3))).join("-");
}
