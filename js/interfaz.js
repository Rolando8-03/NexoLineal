// ============================================================
// interfaz.js
// Interfaz de Sistemas Lineales de NexoLineal.
// ============================================================


// ============================================================
// ESTADO DE SISTEMAS LINEALES
// ============================================================

let numEcuaciones = 3;
let numVariables = 3;


/*
 * El estado se mantiene aunque el usuario cambie a
 * Vectores o Matrices desde el menú lateral.
 *
 * No es necesario volver a escribir la matriz.
 */
const estadoSistemas = {

    ecuaciones: 3,
    variables: 3,

    A: [],
    b: [],

    resultado: null,

    tabActiva: "resumen",
};


// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const selEcuaciones =
            document.getElementById(
                "sel-ecuaciones"
            );

        const selVariables =
            document.getElementById(
                "sel-variables"
            );

        const btnResolver =
            document.getElementById(
                "btn-resolver"
            );

        const btnLimpiar =
            document.getElementById(
                "btn-limpiar"
            );


        // ----------------------------------------------------
        // Selectores 1 a 6
        // ----------------------------------------------------

        poblarSelectorDimension(
            selEcuaciones,
            3
        );

        poblarSelectorDimension(
            selVariables,
            3
        );


        // ----------------------------------------------------
        // Cambiar número de ecuaciones
        // ----------------------------------------------------

        selEcuaciones.addEventListener(
            "change",
            () => {

                guardarEntradasActuales();

                numEcuaciones =
                    parseInt(
                        selEcuaciones.value,
                        10
                    );

                estadoSistemas.ecuaciones =
                    numEcuaciones;

                /*
                 * Al cambiar dimensiones el resultado anterior
                 * ya no representa el nuevo sistema.
                 *
                 * Los valores compatibles sí se conservan.
                 */
                estadoSistemas.resultado = null;

                generarMatriz(
                    true
                );

                ocultarResultados();
            }
        );


        // ----------------------------------------------------
        // Cambiar número de variables
        // ----------------------------------------------------

        selVariables.addEventListener(
            "change",
            () => {

                guardarEntradasActuales();

                numVariables =
                    parseInt(
                        selVariables.value,
                        10
                    );

                estadoSistemas.variables =
                    numVariables;

                estadoSistemas.resultado = null;

                generarMatriz(
                    true
                );

                ocultarResultados();
            }
        );


        // ----------------------------------------------------
        // Botones
        // ----------------------------------------------------

        btnResolver.addEventListener(
            "click",
            manejarResolver
        );

        btnLimpiar.addEventListener(
            "click",
            limpiarTodo
        );


        // ----------------------------------------------------
        // Generar la matriz inicial
        // ----------------------------------------------------

        generarMatriz(
            true
        );
    }
);


// ============================================================
// SELECTORES
// ============================================================

function poblarSelectorDimension(
    selector,
    valorInicial
) {

    if (!selector) {
        return;
    }

    selector.innerHTML = "";

    for (
        let i = 1;
        i <= 6;
        i++
    ) {

        const opcion =
            document.createElement(
                "option"
            );

        opcion.value = i;
        opcion.textContent = i;

        if (i === valorInicial) {
            opcion.selected = true;
        }

        selector.appendChild(
            opcion
        );
    }
}


// ============================================================
// GUARDAR ESTADO DE LA MATRIZ
// ============================================================

function guardarEntradasActuales() {

    const contenedor =
        document.getElementById(
            "contenedor-matriz"
        );

    if (
        !contenedor
        || !contenedor.children.length
    ) {
        return;
    }

    const A = [];
    const b = [];

    for (
        let i = 0;
        i < numEcuaciones;
        i++
    ) {

        const fila = [];

        for (
            let j = 0;
            j < numVariables;
            j++
        ) {

            const input =
                document.getElementById(
                    `a${i}_${j}`
                );

            fila.push(
                input
                    ? input.value
                    : ""
            );
        }

        A.push(
            fila
        );

        const inputB =
            document.getElementById(
                `b${i}`
            );

        b.push(
            inputB
                ? inputB.value
                : ""
        );
    }

    estadoSistemas.A = A;
    estadoSistemas.b = b;

    estadoSistemas.ecuaciones =
        numEcuaciones;

    estadoSistemas.variables =
        numVariables;
}


/*
 * Esta función quedará disponible para la navegación.
 *
 * Cuando posteriormente hagamos temas.js, antes de abandonar
 * Sistemas se podrá llamar:
 *
 *     guardarEstadoSistemas()
 *
 * aunque normalmente no será necesario porque el panel
 * simplemente se ocultará sin eliminarse del DOM.
 */
function guardarEstadoSistemas() {

    guardarEntradasActuales();

    return {
        ...estadoSistemas
    };
}


// ============================================================
// RESTAURAR ESTADO
// ============================================================

function restaurarEstadoSistemas() {

    numEcuaciones =
        estadoSistemas.ecuaciones || 3;

    numVariables =
        estadoSistemas.variables || 3;


    const selEcuaciones =
        document.getElementById(
            "sel-ecuaciones"
        );

    const selVariables =
        document.getElementById(
            "sel-variables"
        );


    if (selEcuaciones) {

        selEcuaciones.value =
            String(
                numEcuaciones
            );
    }


    if (selVariables) {

        selVariables.value =
            String(
                numVariables
            );
    }


    generarMatriz(
        true
    );


    /*
     * Si existe un resultado anterior,
     * se vuelve a mostrar.
     */
    if (
        estadoSistemas.resultado
    ) {

        renderizarResultado(
            estadoSistemas.resultado,
            false
        );

        activarTabSistema(
            estadoSistemas.tabActiva
            || "resumen"
        );
    }
}


// ============================================================
// GENERAR MATRIZ AUMENTADA
// ============================================================

