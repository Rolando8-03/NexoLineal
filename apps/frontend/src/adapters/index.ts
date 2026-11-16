import type { Engine } from "../contracts";
import { WebEngine } from "./web";
import { NativeEngine } from "./native";
export function createEngine(): Engine {
  return import.meta.env.VITE_TARGET === "windows" || import.meta.env.VITE_TARGET === "android"
    ? new NativeEngine() : new WebEngine();
}
