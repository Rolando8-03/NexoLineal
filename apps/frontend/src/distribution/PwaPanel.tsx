import { useEffect, useState, useRef } from "react";
const WEB = !["windows", "android"].includes(
  import.meta.env.VITE_TARGET || "web",
);
export function PwaPanel({ busy }: { busy: boolean }) {
  const [state, setState] = useState("Disponible con conexión"),
    [working, setWorking] = useState(false),
    [available, setAvailable] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  function watch(reg: ServiceWorkerRegistration) {
    registration.current = reg;
    const update = () => {
      if (reg.waiting) {
        setAvailable(true);
        setWorking(false);
        setState(
          "Actualización lista. Guardá y cerrá todas las pestañas de NexoLineal para aplicarla.",
        );
      } else if (reg.active) {
        setAvailable(true);
        setWorking(false);
        setState("Disponible sin conexión en este navegador.");
      }
    };
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      if (worker)
        worker.addEventListener("statechange", () => {
          if (worker.state === "redundant") {
            setWorking(false);
            setState(
              "No se completó la descarga. Conservás tu versión anterior.",
            );
          } else update();
        });
    });
    update();
    if (reg.installing) {
      const worker = reg.installing;
      worker.addEventListener("statechange", () => {
        if (worker.state === "redundant") {
          setWorking(false);
          setState(
            "No se completó la descarga. Conservás tu versión anterior.",
          );
        } else update();
      });
    }
  }
  useEffect(() => {
    if (!WEB || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistration(new URL("./", location.href).href)
      .then((reg) => {
        if (reg) watch(reg);
      })
      .catch(() => {});
    const progress = (event: MessageEvent) => {
      if (event.data?.type === "NEXO_DOWNLOAD") {
        setWorking(true);
        setState(
          "Descargando para usar sin conexión: " +
            Math.round((event.data.done / event.data.total) * 100) +
            " %.",
        );
      }
    };
    const controlled = () => {
      setWorking(false);
      setAvailable(true);
      setState("Disponible sin conexión en este navegador.");
    };
    navigator.serviceWorker.addEventListener("message", progress);
    navigator.serviceWorker.addEventListener("controllerchange", controlled);
    return () => {
      navigator.serviceWorker.removeEventListener("message", progress);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controlled,
      );
    };
  }, []);
  if (!WEB) return null;
  async function prepare() {
    if (!("serviceWorker" in navigator)) {
      setState("Este navegador no permite preparar el modo sin conexión.");
      return;
    }
    setWorking(true);
    setState("Preparando la descarga del programa y su motor…");
    try {
      if (registration.current) {
        await registration.current.update();
        setWorking(false);
        if (!registration.current.waiting)
          setState("Versión instalada disponible sin conexión.");
      } else
        watch(
          await navigator.serviceWorker.register(
            new URL("sw.js", location.href),
            { scope: "./", updateViaCache: "none" },
          ),
        );
    } catch {
      setWorking(false);
      setState(
        "No se pudo completar la descarga. Conectate y volvé a intentarlo.",
      );
    }
  }
  return (
    <section className="offline-panel" aria-label="Uso sin conexión">
      <p id="offline-status" role="status">
        {state}
      </p>
      <button
        type="button"
        className="secondary"
        id="preparar-offline"
        disabled={busy || working}
        onClick={() => void prepare()}
      >
        {working
          ? "Descargando…"
          : available
            ? "Buscar actualizaciones"
            : "Descargar para usar sin conexión"}
      </button>
      <p className="help">
        La primera descarga incluye el motor Python. Después podés volver a
        abrir y calcular sin red. El historial se guarda en este navegador.
      </p>
    </section>
  );
}