function generarMatriz(
    restaurarValores = true
) {

    const contenedor =
        document.getElementById(
            "contenedor-matriz"
        );

    if (!contenedor) {
        return;
    }


    /*
     * Antes de reconstruir la cuadrícula guardamos
     * lo que el usuario ya escribió.
     */
    let valoresAnterioresA =
        estadoSistemas.A || [];

    let valoresAnterioresB =
        estadoSistemas.b || [];


    contenedor.innerHTML = "";


    // ========================================================
    // ENCABEZADO
    // ========================================================

    const encabezado =
        document.createElement(
            "div"
        );

    encabezado.className =
        "mat-header";

    encabezado.style.gridTemplateColumns =
        templateColumnasSistema();


    // Espacio para etiqueta F
    const vacioLabel =
        document.createElement(
            "span"
        );

    encabezado.appendChild(
        vacioLabel
    );


    // Variables x1, x2, ...
    for (
        let j = 0;
        j < numVariables;
        j++
    ) {

        const etiqueta =
            document.createElement(
                "span"
            );

        etiqueta.className =
            "mat-col-label";

        etiqueta.innerHTML =
            `x<sub>${j + 1}</sub>`;

        encabezado.appendChild(
            etiqueta
        );
    }


    // Columna b
    const etiquetaB =
        document.createElement(
            "span"
        );

    etiquetaB.className =
        "mat-col-label mat-col-b";

    etiquetaB.textContent =
        "b";

    encabezado.appendChild(
        etiquetaB
    );


    contenedor.appendChild(
        encabezado
    );


    // ========================================================
    // FILAS
    // ========================================================

    for (
        let i = 0;
        i < numEcuaciones;
        i++
    ) {

        const fila =
            document.createElement(
                "div"
            );

        fila.className =
            "mat-fila";

        fila.style.gridTemplateColumns =
            templateColumnasSistema();


        // ----------------------------------------------------
        // Etiqueta Fi
        // ----------------------------------------------------

        const etiquetaFila =
            document.createElement(
                "span"
            );

        etiquetaFila.className =
            "mat-fila-label";

        etiquetaFila.innerHTML =
            `F<sub>${i + 1}</sub>`;

        fila.appendChild(
            etiquetaFila
        );


        // ----------------------------------------------------
        // Coeficientes de A
        // ----------------------------------------------------

        for (
            let j = 0;
            j < numVariables;
            j++
        ) {

            const input =
                crearInputSistema(
                    `a${i}_${j}`,
                    `x${j + 1}`
                );


            /*
             * Conservar intersección de la matriz anterior.
             *
             * Ejemplo:
             *
             * 3x3 -> 4x4
             *
             * los nueve valores existentes permanecen.
             */
            if (
                restaurarValores
                && valoresAnterioresA[i]
                && valoresAnterioresA[i][j]
                !== undefined
            ) {

                input.value =
                    valoresAnterioresA[i][j];
            }


            fila.appendChild(
                input
            );
        }


        // ----------------------------------------------------
        // Término independiente b
        // ----------------------------------------------------

        const inputB =
            crearInputSistema(
                `b${i}`,
                "b"
            );

        inputB.classList.add(
            "celda-b"
        );


        if (
            restaurarValores
            && valoresAnterioresB[i]
            !== undefined
        ) {

            inputB.value =
                valoresAnterioresB[i];
        }


        fila.appendChild(
            inputB
        );


        contenedor.appendChild(
            fila
        );
    }


    // ========================================================
    // ACTUALIZAR ESTADO
    // ========================================================

    estadoSistemas.ecuaciones =
        numEcuaciones;

    estadoSistemas.variables =
        numVariables;


    guardarEntradasActuales();


    // ========================================================
    // ANIMACIÓN EXISTENTE
    // ========================================================

    const wrapper =
        document.getElementById(
            "wrapper-matriz"
        );

    if (wrapper) {

        wrapper.classList.remove(
            "mat-loaded"
        );

        requestAnimationFrame(
            () => {

                wrapper.classList.add(
                    "mat-loaded"
                );
            }
        );
    }
}


function templateColumnasSistema() {

    return (
        `40px repeat(${numVariables}, 1fr) 1fr`
    );
}


// ============================================================
// CREAR CELDA
// ============================================================

function crearInputSistema(
    id,
    placeholder
) {

    const input =
        document.createElement(
            "input"
        );

    input.type = "text";
    input.id = id;
    input.placeholder = placeholder;

    input.className =
        "celda-mat";

    input.inputMode =
        "decimal";

    input.autocomplete =
        "off";

    input.spellcheck =
        false;


    // --------------------------------------------------------
    // Cambios de valor
    // --------------------------------------------------------

    input.addEventListener(
        "input",
        () => {

            limpiarErrorCelda(
                input
            );

            guardarEntradasActuales();

            /*
             * Si se cambia la matriz después de resolver,
             * el resultado anterior deja de representar
             * los valores actuales.
             */
            if (
                estadoSistemas.resultado
            ) {

                estadoSistemas.resultado =
                    null;

                ocultarResultados();
            }
        }
    );


    // --------------------------------------------------------
    // Navegación con Enter
    // --------------------------------------------------------

    input.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Enter"
            ) {

                evento.preventDefault();

                navegarInputSistema(
                    id,
                    evento.shiftKey
                        ? -1
                        : 1
                );
            }
        }
    );


    return input;
}


// ============================================================
// NAVEGACIÓN ENTRE CELDAS
// ============================================================

function navegarInputSistema(
    idActual,
    direccion
) {

    const todos =
        Array.from(
            document.querySelectorAll(
                "#contenedor-matriz .celda-mat"
            )
        );

    const indice =
        todos.findIndex(
            elemento =>
                elemento.id
                === idActual
        );

    const siguiente =
        todos[
            indice
            + direccion
        ];

    if (siguiente) {

        siguiente.focus();

        siguiente.select();
    }
}


// ============================================================
// LIMPIAR ERROR DE CELDA
// ============================================================

function limpiarErrorCelda(
    input
) {

    input.classList.remove(
        "celda-error"
    );


    /*
     * El mensaje de error se coloca en la fila.
     * Se elimina solamente si pertenece a esta entrada.
     */
    const mensaje =
        document.getElementById(
            `error-${input.id}`
        );

    if (mensaje) {
        mensaje.remove();
    }
}


// ============================================================
// LEER MATRIZ
// ============================================================

function leerEntradas() {

    const textos_A = [];
    const textos_b = [];

    let valido = true;


    for (
        let i = 0;
        i < numEcuaciones;
        i++
    ) {

        const fila = [];


        for (
            let j = 0;
            j < numVariables;
            j++
        ) {

            const input =
                document.getElementById(
                    `a${i}_${j}`
                );

            const valor =
                input.value.trim();


            if (
                !esValorValido(
                    valor
                )
            ) {

                marcarError(
                    input,
                    "Valor inválido"
                );

                valido = false;
            }


            fila.push(
                valor
            );
        }


        textos_A.push(
            fila
        );


        const inputB =
            document.getElementById(
                `b${i}`
            );

        const valorB =
            inputB.value.trim();


        if (
            !esValorValido(
                valorB
            )
        ) {

            marcarError(
                inputB,
                "Valor inválido"
            );

            valido = false;
        }


        textos_b.push(
            valorB
        );
    }


    return {
        valido,
        textos_A,
        textos_b,
    };
}


// ============================================================
// VALIDACIÓN DE NÚMEROS
// ============================================================

function esValorValido(
    valor
) {

    if (
        valor === ""
    ) {
        return false;
    }


    const texto =
        valor
            .replace(
                /\s/g,
                ""
            );


    /*
     * Se aceptan:
     *
     * 5
     * -3
     * +2
     * 2.5
     * 2,5
     * 3/4
     * -7/2
     */
    return /^[+-]?(?:\d+(?:[.,]\d+)?|\d+\/\d+)$/.test(
        texto
    );
}


// ============================================================
// MARCAR ERROR
// ============================================================

function marcarError(
    input,
    mensaje
) {

    input.classList.add(
        "celda-error"
    );


    const idMensaje =
        `error-${input.id}`;


    if (
        document.getElementById(
            idMensaje
        )
    ) {
        return;
    }


    const elemento =
        document.createElement(
            "span"
        );

    elemento.id =
        idMensaje;

    elemento.className =
        "error-msg";

    elemento.textContent =
        mensaje;


    /*
     * Lo añadimos junto a la fila para no alterar
     * las dimensiones de la celda.
     */
    input.parentElement.appendChild(
        elemento
    );
}


