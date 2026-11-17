import type { Problem } from "../contracts";
export interface PlotSeries {
  label: string;
  kind: "line" | "points" | "polygon" | "vector";
  points: (string | number)[][];
  source: string;
}
export interface PlotFrame {
  step: number | null;
  row: number;
  values: Record<string, unknown>;
  series: PlotSeries[];
}
export interface Scene {
  version: 1;
  kind: string;
  reason?: string;
  title: string;
  dimension: 2 | 3;
  axes: string[];
  units: string;
  series: PlotSeries[];
  frames: PlotFrame[];
  notes: string[];
  alternative: string;
  expression?: string;
  range?: string[][];
}
export interface Theorem {
  id: string;
  title: string;
  statement: string;
  hypotheses: string[];
  operations: string[];
  reference: { title: string; url: string; section: string };
}
export interface Application {
  id: string;
  title: string;
  area: string;
  description: string;
  variables: { name: string; unit: string }[];
  equations: string[];
  restrictions: string[];
  problem: Problem;
  reference: string;
  origin: string;
}
