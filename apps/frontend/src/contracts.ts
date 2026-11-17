export type Operation = string;
export interface FieldSpec {
  name: string;
  label: string;
  kind:
    | "matrix"
    | "vector"
    | "vectors"
    | "scalar"
    | "expression"
    | "integer"
    | "index"
    | "cuts"
    | "select"
    | "boolean";
  default: string;
  required: boolean;
  choices?: string[];
  when?: Record<string, string[]>;
}
export interface OperationSpec {
  id: string;
  title: string;
  category: string;
  fields: FieldSpec[];
  description: string;
}
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
  data: Record<string, unknown>;
  formula: string;
}
export interface CalculationResult {
  schema_version: "1.0";
  operation_id: string;
  input: Record<string, unknown>;
  status: string;
  result: Record<string, unknown> | null;
  steps: Step[];
  verification: Record<string, unknown>;
  warnings: string[];
  metadata: Record<string, unknown>;
  error: { code: string; message: string } | null;
}
export interface Engine {
  initialize(): Promise<void>;
  execute(
    problem: Problem,
    onProgress?: (value: number) => void,
  ): Promise<CalculationResult>;
  cancel(): Promise<void>;
  dispose(): void;
}
export function cancelled(problem: Problem): CalculationResult {
  return {
    schema_version: "1.0",
    operation_id: problem.operation_id,
    input: problem.input,
    status: "cancelled",
    result: null,
    steps: [],
    verification: {},
    warnings: [],
    metadata: { index_base: 0 },
    error: { code: "cancelled", message: "Cálculo cancelado." },
  };
}
export function requestId(): string {
  return (
    Date.now() +
    "-" +
    Array.from(crypto.getRandomValues(new Uint32Array(3))).join("-")
  );
}
