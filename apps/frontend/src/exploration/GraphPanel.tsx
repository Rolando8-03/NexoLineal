import { coordinate } from "./geometry";
import { useState } from "react";
import { Dialog } from "../workspace/Dialog";
import { DataView } from "../ResultView";
import type { Scene, PlotSeries } from "./types";

// Proyección de cámara y escala de pantalla; la geometría mundial llega de Python.
function project(
  p: (string | number)[],
  dimension: number,
  azimuth: number,
  elevation: number,
): number[] {
  const [x, y, z = 0] = p.map(coordinate);
  if (dimension === 2) return [x, y];
  const a = (azimuth * Math.PI) / 180,
    e = (elevation * Math.PI) / 180;
  return [
    Math.cos(a) * x - Math.sin(a) * y,
    Math.sin(e) * (Math.sin(a) * x + Math.cos(a) * y) + Math.cos(e) * z,
  ];
}
const palette = [
  "#2367d1",
  "#bc4328",
  "#783abd",
  "#087e76",
  "#ac4b00",
  "#57697e",
];
export function GraphPanel({
  scene,
  step,
  select,
}: {
  scene: Scene;
  step: number;
  select: (step: number) => void;
}) {
  const [expanded, setExpanded] = useState(false),
    [zoom, setZoom] = useState(1),
    [azimuth, setAzimuth] = useState(-35),
    [elevation, setElevation] = useState(30),
    [inspection, setInspection] = useState(0);
  if (scene.kind === "unavailable")
    return <p className="graph-unavailable">Geometría: {scene.reason}</p>;
  const frameIndex = scene.frames.findIndex((f) => f.step === step),
    frame = scene.frames[frameIndex];
  const items = [...scene.series, ...(frame?.series || [])];
  const points = items
    .flatMap((s) => s.points)
    .filter(
      (p) =>
        p.length === scene.dimension &&
        p.every((v) => Number.isFinite(coordinate(v))),
    );
  const projected = points.map((p) =>
    project(p, scene.dimension, azimuth, elevation),
  );
  const bounds =
    scene.range?.length === scene.dimension && scene.dimension === 2
      ? [
          [coordinate(scene.range[0][0]), coordinate(scene.range[1][0])],
          [coordinate(scene.range[0][1]), coordinate(scene.range[1][1])],
        ]
      : projected;
  let minX = Math.min(0, ...bounds.map((p) => p[0])),
    maxX = Math.max(0, ...bounds.map((p) => p[0])),
    minY = Math.min(0, ...bounds.map((p) => p[1])),
    maxY = Math.max(0, ...bounds.map((p) => p[1]));
  let spanX = Math.max(1e-12, maxX - minX),
    spanY = Math.max(1e-12, maxY - minY);
  if (scene.kind !== "roots" && scene.kind !== "residual") {
    const span = Math.max(1, spanX, spanY);
    // 650 y 300 son los tamaños útiles: la misma unidad ocupa los mismos píxeles.
    spanX = span * (650 / 300);
    spanY = span;
  }
  const centerX = (minX + maxX) / 2,
    centerY = (minY + maxY) / 2;
  const xy = (p: (string | number)[]) => {
    const [x, y] = project(p, scene.dimension, azimuth, elevation);
    return [
      390 + (((x - centerX) * 650) / spanX) * zoom,
      205 - (((y - centerY) * 300) / spanY) * zoom,
    ];
  };
  const origin = xy(Array(scene.dimension).fill(0));
  const axisExtent = Math.max(
    1,
    ...points.flat().map((v) => Math.abs(coordinate(v))),
  );
  const labels = [...new Set(items.map((s) => s.label))];
  const color = (s: PlotSeries) =>
    palette[labels.indexOf(s.label) % palette.length];
  const inspected =
    points[Math.min(inspection, Math.max(0, points.length - 1))];
  function reset() {
    setZoom(1);
    setAzimuth(-35);
    setElevation(30);
  }
  const content = (large: boolean) => (
    <div
      className="graph-content"
      data-graph-kind={scene.kind}
      data-frame-row={frame?.row ?? ""}
    >
      {scene.expression && (
        <p className="active-expression">f(x) = {scene.expression}</p>
      )}
      <p className="help">
        {scene.dimension === 3 ? "Vista 3D con proyección ortográfica. " : ""}
        {scene.units}. Dibujo aproximado; datos exactos debajo.
      </p>
      <div className="graph-toolbar">
        <label>
          Ampliación{" "}
          <input
            aria-label="Ampliación de gráfica"
            type="range"
            min="1"
            max="4"
            step="0.25"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <button type="button" className="secondary graph-reset" onClick={reset}>
          Restablecer vista
        </button>
        {!large && (
          <button
            type="button"
            id="ampliar-grafica"
            className="secondary"
            onClick={() => setExpanded(true)}
          >
            Ampliar gráfica
          </button>
        )}
        {scene.dimension === 3 && (
          <>
            <label>
              Giro{" "}
              <input
                aria-label="Giro de cámara"
                type="range"
                min="-180"
                max="180"
                value={azimuth}
                onChange={(e) => setAzimuth(Number(e.target.value))}
              />
            </label>
            <label>
              Elevación{" "}
              <input
                aria-label="Elevación de cámara"
                type="range"
                min="-90"
                max="90"
                value={elevation}
                onChange={(e) => setElevation(Number(e.target.value))}
              />
            </label>
          </>
        )}
      </div>
      <svg
        className="math-graph"
        viewBox="0 0 780 420"
        role="img"
        aria-label={scene.title + ". " + scene.alternative}
      >
        <defs>
          <clipPath id={large ? "graph-clip-large" : "graph-clip-inline"}>
            <rect x="40" y="20" width="700" height="360" />
          </clipPath>
        </defs>
        <rect
          x="40"
          y="20"
          width="700"
          height="360"
          className="plot-background"
        />
        <g
          clipPath={`url(#${large ? "graph-clip-large" : "graph-clip-inline"})`}
        >
          {scene.dimension === 2 ? (
            <>
              <line
                x1="40"
                y1={origin[1]}
                x2="740"
                y2={origin[1]}
                className="plot-axis"
              />
              <line
                x1={origin[0]}
                y1="20"
                x2={origin[0]}
                y2="380"
                className="plot-axis"
              />
            </>
          ) : (
            [0, 1, 2].map((i) => {
              const p = [0, 0, 0];
              p[i] = axisExtent;
              const q = xy(p);
              return (
                <g key={i}>
                  <line
                    x1={origin[0]}
                    y1={origin[1]}
                    x2={q[0]}
                    y2={q[1]}
                    className="plot-axis"
                  />
                  <text x={q[0]} y={q[1] - 7}>
                    {scene.axes[i]}
                  </text>
                </g>
              );
            })
          )}
          {items.map((s, index) => {
            const ps = s.points.map(xy),
              coords = ps.map((p) => p.join(",")).join(" ");
            if (!ps.length) return null;
            return (
              <g key={index} data-series={s.label}>
                <title>{s.label + "; " + s.source}</title>
                {s.kind === "polygon" ? (
                  <polygon
                    points={coords}
                    fill={color(s)}
                    fillOpacity="0.12"
                    stroke={color(s)}
                    strokeWidth="2"
                  />
                ) : s.kind === "points" ? (
                  ps.map((p, i) => (
                    <circle key={i} cx={p[0]} cy={p[1]} r="5" fill={color(s)} />
                  ))
                ) : (
                  <polyline
                    points={coords}
                    fill="none"
                    stroke={color(s)}
                    strokeWidth={s.kind === "vector" ? 3 : 2}
                    strokeDasharray={
                      s.label.includes("original") ? "5 5" : undefined
                    }
                  />
                )}
                {s.kind === "vector" && ps.length > 1 && (
                  <circle
                    cx={ps.at(-1)![0]}
                    cy={ps.at(-1)![1]}
                    r="4"
                    fill={color(s)}
                  />
                )}
              </g>
            );
          })}
        </g>
        {scene.dimension === 2 && (
          <>
            <text x="738" y="407" textAnchor="end">
              {scene.axes[0]}
            </text>
            <text x="43" y="16">
              {scene.axes[1]}
            </text>
          </>
        )}
        <text x="45" y="400">
          {(centerX - spanX / (2 * zoom)).toPrecision(4)}
        </text>
        <text x="735" y="400" textAnchor="end">
          {(centerX + spanX / (2 * zoom)).toPrecision(4)}
        </text>
        <text x="44" y="34">
          {(centerY + spanY / (2 * zoom)).toPrecision(4)}
        </text>
      </svg>
      <ul className="graph-legend" aria-label="Leyenda">
        {labels.map((label, i) => (
          <li key={label}>
            <span
              style={{ background: palette[i % palette.length] }}
              aria-hidden="true"
            />
            {label}
          </li>
        ))}
      </ul>
      {!!scene.frames.length && (
        <div className="frame-controls">
          <button
            type="button"
            className="secondary"
            disabled={frameIndex <= 0}
            onClick={() => {
              const f = scene.frames[frameIndex - 1];
              if (f?.step !== null) select(f.step);
            }}
          >
            Iteración anterior
          </button>
          <span role="status">
            {frame
              ? `Fila ${frame.row + 1} · paso ${(frame.step ?? 0) + 1}`
              : "Elegí un paso con datos de iteración"}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={frameIndex >= scene.frames.length - 1}
            onClick={() => {
              const f = scene.frames[frameIndex + 1];
              if (f?.step !== null) select(f.step);
            }}
          >
            Iteración siguiente
          </button>
        </div>
      )}
      {!!points.length && (
        <div className="point-inspector">
          <label>
            Inspeccionar coordenada{" "}
            <input
              type="range"
              min="0"
              max={points.length - 1}
              value={Math.min(inspection, points.length - 1)}
              onChange={(e) => setInspection(Number(e.target.value))}
            />
          </label>
          <output>{inspected?.map(String).join(" ; ")}</output>
        </div>
      )}
      {scene.notes.map((note, i) => (
        <p className="help" key={i}>
          {note}
        </p>
      ))}
      <details className="graph-alternative">
        <summary>Alternativa textual y coordenadas de la gráfica</summary>
        <p>{scene.alternative}</p>
        {items.map((s, i) => (
          <section key={i}>
            <h4>{s.label}</h4>
            <p className="help">Fuente: {s.source}</p>
            <DataView value={s.points} />
          </section>
        ))}
        {frame && <DataView value={frame.values} />}
      </details>
    </div>
  );
  return (
    <section className="graph-panel" aria-label="Visualización matemática">
      <h3>{scene.title}</h3>
      {content(false)}
      {expanded && (
        <Dialog
          title={scene.title + " · vista ampliada"}
          onClose={() => setExpanded(false)}
        >
          {content(true)}
        </Dialog>
      )}
    </section>
  );
}
