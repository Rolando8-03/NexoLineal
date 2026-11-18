import { useEffect, useRef } from "react";
import { AcademicArt } from "./AstroArt";
import { AREAS } from "./navigation";

const destinations = [
  [
    "systems",
    "Sistemas estelares",
    "Sistemas de ecuaciones",
    "Resolver",
    "sistemas.resolver",
  ],
  [
    "matrices",
    "Álgebra de matrices",
    "Operaciones con matrices",
    "Multiplicar",
    "matrices.producto",
  ],
  [
    "inverse",
    "Gravedad e inversas",
    "Determinantes e inversas",
    "Calcular inversa",
    "matrices.inversa",
  ],
  [
    "vectors",
    "Constelaciones vectoriales",
    "Espacios y subespacios",
    "Verificar base",
    "espacios.base",
  ],
  [
    "transforms",
    "Transformaciones cósmicas",
    "Aplicaciones lineales",
    "Transformar",
    "transformaciones.analizar",
  ],
  [
    "roots",
    "Aterrizaje en raíces",
    "Métodos numéricos",
    "Explorar métodos",
    "",
  ],
] as const;

export function Observatory({
  explorer,
  resume,
  choose,
  navigate,
}: {
  explorer: boolean;
  resume?: string;
  choose: (operation: string) => void;
  navigate: (route: string) => void;
}) {
  const scene = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!explorer) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    function paint() {
      frame = 0;
      const progress = motion.matches
        ? 0
        : Math.min(1, Math.max(0, window.scrollY / 420));
      scene.current?.style.setProperty("--travel", String(progress));
    }
    function scroll() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    paint();
    window.addEventListener("scroll", scroll, { passive: true });
    motion.addEventListener("change", scroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      motion.removeEventListener("change", scroll);
    };
  }, [explorer]);
  return (
    <section className="observatory" aria-labelledby="objetivo" ref={scene}>
      <div className="cosmic-hero">
        <div className="mission-copy">
          <p className="greeting">
            {explorer ? "¡Hola, Explorador!" : "Álgebra lineal"}
          </p>
          <h1 id="objetivo" tabIndex={-1}>
            {explorer ? (
              <>
                ¿Qué rincón del <em>cosmos matemático</em> resolvemos hoy?
              </>
            ) : (
              "¿Qué querés calcular hoy?"
            )}
          </h1>
          <div className="mission-actions">
            <button
              className="launch"
              onClick={() => choose("sistemas.resolver")}
            >
              Resolver un sistema <span aria-hidden="true">↗</span>
            </button>
            {resume && (
              <button
                className="text-button"
                onClick={() => navigate("trabajo")}
              >
                Retomar · {resume}
              </button>
            )}
          </div>
        </div>
        {explorer ? (
          <div className="cosmic-scene" aria-hidden="true">
            <div className="star-plane" />
            <div className="orbit-plane">
              <i />
              <i />
              <i />
            </div>
            <img className="satellite" src="./cosmos/satellite.webp" alt="" />
            <img
              className="cosmonaut"
              src="./cosmos/astronaut.webp"
              fetchPriority="high"
              alt=""
            />
          </div>
        ) : (
          <AcademicArt />
        )}
      </div>
      <section aria-labelledby="areas-titulo">
        <div className="atlas-heading">
          <h2 id="areas-titulo">Áreas de cálculo</h2>
          <span aria-hidden="true" />
        </div>
        <div className="atlas-grid">
          {destinations.map(([art, title, subtitle, action, op], i) => (
            <article key={art} className={"atlas-card " + art}>
              <img alt="" src={"./cosmos/" + art + ".webp"} />
              <div className="atlas-copy">
                <h3>{explorer ? title : AREAS[i].name}</h3>
                <p>{explorer ? subtitle : AREAS[i].copy}</p>
                <button
                  onClick={() => (op ? choose(op) : navigate(AREAS[i].name))}
                >
                  {action} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