// ============================================================
// RESOLVER SISTEMA
// ============================================================

async function manejarResolver() {

    const {
        valido,
        textos_A,
        textos_b,
    } = leerEntradas();


    if (!valido) {

        mostrarBannerError(
            "Corrige los campos marcados antes de continuar."
        );

        return;
    }


    // --------------------------------------------------------
    // Guardar matriz
    // --------------------------------------------------------

    estadoSistemas.A =
        textos_A.map(
            fila => fila.slice()
        );

    estadoSistemas.b =
        textos_b.slice();


    // --------------------------------------------------------
    // Botón de carga
    // --------------------------------------------------------

    const boton =
        document.getElementById(
            "btn-resolver"
        );

    boton.classList.add(
        "cargando"
    );

    boton.disabled =
        true;


    ocultarBannerError();


    try {

        const resultado =
            await resolverSistema(
                textos_A,
                textos_b
            );


        // ----------------------------------------------------
        // Guardar resultado completo
        // ----------------------------------------------------

        estadoSistemas.resultado =
            resultado;


        renderizarResultado(
            resultado
        );


        const seccion =
            document.getElementById(
                "seccion-resultado"
            );


        if (seccion) {

            seccion.scrollIntoView(
                {
                    behavior:
                        "smooth",

                    block:
                        "start",
                }
            );
        }


    } catch (error) {

        mostrarBannerError(
            error.message
        );


    } finally {

        boton.classList.remove(
            "cargando"
        );

        boton.disabled =
            false;
    }
}


// ============================================================
// BANNER DE ERROR
// ============================================================

function mostrarBannerError(
    mensaje
) {

    let banner =
        document.getElementById(
            "banner-error"
        );


    if (!banner) {

        banner =
            document.createElement(
                "div"
            );

        banner.id =
            "banner-error";

        banner.className =
            "banner-error";


        const seccion =
            document.getElementById(
                "seccion-entrada"
            );

        if (seccion) {

            seccion.appendChild(
                banner
            );
        }
    }


    banner.textContent =
        "⚠ " + mensaje;

    banner.style.display =
        "block";
}


function ocultarBannerError() {

    const banner =
        document.getElementById(
            "banner-error"
        );

    if (banner) {

        banner.style.display =
            "none";
    }
}


// ============================================================
// LIMPIAR SISTEMA
// ============================================================

function limpiarTodo() {

    document.querySelectorAll(
        "#contenedor-matriz .celda-mat"
    ).forEach(
        input => {

            input.value = "";

            limpiarErrorCelda(
                input
            );
        }
    );


    estadoSistemas.A =
        [];

    estadoSistemas.b =
        [];

    estadoSistemas.resultado =
        null;

    estadoSistemas.tabActiva =
        "resumen";


    ocultarResultados();

    ocultarBannerError();
}


// ============================================================
// OCULTAR RESULTADO
// ============================================================

function ocultarResultados() {

    const seccion =
        document.getElementById(
            "seccion-resultado"
        );

    if (!seccion) {
        return;
    }


    seccion.style.display =
        "none";

    seccion.innerHTML =
        "";
}


// ============================================================
// RENDERIZAR RESULTADO
// ============================================================

function renderizarResultado(
    resultado,
    recordarTab = true
) {

    const seccion =
        document.getElementById(
            "seccion-resultado"
        );


    if (!seccion) {
        return;
    }


    seccion.style.display =
        "block";

    seccion.innerHTML =
        "";


    // ========================================================
    // BANNER DE CLASIFICACIÓN
    // ========================================================

    const tipo =
        resultado.tipo;


    const banner =
        document.createElement(
            "div"
        );

    banner.className =
        `clasificacion-banner tipo-${tipo}`;


    let icono = "✓";

    if (
        tipo === "infinitas"
    ) {

        icono = "∞";

    } else if (
        tipo === "inconsistente"
    ) {

        icono = "✗";
    }


    banner.innerHTML = `
        <span class="cls-icono">
            ${icono}
        </span>

        <div>
            <div class="cls-titulo">
                ${resultado.clasificacion}
            </div>

            <div class="cls-conclusion">
                ${resultado.conclusion}
            </div>
        </div>
    `;


    seccion.appendChild(
        banner
    );


    // ========================================================
    // TABS
    // ========================================================

    const tabsWrapper =
        document.createElement(
            "div"
        );

    tabsWrapper.className =
        "tabs-wrapper";


    const tabsNav =
        document.createElement(
            "div"
        );

    tabsNav.className =
        "tabs-nav";


    const tabsContent =
        document.createElement(
            "div"
        );

    tabsContent.className =
        "tabs-content";


    tabsWrapper.appendChild(
        tabsNav
    );

    tabsWrapper.appendChild(
        tabsContent
    );

    seccion.appendChild(
        tabsWrapper
    );


    const tabs = [

        {
            id: "resumen",
            label: "Resumen",
        },

        {
            id: "gauss-jordan",
            label: "Gauss-Jordan",
        },

        {
            id: "gauss",
            label: "Gauss",
        },

        {
            id: "comprobacion",
            label: "Comprobación",
        },

        {
            id: "ecuacion-matricial",
            label: "Ecuación matricial",
        },

        {
            id: "ecuacion-vectorial",
            label: "Ecuación vectorial",
        },
    ];


    tabs.forEach(
        (
            tab,
            indice
        ) => {

            const boton =
                document.createElement(
                    "button"
                );

            boton.type =
                "button";

            boton.className =
                "tab-btn";

            boton.dataset.tabSistema =
                tab.id;

            boton.textContent =
                tab.label;


            boton.addEventListener(
                "click",
                () => {

                    activarTabSistema(
                        tab.id
                    );
                }
            );


            tabsNav.appendChild(
                boton
            );


            const panel =
                document.createElement(
                    "div"
                );

            panel.className =
                "tab-panel";

            panel.id =
                `tab-sistema-${tab.id}`;


            tabsContent.appendChild(
                panel
            );
        }
    );


    // ========================================================
    // CONTENIDO
    // ========================================================

    poblarResumen(
        document.getElementById(
            "tab-sistema-resumen"
        ),
        resultado
    );


    poblarGaussJordan(
        document.getElementById(
            "tab-sistema-gauss-jordan"
        ),
        resultado
    );


    poblarGauss(
        document.getElementById(
            "tab-sistema-gauss"
        ),
        resultado
    );


    poblarComprobacion(
        document.getElementById(
            "tab-sistema-comprobacion"
        ),
        resultado
    );


    poblarEcuacionMatricialSistema(
        document.getElementById(
            "tab-sistema-ecuacion-matricial"
        ),
        resultado
    );


    poblarEcuacionVectorialSistema(
        document.getElementById(
            "tab-sistema-ecuacion-vectorial"
        ),
        resultado
    );


    // ========================================================
    // RESTAURAR TAB
    // ========================================================

    let tabInicial =
        "resumen";


    if (
        recordarTab
        && estadoSistemas.tabActiva
    ) {

        tabInicial =
            estadoSistemas.tabActiva;
    }


    activarTabSistema(
        tabInicial
    );


    renderizarKatex(
        seccion
    );
}


