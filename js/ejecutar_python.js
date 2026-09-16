const PYTHON_FILES = [
    "python/operaciones_fila.py",
    "python/entrada_datos.py",
    "python/metodos_eliminacion.py",
    "python/formas_matriciales.py",
    "python/analisis_sistema.py",
    "python/vectores.py",
    "python/relaciones_vectoriales.py",
    "python/operaciones_matrices.py",
    "python/formato_latex.py",
];


// ============================================================
// ESTADO DE PYODIDE
// ============================================================

let pyodide = null;
let pyodideReady = false;
let inicializandoPyodide = false;


// ============================================================
// ELEMENTOS DE LA PANTALLA DE CARGA
// ============================================================

function obtenerElementosCarga() {
    return {
        barra: document.getElementById("barra-carga"),
        texto: document.getElementById("texto-carga"),
        contenedor: document.getElementById("contenedor-carga"),
    };
}


function actualizarCarga(
    mensaje,
    porcentaje
) {
    const {
        barra,
        texto,
    } = obtenerElementosCarga();

    if (texto) {
        texto.textContent = mensaje;
    }

    if (barra) {
        barra.style.width = `${porcentaje}%`;
    }
}


function mostrarErrorCarga(
    mensaje
) {
    const {
        texto,
        contenedor,
    } = obtenerElementosCarga();

    if (contenedor) {
        contenedor.style.display = "flex";
        contenedor.style.opacity = "1";
    }

    if (texto) {
        texto.textContent = mensaje;
        texto.style.color = "var(--uam-danger)";
    }
}


// ============================================================
// CARGAR UN ARCHIVO PYTHON
// ============================================================

async function cargarArchivoPython(
    ruta
) {
    /*
     * Se utiliza cache: "no-store" para evitar que el navegador
     * continúe utilizando una versión anterior de un archivo
     * Python después de que nosotros lo modifiquemos.
     */

    const respuesta = await fetch(
        ruta,
        {
            cache: "no-store",
        }
    );

    if (!respuesta.ok) {
        throw new Error(
            `No se pudo cargar ${ruta}. `
            + `Código HTTP: ${respuesta.status}`
        );
    }

    const codigo = await respuesta.text();

    /*
     * Pyodide trabaja con un sistema de archivos virtual.
     *
     * Python importará:
     *
     *     entrada_datos.py
     *
     * y no:
     *
     *     python/entrada_datos.py
     *
     * Por eso guardamos únicamente el nombre del archivo.
     */

    const nombreArchivo = ruta
        .split("/")
        .pop();

    pyodide.FS.writeFile(
        nombreArchivo,
        codigo
    );
}


// ============================================================
// COMPROBAR LOS MÓDULOS PYTHON
// ============================================================

