// ============================================================
// ejecutar_python.js
// Carga Pyodide y los 5 módulos Python. Expone resolverSistema().
// ============================================================

const PYTHON_FILES = [
  "python/operaciones_fila.py",
  "python/entrada_datos.py",
  "python/metodos_eliminacion.py",
  "python/analisis_sistema.py",
  "python/formato_latex.py",
];

let pyodide = null;
let pyodideReady = false;

// ──────────────────────────────────────────────
// Inicialización
// ──────────────────────────────────────────────
async function inicializarPyodide() {
  const barra = document.getElementById("barra-carga");
  const texto = document.getElementById("texto-carga");
  const contenedor = document.getElementById("contenedor-carga");

  if (contenedor) contenedor.style.display = "flex";

  try {
    if (texto) texto.textContent = "Cargando entorno Python (Pyodide)…";
    if (barra) barra.style.width = "20%";

    pyodide = await loadPyodide();

    if (texto) texto.textContent = "Cargando módulos de la calculadora…";
    if (barra) barra.style.width = "60%";

    // Cargar cada módulo Python en el sistema de archivos virtual
    for (const ruta of PYTHON_FILES) {
      const respuesta = await fetch(ruta);
      if (!respuesta.ok) {
        throw new Error(`No se pudo cargar ${ruta}: ${respuesta.status}`);
      }
      const codigo = await respuesta.text();
      const nombre = ruta.split("/").pop();
      pyodide.FS.writeFile(nombre, codigo);
    }

    if (barra) barra.style.width = "90%";
    if (texto) texto.textContent = "Listo.";

    // Importar el módulo principal
    pyodide.runPython(`import sys; sys.path.insert(0, '')`);
    pyodide.runPython(`from analisis_sistema import resolver_sistema`);
    pyodide.runPython(`from entrada_datos import leer_matriz_texto, convertir_numero`);
    pyodide.runPython(`import json`);

    if (barra) barra.style.width = "100%";
    pyodideReady = true;

    setTimeout(() => {
      if (contenedor) {
        contenedor.style.opacity = "0";
        setTimeout(() => {
          contenedor.style.display = "none";
          contenedor.style.opacity = "1";
        }, 600);
      }
    }, 500);
  } catch (err) {
    if (texto) {
      texto.textContent = "Error al cargar Python: " + err.message;
      texto.style.color = "var(--uam-danger)";
    }
    console.error("Error Pyodide:", err);
    throw err;
  }
}

// ──────────────────────────────────────────────
// Función principal expuesta a interfaz.js
// ──────────────────────────────────────────────
async function resolverSistema(textos_A, textos_b) {
  if (!pyodideReady) {
    throw new Error("Pyodide aún no está listo. Espera unos segundos.");
  }

  // Serializar a JSON para evitar problemas con el puente Pyodide ↔ JS
  const jsonEntrada = JSON.stringify({ textos_A, textos_b });
  pyodide.globals.set("_json_entrada", jsonEntrada);

  const codigo = `
import json as _json

_entrada = _json.loads(_json_entrada)
_textos_A = _entrada["textos_A"]
_textos_b = _entrada["textos_b"]

try:
    _A, _b = leer_matriz_texto(_textos_A, _textos_b)
    _resultado = resolver_sistema(_A, _b)
    _salida = {"ok": True, "resultado": _resultado}
except Exception as _e:
    _salida = {"ok": False, "error": str(_e)}

_json.dumps(_salida)
`;

  const jsonStr = pyodide.runPython(codigo);
  const salida = JSON.parse(jsonStr);

  if (!salida.ok) {
    throw new Error(salida.error);
  }

  return salida.resultado;
}

// Iniciar en cuanto el DOM esté listo
window.addEventListener("DOMContentLoaded", () => {
  inicializarPyodide().catch((e) => console.error(e));
});