// ============================================================
// PROPIEDADES REF / RREF
// ============================================================

const propiedadesForma = [

    "Las filas nulas están debajo de las no nulas.",

    "Cada entrada principal está a la derecha de la anterior.",

    "Hay ceros debajo de cada entrada principal.",

    "Todas las entradas principales son 1.",

    "Cada entrada principal es la única no nula en su columna.",
];


function tablaForma(
    forma
) {

    const filas =
        propiedadesForma
            .map(
                (
                    texto,
                    indice
                ) => {

                    const cumple =
                        forma.propiedades[
                            indice
                        ]
                            ? "Sí"
                            : "No";


                    return `
                        <tr>
                            <td>
                                ${indice + 1}. ${texto}
                            </td>

                            <td>
                                ${cumple}
                            </td>
                        </tr>
                    `;
                }
            )
            .join("");


    return `
        <p>
            <strong>
                ${forma.clasificacion}
            </strong>
        </p>

        <table class="tabla-tema">
            <thead>
                <tr>
                    <th>Propiedad</th>
                    <th>¿Se cumple?</th>
                </tr>
            </thead>

            <tbody>
                ${filas}
            </tbody>
        </table>
    `;
}


// ============================================================
// TAB: RESUMEN
// ============================================================

function poblarResumen(
    panel,
    r
) {

    let html = "";


    // ========================================================
    // SISTEMA ORIGINAL
    // ========================================================

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Sistema original
            </h3>

            <div class="katex-display">
                $$${sistemaLatex(
                    r.A,
                    r.b
                )}$$
            </div>

        </div>
    `;


    // ========================================================
    // NATURALEZA DEL SISTEMA
    // ========================================================

    const claseNaturaleza =
        r.es_homogeneo
            ? "estado-ok"
            : "estado-info";


    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Naturaleza del sistema
            </h3>

            <div class="estado-matematico ${claseNaturaleza}">
                <strong>
                    ${r.naturaleza_sistema}
                </strong>
            </div>
    `;


    if (
        r.es_homogeneo
        && r.descripcion_homogenea
    ) {

        html += `
            <p>
                ${r.descripcion_homogenea}
            </p>
        `;
    }


    html += `
        </div>
    `;


    // ========================================================
    // INDEPENDENCIA DE COLUMNAS
    // ========================================================

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Columnas de A
            </h3>

            <div class="estado-matematico ${
                r.columnas_linealmente_independientes
                    ? "estado-ok"
                    : "estado-aviso"
            }">

                <strong>
                    ${
                        r.columnas_linealmente_independientes
                            ? "Linealmente independientes"
                            : "Linealmente dependientes"
                    }
                </strong>

            </div>

            <p>
                ${r.descripcion_columnas}
            </p>

        </div>
    `;


    // ========================================================
    // ECUACIÓN MATRICIAL COMPACTA
    // ========================================================

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Forma matricial
            </h3>

            <div class="katex-display">
                $$${ecuacionMatricialLatex(
                    r.A,
                    r.b
                )}$$
            </div>

        </div>
    `;


    // ========================================================
    // MATRIZ AUMENTADA
    // ========================================================

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Matriz aumentada [A | b]
            </h3>

            <div class="katex-display">
                $$${matrizLatex(
                    r.matriz_inicial,
                    r.numero_variables
                )}$$
            </div>

        </div>
    `;


    // ========================================================
    // ROUCHÉ-FROBENIUS
    // ========================================================

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Criterio de clasificación
            </h3>

            <div class="katex-display">

                $$

                \\operatorname{rango}(A)
                =
                ${r.rango_A},

                \\qquad

                \\operatorname{rango}([A\\mid b])
                =
                ${r.rango_aumentada},

                \\qquad

                n
                =
                ${r.numero_variables}

                $$

            </div>

        </div>
    `;


    // ========================================================
    // PIVOTES
    // ========================================================

    const columnasPivote =
        (
            r.columnas_pivote
            || []
        )
            .map(
                columna =>
                    columna + 1
            );


    const variablesBasicas =
        (
            r.variables_basicas
            || []
        )
            .map(
                variable =>
                    `x<sub>${variable + 1}</sub>`
            );


    const variablesLibres =
        (
            r.variables_libres
            || []
        )
            .map(
                variable =>
                    `x<sub>${variable + 1}</sub>`
            );


    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Pivotes y variables
            </h3>

            <div class="resumen-datos">

                <p>
                    <strong>
                        Columnas pivote de A:
                    </strong>

                    ${
                        columnasPivote.length
                            ? columnasPivote
                                .map(
                                    numero =>
                                        `C${numero}`
                                )
                                .join(", ")
                            : "Ninguna"
                    }
                </p>

                <p>
                    <strong>
                        Variables básicas:
                    </strong>

                    ${
                        variablesBasicas.length
                            ? variablesBasicas.join(", ")
                            : "Ninguna"
                    }
                </p>

                <p>
                    <strong>
                        Variables libres:
                    </strong>

                    ${
                        variablesLibres.length
                            ? variablesLibres.join(", ")
                            : "Ninguna"
                    }
                </p>

            </div>

        </div>
    `;


    // ========================================================
    // REF
    // ========================================================

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Forma escalonada por filas (REF)
            </h3>

            <div class="katex-display">

                $$${matrizLatex(
                    r.matriz_escalonada,
                    r.numero_variables
                )}$$

            </div>

            ${tablaForma(
                r.forma_escalonada
            )}

        </div>
    `;


    // ========================================================
    // RREF
    // ========================================================

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Forma escalonada reducida por filas (RREF)
            </h3>

            <div class="katex-display">

                $$${matrizLatex(
                    r.matriz_rref,
                    r.numero_variables,
                    r.posiciones_pivote
                )}$$

            </div>

            ${tablaForma(
                r.forma_rref
            )}

        </div>
    `;


    // ========================================================
    // SISTEMA INCONSISTENTE
    // ========================================================

    if (
        r.tipo === "inconsistente"
    ) {

        if (
            r.fila_contradiccion_datos
        ) {

            const valor =
                r.fila_contradiccion_datos[
                    r.fila_contradiccion_datos.length
                    - 1
                ];


            html += `
                <div class="seccion-resultado">

                    <h3 class="sec-titulo">
                        Fila contradictoria
                    </h3>

                    <div class="katex-display">

                        $$${matrizLatex(
                            [
                                r.fila_contradiccion_datos
                            ],
                            r.numero_variables
                        )}$$

                    </div>

                    <div class="katex-display">

                        $$
                        0
                        =
                        ${formatFrac(valor)},
                        \\qquad
                        ${formatFrac(valor)}
                        \\neq
                        0
                        $$

                    </div>

                </div>
            `;
        }


        panel.innerHTML =
            html;

        return;
    }


    // ========================================================
    // SOLUCIÓN
    // ========================================================

    const libres =
        r.variables_libres
        || [];


    if (
        r.tipo === "unica"
    ) {

        html += `
            <div class="seccion-resultado">

                <h3 class="sec-titulo">
                    Solución única
                </h3>

                <div class="katex-display">

                    $$${listaSolucionesLatex(
                        r.expresiones_rref,
                        libres
                    )}$$

                </div>

            </div>
        `;

    } else {

        const nombres =
            libres
                .map(
                    variable =>
                        `x_{${variable + 1}}`
                )
                .join(
                    ",\\quad "
                );


        html += `
            <div class="seccion-resultado">

                <h3 class="sec-titulo">
                    Variables libres
                </h3>

                <div class="katex-display">
                    $$${nombres}$$
                </div>


                <h3 class="sec-titulo">
                    Solución paramétrica general
                </h3>

                <div class="katex-display">

                    $$${listaSolucionesLatex(
                        r.expresiones_rref,
                        libres
                    )}$$

                </div>

                <p>
                    Los parámetros libres pueden tomar
                    cualquier valor real.
                </p>

            </div>
        `;
    }


    panel.innerHTML =
        html;
}


// ============================================================
// TAB: GAUSS-JORDAN
// ============================================================

function poblarGaussJordan(
    panel,
    r
) {

    let html = `
        <p class="intro-metodo">
            Primero se aplica eliminación de Gauss para
            formar ceros debajo de cada pivote. Después,
            Gauss-Jordan convierte los pivotes en 1 y
            forma ceros encima de ellos.
        </p>
    `;


    const pasos = [
        ...(r.pasos_gauss || []),
        ...(r.pasos_jordan || []),
    ];


    html += construirAcordeon(
        pasos,
        r.numero_variables,
        1,
        "gj"
    );


    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Resultado final (RREF)
            </h3>

            <div class="katex-display">

                $$${matrizLatex(
                    r.matriz_rref,
                    r.numero_variables
                )}$$

            </div>

        </div>
    `;


    panel.innerHTML =
        html;
}


