// ejecutar_python.js
// Conecta la interfaz de NexoLineal con Python mediante Pyodide.

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
  "python/calculo_basico.py",

  // Archivos que contienen los teoremas.
  "teoremas/__init__.py",
  "teoremas/resumen_teoremas.py",

  // Módulos que conectan los cálculos con la interfaz.
  "modulos/__init__.py",
  "modulos/modulo_sistemas.py",
  "modulos/modulo_vectores.py",
  "modulos/modulo_matrices.py",
  "modulos/factorizacion.py",
  "modulos/modulo_determinantes.py",
];

let pyodide = null;
let pyodideReady = false;
let pyodideLoading = false;

// Indica si el motor de Python está preparado.
function pythonEstaListo() {
  return pyodideReady;
}

// Carga Python y los archivos necesarios para la calculadora.
async function inicializarPyodide() {
  if (pyodideReady || pyodideLoading) return;

  pyodideLoading = true;

  const barra = document.getElementById("barra-carga");
  const texto = document.getElementById("texto-carga");
  const contenedor = document.getElementById("contenedor-carga");

  let ultimaEtapa = "Iniciando Python";

  const progreso = (mensaje, porcentaje) => {
    ultimaEtapa = mensaje;

    if (texto) texto.textContent = mensaje;
    if (barra) barra.style.width = `${porcentaje}%`;
  };

  try {
    if (texto) texto.classList.remove("text-rose-300");

    progreso("Cargando Pyodide…", 15);
    pyodide = await loadPyodide();

    // Usa rutas absolutas dentro del sistema de archivos de Pyodide.
    let carpetaBase = pyodide.FS.cwd();

    if (carpetaBase.endsWith("/")) {
      carpetaBase = carpetaBase.slice(0, -1);
    }

    for (let i = 0; i < PYTHON_FILES.length; i++) {
      const ruta = PYTHON_FILES[i];
      const porcentaje =
        25 + Math.round(((i + 1) / PYTHON_FILES.length) * 55);

      progreso(`Leyendo ${ruta}…`, porcentaje);

      const respuesta = await fetch(ruta, {
        cache: "no-store",
      });

      if (!respuesta.ok) {
        throw new Error(
          `No se pudo cargar ${ruta} (${respuesta.status}).`
        );
      }

      const codigo = await respuesta.text();

      // Los archivos originales conservan sus importaciones.
      // Los paquetes nuevos conservan sus carpetas.
      const rutaRelativa = ruta.startsWith("python/")
        ? ruta.split("/").pop()
        : ruta;

      const destino = `${carpetaBase}/${rutaRelativa}`;

      const carpetaDestino =
        destino.slice(0, destino.lastIndexOf("/")) || "/";

      progreso(`Creando carpeta para ${ruta}…`, porcentaje);
      pyodide.FS.mkdirTree(carpetaDestino);

      progreso(`Guardando ${ruta}…`, porcentaje);
      pyodide.FS.writeFile(destino, codigo, {
        encoding: "utf8",
      });
    }

    progreso("Comprobando módulos matemáticos…", 88);

    // Comprueba las importaciones antes de habilitar la interfaz.
    pyodide.runPython(`
import sys
import os
import importlib

_carpeta_trabajo = os.getcwd()
if _carpeta_trabajo not in sys.path:
    sys.path.insert(0, _carpeta_trabajo)

importlib.invalidate_caches()

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
import calculo_basico
import teoremas.resumen_teoremas
import modulos.modulo_sistemas
import modulos.modulo_vectores
import modulos.modulo_matrices
import modulos.modulo_determinantes
`);

    pyodideReady = true;
    progreso("NexoLineal está listo.", 100);

    // Notifica a la interfaz que ya puede realizar cálculos.
    window.dispatchEvent(
      new CustomEvent("nexolineal-python-listo")
    );

    // Oculta la pantalla de carga.
    setTimeout(() => {
      if (!contenedor) return;

      contenedor.style.opacity = "0";

      setTimeout(() => {
        contenedor.style.display = "none";
      }, 450);
    }, 300);
  } catch (error) {
    pyodideReady = false;

    const detalle = error?.message || String(error);
    const codigoError =
      error?.errno != null
        ? `\nCódigo del sistema de archivos: ${error.errno}`
        : "";

    if (texto) {
      texto.textContent =
        `Error al cargar Python\n` +
        `Etapa: ${ultimaEtapa}\n` +
        `Detalle: ${detalle}${codigoError}`;

      // Permite leer y copiar el error completo.
      texto.style.whiteSpace = "pre-wrap";
      texto.style.overflowWrap = "anywhere";
      texto.style.maxHeight = "60vh";
      texto.style.overflowY = "auto";
      texto.style.userSelect = "text";
      texto.classList.add("text-rose-300");
    }

    console.error("Error durante la carga de Python:", error);
    throw error;
  } finally {
    pyodideLoading = false;
  }
}

