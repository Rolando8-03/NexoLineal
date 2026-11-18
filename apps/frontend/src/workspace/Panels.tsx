import { useState, type ChangeEvent } from "react";
import type { OperationSpec } from "../contracts";
import type { Project, SavedObject } from "./project";
import { searchable } from "./project";
import { isWeb, storageName } from "./storage";
interface ProjectProps {
  project: Project;
  busy: boolean;
  name: (s: string) => void;
  exportProject: () => void;
  importFile: (event: ChangeEvent<HTMLInputElement>) => void;
  importNative: () => void;
  json: () => void;
  newProject: () => void;
  save: () => void;
}
export function ProjectPanel(p: ProjectProps) {
  return (
    <section className="panel page-panel">
      <h1 tabIndex={-1}>Archivo del proyecto</h1>
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
          entradas, objetos y el paso activo. Los resultados se vuelven a
          calcular al abrirlos.
        </p>
      </div>
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
              <dd>Abrir el menú de áreas</dd>
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