// ============================================================
// TAB: GAUSS
// ============================================================

function poblarGauss(
    panel,
    r
) {

    let html = `
        <p class="intro-metodo">

            Se aplican operaciones elementales por filas
            hasta obtener una matriz escalonada. Cuando
            el sistema es consistente se continúa mediante
            sustitución regresiva.

        </p>
    `;


    html += construirAcordeon(
        r.pasos_gauss || [],
        r.numero_variables,
        1,
        "g"
    );


    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Matriz escalonada
            </h3>

            <div class="katex-display">

                $$${matrizLatex(
                    r.matriz_escalonada,
                    r.numero_variables
                )}$$

            </div>

        </div>
    `;


    if (
        r.tipo !== "inconsistente"
    ) {

        html += `
            <div class="seccion-resultado">

                <h3 class="sec-titulo">
                    Sustitución regresiva
                </h3>
        `;


        const sustitucion =
            r.pasos_sustitucion
            || [];


        sustitucion.forEach(
            (
                paso,
                indice
            ) => {

                const expresion =
                    expresionLatex(
                        paso.variable,
                        paso.expresion,
                        r.variables_libres
                    );


                html += `
                    <div class="sust-paso">

                        <span class="sust-num">
                            ${indice + 1}.
                        </span>

                        Se despeja
                        $x_{${paso.variable + 1}}$
                        usando la fila
                        ${paso.fila + 1}.

                        <div class="katex-display">
                            $$${expresion}$$
                        </div>

                    </div>
                `;
            }
        );


        html += `
                <h3 class="sec-titulo">
                    Resultado obtenido con Gauss
                </h3>

                <div class="katex-display">

                    $$${listaSolucionesLatex(
                        r.expresiones_gauss,
                        r.variables_libres
                    )}$$

                </div>

            </div>
        `;
    }


    panel.innerHTML =
        html;
}


// ============================================================
// TAB: COMPROBACIÓN
// ============================================================

function poblarComprobacion(
    panel,
    r
) {

    if (
        r.tipo === "inconsistente"
    ) {

        panel.innerHTML = `
            <p class="intro-metodo">

                El sistema es inconsistente, por lo tanto
                no existe una solución que pueda comprobarse
                en todas las ecuaciones originales.

            </p>
        `;

        return;
    }


    let html = "";


    if (
        r.tipo === "infinitas"
    ) {

        html += `
            <p class="intro-metodo">

                Para comprobar el sistema se utiliza la
                solución particular obtenida al asignar
                cero a los parámetros libres.

            </p>
        `;
    }


    const comprobaciones =
        r.comprobaciones
        || [];


    comprobaciones.forEach(
        comprobacion => {

            const partes = [];


            comprobacion.terminos
                .forEach(
                    termino => {

                        const coeficiente =
                            parseFrac(
                                termino.coeficiente
                            );


                        if (
                            coeficiente === 0
                        ) {
                            return;
                        }


                        const magnitud =
                            formatFrac(
                                fracAbs(
                                    termino.coeficiente
                                )
                            );


                        const valor =
                            formatFrac(
                                termino.valor
                            );


                        const producto =
                            `${magnitud}\\left(${valor}\\right)`;


                        if (
                            partes.length === 0
                        ) {

                            partes.push(
                                (
                                    coeficiente < 0
                                        ? "-"
                                        : ""
                                )
                                + producto
                            );

                        } else {

                            partes.push(
                                (
                                    coeficiente < 0
                                        ? "-"
                                        : "+"
                                )
                                + producto
                            );
                        }
                    }
                );


            const izquierda =
                partes.length
                    ? partes.join("")
                    : "0";


            const total =
                formatFrac(
                    comprobacion.resultado
                );


            const esperado =
                formatFrac(
                    comprobacion.esperado
                );


            const simbolo =
                comprobacion.cumple
                    ? "\\checkmark"
                    : "\\times";


            html += `
                <div class="comp-card ${
                    comprobacion.cumple
                        ? "ok"
                        : "error"
                }">

                    <div class="comp-titulo">
                        Ecuación
                        ${comprobacion.ecuacion}
                    </div>

                    <div class="katex-display">

                        $$
                        ${izquierda}
                        =
                        ${total}
                        =
                        ${esperado}
                        \\qquad
                        ${simbolo}
                        $$

                    </div>

                </div>
            `;
        }
    );


    if (
        comprobaciones.length
        && comprobaciones.every(
            comprobacion =>
                comprobacion.cumple
        )
    ) {

        html += `
            <div class="comp-exito">

                ✓ La solución satisface todas las
                ecuaciones del sistema original.

            </div>
        `;
    }


    panel.innerHTML =
        html;
}


// ============================================================
// TAB: ECUACIÓN MATRICIAL
// ============================================================

function poblarEcuacionMatricialSistema(
    panel,
    r
) {

    let html = `
        <p class="intro-metodo">

            Un sistema de ecuaciones lineales puede escribirse
            en la forma matricial

            $Ax=b$,

            donde A contiene los coeficientes, x contiene
            las incógnitas y b contiene los términos
            independientes.

        </p>


        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Matriz de coeficientes A
            </h3>

            <div class="katex-display">

                $$A=${matrizNormalLatex(
                    r.A
                )}$$

            </div>

        </div>


        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Vector de incógnitas x
            </h3>

            <div class="katex-display">

                $$x=${vectorVariablesLatex(
                    r.numero_variables
                )}$$

            </div>

        </div>


        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Vector b
            </h3>

            <div class="katex-display">

                $$b=${vectorLatexSistema(
                    r.b
                )}$$

            </div>

        </div>


        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Ecuación matricial
            </h3>

            <div class="katex-display">

                $$${ecuacionMatricialLatex(
                    r.A,
                    r.b
                )}$$

            </div>

        </div>
    `;


    // --------------------------------------------------------
    // Relación con la existencia de soluciones
    // --------------------------------------------------------

    if (
        r.tipo === "inconsistente"
    ) {

        html += `
            <div class="seccion-resultado">

                <p>
                    La ecuación matricial

                    $Ax=b$

                    no tiene solución porque el sistema es
                    inconsistente.
                </p>

            </div>
        `;

    } else if (
        r.tipo === "unica"
    ) {

        html += `
            <div class="seccion-resultado">

                <p>
                    La ecuación matricial tiene una única
                    solución.
                </p>

                <div class="katex-display">

                    $$x=${vectorLatexSistema(
                        r.solucion_particular
                    )}$$

                </div>

            </div>
        `;

    } else {

        html += `
            <div class="seccion-resultado">

                <p>
                    La ecuación matricial tiene infinitas
                    soluciones porque existen variables
                    libres.
                </p>

                <div class="katex-display">

                    $$${solucionVectorialLatex(
                        r
                    )}$$

                </div>

            </div>
        `;
    }


    panel.innerHTML =
        html;
}


// ============================================================
// TAB: ECUACIÓN VECTORIAL
// ============================================================

function poblarEcuacionVectorialSistema(
    panel,
    r
) {

    const columnas =
        r.columnas_vectores
        || [];


    const ecuacion =
        columnas
            .map(
                (
                    vector,
                    indice
                ) => {

                    return (
                        `x_{${indice + 1}}`
                        + vectorLatexSistema(
                            vector
                        )
                    );
                }
            )
            .join(
                "+"
            );


    let html = `
        <p class="intro-metodo">

            Cada columna de A puede interpretarse como
            un vector. El sistema $Ax=b$ es equivalente
            a preguntar si una combinación lineal de
            esas columnas produce el vector b.

        </p>


        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Columnas de A
            </h3>

            <div class="katex-display">

                $$
                ${ecuacion}
                =
                ${vectorLatexSistema(
                    r.b
                )}
                $$

            </div>

        </div>


        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                ¿b es combinación lineal de las columnas de A?
            </h3>
    `;


    if (
        !r.es_combinacion_lineal
    ) {

        html += `
            <div class="estado-matematico estado-aviso">

                <strong>
                    No.
                </strong>

                El sistema es inconsistente, por lo tanto
                ningún conjunto de pesos produce b.

            </div>

        </div>
        `;


        panel.innerHTML =
            html;

        return;
    }


    html += `
        <div class="estado-matematico estado-ok">

            <strong>
                Sí.
            </strong>

            El sistema es consistente.

        </div>

    </div>
    `;


    const solucion =
        r.solucion_particular
        || [];


    // --------------------------------------------------------
    // Una combinación concreta
    // --------------------------------------------------------

    const combinacion =
        columnas
            .map(
                (
                    vector,
                    indice
                ) => {

                    const peso =
                        formatFrac(
                            solucion[
                                indice
                            ]
                            ?? "0"
                        );


                    return (
                        `\\left(${peso}\\right)`
                        + vectorLatexSistema(
                            vector
                        )
                    );
                }
            )
            .join(
                "+"
            );


    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Una elección de coeficientes
            </h3>

            <div class="katex-display">

                $$x=${vectorLatexSistema(
                    solucion
                )}$$

            </div>


            <div class="katex-display">

                $$
                ${combinacion}
                =
                ${vectorLatexSistema(
                    r.b
                )}
                $$

            </div>


            <p>

                ${
                    r.tipo === "unica"
                        ? (
                            "Los coeficientes son únicos."
                        )
                        : (
                            "Esta es una solución particular. "
                            + "Existen otras elecciones porque "
                            + "hay variables libres."
                        )
                }

            </p>

        </div>
    `;


    // --------------------------------------------------------
    // Forma vectorial de toda la solución
    // --------------------------------------------------------

    html += `
        <div class="seccion-resultado">

            <h3 class="sec-titulo">
                Forma vectorial de la solución
            </h3>

            <div class="katex-display">

                $$${solucionVectorialLatex(
                    r
                )}$$

            </div>

        </div>
    `;


    panel.innerHTML =
        html;
}


