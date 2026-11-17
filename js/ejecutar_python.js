// ejecutar_python.js
// Conecta la interfaz de NexoLineal con Python mediante Pyodide.

const PYTHON_FILES = [
  "python/__init__.py",
  "packages/core/src/nexolineal/__init__.py",
  "packages/core/src/nexolineal/domain/__init__.py",
  "packages/core/src/nexolineal/parsing/__init__.py",
  "packages/core/src/nexolineal/algorithms/__init__.py",
  "packages/core/src/nexolineal/application/__init__.py",
  "packages/core/src/nexolineal/domain/models.py",
  "packages/core/src/nexolineal/parsing/numbers.py",
  "packages/core/src/nexolineal/algorithms/matrices.py",
  "packages/core/src/nexolineal/algorithms/calculo.py",
  "packages/core/src/nexolineal/algorithms/domains.py",
  "packages/core/src/nexolineal/application/service.py",
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
  "modulos/modulo_lu.py",
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

    // El mismo manifiesto incluye los módulos nuevos y los adaptadores docentes.
    const manifest = await fetch("packages/core/python-files.json", { cache: "no-store" });
    if (!manifest.ok) throw new Error("No se encontró el manifiesto del núcleo Python.");
    const coreFiles = await manifest.json();
    if (!Array.isArray(coreFiles) || !coreFiles.every(path =>
      typeof path === "string" && path.startsWith("packages/core/src/nexolineal/") &&
      path.endsWith(".py") && !path.includes(".."))) {
      throw new Error("El manifiesto del núcleo no es válido.");
    }
    const archivos = Array.from(new Set([...PYTHON_FILES, ...coreFiles]));
    progreso("Cargando Pyodide…", 15);
    pyodide = await loadPyodide();

    // Usa rutas absolutas dentro del sistema de archivos de Pyodide.
    let carpetaBase = pyodide.runPython("import sysconfig; sysconfig.get_path(\"purelib\")");

    if (carpetaBase.endsWith("/")) {
      carpetaBase = carpetaBase.slice(0, -1);
    }

    for (let i = 0; i < archivos.length; i++) {
      const ruta = archivos[i];
      const porcentaje =
        25 + Math.round(((i + 1) / archivos.length) * 55);

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

      // Conserva la estructura de paquetes de Python también en Pyodide.
      const rutaRelativa = ruta.replace("packages/core/src/", "");

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
import importlib
importlib.invalidate_caches()

import json
import nexolineal.application.service
import python.operaciones_fila
import python.entrada_datos
import python.metodos_eliminacion
import python.formas_matriciales
import python.analisis_sistema
import python.vectores
import python.operaciones_matrices
import python.relaciones_vectoriales
import python.formato_latex
import python.calculo_basico
import teoremas.resumen_teoremas
import modulos.modulo_sistemas
import modulos.modulo_vectores
import modulos.modulo_matrices
import modulos.modulo_determinantes
import modulos.modulo_lu
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

  const entradaJSON = JSON.stringify(datos, (_clave, valor) => {
    if (typeof valor === "number" && (!Number.isFinite(valor) ||
        (Number.isInteger(valor) && !Number.isSafeInteger(valor)))) {
      throw new Error("Envía el número como texto para conservar su exactitud.");
    }
    return valor;
  });
  pyodide.globals.set(variable, entradaJSON);

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
`from python.calculo_basico import ejecutar_calculo
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

// Entrada pública versionada para consumidores del núcleo.
async function ejecutarContrato(solicitud) {
  return ejecutarJSON(
`from nexolineal.application.service import execute
_resultado = execute(_entrada)`,
    solicitud, "_contrato_js"
  );
}
