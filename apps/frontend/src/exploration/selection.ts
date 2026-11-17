import { createContext } from "react";
/** La tabla, el procedimiento y la gráfica comparten el mismo índice del resultado. */
export const IterationSelection = createContext<{
  selected: number | null;
  select: (row: number) => void;
}>({ selected: null, select: () => {} });