// ============================================================
// SOLUCIÓN VECTORIAL
// ============================================================

function solucionVectorialLatex(
    r
) {

    if (
        !r.solucion_particular
        || !r.solucion_particular.length
    ) {

        return ("\text{No existe solución}");
    }


    let expresion =
        "x="
        + vectorLatexSistema(
            r.solucion_particular
        );


    (
        r.direcciones
        || []
    ).forEach(
        (
            direccion,
            indice
        ) => {

            expresion +=
                `+t_{${indice + 1}}`
                + vectorLatexSistema(
                    direccion
                );
        }
    );


    return expresion;
}


// ============================================================
// ACORDEÓN DE PASOS
// ============================================================

function construirAcordeon(
    pasos,
    numeroVariables,
    numeroInicial = 1,
    prefijo = "paso"
) {

    if (
        !pasos
        || !pasos.length
    ) {

        return `
            <p class="intro-metodo">
                No fueron necesarias operaciones adicionales.
            </p>
        `;
    }


    let html =
        '<div class="acordeon">';


    pasos.forEach(
        (
            paso,
            indice
        ) => {

            const numero =
                numeroInicial
                + indice;


            const id =
                `${prefijo}-${numero}`;


            const operacion =
                operacionLatex(
                    paso.operacion
                );


            let matriz = "";


            if (
                paso.mostrar_matriz
            ) {

                matriz = `
                    <div class="katex-display">

                        $$${matrizLatex(
                            paso.matriz,
                            numeroVariables
                        )}$$

                    </div>
                `;
            }


            html += `
                <div class="acord-item">

                    <button
                        class="acord-header"
                        type="button"
                        data-acordeon="${id}"
                    >

                        <span class="acord-num">
                            Paso ${numero}
                        </span>

                        <span class="acord-titulo">
                            ${paso.titulo}
                        </span>

                        <span class="acord-chevron">
                            ▾
                        </span>

                    </button>


                    <div
                        class="acord-body"
                        id="${id}"
                    >

                        <div class="katex-display">
                            $$${operacion}$$
                        </div>

                        ${matriz}

                    </div>

                </div>
            `;
        }
    );


    html +=
        "</div>";


    /*
     * El listener se instala después de insertar el HTML,
     * desde renderizarResultado mediante delegación global.
     */
    setTimeout(
        conectarAcordeones,
        0
    );


    return html;
}


