import { PwaPanel } from "./distribution/PwaPanel";
import { LearningLibrary } from "./exploration/Learning";
import type { Theorem, Application } from "./exploration/types";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { createEngine } from "./adapters";
import type { CalculationResult, OperationSpec } from "./contracts";
import { initialValues, payload, fieldId } from "./FormFields";
import { WorkspacePanel, type ResultObject } from "./workspace/WorkspacePanel";
import { HistoryPanel, LibraryPanel } from "./workspace/Panels";
import { Dialog } from "./workspace/Dialog";
import { Observatory } from "./workspace/Observatory";
import { AREAS, areaFor } from "./workspace/navigation";
import {
  emptyProject,
  encodeProject,
  decodeProject,
  addHistory,
  id,
  supports,
  MAX_BYTES,
  type Project,
  type SavedObject,
  type HistoryEntry,
} from "./workspace/project";
import { validateFields } from "./workspace/validation";
import {
  loadState,
  saveState,
  exportFile,
  importNativeFile,
  isWeb,
  storageName,
} from "./workspace/storage";

type Route = "inicio" | "trabajo" | "historial" | "biblioteca" | string;
type Modal =
  | { kind: "object"; object: ResultObject }
  | { kind: "reuse"; object: SavedObject }
  | { kind: "json"; text: string; result?: boolean }
  | { kind: "new" }
  | null;
