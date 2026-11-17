import { useState } from "react";
import { DataView } from "../ResultView";
import { searchable } from "../workspace/project";
import type { Theorem, Application } from "./types";
export function TheoryCards({
  theorems,
  operation,
  choose,
}: {
  theorems: Theorem[];
  operation?: string;
  choose?: (prefix: string) => void;
}) {
  const found = theorems.filter(
    (t) => !operation || t.operations.some((p) => operation.startsWith(p)),
  );
  return (
    <div className="theorem-list">
      {found.map((t) => (
        <details className="theorem-card" key={t.id} data-theorem={t.id}>
          <summary>{t.title}</summary>
          <p>{t.statement}</p>
          <h4>Hipótesis</h4>
          <ul>
            {t.hypotheses.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
          <p>
            <a href={t.reference.url} target="_blank" rel="noreferrer">
              {t.reference.title} · {t.reference.section}
            </a>
          </p>
          {choose && (
            <button
              type="button"
              className="secondary"
              onClick={() => choose(t.operations[0])}
            >
              Ir a una operación relacionada
            </button>
          )}
        </details>
      ))}
    </div>
  );
}
export function ModelResult({ value }: { value: Record<string, unknown> }) {
  const values = value.interpretation as {
    name: string;
    value: string;
    unit: string;
  }[];
  return (
    <section
      data-model-id={String(value.id)}
      className="model-result"
      aria-label="Interpretación del modelo"
    >
      <h3>{String(value.title)}</h3>
      <dl>
        {values.map((v, i) => (
          <div key={i}>
            <dt>{v.name}</dt>
            <dd>
              {v.value} {v.unit}
            </dd>
          </div>
        ))}
      </dl>
      <p className="verified">
        {value.passed
          ? "✓ Ecuaciones y restricciones del ejemplo verificadas"
          : "Revisá las restricciones del modelo"}
      </p>
      <details>
        <summary>Condiciones y comprobaciones del modelo</summary>
        <ul>
          {(value.restrictions as string[]).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <DataView value={value.checks} />
      </details>
    </section>
  );
}
export function LearningLibrary({
  theorems,
  applications,
  busy,
  load,
  choose,
}: {
  theorems: Theorem[];
  applications: Application[];
  busy: boolean;
  load: (app: Application) => void;
  choose: (prefix: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = searchable(query);
  return (
    <section className="learning-library" aria-labelledby="learning-title">
      <h2 id="learning-title">Teoría y aplicaciones</h2>
      <p>
        Conectá los resultados con sus hipótesis y con modelos que podés
        resolver.
      </p>
      <label htmlFor="buscar-teoria">Buscar teoría o aplicación</label>
      <input
        id="buscar-teoria"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rango, proyección, química…"
      />
      <h3>Fichas de teoremas</h3>
      <TheoryCards
        theorems={theorems.filter((t) =>
          searchable(t.title + " " + t.statement).includes(q),
        )}
        choose={choose}
      />
      <h3>Aplicaciones reproducibles</h3>
      <div className="application-grid">
        {applications
          .filter((a) =>
            searchable(a.area + " " + a.title + " " + a.description).includes(
              q,
            ),
          )
          .map((a) => (
            <article
              className="application-card"
              key={a.id}
              data-application={a.id}
            >
              <span className="eyebrow">{a.area}</span>
              <h4>{a.title}</h4>
              <p>{a.description}</p>
              <dl>
                {a.variables.map((v, i) => (
                  <div key={i}>
                    <dt>{v.name}</dt>
                    <dd>{v.unit}</dd>
                  </div>
                ))}
              </dl>
              <h5>Ecuaciones del modelo</h5>
              <ul>
                {a.equations.map((eq, i) => (
                  <li key={i}>{eq}</li>
                ))}
              </ul>
              <details>
                <summary>Hipótesis, unidades y límites</summary>
                <ul>
                  {a.restrictions.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <p className="help">{a.origin}</p>
                <a href={a.reference} target="_blank" rel="noreferrer">
                  Referencia conceptual
                </a>
              </details>
              <button
                type="button"
                className="primary load-application"
                disabled={busy}
                onClick={() => load(a)}
              >
                Resolver este modelo
              </button>
            </article>
          ))}
      </div>
      {!theorems.some((t) =>
        searchable(t.title + " " + t.statement).includes(q),
      ) &&
        !applications.some((a) =>
          searchable(a.area + " " + a.title + " " + a.description).includes(q),
        ) && <p role="status">No hay coincidencias para esa búsqueda.</p>}
    </section>
  );
}