// ============================================================
// CONECTAR ACORDEONES
// ============================================================

function conectarAcordeones() {

    document.querySelectorAll(
        ".acord-header[data-acordeon]"
    ).forEach(
        boton => {

            if (
                boton.dataset.conectado
                === "true"
            ) {
                return;
            }


            boton.dataset.conectado =
                "true";


            boton.addEventListener(
                "click",
                () => {

                    toggleAcordeon(
                        boton.dataset.acordeon
                    );
                }
            );
        }
    );
}


function toggleAcordeon(
    id
) {

    const body =
        document.getElementById(
            id
        );

    if (!body) {
        return;
    }


    const item =
        body.closest(
            ".acord-item"
        );


    const abierto =
        body.classList.contains(
            "abierto"
        );


    body.classList.toggle(
        "abierto",
        !abierto
    );


    if (item) {

        item.classList.toggle(
            "activo",
            !abierto
        );
    }
}


// ============================================================
// TABS DE SISTEMAS
// ============================================================

function activarTabSistema(
    id
) {

    estadoSistemas.tabActiva =
        id;


    document.querySelectorAll(
        "[data-tab-sistema]"
    ).forEach(
        boton => {

            boton.classList.toggle(
                "activo",
                boton.dataset.tabSistema
                === id
            );
        }
    );


    document.querySelectorAll(
        "[id^='tab-sistema-']"
    ).forEach(
        panel => {

            panel.classList.toggle(
                "activo",
                panel.id
                === `tab-sistema-${id}`
            );
        }
    );
}


// ============================================================
// KATEX
// ============================================================

function renderizarKatex(
    contenedor
) {

    if (
        typeof renderMathInElement
        === "undefined"
    ) {
        return;
    }


    renderMathInElement(
        contenedor,
        {

            delimiters: [

                {
                    left: "$$",
                    right: "$$",
                    display: true,
                },

                {
                    left: "$",
                    right: "$",
                    display: false,
                },
            ],

            throwOnError: false,

            errorColor:
                "#E74C3C",
        }
    );
}


// ============================================================
// FORMATO DE FRACCIONES
// ============================================================

function formatFrac(
    valor
) {

    if (
        typeof valor
        !== "string"
    ) {

        valor =
            String(
                valor
            );
    }


    const partes =
        valor.split(
            "/"
        );


    if (
        partes.length === 1
    ) {

        return partes[0];
    }


    const numerador =
        parseInt(
            partes[0],
            10
        );


    const denominador =
        parseInt(
            partes[1],
            10
        );


    if (
        denominador === 1
    ) {

        return String(
            numerador
        );
    }


    const signo =
        numerador < 0
            ? "-"
            : "";


    return (
        `${signo}\\frac{`
        + `${Math.abs(numerador)}}`
        + `{${Math.abs(denominador)}}`
    );
}


function fracAbs(
    valor
) {

    const texto =
        String(
            valor
        );


    const partes =
        texto.split(
            "/"
        );


    if (
        partes.length === 1
    ) {

        return String(
            Math.abs(
                parseInt(
                    partes[0],
                    10
                )
            )
        );
    }


    return (
        `${Math.abs(
            parseInt(
                partes[0],
                10
            )
        )}/${Math.abs(
            parseInt(
                partes[1],
                10
            )
        )}`
    );
}


function parseFrac(
    valor
) {

    if (
        typeof valor
        === "number"
    ) {

        return valor;
    }


    if (
        valor === null
        || valor === undefined
        || valor === ""
    ) {

        return 0;
    }


    const partes =
        String(
            valor
        ).split(
            "/"
        );


    if (
        partes.length === 1
    ) {

        return parseFloat(
            partes[0]
        );
    }


    return (
        parseFloat(
            partes[0]
        )
        /
        parseFloat(
            partes[1]
        )
    );
}


// ============================================================
// MATRIZ LATEX
// ============================================================

function matrizLatex(
    matriz,
    numeroVariables = null,
    posiciones = []
) {

    if (
        !matriz
        || !matriz.length
        || !matriz[0]
    ) {

        return (
            "\\left[\\right]"
        );
    }


    const columnas =
        numeroVariables === null

            ? (
                "c".repeat(
                    matriz[0].length
                )
            )

            : (
                "c".repeat(
                    numeroVariables
                )
                + "|c"
            );


    const filas =
        matriz
            .map(
                (
                    fila,
                    i
                ) => {

                    return fila
                        .map(
                            (
                                valor,
                                j
                            ) => {

                                const pivote =
                                    posiciones.some(
                                        posicion =>
                                            Number(
                                                posicion[0]
                                            )
                                            === i
                                            &&
                                            Number(
                                                posicion[1]
                                            )
                                            === j
                                    );


                                if (pivote) {

                                    return (
                                        `\\boxed{`
                                        + formatFrac(
                                            valor
                                        )
                                        + "}"
                                    );
                                }


                                return formatFrac(
                                    valor
                                );
                            }
                        )
                        .join(
                            " & "
                        );
                }
            )
            .join(
                " \\\\ "
            );


    return (
        `\\left[\\begin{array}{${columnas}}`
        + filas
        + "\\end{array}\\right]"
    );
}


function matrizNormalLatex(
    matriz
) {

    if (
        !matriz
        || !matriz.length
    ) {

        return (
            "\\begin{pmatrix}\\end{pmatrix}"
        );
    }


    const filas =
        matriz
            .map(
                fila =>
                    fila
                        .map(
                            formatFrac
                        )
                        .join(
                            " & "
                        )
            )
            .join(
                " \\\\ "
            );


    return (
        "\\begin{pmatrix}"
        + filas
        + "\\end{pmatrix}"
    );
}


// ============================================================
// VECTOR LATEX
// ============================================================

function vectorLatexSistema(
    vector
) {

    const valores =
        (
            vector
            || []
        )
            .map(
                formatFrac
            )
            .join(
                " \\\\ "
            );


    return (
        "\\begin{pmatrix}"
        + valores
        + "\\end{pmatrix}"
    );
}


function vectorVariablesLatex(
    cantidad
) {

    const variables = [];


    for (
        let i = 1;
        i <= cantidad;
        i++
    ) {

        variables.push(
            `x_{${i}}`
        );
    }


    return (
        "\\begin{pmatrix}"
        + variables.join(
            " \\\\ "
        )
        + "\\end{pmatrix}"
    );
}


// ============================================================
// SISTEMA LATEX
// ============================================================

