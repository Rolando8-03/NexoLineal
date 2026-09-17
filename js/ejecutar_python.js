// ============================================================
// ejecutar_python.js
// Puente JavaScript <-> Python mediante Pyodide.
// ============================================================

const PYTHON_FILES = [
  "python/operaciones_fila.py",
  "python/entrada_datos.py",
  "python/metodos_eliminacion.py",
  "python/formas_matriciales.py",
  "python/analisis_sistema.py",
  "python/vectores.py",
  "python/operaciones_matrices.py",
  "python/relaciones_vectoriales.py",
  "python/formato_latex.py",
];

let pyodide = null;
let pyodideReady = false;
let pyodideLoading = false;

function pythonEstaListo() {
  return pyodideReady;
}

async function inicializarPyodide() {
  if (pyodideReady || pyodideLoading) return;
  pyodideLoading = true;

  const barra = document.getElementById("barra-carga");
  const texto = document.getElementById("texto-carga");
  const contenedor = document.getElementById("contenedor-carga");

  const progreso = (mensaje, porcentaje) => {
    if (texto) texto.textContent = mensaje;
    if (barra) barra.style.width = `${porcentaje}%`;
  };

  try {
    progreso("Cargando Pyodide…", 15);
    pyodide = await loadPyodide();

    for (let i = 0; i < PYTHON_FILES.length; i++) {
      const ruta = PYTHON_FILES[i];
      progreso(
        `Preparando ${ruta.split("/").pop()}…`,
        25 + Math.round(((i + 1) / PYTHON_FILES.length) * 55)
      );

      const respuesta = await fetch(ruta, { cache: "no-store" });
      if (!respuesta.ok) {
        throw new Error(`No se pudo cargar ${ruta} (${respuesta.status}).`);
      }

      const codigo = await respuesta.text();
      pyodide.FS.writeFile(ruta.split("/").pop(), codigo);
    }

    progreso("Comprobando módulos matemáticos…", 88);

    pyodide.runPython(`
import sys
if "" not in sys.path:
    sys.path.insert(0, "")

import json
import operaciones_fila
import entrada_datos
import metodos_eliminacion
import formas_matriciales
import analisis_sistema
import vectores
import operaciones_matrices
import relaciones_vectoriales
import formato_latex
`);

    pyodideReady = true;
    pyodideLoading = false;
    progreso("NexoLineal está listo.", 100);

    window.dispatchEvent(new CustomEvent("nexolineal-python-listo"));

    setTimeout(() => {
      if (!contenedor) return;
      contenedor.style.opacity = "0";
      setTimeout(() => {
        contenedor.style.display = "none";
      }, 450);
    }, 300);
  } catch (error) {
    pyodideReady = false;
    pyodideLoading = false;

    if (texto) {
      texto.textContent = `Error al cargar Python: ${error.message}`;
      texto.classList.add("text-rose-300");
    }

    console.error(error);
    throw error;
  }
}

function verificarPython() {
  if (!pyodideReady || !pyodide) {
    throw new Error("El motor de Python todavía está cargando. Espera unos segundos.");
  }
}

function ejecutarJSON(codigoPython, datos, variable = "_datos_js") {
  verificarPython();
  pyodide.globals.set(variable, JSON.stringify(datos));

  const salidaTexto = pyodide.runPython(`
import json as _json
try:
    _entrada = _json.loads(${variable})
${codigoPython.split("\n").map(linea => linea ? "    " + linea : "").join("\n")}
    _respuesta = {"ok": True, "resultado": _resultado}
except Exception as _error:
    _respuesta = {"ok": False, "error": str(_error)}
_json.dumps(_respuesta, default=str)
`);

  const salida = JSON.parse(salidaTexto);
  if (!salida.ok) throw new Error(salida.error);
  return salida.resultado;
}

async function resolverSistema(textos_A, textos_b) {
  return ejecutarJSON(
`from entrada_datos import leer_matriz_texto
from analisis_sistema import resolver_sistema
_A, _b = leer_matriz_texto(_entrada["textos_A"], _entrada["textos_b"])
_resultado = resolver_sistema(_A, _b)`,
    { textos_A, textos_b },
    "_sistema_js"
  );
}

async function ejecutarTema(datos) {
  const accion = datos.accion;

  if (accion === "vectores") {
    return ejecutarJSON(
`from vectores import ejecutar_tema
_resultado = ejecutar_tema(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  if (accion === "matrices") {
    return ejecutarJSON(
`from operaciones_matrices import ejecutar_matrices
_resultado = ejecutar_matrices(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  if (accion === "combinacion_lineal" || accion === "independencia_lineal") {
    return ejecutarJSON(
`from relaciones_vectoriales import ejecutar_relaciones
_resultado = ejecutar_relaciones(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  throw new Error("Operación no reconocida.");
}

window.addEventListener("DOMContentLoaded", () => {
  inicializarPyodide().catch(error => console.error(error));
});