function comprobarModulosPython() {

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
import relaciones_vectoriales
import operaciones_matrices
import formato_latex
`);
}


// ============================================================
// INICIALIZAR PYODIDE
// ============================================================

async function inicializarPyodide() {
    /*
     * Evita iniciar Pyodide dos veces si por alguna razón
     * la función recibe más de una llamada.
     */

    if (
        pyodideReady
        || inicializandoPyodide
    ) {
        return;
    }

    inicializandoPyodide = true;

    const {
        barra,
        texto,
        contenedor,
    } = obtenerElementosCarga();

    if (contenedor) {
        contenedor.style.display = "flex";
        contenedor.style.opacity = "1";
    }

    if (texto) {
        texto.style.color = "";
    }

    try {
        // ----------------------------------------------------
        // 1. Cargar Pyodide
        // ----------------------------------------------------

        actualizarCarga(
            "Cargando entorno Python (Pyodide)…",
            10
        );

        pyodide = await loadPyodide();

        actualizarCarga(
            "Preparando NexoLineal…",
            25
        );


        // ----------------------------------------------------
        // 2. Cargar todos los módulos Python
        // ----------------------------------------------------

        const totalArchivos = PYTHON_FILES.length;

        for (
            let indice = 0;
            indice < totalArchivos;
            indice++
        ) {
            const ruta = PYTHON_FILES[indice];

            const porcentaje = (
                25
                + Math.round(
                    (
                        (indice + 1)
                        / totalArchivos
                    )
                    * 55
                )
            );

            actualizarCarga(
                `Cargando ${ruta.split("/").pop()}…`,
                porcentaje
            );

            await cargarArchivoPython(
                ruta
            );
        }


        // ----------------------------------------------------
        // 3. Comprobar imports
        // ----------------------------------------------------

        actualizarCarga(
            "Comprobando módulos matemáticos…",
            85
        );

        comprobarModulosPython();


        // ----------------------------------------------------
        // 4. Finalizar
        // ----------------------------------------------------

        actualizarCarga(
            "NexoLineal está listo.",
            100
        );

        pyodideReady = true;
        inicializandoPyodide = false;

        /*
         * Lanzamos un evento propio.
         *
         * Más adelante interfaz.js, vectores.js y matrices.js
         * podrán escuchar:
         *
         *     nexolineal-python-listo
         *
         * si necesitan habilitar botones después de cargar.
         */

        window.dispatchEvent(
            new CustomEvent(
                "nexolineal-python-listo"
            )
        );

        setTimeout(
            () => {
                if (!contenedor) {
                    return;
                }

                contenedor.style.opacity = "0";

                setTimeout(
                    () => {
                        contenedor.style.display = "none";
                        contenedor.style.opacity = "1";
                    },
                    500
                );
            },
            400
        );

    } catch (error) {
        pyodideReady = false;
        inicializandoPyodide = false;

        mostrarErrorCarga(
            "Error al cargar NexoLineal: "
            + error.message
        );

        console.error(
            "Error al inicializar Pyodide:",
            error
        );

        throw error;
    }
}


// ============================================================
// COMPROBAR QUE PYODIDE ESTÉ LISTO
// ============================================================

function verificarPyodide() {
    if (
        !pyodide
        || !pyodideReady
    ) {
        throw new Error(
            "NexoLineal todavía está cargando Python. "
            + "Espera unos segundos e inténtalo nuevamente."
        );
    }
}


// ============================================================
// EJECUTAR PYTHON DE FORMA SEGURA
// ============================================================

function ejecutarPythonJSON(
    codigoPython,
    datos,
    nombreVariable="_entrada_js"
) {
    /*
     * Todos los datos JS -> Python se convierten primero
     * a JSON.
     *
     * Esto evita problemas de conversión entre:
     *
     *     Array JavaScript
     *
     * y:
     *
     *     list Python
     */

    verificarPyodide();

    const jsonEntrada = JSON.stringify(
        datos
    );

    pyodide.globals.set(
        nombreVariable,
        jsonEntrada
    );

    const codigo = `
import json as _json

try:
${indentarCodigo(codigoPython, 4)}

    _respuesta_js = {
        "ok": True,
        "resultado": _resultado_python
    }

except Exception as _error_python:

    _respuesta_js = {
        "ok": False,
        "error": str(_error_python)
    }

_json.dumps(
    _respuesta_js,
    default=str
)
`;

    const salidaTexto = pyodide.runPython(
        codigo
    );

    let salida;

    try {
        salida = JSON.parse(
            salidaTexto
        );

    } catch (error) {
        console.error(
            "Respuesta Python no válida:",
            salidaTexto
        );

        throw new Error(
            "Python devolvió una respuesta que "
            + "no pudo ser interpretada."
        );
    }

    if (!salida.ok) {
        throw new Error(
            salida.error
        );
    }

    return salida.resultado;
}


// ============================================================
// INDENTAR CÓDIGO PYTHON
// ============================================================

function indentarCodigo(
    codigo,
    espacios
) {
    const sangria = " ".repeat(
        espacios
    );

    return codigo
        .split("\n")
        .map(
            linea => (
                linea.trim() === ""
                    ? ""
                    : sangria + linea
            )
        )
        .join("\n");
}


// ============================================================
// SISTEMAS LINEALES
// ============================================================

async function resolverSistema(
    textos_A,
    textos_b
) {
    /*
     * La interfaz de Sistemas lineales sigue enviando:
     *
     *     textos_A
     *     textos_b
     *
     * exactamente igual que antes.
     *
     * De esta forma conservamos el diseño que ya tienes.
     */

    const datos = {
        textos_A,
        textos_b,
    };

    return ejecutarPythonJSON(
        `
from entrada_datos import leer_matriz_texto
from analisis_sistema import resolver_sistema

_entrada = _json.loads(_entrada_js)

_A, _b = leer_matriz_texto(
    _entrada["textos_A"],
    _entrada["textos_b"]
)

_resultado_python = resolver_sistema(
    _A,
    _b
)
`,
        datos,
        "_entrada_js"
    );
}


// ============================================================
// OPERACIONES CON VECTORES
// ============================================================

async function ejecutarVectores(
    datos
) {
    /*
     * Ejemplos de operación:
     *
     *     suma
     *     resta
     *     escalar
     *     opuesto
     *     combinacion
     *     norma
     *     propiedades
     */

    const entrada = {
        ...datos,
        accion: "vectores",
    };

    return ejecutarPythonJSON(
        `
from vectores import ejecutar_tema

_entrada = _json.loads(_entrada_js)

_resultado_python = ejecutar_tema(
    _entrada
)
`,
        entrada,
        "_entrada_js"
    );
}


// ============================================================
// COMBINACIÓN LINEAL
// ============================================================

async function analizarCombinacionLineal(
    vectores,
    b
) {
    /*
     * vectores:
     *
     * [
     *     ["1", "0", "2"],
     *     ["0", "1", "3"]
     * ]
     *
     * b:
     *
     * ["4", "5", "6"]
     */

    const datos = {
        accion: "combinacion_lineal",
        vectores,
        b,
    };

    return ejecutarPythonJSON(
        `
from relaciones_vectoriales import ejecutar_relaciones

_entrada = _json.loads(_entrada_js)

_resultado_python = ejecutar_relaciones(
    _entrada
)
`,
        datos,
        "_entrada_js"
    );
}


// ============================================================
// INDEPENDENCIA LINEAL
// ============================================================

async function analizarIndependenciaLineal(
    vectores
) {
    const datos = {
        accion: "independencia_lineal",
        vectores,
    };

    return ejecutarPythonJSON(
        `
from relaciones_vectoriales import ejecutar_relaciones

_entrada = _json.loads(_entrada_js)

_resultado_python = ejecutar_relaciones(
    _entrada
)
`,
        datos,
        "_entrada_js"
    );
}


// ============================================================
// OPERACIONES CON MATRICES
// ============================================================

async function ejecutarMatrices(
    datos
) {
    /*
     * datos.operacion puede ser:
     *
     *     suma
     *     resta
     *     escalar
     *     igualdad
     *     clasificacion
     *     producto
     *     transpuesta
     *     reduccion
     *     propiedad
     */

    return ejecutarPythonJSON(
        `
from operaciones_matrices import ejecutar_matrices

_entrada = _json.loads(_entrada_js)

_resultado_python = ejecutar_matrices(
    _entrada
)
`,
        datos,
        "_entrada_js"
    );
}


// ============================================================
// REDUCCIÓN DE MATRICES
// ============================================================

async function reducirMatriz(
    A
) {
    return ejecutarMatrices(
        {
            operacion: "reduccion",
            A,
        }
    );
}


// ============================================================
// TRANSPUESTA
// ============================================================

async function transponerMatriz(
    A
) {
    return ejecutarMatrices(
        {
            operacion: "transpuesta",
            A,
        }
    );
}


// ============================================================
// CLASIFICACIÓN DE MATRIZ
// ============================================================

async function clasificarMatriz(
    A
) {
    return ejecutarMatrices(
        {
            operacion: "clasificacion",
            A,
        }
    );
}


// ============================================================
// MULTIPLICACIÓN DE MATRICES
// ============================================================

async function multiplicarMatrices(
    A,
    B
) {
    return ejecutarMatrices(
        {
            operacion: "producto",
            A,
            B,
        }
    );
}


// ============================================================
// PROPIEDADES DE MATRICES
// ============================================================

async function comprobarPropiedadMatriz(
    propiedad,
    datos={}
) {
    return ejecutarMatrices(
        {
            ...datos,
            operacion: "propiedad",
            propiedad,
        }
    );
}


// ============================================================
// FUNCIÓN GENÉRICA POR COMPATIBILIDAD
// ============================================================

async function ejecutarTema(
    datos
) {
    /*
     * Conservamos ejecutarTema() para no romper inmediatamente
     * código que todavía exista en temas.js.
     *
     * Los nuevos módulos utilizarán preferentemente:
     *
     *     ejecutarVectores()
     *     analizarCombinacionLineal()
     *     analizarIndependenciaLineal()
     *     ejecutarMatrices()
     */

    const accion = datos?.accion;

    if (accion === "vectores") {
        return ejecutarVectores(
            datos
        );
    }

    if (
        accion === "combinacion_lineal"
    ) {
        return analizarCombinacionLineal(
            datos.vectores,
            datos.b
        );
    }

    if (
        accion === "independencia_lineal"
    ) {
        return analizarIndependenciaLineal(
            datos.vectores
        );
    }

    /*
     * Para matrices podemos recibir:
     *
     *     accion: "matrices"
     *
     * o directamente una propiedad "operacion".
     */

    if (
        accion === "matrices"
        || datos?.operacion
    ) {
        const copia = {
            ...datos,
        };

        delete copia.accion;

        return ejecutarMatrices(
            copia
        );
    }

    throw new Error(
        "La operación solicitada no está reconocida "
        + "por NexoLineal."
    );
}


// ============================================================
// INFORMACIÓN DEL ESTADO DE PYTHON
// ============================================================

function pythonEstaListo() {
    return pyodideReady;
}


// ============================================================
// INICIAR PYODIDE
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    () => {
        inicializarPyodide()
            .catch(
                error => {
                    console.error(
                        error
                    );
                }
            );
    }
);