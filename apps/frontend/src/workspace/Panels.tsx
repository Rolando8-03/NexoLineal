import { useState, type ChangeEvent } from "react";
import type { OperationSpec } from "../contracts";
import type { Project, SavedObject, HistoryEntry } from "./project";
import { searchable } from "./project";
import { isWeb, storageName } from "./storage";
const STATUS: Record<string, string> = {
  ok: "Finalizado",
  infinite: "Infinitas soluciones",
  inconsistent: "Sin solución",
  invalid_input: "Datos por revisar",
  domain_error: "Dominio no admitido",
  singular: "Matriz singular",
  not_applicable: "Método no aplicable",
  iteration_limit: "Límite de iteraciones",
  limit_reached: "Límite de cálculo",
  stagnated: "Estancamiento",
  cycle_detected: "Ciclo detectado",
  breakdown: "Método detenido",
  cancelled: "Cancelado",
  non_convergent: "No convergió",
  internal_error: "Revisar cálculo",
};
interface HistoryProps {
  project: Project;
  operations: OperationSpec[];
  busy: boolean;
  name: (s: string) => void;
  favorite: (id: string) => void;
  edit: (h: HistoryEntry, repeat: boolean) => void;
  remove: (id: string) => void;
  exportProject: () => void;
  importFile: (event: ChangeEvent<HTMLInputElement>) => void;
  importNative: () => void;
  json: () => void;
  newProject: () => void;
  save: () => void;
}
export function HistoryPanel(p: HistoryProps) {
  const [query, setQuery] = useState(""),
    [onlyFavorites, setOnlyFavorites] = useState(false);
  const history = p.project.history.filter(
    (h) =>
      (!onlyFavorites || h.favorite) &&
      searchable(
        h.label + " " + h.operation + " " + Object.values(h.values).join(" "),
      ).includes(searchable(query)),
  );
  return (
    <section className="panel page-panel" aria-labelledby="history-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">TU CUADERNO</span>
          <h1 id="history-title" tabIndex={-1}>
            Historial y proyectos
          </h1>
          <p className="help">
            Volvé a tus cálculos, guardá favoritos y llevá el trabajo a otro
            dispositivo.
          </p>
        </div>
        <span className="count-badge">{p.project.history.length} cálculos</span>
      </div>
      <div className="project-settings">
        <label htmlFor="project-name">Nombre del proyecto</label>
        <input
          id="project-name"
          maxLength={100}
          value={p.project.name}
          disabled={p.busy}
          onChange={(e) => p.name(e.target.value)}
        />
        <div className="project-actions">
          <button className="secondary" id="guardar-proyecto" onClick={p.save}>
            Guardar ahora
          </button>
          <button
            className="primary"
            id="exportar-proyecto"
            onClick={p.exportProject}
          >
            Exportar proyecto JSON
          </button>
          {isWeb() ? (
            <label
              className="button-label secondary"
              htmlFor="importar-proyecto"
            >
              Importar archivo
              <input
                id="importar-proyecto"
                type="file"
                accept=".json,application/json"
                disabled={p.busy}
                onChange={p.importFile}
              />
            </label>
          ) : (
            <button
              className="secondary"
              id="importar-proyecto-nativo"
              disabled={p.busy}
              onClick={p.importNative}
            >
              Importar archivo
            </button>
          )}
          <button
            className="secondary"
            id="abrir-json"
            disabled={p.busy}
            onClick={p.json}
          >
            Ver o pegar JSON
          </button>
          <button
            className="text-button"
            id="nuevo-proyecto"
            disabled={p.busy}
            onClick={p.newProject}
          >
            Nuevo cuaderno
          </button>
        </div>
        <p className="help">
          Guardado local en {storageName}. El proyecto exportado incluye
          entradas, objetos, favoritos y el paso activo. Los resultados se
          vuelven a calcular al abrirlos.
        </p>
      </div>
      <div className="history-filters">
        <div>
          <label htmlFor="buscar-historial">Buscar en tu historial</label>
          <input
            id="buscar-historial"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Operación, dato o nombre…"
          />
        </div>
        <label className="check-label">
          <input
            id="solo-favoritos"
            type="checkbox"
            checked={onlyFavorites}
            onChange={(e) => setOnlyFavorites(e.target.checked)}
          />
          Solo favoritos
        </label>
      </div>
      {!history.length ? (
        <div className="empty">
          <strong>
            {p.project.history.length
              ? "No hay coincidencias."
              : "Tu primer cálculo empieza aquí."}
          </strong>
          <p>
            {p.project.history.length
              ? "Probá con otro término o desactivá el filtro."
              : "Cada cálculo ejecutado aparecerá en este cuaderno."}
          </p>
        </div>
      ) : (
        <ol className="history-list">
          {history.map((h) => (
            <li className="history-entry" key={h.id} data-entry-id={h.id}>
              <button
                className="favorite-button"
                type="button"
                aria-label={
                  (h.favorite ? "Quitar favorito: " : "Marcar favorito: ") +
                  h.label
                }
                aria-pressed={h.favorite}
                onClick={() => p.favorite(h.id)}
              >
                {h.favorite ? "★" : "☆"}
              </button>
              <div className="history-entry-body">
                <strong>{h.label}</strong>
                <p>
                  {p.operations.find((o) => o.id === h.operation)?.category}{" "}
                  <span aria-hidden="true">·</span>{" "}
                  <time dateTime={h.date}>
                    {new Date(h.date).toLocaleString("es")}
                  </time>
                </p>
                <span className="status-tag">
                  {STATUS[h.status] || h.status}
                </span>
              </div>
              <div className="history-entry-actions">
                <button
                  className="secondary edit-history"
                  disabled={p.busy}
                  onClick={() => p.edit(h, false)}
                >
                  Editar
                </button>
                <button
                  className="secondary repeat-history"
                  disabled={p.busy}
                  onClick={() => p.edit(h, true)}
                >
                  Repetir
                </button>
                <button
                  className="text-button delete-history"
                  aria-label={"Eliminar cálculo: " + h.label}
                  onClick={() => p.remove(h.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
export function LibraryPanel({
  project,
  busy,
  reuse,
  remove,
  choose,
  operations,
}: {
  project: Project;
  busy: boolean;
  reuse: (o: SavedObject) => void;
  remove: (id: string) => void;
  choose: (id: string) => void;
  operations: OperationSpec[];
}) {
  const [query, setQuery] = useState("");
  const names = {
    matrix: "Matriz",
    vector: "Vector",
    base: "Base o familia",
    function: "Función",
  };
  const found = project.objects.filter((o) =>
    searchable(o.name + " " + names[o.kind]).includes(searchable(query)),
  );
  return (
    <section className="panel page-panel" aria-labelledby="library-title">
      <span className="eyebrow">APRENDER Y REUTILIZAR</span>
      <h1 id="library-title" tabIndex={-1}>
        Biblioteca y ayuda
      </h1>
      <p className="help">
        Un solo dato, muchas operaciones. Guardá entradas o resultados desde el
        área de trabajo.
      </p>
      <label htmlFor="buscar-objetos">Buscar objetos del proyecto</label>
      <input
        id="buscar-objetos"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Matriz, base o función…"
      />
      {!found.length ? (
        <div className="empty">
          <strong>
            {project.objects.length
              ? "No se encontraron objetos."
              : "Todavía no hay objetos guardados."}
          </strong>
          <p>
            Junto a una entrada encontrás «Guardar como objeto». También podés
            guardar matrices, vectores y bases calculados.
          </p>
        </div>
      ) : (
        <div className="object-grid">
          {found.map((o) => (
            <article className="object-card" key={o.id}>
              <span className="eyebrow">{names[o.kind]}</span>
              <h2>{o.name}</h2>
              <pre>{o.text}</pre>
              <div className="actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => reuse(o)}
                >
                  Usar en el cálculo activo
                </button>
                <button
                  className="text-button"
                  onClick={() => remove(o.id)}
                  aria-label={"Eliminar objeto: " + o.name}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="help-grid">
        <article>
          <h2>Empezar con un ejemplo</h2>
          <p>
            Elegí una operación y revisá sus datos iniciales. «Calcular» muestra
            un resultado y permite desplegar el procedimiento.
          </p>
          <div className="help-links">
            {[
              "sistemas.resolver",
              "matrices.transpuesta",
              "vectores.norma",
              "raices.biseccion",
            ].map((id) => (
              <button
                className="text-button"
                disabled={busy}
                key={id}
                onClick={() => choose(id)}
              >
                {operations.find((o) => o.id === id)?.title || id} →
              </button>
            ))}
          </div>
        </article>
        <article>
          <h2>Datos exactos y aproximaciones</h2>
          <p>
            Usá fracciones como 1/3 para conservar exactitud. Un residual no
            equivale al error verdadero. Las condiciones y advertencias aparecen
            junto al resultado.
          </p>
        </article>
        <article>
          <h2>Cómo pegar una matriz</h2>
          <p>
            Copiá celdas de una hoja de cálculo o escribí una fila por línea. No
            hace falta indicar dimensiones. Una celda vacía se marca; nunca se
            cambia por cero.
          </p>
        </article>
        <article>
          <h2>Teclado y accesibilidad</h2>
          <dl className="shortcut-list">
            <div>
              <dt>Ctrl / ⌘ + K</dt>
              <dd>Buscar operaciones</dd>
            </div>
            <div>
              <dt>Ctrl / ⌘ + Enter</dt>
              <dd>Calcular desde el formulario</dd>
            </div>
            <div>
              <dt>Ctrl / ⌘ + S</dt>
              <dd>Guardar el cuaderno</dd>
            </div>
            <div>
              <dt>Escape</dt>
              <dd>Cerrar diálogo o menú</dd>
            </div>
            <div>
              <dt>Tab / Shift + Tab</dt>
              <dd>Recorrer controles</dd>
            </div>
          </dl>
          <p>
            Las animaciones respetan la preferencia de movimiento reducido del
            dispositivo.
          </p>
        </article>
      </div>
    </section>
  );
}