// Evita ejecutar cálculos antes de terminar la carga.
function verificarPython() {
  if (!pyodideReady || !pyodide) {
    throw new Error(
      "El motor de Python no está listo. Revisa si terminó la carga o apareció un error."
    );
  }
}

// Envía datos a Python y convierte la respuesta a JavaScript.
function ejecutarJSON(codigoPython, datos, variable = "_datos_js") {
  verificarPython();

  pyodide.globals.set(variable, JSON.stringify(datos));

  // Agrega la sangría necesaria para el bloque try de Python.
  const codigoIndentado = codigoPython
    .split("\n")
    .map(linea => (linea ? "    " + linea : ""))
    .join("\n");

  const salidaTexto = pyodide.runPython(`
import json as _json
try:
    _entrada = _json.loads(${variable})
${codigoIndentado}
    _respuesta = {"ok": True, "resultado": _resultado}
except Exception as _error:
    _respuesta = {"ok": False, "error": str(_error)}
_json.dumps(_respuesta, default=str)
`);

  const salida = JSON.parse(salidaTexto);

  if (!salida.ok) {
    throw new Error(salida.error);
  }

  return salida.resultado;
}

// Resuelve los sistemas ingresados en la interfaz.
async function resolverSistema(textos_A, textos_b) {
  return ejecutarJSON(
`from modulos.modulo_sistemas import resolver_desde_interfaz
_resultado = resolver_desde_interfaz(_entrada)`,
    { textos_A, textos_b },
    "_sistema_js"
  );
}

// Selecciona el módulo correspondiente a cada operación.
async function ejecutarTema(datos) {
  const accion = datos.accion;

  if (accion === "programa5") {
    return ejecutarJSON(`from modulos.modulo_matrices import ejecutar_programa5
_resultado = ejecutar_programa5(_entrada)`, datos, "_programa5_js");
  }

  // Cálculo y calculadora básica.
  if (accion === "calculo" || accion === "basica") {
    return ejecutarJSON(
`from calculo_basico import ejecutar_calculo
_resultado = ejecutar_calculo(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  // Operaciones con vectores.
  if (accion === "vectores") {
    return ejecutarJSON(
`from modulos.modulo_vectores import ejecutar_vectores_interfaz
_resultado = ejecutar_vectores_interfaz(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  // Operaciones con matrices.
  if (accion === "matrices") {
    return ejecutarJSON(
`from modulos.modulo_matrices import ejecutar_matrices_interfaz
_resultado = ejecutar_matrices_interfaz(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  // Combinación lineal, independencia y propiedades.
  if (
    accion === "combinacion_lineal" ||
    accion === "independencia_lineal" ||
    accion === "propiedades_matriz_vector"
  ) {
    return ejecutarJSON(
`from modulos.modulo_vectores import ejecutar_relaciones_interfaz
_resultado = ejecutar_relaciones_interfaz(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  // Consulta independiente del determinante.
  if (accion === "determinantes") {
    return ejecutarJSON(
`from modulos.modulo_determinantes import ejecutar_determinante_interfaz
_resultado = ejecutar_determinante_interfaz(_entrada)`,
      datos,
      "_tema_js"
    );
  }

  // Teoremas del módulo solicitado.
  if (accion === "teoremas") {
    return ejecutarJSON(
`from teoremas.resumen_teoremas import obtener_teoremas
_resultado = obtener_teoremas(_entrada["modulo"])`,
      datos,
      "_tema_js"
    );
  }

  throw new Error("Operación no reconocida.");
}

// Inicia la carga cuando el documento está preparado.
window.addEventListener("DOMContentLoaded", () => {
  inicializarPyodide().catch(error => console.error(error));
});
