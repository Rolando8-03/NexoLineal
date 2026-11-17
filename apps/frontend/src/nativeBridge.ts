/** pywebview publica el objeto antes de completar sus métodos; esperar el contrato. */
export async function waitForWindowsMethods<T>(
  methods: readonly string[],
): Promise<{ api: T }> {
  for (let attempt = 0; attempt < 300; attempt++) {
    const api = (
      window as unknown as { pywebview?: { api?: Record<string, unknown> } }
    ).pywebview?.api;
    if (api && methods.every((name) => typeof api[name] === "function"))
      return { api: api as T };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    "El puente de Windows no está listo. Volvé a intentar iniciar la aplicación.",
  );
}