export function App() {
  const [engine] = useState(createEngine),
    [project, setProject] = useState(emptyProject),
    [operations, setOperations] = useState<OperationSpec[]>([]);
  const [theorems, setTheorems] = useState<Theorem[]>([]),
    [applications, setApplications] = useState<Application[]>([]);
  const [startup, setStartup] = useState("engine");
  const [ready, setReady] = useState(false),
    [hydrated, setHydrated] = useState(false),
    [blocked, setBlocked] = useState(false);
  const [navToken, setNavToken] = useState(0);
  const navFocusRequested = useRef(false);
  const [route, setRoute] = useState<Route>("inicio"),
    [menu, setMenu] = useState(false);
  const pendingOperation = useRef<string | null>(null);
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [result, setResult] = useState<CalculationResult | null>(null),
    [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [notice, setNotice] = useState(""),
    [saveStatus, setSaveStatus] = useState("Preparando cuaderno…");
  const [modal, setModal] = useState<Modal>(null),
    [modalName, setModalName] = useState(""),
    [modalText, setModalText] = useState(""),
    [modalError, setModalError] = useState(""),
    [undo, setUndo] = useState<Project | null>(null);
  const alive = useRef(true),
    running = useRef(false),
    initializing = useRef(false),
    current = useRef(project),
    nav = useRef<HTMLElement>(null),
    saveQueue = useRef<Promise<unknown>>(Promise.resolve()),
    saveSequence = useRef(0),
    saved = useRef("");
  current.current = project;
  const spec = operations.find((o) => o.id === project.active.operation),
    values = spec ? project.active.inputs[spec.id] || initialValues(spec) : {};
  const mode = project.preferences.mode,
    theme = project.preferences.theme;
  const update = (next: Project | ((p: Project) => Project)) =>
    setProject((p) => ({
      ...(typeof next === "function" ? next(p) : next),
      updatedAt: new Date().toISOString(),
    }));
  function setActive(patch: Partial<Project["active"]>) {
    update((p) => ({ ...p, active: { ...p.active, ...patch } }));
  }
  function navigate(next: Route) {
    navFocusRequested.current = true;
    setRoute(next);
    setMenu(false);
    window.scrollTo(0, 0);
    setNavToken((n) => n + 1);
  }
  function change(name: string, value: string) {
    if (running.current || !spec) return;
    update((p) => ({
      ...p,
      active: {
        ...p.active,
        inputs: {
          ...p.active.inputs,
          [spec.id]: {
            ...initialValues(spec),
            ...p.active.inputs[spec.id],
            [name]: value,
          },
        },
        resumeResult: false,
      },
    }));
    setResult(null);
    setError("");
    setErrors((e) => {
      const next = { ...e };
      delete next[name];
      return next;
    });
    setUndo(null);
  }
  function choose(operation: string) {
    if (!ready) {
      pendingOperation.current = operation;
      navigate("trabajo");
      return;
    }
    if (running.current) return;
    const chosen = operations.find((o) => o.id === operation);
    if (!chosen) return;
    update((p) => ({
      ...p,
      active: {
        ...p.active,
        operation,
        inputs: {
          ...p.active.inputs,
          [operation]: p.active.inputs[operation] || initialValues(chosen),
        },
        step: 0,
        stepsOpen: false,
        verificationOpen: false,
        resumeResult: false,
      },
    }));
    setResult(null);
    setError("");
    setErrors({});
    navigate("trabajo");
  }
  async function persist(p = current.current) {
    let raw: string;
    try {
      raw = encodeProject(p);
    } catch (e) {
      setSaveStatus(String((e as Error).message));
      return;
    }
    const sequence = ++saveSequence.current;
    setSaveStatus("Guardando…");
    const task = saveQueue.current.catch(() => {}).then(() => saveState(raw));
    saveQueue.current = task;
    try {
      await task;
      saved.current = raw;
      if (alive.current) {
        setBlocked(false);
        if (sequence === saveSequence.current) {
          try {
            setSaveStatus(
              raw === encodeProject(current.current)
                ? "Guardado en " + storageName
                : "Cambios pendientes…",
            );
          } catch (e) {
            setSaveStatus((e as Error).message);
          }
        }
      }
    } catch (e) {
      if (alive.current)
        setSaveStatus("No se pudo guardar. " + String((e as Error).message));
    }
  }
  async function calculateProblem(
    p: Project,
    append: boolean,
    preserveStep = false,
  ) {
    const s = operations.find((o) => o.id === p.active.operation);
    if (!s) return;
    running.current = true;
    setBusy(true);
    setProgress(0);
    setResult(null);
    setError("");
    try {
      const vals = p.active.inputs[s.id] || initialValues(s);
      const response = await engine.execute(
        {
          schema_version: "1.0",
          operation_id: s.id,
          input: payload(s, vals),
          options: { include_visualization: true },
        },
        (n) => {
          if (alive.current) setProgress(n);
        },
      );
      if (!alive.current) return;
      setResult(response);
      let next = {
        ...current.current,
        active: {
          ...current.current.active,
          inputs: { ...current.current.active.inputs, [s.id]: { ...vals } },
          step: preserveStep
            ? Math.min(p.active.step, Math.max(0, response.steps.length - 1))
            : 0,
          resumeResult: response.status !== "cancelled",
        },
      };
      if (append) {
        try {
          next = addHistory(next, {
            id: id(),
            date: new Date().toISOString(),
            operation: s.id,
            values: { ...vals },
            label: s.title,
            status: response.status,
            favorite: false,
          });
        } catch (e) {
          setNotice((e as Error).message);
        }
      }
      update(next);
      return response;
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      running.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function initialize() {
    if (initializing.current) return;
    initializing.current = true;
    setError("");
    setReady(false);
    try {
      setStartup("engine");
      await engine.initialize();
      setStartup("catalog");
      const response = await engine.execute({
        schema_version: "1.0",
        operation_id: "catalogo.operaciones",
        input: {},
      });
      if (
        response.status !== "ok" ||
        !Array.isArray(response.result?.operations)
      )
        throw new Error("No se pudo cargar el catálogo.");
      const ops = response.result.operations as OperationSpec[];
      if (!alive.current) return;
      setOperations(ops);
      setTheorems((response.result?.theorems || []) as Theorem[]);
      setApplications((response.result?.applications || []) as Application[]);
      setStartup("load-project");
      let restored = emptyProject();
      try {
        const raw = await loadState();
        if (raw) {
          restored = decodeProject(raw, ops);
          saved.current = encodeProject(restored);
        }
        setSaveStatus("Guardado local disponible");
      } catch (e) {
        setBlocked(true);
        setSaveStatus(
          "No se pudo recuperar el guardado. La copia existente no se sobrescribió.",
        );
        setNotice((e as Error).message);
      }
      current.current = restored;
      setProject(restored);
      setHydrated(true);
      if (restored.active.resumeResult) {
        setStartup("restore-result");
        running.current = true;
        setBusy(true);
        const s = ops.find((o) => o.id === restored.active.operation)!;
        try {
          const r = await engine.execute({
            schema_version: "1.0",
            operation_id: s.id,
            input: payload(s, restored.active.inputs[s.id] || initialValues(s)),
            options: { include_visualization: true },
          });
          if (alive.current) {
            setResult(r);
            setProject((p) => ({
              ...p,
              active: {
                ...p.active,
                step: Math.min(p.active.step, Math.max(0, r.steps.length - 1)),
              },
            }));
          }
        } finally {
          running.current = false;
          setBusy(false);
        }
      }
      if (alive.current) {
        setStartup("ready");
        setReady(true);
      }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      initializing.current = false;
    }
  }
  useEffect(() => {
    alive.current = true;
    void initialize();
    return () => {
      alive.current = false;
      engine.dispose();
    };
  }, [engine]);
  useEffect(() => {
    if (!hydrated || blocked) return;
    let raw: string;
    try {
      raw = encodeProject(project);
    } catch (e) {
      setSaveStatus((e as Error).message);
      return;
    }
    if (raw === saved.current) {
      setSaveStatus("Guardado en " + storageName);
      return;
    }
    setSaveStatus("Cambios pendientes…");
    const timer = setTimeout(() => void persist(project), 180);
    return () => clearTimeout(timer);
  }, [project, hydrated, blocked]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!blocked) void persist();
      }
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
        setMenu(false);
        if (menu) document.getElementById("menu-toggle")?.focus();

      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [menu, blocked]);
  useEffect(() => {
    if (!hydrated || blocked) return;
    const flush = () => {
      if (document.visibilityState === "hidden") void persist();
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [hydrated, blocked]);
  useEffect(() => {
    if (import.meta.env.VITE_TARGET !== "android") return;
    const back = () => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (dialog) {
        dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
        return;
      }
      if (menu) {
        setMenu(false);
        return;
      }
      if (route !== "inicio") {
        navigate("inicio");
        return;
      }
      // El guardado se solicita antes de mandar la actividad a segundo plano.
      void (async () => {
        if (hydrated && !blocked) await persist();
        const { registerPlugin } = await import("@capacitor/core");
        await registerPlugin<{ background(): Promise<void> }>(
          "NexoEngine",
        ).background();
      })();
    };
    document.addEventListener("nexo-back", back);
    return () => document.removeEventListener("nexo-back", back);
  }, [menu, route, hydrated, blocked]);
  useLayoutEffect(() => {
    if (navFocusRequested.current) {
      navFocusRequested.current = false;
      [...document.querySelectorAll<HTMLElement>("main h1,#operacion-titulo")]
        .find((el) => el.offsetParent !== null)
        ?.focus();
    }
  }, [navToken]);
  useEffect(() => {
    if (menu)
      nav.current?.querySelector<HTMLElement>("a[href],button")?.focus();
  }, [menu]);
  async function calculate(e: FormEvent) {
    e.preventDefault();
    if (!ready || running.current || !spec) return;
    const found = validateFields(spec, values);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => {
        const field = document.querySelector<HTMLElement>(".augmented-grid input[aria-invalid=true]")
          || document.getElementById(fieldId(Object.keys(found)[0]));
        field?.focus();
      });
      return;
    }
    await calculateProblem(current.current, true);
  }
  async function cancel() {
    try {
      await engine.cancel();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function openObject(object: ResultObject) {
    setModal({ kind: "object", object });
    setModalName(object.name.replace(/[:?]/g, "").slice(0, 90));
    setModalError("");
  }
  function saveObject() {
    if (modal?.kind !== "object") return;
    const name = modalName.trim();
    if (!name) {
      setModalError("Dale un nombre al objeto.");
      return;
    }
    if (
      project.objects.some(
        (o) => o.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"),
      )
    ) {
      setModalError("Ya hay un objeto con ese nombre.");
      return;
    }
    if (project.objects.length >= 100) {
      setModalError("El máximo es de 100 objetos por proyecto.");
      return;
    }
    const next = {
      ...project,
      objects: [...project.objects, { ...modal.object, id: id(), name }],
    };
    try {
      encodeProject(next);
    } catch (e) {
      setModalError((e as Error).message);
      return;
    }
    update(next);
    setModal(null);
    setNotice("Objeto guardado: " + name);
  }
  function reuse(field: string, object: SavedObject) {
    change(field, object.text);
    if (
      object.ambient &&
      spec?.fields.some((f) => f.name === "dimension_ambiente")
    )
      change("dimension_ambiente", String(object.ambient));
    setModal(null);
    navigate("trabajo");
  }
  const candidates: ResultObject[] = [];
  if (result?.result) {
    for (const key of [
      "matrix",
      "vector",
      "base",
      "base_columna",
      "base_fila",
      "base_nucleo",
      "base_imagen",
      "base_generado",
      "base_suma",
      "base_interseccion",
    ]) {
      const value = result.result[key];
      if (!Array.isArray(value)) continue;
      const kind =
        key === "matrix" ? "matrix" : key === "vector" ? "vector" : "base";
      const valid =
        kind === "vector"
          ? value.every((x) => typeof x === "string")
          : value.every(
              (row) =>
                Array.isArray(row) && row.every((x) => typeof x === "string"),
            );
      if (!valid) continue;
      const text =
        kind === "vector"
          ? value.join(" ")
          : value.length
            ? value.map((v) => (v as string[]).join(" ")).join("\n")
            : "[]";
      const ambient = Number(
        result.result[
          key === "base_columna" || key === "base_imagen"
            ? "dimension_codominio"
            : key === "base_fila" || key === "base_nucleo"
              ? "dimension_dominio"
              : "dimension_ambiente"
        ],
      );
      candidates.push({
        name:
          (
            {
              matrix: "Matriz resultado",
              vector: "Vector resultado",
              base: "Base",
              base_columna: "Base del espacio columna",
              base_fila: "Base del espacio fila",
              base_nucleo: "Base del núcleo",
              base_imagen: "Base de la imagen",
              base_generado: "Base del generado",
              base_suma: "Base de la suma",
              base_interseccion: "Base de la intersección",
            } as Record<string, string>
          )[key] + (result.metadata.exact === false ? " (aproximado)" : ""),
        kind,
        text,
        ...(Number.isInteger(ambient) && ambient > 0 && ambient <= 20
          ? { ambient }
          : {}),
      });
    }
  }
  async function repeat(h: HistoryEntry, again: boolean) {
    if (running.current) return;
    const next = {
      ...project,
      active: {
        ...project.active,
        operation: h.operation,
        inputs: { ...project.active.inputs, [h.operation]: { ...h.values } },
        step: 0,
        stepsOpen: false,
        verificationOpen: false,
        resumeResult: false,
      },
    };
    current.current = next;
    update(next);
    setResult(null);
    setErrors({});
    setError("");
    navigate("trabajo");
    if (again) await calculateProblem(next, true);
  }
  async function applyImport(raw: string) {
    try {
      const next = decodeProject(raw, operations);
      setUndo(project);
      current.current = next;
      setProject(next);
      setBlocked(false);
      setResult(null);
      setErrors({});
      setError("");
      setModal(null);
      navigate("trabajo");
      const checked = next.active.resumeResult
        ? await calculateProblem(next, false, true)
        : null;
      setNotice(
        !next.active.resumeResult
          ? "Proyecto importado con sus datos y preferencias."
          : checked
            ? "Proyecto importado. Los resultados se comprobaron de nuevo con el motor actual."
            : "Proyecto importado. No se pudo recalcular: revisá el mensaje del motor.",
      );
    } catch (e) {
      setModalError((e as Error).message);
      setNotice((e as Error).message);
    }
  }
  async function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setNotice("El archivo supera 2 MiB.");
      return;
    }
    await applyImport(await file.text());
  }
  async function importNative() {
    try {
      const content = await importNativeFile();
      if (content !== null) await applyImport(content);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function exportProject() {
    let raw: string;
    try {
      raw = encodeProject(project);
    } catch (e) {
      setNotice((e as Error).message);
      return;
    }
    try {
      if (await exportFile(raw)) setNotice("Proyecto exportado.");
    } catch (e) {
      setModal({ kind: "json", text: raw });
      setModalText(raw);
      setModalError(
        "No se pudo guardar el archivo. Podés copiar el JSON. " +
          (e as Error).message,
      );
    }
  }
  async function exportResult() {
    if (!result) return;
    const raw = JSON.stringify(result, null, 2);
    if (isWeb()) {
      await exportFile(raw, "nexolineal-resultado.json");
    } else {
      setModal({ kind: "json", text: raw, result: true });
      setModalText(raw);
      setModalError("");
    }
  }
  async function copyJson() {
    try {
      await navigator.clipboard.writeText(modalText);
      setNotice("JSON copiado.");
    } catch {
      const field =
        document.querySelector<HTMLTextAreaElement>("#project-json");
      field?.focus();
      field?.select();
      setModalError(
        "El permiso del portapapeles no está disponible. El texto quedó seleccionado para copiarlo.",
      );
    }
  }
  useEffect(() => {
    if (ready && pendingOperation.current) {
      const operation = pendingOperation.current;
      pendingOperation.current = null;
      choose(operation);
    }
  }, [ready]);
  const workspaceVisible = route === "trabajo";
  const routes = [
    { id: "inicio", name: "Inicio", icon: "⌂" },
    ...AREAS.map((a) => ({ id: a.name, name: a.name, icon: a.icon })),
    { id: "historial", name: "Historial y proyectos", icon: "◷" },
    { id: "biblioteca", name: "Biblioteca y ayuda", icon: "▧" },
  ];
  return (
    <div
      className={"app " + mode + " theme-" + theme}
      data-mode={mode}
      data-theme={theme}
      data-startup={startup}
      data-route={route}
    >
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside
        className={"sidebar " + (menu ? "is-open" : "")}
        ref={nav}
        onKeyDown={(e) => {
          if (e.key === "Tab" && menu) {
            const els = [
              ...nav.current!.querySelectorAll<HTMLElement>(
                "a[href],button:not([disabled])",
              ),
            ].filter((el) => el.offsetParent !== null);
            if (e.shiftKey && document.activeElement === els[0]) {
              e.preventDefault();
              els.at(-1)?.focus();
            } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
              e.preventDefault();
              els[0]?.focus();
            }
          }
        }}
      >
        <a
          href="#inicio"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("inicio");
          }}
        >
          <img src="./icono.ico" alt="" />
          <span>
            NexoLineal<small>Un espacio para entender</small>
          </span>
        </a>
        <button
          className="drawer-close icon-button"
          aria-label="Cerrar menú"
          onClick={() => {
            setMenu(false);
            document.getElementById("menu-toggle")?.focus();
          }}
        >
          ×
        </button>
        <span className="nav-label">EXPLORÁ TU CUADERNO</span>
        <nav aria-label="Menú principal">
          {routes.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-current={route === r.id ? "page" : undefined}
              data-route={r.id}
              onClick={() => navigate(r.id)}
            >
              <span aria-hidden="true">{r.icon}</span>
              <span>{r.name}</span>
              {r.id === "historial" && !!project.history.length && (
                <small>{project.history.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="local-dot" />
          Tu trabajo se guarda en este dispositivo.
          <small>NexoLineal · 0.8.0</small>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-scrim"
          aria-label="Cerrar navegación"
          tabIndex={-1}
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-body">
        <header className="topbar">
          <button
            id="menu-toggle"
            className="icon-button mobile-menu"
            aria-label="Abrir menú principal"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            ☰
          </button>
          <a className="orbit-brand" href="#inicio" onClick={e => {e.preventDefault(); navigate("inicio");}}>
            <span className="planet-logo" aria-hidden="true">🪐</span> NexoLineal
          </a>
          <nav className="quick-nav" aria-label="Accesos directos">
            {([["inicio","Inicio"], ["trabajo","Consola"], ["Herramientas","Herramientas"], ["biblioteca","Biblioteca"], ["historial","Historial"]]).map(([to,label]) =>
              <button key={to} aria-current={route === to ? "page" : undefined} onClick={() => navigate(to)}>{label}</button>)}
          </nav>
          <div className="preferences">
            <div className="mode" role="group" aria-label="Presentación">
              <button
                id="modo-serio"
                aria-pressed={mode === "serio"}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    preferences: { ...p.preferences, mode: "serio" },
                  }))
                }
              >
                Serio
              </button>
              <button
                id="modo-explorador"
                aria-pressed={mode === "explorador"}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    preferences: { ...p.preferences, mode: "explorador" },
                  }))
                }
              >
                Explorador
              </button>
            </div>
            <div className="theme" role="group" aria-label="Tema">
              <button
                id="tema-claro"
                aria-pressed={theme === "claro"}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    preferences: { ...p.preferences, theme: "claro" },
                  }))
                }
              >
                Claro
              </button>
              <button
                id="tema-oscuro"
                aria-pressed={theme === "oscuro"}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    preferences: { ...p.preferences, theme: "oscuro" },
                  }))
                }
              >
                Oscuro
              </button>
            </div>
          </div>
        </header>
        <div
          hidden={route === "inicio" && !blocked}
          className="save-strip"
          role="region"
          aria-label="Estado del cuaderno"
        >
          <span>{project.name || "Cuaderno sin nombre"}</span>
          <span id="estado-guardado" role="status">
            {saveStatus}
          </span>
          {blocked && (
            <button
              className="text-button"
              onClick={() => {
                setBlocked(false);
                void persist();
              }}
            >
              Guardar el cuaderno actual
            </button>
          )}
        </div>
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            {undo && (
              <button
                className="text-button"
                onClick={() => {
                  const previous = undo;
                  setUndo(null);
                  current.current = previous;
                  setProject(previous);
                  setResult(null);
                  if (previous.active.resumeResult)
                    void calculateProblem(previous, false, true);
                }}
              >
                Deshacer importación
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Cerrar aviso"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        {!workspaceVisible && route !== "inicio" && (
          <div
            className="active-problem"
            role="region"
            aria-label="Ejercicio activo"
          >
            <div>
              <span className="eyebrow">EJERCICIO ACTIVO</span>
              <strong>{spec?.title || "Cargando…"}</strong>
              <span className="active-expression">
                {values.expresion ||
                  values.A ||
                  values.v ||
                  "Tus datos permanecen en el área de trabajo."}
              </span>
            </div>
            <button className="secondary" onClick={() => navigate("trabajo")}>
              Volver al cálculo
            </button>
            <details>
              <summary>Ver datos activos</summary>
              {Object.entries(values)
                .filter(([, v]) => v.trim())
                .map(([name, value]) => (
                  <div key={name}>
                    <strong>
                      {spec?.fields.find((f) => f.name === name)?.label || name}
                    </strong>
                    <pre>{value}</pre>
                  </div>
                ))}
            </details>
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {route === "inicio" && <>
            <Observatory explorer={mode === "explorador"}
              resume={project.active.inputs[project.active.operation] || project.active.resumeResult ? spec?.title : undefined}
              navigate={navigate} choose={choose} />
            {error && !ready && <p role="alert">{error} <button className="secondary" onClick={() => void initialize()}>Reintentar</button></p>}
          </>}
          {AREAS.some((a) => a.name === route) && (
            <section className="panel page-panel">
              <span className="eyebrow">
                {mode === "explorador"
                  ? areaFor(route)?.alias
                  : "ELEGÍ UNA OPERACIÓN"}
              </span>
              <h1 tabIndex={-1}>{route}</h1>
              <p className="help">
                {areaFor(route)?.copy} Todas las operaciones listadas están
                disponibles.
              </p>
              <div className="operation-list">
                {operations
                  .filter((o) => o.category === route)
                  .map((o) => (
                    <button
                      key={o.id}
                      className="operation-choice"
                      disabled={busy}
                      onClick={() => choose(o.id)}
                    >
                      <strong>{o.title}</strong>
                      <span>{o.description}</span>
                      <small>Disponible →</small>
                    </button>
                  ))}
              </div>
            </section>
          )}
          <div hidden={!workspaceVisible}>
            {route === "trabajo" && (
              <h1 className="sr-only" tabIndex={-1}>
                Área de trabajo
              </h1>
            )}
            <WorkspacePanel
              theorems={theorems}
              operations={operations}
              spec={spec}
              operation={project.active.operation}
              values={values}
              ready={ready}
              busy={busy}
              progress={progress}
              result={result}
              error={error}
              errors={errors}
              active={project.active}
              objects={project.objects}
              candidates={candidates}
              choose={choose}
              change={change}
              calculate={(e) => void calculate(e)}
              cancel={() => void cancel()}
              retry={() => void initialize()}
              setActive={setActive}
              exportResult={() => void exportResult()}
              saveObject={openObject}
              reuse={reuse}
            />
          </div>
          {route === "historial" && (
            <HistoryPanel
              project={project}
              operations={operations}
              busy={busy}
              name={(name) => update((p) => ({ ...p, name }))}
              favorite={(entry) =>
                update((p) => ({
                  ...p,
                  history: p.history.map((h) =>
                    h.id === entry ? { ...h, favorite: !h.favorite } : h,
                  ),
                }))
              }
              edit={(h, again) => void repeat(h, again)}
              remove={(entry) =>
                update((p) => ({
                  ...p,
                  history: p.history.filter((h) => h.id !== entry),
                }))
              }
              exportProject={() => void exportProject()}
              importFile={(e) => void readFile(e)}
              importNative={() => void importNative()}
              json={() => {
                try {
                  const raw = encodeProject(project);
                  setModal({ kind: "json", text: raw });
                  setModalText(raw);
                  setModalError("");
                } catch (e) {
                  setNotice((e as Error).message);
                }
              }}
              newProject={() => setModal({ kind: "new" })}
              save={() => void persist()}
            />
          )}
          {route === "biblioteca" && (
            <>
              <LibraryPanel
                project={project}
                operations={operations}
                busy={busy}
                choose={choose}
                reuse={(object) => {
                  setModal({ kind: "reuse", object });
                  setModalError("");
                }}
                remove={(object) =>
                  update((p) => ({
                    ...p,
                    objects: p.objects.filter((o) => o.id !== object),
                  }))
                }
              />
              <LearningLibrary
                theorems={theorems}
                applications={applications}
                busy={busy || !ready}
                choose={(prefix) => {
                  const op = operations.find((o) => o.id.startsWith(prefix));
                  if (op) choose(op.id);
                }}
                load={(app) => {
                  const spec = operations.find(
                    (o) => o.id === app.problem.operation_id,
                  );
                  if (!spec) return;
                  const values = {
                    ...initialValues(spec),
                    ...Object.fromEntries(
                      Object.entries(app.problem.input).map(([k, v]) => [
                        k,
                        String(v),
                      ]),
                    ),
                  };
                  void repeat(
                    {
                      id: id(),
                      date: new Date().toISOString(),
                      operation: spec.id,
                      values,
                      label: app.title,
                      status: "ok",
                      favorite: false,
                    },
                    true,
                  );
                }}
              />
            </>
          )}
        </main>
        <PwaPanel busy={busy} />
        <footer className="app-footer">
          <span>NexoLineal · Álgebra lineal</span>
          <span>Grupo 4</span>
        </footer>
      </div>
      {modal && (
        <Dialog
          title={
            modal.kind === "object"
              ? "Guardar objeto"
              : modal.kind === "reuse"
                ? "¿Dónde querés usar este objeto?"
                : modal.kind === "new"
                  ? "Crear un cuaderno nuevo"
                  : modal.result
                    ? "JSON del resultado"
                    : "Proyecto JSON versionado"
          }
          onClose={() => setModal(null)}
        >
          {modal.kind === "object" && (
            <>
              <label htmlFor="object-name">Nombre del objeto</label>
              <input
                id="object-name"
                autoFocus
                maxLength={100}
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
              />
              <pre className="object-preview">{modal.object.text}</pre>
              <p className="help">
                Se conserva el texto exacto. La validez matemática se comprueba
                al calcular.
              </p>
              <button
                id="confirmar-objeto"
                className="primary"
                onClick={saveObject}
              >
                Guardar objeto
              </button>
            </>
          )}
          {modal.kind === "reuse" && (
            <>
              <p>
                Usar «{modal.object.name}» en {spec?.title}:
              </p>
              <div className="object-actions">
                {spec?.fields
                  .filter((f) => supports(f.kind, modal.object))
                  .map((f) => (
                    <button
                      className="secondary"
                      key={f.name}
                      onClick={() => reuse(f.name, modal.object)}
                    >
                      {f.label}
                    </button>
                  ))}
              </div>
              {!spec?.fields.some((f) => supports(f.kind, modal.object)) && (
                <p className="help">
                  La operación activa no usa este tipo de objeto. Elegí primero
                  una operación compatible.
                </p>
              )}
            </>
          )}
          {modal.kind === "json" && (
            <>
              <label htmlFor="project-json">
                {modal.result
                  ? "Resultado completo"
                  : "Contenido del proyecto · versión 1"}
              </label>
              <textarea
                id="project-json"
                rows={12}
                value={modalText}
                readOnly={modal.result}
                onChange={(e) => setModalText(e.target.value)}
                spellCheck={false}
              />
              <div className="actions">
                <button className="secondary" onClick={() => void copyJson()}>
                  Copiar JSON
                </button>
                {!modal.result && (
                  <button
                    id="importar-json"
                    className="primary"
                    disabled={busy || !ready}
                    onClick={() => void applyImport(modalText)}
                  >
                    Importar este proyecto
                  </button>
                )}
              </div>
              <p className="help">
                {modal.result
                  ? "Incluye datos, pasos y comprobaciones del motor."
                  : "Se valida el archivo completo antes de reemplazar el cuaderno. Los resultados se vuelven a calcular."}
              </p>
            </>
          )}
          {modal.kind === "new" && (
            <>
              <p>
                El cuaderno actual se reemplazará. Podés exportarlo antes para
                conservarlo.
              </p>
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => void exportProject()}
                >
                  Exportar primero
                </button>
                <button
                  id="confirmar-nuevo"
                  className="primary"
                  onClick={() => {
                    const next = emptyProject();
                    next.preferences = project.preferences;
                    setUndo(project);
                    current.current = next;
                    setProject(next);
                    setResult(null);
                    setModal(null);
                    setErrors({});
                    setError("");
                    navigate("inicio");
                    setNotice("Cuaderno nuevo. Podés deshacer este cambio.");
                  }}
                >
                  Crear cuaderno
                </button>
              </div>
            </>
          )}
          {modalError && (
            <p className="error" role="alert">
              {modalError}
            </p>
          )}
        </Dialog>
      )}
    </div>
  );
}