function sistemaLatex(
    A,
    b
) {

    const ecuaciones =
        A.map(
            (
                fila,
                indiceFila
            ) => {

                let izquierda =
                    "";


                fila.forEach(
                    (
                        coeficiente,
                        indiceColumna
                    ) => {

                        const numero =
                            parseFrac(
                                coeficiente
                            );


                        if (
                            numero === 0
                        ) {
                            return;
                        }


                        const magnitud =
                            formatFrac(
                                fracAbs(
                                    coeficiente
                                )
                            );


                        const variable =
                            `x_{${indiceColumna + 1}}`;


                        const termino =
                            Math.abs(
                                numero
                            ) === 1

                                ? variable

                                : (
                                    magnitud
                                    + variable
                                );


                        if (
                            izquierda === ""
                        ) {

                            izquierda =
                                (
                                    numero < 0
                                        ? "-"
                                        : ""
                                )
                                + termino;

                        } else {

                            izquierda +=
                                numero < 0
                                    ? "-" + termino
                                    : "+" + termino;
                        }
                    }
                );


                if (
                    izquierda === ""
                ) {

                    izquierda =
                        "0";
                }


                return (
                    izquierda
                    + "="
                    + formatFrac(
                        b[
                            indiceFila
                        ]
                    )
                );
            }
        );


    return (
        "\\begin{cases}"
        + ecuaciones.join(
            " \\\\ "
        )
        + "\\end{cases}"
    );
}


// ============================================================
// ECUACIÓN MATRICIAL LATEX
// ============================================================

function ecuacionMatricialLatex(
    A,
    b
) {

    return (
        matrizNormalLatex(
            A
        )
        + vectorVariablesLatex(
            A[0].length
        )
        + "="
        + vectorLatexSistema(
            b
        )
    );
}


// ============================================================
// EXPRESIONES PARAMÉTRICAS
// ============================================================

function expresionLatex(
    variable,
    expresion,
    variablesLibres
) {

    const constante =
        expresion.constante;


    const terminos =
        expresion.terminos
        || {};


    let derecha =
        "";


    const valorConstante =
        parseFrac(
            constante
        );


    if (
        valorConstante !== 0
        || Object.keys(
            terminos
        ).length === 0
    ) {

        derecha =
            formatFrac(
                constante
            );
    }


    (
        variablesLibres
        || []
    ).forEach(
        (
            libre,
            indiceParametro
        ) => {

            const clave =
                String(
                    libre
                );


            if (
                !(clave in terminos)
            ) {
                return;
            }


            const coeficiente =
                terminos[
                    clave
                ];


            const valor =
                parseFrac(
                    coeficiente
                );


            const parametro =
                `t_{${indiceParametro + 1}}`;


            const magnitud =
                formatFrac(
                    fracAbs(
                        coeficiente
                    )
                );


            const termino =
                Math.abs(
                    valor
                ) === 1

                    ? parametro

                    : (
                        magnitud
                        + parametro
                    );


            if (
                derecha === ""
            ) {

                derecha =
                    (
                        valor < 0
                            ? "-"
                            : ""
                    )
                    + termino;

            } else {

                derecha +=
                    valor < 0
                        ? "-" + termino
                        : "+" + termino;
            }
        }
    );


    if (
        derecha === ""
    ) {

        derecha =
            "0";
    }


    return (
        `x_{${variable + 1}}`
        + "="
        + derecha
    );
}


function listaSolucionesLatex(
    expresiones,
    variablesLibres
) {

    const lineas =
        expresiones.map(
            (
                expresion,
                indice
            ) => {

                return expresionLatex(
                    indice,
                    expresion,
                    variablesLibres
                );
            }
        );


    return (
        "\\begin{aligned}"
        + lineas.join(
            " \\\\ "
        )
        + "\\end{aligned}"
    );
}


// ============================================================
// OPERACIÓN ELEMENTAL LATEX
// ============================================================

function operacionLatex(
    operacion
) {

    const tipo =
        operacion.tipo;


    if (
        tipo === "inicial"
    ) {

        return (
            "[A\\mid b]"
        );
    }


    if (
        tipo === "inicial_matriz"
    ) {

        return "A";
    }


    if (
        tipo === "retomar"
    ) {

        return (
            "\\text{Se retoma la matriz escalonada obtenida con Gauss.}"
        );
    }


    if (
        tipo === "pivote"
    ) {

        const fila =
            parseInt(
                operacion.fila,
                10
            )
            + 1;


        const columna =
            parseInt(
                operacion.columna,
                10
            )
            + 1;


        const valor =
            formatFrac(
                operacion.valor
            );


        const nombre =
            operacion.aumentada

                ? "la columna aumentada"

                : (
                    `la columna ${columna}`
                );


        return (
            `p=${valor},\\quad `
            + "\\text{pivote seleccionado en "
            + `${nombre}, fila }F_{${fila}}`
        );
    }


    if (
        tipo === "intercambio"
    ) {

        const filaA =
            parseInt(
                operacion.fila_a,
                10
            )
            + 1;


        const filaB =
            parseInt(
                operacion.fila_b,
                10
            )
            + 1;


        return (
            `F_{${filaA}}`
            + "\\leftrightarrow"
            + `F_{${filaB}}`
        );
    }


    if (
        tipo === "mcm"
    ) {

        const fila =
            parseInt(
                operacion.fila,
                10
            )
            + 1;


        return (
            `\\operatorname{mcm}`
            + `=${operacion.multiplo},`
            + "\\qquad "
            + `F_{${fila}}`
            + "\\leftarrow "
            + `${operacion.multiplo}`
            + `F_{${fila}}`
        );
    }


    if (
        tipo === "normalizacion"
    ) {

        const fila =
            parseInt(
                operacion.fila,
                10
            )
            + 1;


        const constante =
            formatFrac(
                operacion.constante
            );


        return (
            `F_{${fila}}`
            + "\\leftarrow"
            + `\\left(${constante}\\right)`
            + `F_{${fila}}`
        );
    }


    if (
        tipo === "combinacion"
    ) {

        const destino =
            parseInt(
                operacion.destino,
                10
            )
            + 1;


        const origen =
            parseInt(
                operacion.origen,
                10
            )
            + 1;


        const p =
            formatFrac(
                operacion.p
            );


        const b =
            formatFrac(
                operacion.b
            );


        const k =
            formatFrac(
                operacion.k
            );


        const valorK =
            parseFrac(
                operacion.k
            );


        let operacionFila;


        if (
            valorK < 0
        ) {

            operacionFila =
                `F_{${destino}}`
                + "\\leftarrow"
                + `F_{${destino}}`
                + "-"
                + "\\left("
                + formatFrac(
                    fracAbs(
                        operacion.k
                    )
                )
                + "\\right)"
                + `F_{${origen}}`;

        } else {

            operacionFila =
                `F_{${destino}}`
                + "\\leftarrow"
                + `F_{${destino}}`
                + "+"
                + `\\left(${k}\\right)`
                + `F_{${origen}}`;
        }


        return (
            "k=-\\frac{b}{p}"
            + `=-\\frac{\\left(${b}\\right)}`
            + `{\\left(${p}\\right)}`
            + `=${k},\\qquad `
            + operacionFila
        );
    }


    return (
        "\\text{Operación elemental por filas}"
    );
}