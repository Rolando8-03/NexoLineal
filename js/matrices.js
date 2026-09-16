// ============================================================
// matrices.js
// Interfaz del módulo de Matrices de NexoLineal.
// ============================================================


// ============================================================
// ESTADO DEL MÓDULO
// ============================================================

const estadoMatrices = {
    inicializado: false,
    herramientaActiva: "operaciones",

    matrices: {
        A: crearEstadoMatriz(3, 3),
        B: crearEstadoMatriz(3, 3),
        C: crearEstadoMatriz(3, 3),
    },

    operaciones: {
        operacion: "suma",
        c: "",
        resultado: null,
    },

    producto: {
        resultado: null,
    },

    transpuesta: {
        resultado: null,
    },

    reduccion: {
        resultado: null,
    },

    propiedades: {
        propiedad: "suma_conmutativa",
        r: "",
        s: "",
        resultado: null,
    },
};


// ============================================================
// ESTADO DE UNA MATRIZ
// ============================================================

function crearEstadoMatriz(
    filas,
    columnas
) {
    return {
        filas,
        columnas,
        valores: crearMatrizVacia(
            filas,
            columnas
        ),
    };
}


function crearMatrizVacia(
    filas,
    columnas
) {
    return Array.from(
        { length: filas },
        () => Array.from(
            { length: columnas },
            () => ""
        )
    );
}


function ajustarMatrizEstado(
    nombre,
    filas,
    columnas
) {
    const actual =
        estadoMatrices.matrices[
            nombre
        ];

    const nueva =
        crearMatrizVacia(
            filas,
            columnas
        );

    /*
     * Se conservan los valores que todavía
     * caben en las nuevas dimensiones.
     */
    for (
        let i = 0;
        i < Math.min(
            filas,
            actual.filas
        );
        i++
    ) {
        for (
            let j = 0;
            j < Math.min(
                columnas,
                actual.columnas
            );
            j++
        ) {
            nueva[i][j] =
                actual.valores[i][j];
        }
    }

    actual.filas =
        filas;

    actual.columnas =
        columnas;

    actual.valores =
        nueva;

    invalidarResultadosMatrices();
}


function invalidarResultadosMatrices() {
    /*
     * Cambiar una entrada no borra las matrices.
     *
     * Únicamente invalida resultados que pertenecían
     * a valores anteriores.
     */

    estadoMatrices.operaciones.resultado =
        null;

    estadoMatrices.producto.resultado =
        null;

    estadoMatrices.transpuesta.resultado =
        null;

    estadoMatrices.reduccion.resultado =
        null;

    estadoMatrices.propiedades.resultado =
        null;
}


// ============================================================
// INICIALIZAR VISTA
// ============================================================

function inicializarModuloMatrices() {
    if (
        estadoMatrices.inicializado
    ) {
        return;
    }

    const contenedor =
        document.getElementById(
            "herramientas"
        );

    if (!contenedor) {
        console.error(
            "No existe #herramientas "
            + "para crear la vista de Matrices."
        );

        return;
    }

    const vista =
        document.createElement(
            "section"
        );

    vista.id =
        "vista-matrices";

    vista.className =
        "vista-tema vista-matrices";

    /*
     * El menú lateral decidirá cuándo mostrarla.
     */
    vista.style.display =
        "none";

    vista.innerHTML = `
        <div class="tema-contenedor">

            <div class="tema-encabezado">

                <div>

                    <div class="tema-etiqueta">
                        Álgebra de matrices
                    </div>

                    <h2 class="tema-titulo">
                        Matrices
                    </h2>

                    <p class="tema-descripcion">

                        Opera con matrices, aplica la regla
                        fila-columna, calcula transpuestas,
                        reduce por filas y comprueba propiedades.

                    </p>

                </div>

            </div>


            <nav
                class="tema-menu-interno"
                aria-label="Herramientas de matrices"
            >

                <button
                    type="button"
                    class="tema-menu-btn activo"
                    data-matriz-herramienta="operaciones"
                >
                    Operaciones
                </button>


                <button
                    type="button"
                    class="tema-menu-btn"
                    data-matriz-herramienta="producto"
                >
                    Producto
                </button>


                <button
                    type="button"
                    class="tema-menu-btn"
                    data-matriz-herramienta="transpuesta"
                >
                    Transpuesta
                </button>


                <button
                    type="button"
                    class="tema-menu-btn"
                    data-matriz-herramienta="reduccion"
                >
                    Reducción
                </button>


                <button
                    type="button"
                    class="tema-menu-btn"
                    data-matriz-herramienta="propiedades"
                >
                    Propiedades
                </button>

            </nav>


            <div
                id="matriz-panel-operaciones"
                class="matriz-panel interno-activo"
            ></div>


            <div
                id="matriz-panel-producto"
                class="matriz-panel"
            ></div>


            <div
                id="matriz-panel-transpuesta"
                class="matriz-panel"
            ></div>


            <div
                id="matriz-panel-reduccion"
                class="matriz-panel"
            ></div>


            <div
                id="matriz-panel-propiedades"
                class="matriz-panel"
            ></div>

        </div>
    `;

    contenedor.appendChild(
        vista
    );

    conectarMenuMatrices();

    renderizarOperacionesMatrices();

    renderizarProductoMatrices();

    renderizarTranspuestaMatriz();

    renderizarReduccionMatriz();

    renderizarPropiedadesMatrices();

    estadoMatrices.inicializado =
        true;
}


// ============================================================
// MOSTRAR / OCULTAR VISTA
// ============================================================

function mostrarVistaMatrices() {
    inicializarModuloMatrices();

    const vista =
        document.getElementById(
            "vista-matrices"
        );

    if (vista) {
        vista.style.display =
            "block";
    }

    activarHerramientaMatrices(
        estadoMatrices.herramientaActiva
    );
}


function ocultarVistaMatrices() {
    const vista =
        document.getElementById(
            "vista-matrices"
        );

    if (vista) {
        vista.style.display =
            "none";
    }
}


// ============================================================
// MENÚ INTERNO
// ============================================================

function conectarMenuMatrices() {
    document.querySelectorAll(
        "[data-matriz-herramienta]"
    ).forEach(
        boton => {
            boton.addEventListener(
                "click",
                () => {
                    activarHerramientaMatrices(
                        boton.dataset
                            .matrizHerramienta
                    );
                }
            );
        }
    );
}


function activarHerramientaMatrices(
    herramienta
) {
    estadoMatrices.herramientaActiva =
        herramienta;

    document.querySelectorAll(
        "[data-matriz-herramienta]"
    ).forEach(
        boton => {
            boton.classList.toggle(
                "activo",
                boton.dataset
                    .matrizHerramienta
                === herramienta
            );
        }
    );

    document.querySelectorAll(
        "#vista-matrices .matriz-panel"
    ).forEach(
        panel => {
            panel.classList.remove(
                "interno-activo"
            );
        }
    );

    const panel =
        document.getElementById(
            `matriz-panel-${herramienta}`
        );

    if (panel) {
        panel.classList.add(
            "interno-activo"
        );
    }

    renderizarHerramientaMatrices(
        herramienta
    );
}


function renderizarHerramientaMatrices(
    herramienta =
        estadoMatrices.herramientaActiva
) {
    if (
        herramienta ===
        "operaciones"
    ) {
        renderizarOperacionesMatrices();

    } else if (
        herramienta ===
        "producto"
    ) {
        renderizarProductoMatrices();

    } else if (
        herramienta ===
        "transpuesta"
    ) {
        renderizarTranspuestaMatriz();

    } else if (
        herramienta ===
        "reduccion"
    ) {
        renderizarReduccionMatriz();

    } else if (
        herramienta ===
        "propiedades"
    ) {
        renderizarPropiedadesMatrices();
    }
}


// ============================================================
// SELECTORES DE DIMENSIÓN
// ============================================================

function opcionesDimensionMatriz(
    valor
) {
    let html =
        "";

    for (
        let i = 1;
        i <= 6;
        i++
    ) {
        html += `
            <option
                value="${i}"
                ${
                    i === valor
                        ? "selected"
                        : ""
                }
            >
                ${i}
            </option>
        `;
    }

    return html;
}


// ============================================================
// CUADRÍCULA DE MATRIZ
// ============================================================

function htmlMatrizEntrada(
    nombre,
    titulo,
    contexto
) {
    const estado =
        estadoMatrices.matrices[
            nombre
        ];

    const encabezados =
        Array.from(
            {
                length:
                    estado.columnas
            },
            (_, j) => `
                <span class="matriz-grid-columna">

                    C<sub>${j + 1}</sub>

                </span>
            `
        ).join("");

    let filas =
        "";

    for (
        let i = 0;
        i < estado.filas;
        i++
    ) {
        let celdas =
            "";

        for (
            let j = 0;
            j < estado.columnas;
            j++
        ) {
            celdas += `
                <input
                    type="text"
                    class="celda-matriz-tema"

                    id="${contexto}-${nombre}-${i}-${j}"

                    data-matriz-nombre="${nombre}"
                    data-matriz-fila="${i}"
                    data-matriz-columna="${j}"

                    value="${escaparAtributoMatriz(
                        estado.valores[i][j]
                    )}"

                    placeholder="0"

                    autocomplete="off"
                    spellcheck="false"
                    inputmode="decimal"

                    aria-label="${nombre}, fila ${i + 1}, columna ${j + 1}"
                >
            `;
        }

        filas += `
            <div
                class="matriz-grid-fila"

                style="
                    grid-template-columns:
                    42px
                    repeat(
                        ${estado.columnas},
                        minmax(54px, 1fr)
                    );
                "
            >

                <span class="matriz-grid-fila-label">

                    F<sub>${i + 1}</sub>

                </span>

                ${celdas}

            </div>
        `;
    }

    return `
        <article
            class="matriz-entrada-card"
            data-matriz-card="${nombre}"
        >

            <div class="matriz-entrada-cabecera">

                <div>

                    <h4>
                        ${titulo}
                    </h4>

                    <span class="matriz-dimension-badge">

                        ${estado.filas}
                        ×
                        ${estado.columnas}

                    </span>

                </div>


                <div class="matriz-dimensiones">

                    <label>

                        Filas

                        <select
                            data-dimension-matriz="${nombre}"
                            data-dimension-tipo="filas"
                        >

                            ${opcionesDimensionMatriz(
                                estado.filas
                            )}

                        </select>

                    </label>


                    <label>

                        Columnas

                        <select
                            data-dimension-matriz="${nombre}"
                            data-dimension-tipo="columnas"
                        >

                            ${opcionesDimensionMatriz(
                                estado.columnas
                            )}

                        </select>

                    </label>

                </div>

            </div>


            <div class="matriz-grid-wrapper">

                <div
                    class="matriz-grid-encabezado"

                    style="
                        grid-template-columns:
                        42px
                        repeat(
                            ${estado.columnas},
                            minmax(54px, 1fr)
                        );
                    "
                >

                    <span></span>

                    ${encabezados}

                </div>


                <div class="matriz-grid-cuerpo">

                    ${filas}

                </div>

            </div>

        </article>
    `;
}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparAtributoMatriz(
    valor
) {
    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );
}


function escaparTextoMatriz(
    valor
) {
    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// ============================================================
// CONECTAR CUADRÍCULAS
// ============================================================

function conectarMatricesEn(
    contenedor,
    alCambiar = null
) {
    if (!contenedor) {
        return;
    }

    contenedor.querySelectorAll(
        ".celda-matriz-tema"
    ).forEach(
        input => {
            input.addEventListener(
                "input",
                () => {
                    const nombre =
                        input.dataset
                            .matrizNombre;

                    const fila =
                        Number(
                            input.dataset
                                .matrizFila
                        );

                    const columna =
                        Number(
                            input.dataset
                                .matrizColumna
                        );

                    estadoMatrices
                        .matrices[
                            nombre
                        ]
                        .valores[
                            fila
                        ][
                            columna
                        ] =
                        input.value;

                    invalidarResultadosMatrices();

                    if (
                        typeof alCambiar
                        === "function"
                    ) {
                        alCambiar();
                    }
                }
            );
        }
    );

    contenedor.querySelectorAll(
        "[data-dimension-matriz]"
    ).forEach(
        selector => {
            selector.addEventListener(
                "change",
                () => {
                    const nombre =
                        selector.dataset
                            .dimensionMatriz;

                    const tipo =
                        selector.dataset
                            .dimensionTipo;

                    const matriz =
                        estadoMatrices
                            .matrices[
                                nombre
                            ];

                    const valor =
                        Number(
                            selector.value
                        );

                    const filas =
                        tipo === "filas"
                            ? valor
                            : matriz.filas;

                    const columnas =
                        tipo === "columnas"
                            ? valor
                            : matriz.columnas;

                    ajustarMatrizEstado(
                        nombre,
                        filas,
                        columnas
                    );

                    renderizarHerramientaMatrices();
                }
            );
        }
    );
}


function copiarValoresMatriz(
    nombre
) {
    return estadoMatrices
        .matrices[
            nombre
        ]
        .valores
        .map(
            fila =>
                fila.slice()
        );
}


// ============================================================
// OPERACIONES
// ============================================================

function opcionesOperacionesMatrices(
    seleccion
) {
    const opciones = [
        [
            "suma",
            "Suma A + B",
        ],

        [
            "resta",
            "Resta A - B",
        ],

        [
            "escalar",
            "Multiplicación cA",
        ],

        [
            "igualdad",
            "Igualdad A = B",
        ],

        [
            "clasificacion",
            "Clasificar matriz A",
        ],
    ];

    return opciones
        .map(
            (
                [
                    valor,
                    texto,
                ]
            ) => `
                <option
                    value="${valor}"

                    ${
                        valor === seleccion
                            ? "selected"
                            : ""
                    }
                >
                    ${texto}
                </option>
            `
        )
        .join("");
}


function matricesRequeridasOperacion(
    operacion
) {
    if (
        [
            "suma",
            "resta",
            "igualdad",
        ].includes(
            operacion
        )
    ) {
        return [
            "A",
            "B",
        ];
    }

    return [
        "A",
    ];
}


function renderizarOperacionesMatrices() {
    const panel =
        document.getElementById(
            "matriz-panel-operaciones"
        );

    if (!panel) {
        return;
    }

    const estado =
        estadoMatrices.operaciones;

    const requeridas =
        matricesRequeridasOperacion(
            estado.operacion
        );

    panel.innerHTML = `
        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Operaciones con matrices
                    </h3>

                    <p>

                        Selecciona una operación e ingresa
                        las matrices directamente en la
                        cuadrícula.

                    </p>

                </div>

            </div>


            <div class="tema-controles">

                <div class="tema-control">

                    <label for="matriz-operacion-select">

                        Operación

                    </label>

                    <select id="matriz-operacion-select">

                        ${opcionesOperacionesMatrices(
                            estado.operacion
                        )}

                    </select>

                </div>


                ${
                    estado.operacion
                    === "escalar"

                        ? `
                            <div class="tema-control">

                                <label for="matriz-escalar-c">

                                    Escalar c

                                </label>

                                <input
                                    id="matriz-escalar-c"

                                    type="text"

                                    value="${escaparAtributoMatriz(
                                        estado.c
                                    )}"

                                    placeholder="Ej. 2"

                                    autocomplete="off"
                                >

                            </div>
                        `

                        : ""
                }

            </div>


            <div
                id="matriz-operaciones-entradas"
                class="matrices-entradas-grid"
            >

                ${requeridas
                    .map(
                        nombre =>
                            htmlMatrizEntrada(
                                nombre,
                                `Matriz ${nombre}`,
                                "op"
                            )
                    )
                    .join("")}

            </div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-calcular-matriz-operacion"
                    class="btn-tema-principal"
                >
                    Calcular
                </button>

            </div>

        </div>


        <div
            id="resultado-matriz-operacion"
            class="tema-resultado"
        ></div>
    `;


    const selector =
        document.getElementById(
            "matriz-operacion-select"
        );


    selector.addEventListener(
        "change",
        () => {
            estado.operacion =
                selector.value;

            estado.resultado =
                null;

            renderizarOperacionesMatrices();
        }
    );


    const inputC =
        document.getElementById(
            "matriz-escalar-c"
        );


    if (inputC) {
        inputC.addEventListener(
            "input",
            () => {
                estado.c =
                    inputC.value;

                estado.resultado =
                    null;

                renderizarResultadoOperacionMatriz();
            }
        );
    }


    conectarMatricesEn(
        document.getElementById(
            "matriz-operaciones-entradas"
        ),
        renderizarResultadoOperacionMatriz
    );


    document.getElementById(
        "btn-calcular-matriz-operacion"
    ).addEventListener(
        "click",
        ejecutarOperacionMatrizUI
    );


    renderizarResultadoOperacionMatriz();
}


// ============================================================
// EJECUTAR OPERACIÓN
// ============================================================

async function ejecutarOperacionMatrizUI() {
    const estado =
        estadoMatrices.operaciones;

    const boton =
        document.getElementById(
            "btn-calcular-matriz-operacion"
        );

    const datos = {
        operacion:
            estado.operacion,

        A:
            copiarValoresMatriz(
                "A"
            ),
    };


    if (
        [
            "suma",
            "resta",
            "igualdad",
        ].includes(
            estado.operacion
        )
    ) {
        datos.B =
            copiarValoresMatriz(
                "B"
            );
    }


    if (
        estado.operacion
        === "escalar"
    ) {
        datos.c =
            estado.c;
    }


    ponerBotonCargandoMatriz(
        boton,
        true,
        "Calculando…"
    );


    try {
        estado.resultado =
            await ejecutarMatrices(
                datos
            );

        renderizarResultadoOperacionMatriz();

    } catch (error) {
        mostrarErrorMatriz(
            "resultado-matriz-operacion",
            error.message
        );

    } finally {
        ponerBotonCargandoMatriz(
            boton,
            false,
            "Calcular"
        );
    }
}


// ============================================================
// RESULTADO DE OPERACIONES
// ============================================================

function renderizarResultadoOperacionMatriz() {
    const contenedor =
        document.getElementById(
            "resultado-matriz-operacion"
        );

    if (!contenedor) {
        return;
    }

    const r =
        estadoMatrices
            .operaciones
            .resultado;

    if (!r) {
        contenedor.innerHTML =
            "";

        return;
    }

    let html = `
        <div class="tema-panel resultado-panel">

            <h3 class="sec-titulo">
                Resultado
            </h3>
    `;


    // ========================================================
    // SUMA
    // ========================================================

    if (
        r.operacion === "suma"
    ) {
        html += `
            <div class="katex-display">

                $$

                ${matrizNormalLatex(
                    r.A
                )}

                +

                ${matrizNormalLatex(
                    r.B
                )}

                =

                ${matrizNormalLatex(
                    r.resultado
                )}

                $$

            </div>
        `;
    }


    // ========================================================
    // RESTA
    // ========================================================

    else if (
        r.operacion === "resta"
    ) {
        html += `
            <div class="katex-display">

                $$

                ${matrizNormalLatex(
                    r.A
                )}

                -

                ${matrizNormalLatex(
                    r.B
                )}

                =

                ${matrizNormalLatex(
                    r.resultado
                )}

                $$

            </div>
        `;
    }


    // ========================================================
    // ESCALAR
    // ========================================================

    else if (
        r.operacion === "escalar"
    ) {
        html += `
            <div class="katex-display">

                $$

                \\left(
                    ${formatFrac(
                        r.c
                    )}
                \\right)

                ${matrizNormalLatex(
                    r.A
                )}

                =

                ${matrizNormalLatex(
                    r.resultado
                )}

                $$

            </div>
        `;
    }


    // ========================================================
    // IGUALDAD
    // ========================================================

    else if (
        r.operacion === "igualdad"
    ) {
        html += `
            <div class="resultado-matriz-doble">

                <div class="katex-display">

                    $$A=${matrizNormalLatex(
                        r.A
                    )}$$

                </div>


                <div class="katex-display">

                    $$B=${matrizNormalLatex(
                        r.B
                    )}$$

                </div>

            </div>


            <div class="estado-matematico ${
                r.iguales
                    ? "estado-ok"
                    : "estado-aviso"
            }">

                <strong>

                    ${
                        r.iguales
                            ? "A = B"
                            : "A ≠ B"
                    }

                </strong>


                <p>

                    ${
                        r.iguales

                            ? (
                                "Las matrices tienen las "
                                + "mismas dimensiones y todas "
                                + "sus entradas correspondientes "
                                + "son iguales."
                            )

                            : (
                                r.misma_dimension

                                    ? (
                                        "Las dimensiones coinciden, "
                                        + "pero existe al menos una "
                                        + "entrada diferente."
                                    )

                                    : (
                                        "Las matrices tienen "
                                        + "dimensiones diferentes, "
                                        + "por lo tanto no pueden "
                                        + "ser iguales."
                                    )
                            )
                    }

                </p>

            </div>
        `;
    }


    // ========================================================
    // CLASIFICACIÓN
    // ========================================================

    else if (
        r.operacion
        === "clasificacion"
    ) {
        const c =
            r.clasificacion;

        const tipos = [
            [
                "Matriz fila",
                c.matriz_fila,
            ],

            [
                "Matriz columna",
                c.matriz_columna,
            ],

            [
                "Matriz rectangular",
                c.rectangular,
            ],

            [
                "Matriz cuadrada",
                c.cuadrada,
            ],

            [
                "Matriz cero",
                c.cero,
            ],

            [
                "Matriz identidad",
                c.identidad,
            ],

            [
                "Matriz diagonal",
                c.diagonal,
            ],

            [
                "Triangular superior",
                c.triangular_superior,
            ],

            [
                "Triangular inferior",
                c.triangular_inferior,
            ],
        ];

        html += `
            <div class="katex-display">

                $$A=${matrizNormalLatex(
                    r.A
                )}$$

            </div>


            <div class="resumen-datos">

                <p>

                    <strong>
                        Dimensión:
                    </strong>

                    ${c.filas}
                    ×
                    ${c.columnas}

                </p>


                <p>

                    <strong>
                        Diagonal principal:
                    </strong>

                    ${
                        c.diagonal_principal.length

                            ? c.diagonal_principal
                                .join(", ")

                            : "No existe"
                    }

                </p>

            </div>


            <div class="clasificacion-matriz-grid">

                ${tipos
                    .map(
                        (
                            [
                                nombre,
                                cumple,
                            ]
                        ) => `
                            <div class="
                                clasificacion-matriz-item
                                ${
                                    cumple
                                        ? "cumple"
                                        : "no-cumple"
                                }
                            ">

                                <span>

                                    ${
                                        cumple
                                            ? "✓"
                                            : "—"
                                    }

                                </span>

                                ${nombre}

                            </div>
                        `
                    )
                    .join("")}

            </div>
        `;
    }


    html += `
        </div>
    `;


    contenedor.innerHTML =
        html;


    renderizarKatex(
        contenedor
    );
}


// ============================================================
// PRODUCTO MATRICIAL
// ============================================================

function renderizarProductoMatrices() {
    const panel =
        document.getElementById(
            "matriz-panel-producto"
        );

    if (!panel) {
        return;
    }

    const A =
        estadoMatrices.matrices.A;

    const B =
        estadoMatrices.matrices.B;

    const compatible =
        A.columnas ===
        B.filas;


    panel.innerHTML = `
        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Multiplicación de matrices
                    </h3>

                    <p>

                        Para calcular AB debe cumplirse que
                        el número de columnas de A sea igual
                        al número de filas de B.

                    </p>

                </div>

            </div>


            <div class="estado-matematico ${
                compatible
                    ? "estado-ok"
                    : "estado-aviso"
            }">

                <strong>

                    ${
                        compatible

                            ? "Producto AB definido"

                            : (
                                "Dimensiones incompatibles "
                                + "para AB"
                            )
                    }

                </strong>


                <p>

                    A es
                    ${A.filas}
                    ×
                    ${A.columnas}

                    y B es
                    ${B.filas}
                    ×
                    ${B.columnas}.

                    ${
                        compatible

                            ? (
                                `El resultado será `
                                + `${A.filas}`
                                + ` × `
                                + `${B.columnas}.`
                            )

                            : (
                                `Se necesita que B tenga `
                                + `${A.columnas}`
                                + ` fila(s).`
                            )
                    }

                </p>

            </div>


            <div
                id="matriz-producto-entradas"
                class="matrices-entradas-grid"
            >

                ${htmlMatrizEntrada(
                    "A",
                    "Matriz A",
                    "prod"
                )}


                ${htmlMatrizEntrada(
                    "B",
                    "Matriz B",
                    "prod"
                )}

            </div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-producto-matrices"
                    class="btn-tema-principal"
                >
                    Multiplicar A × B
                </button>

            </div>

        </div>


        <div
            id="resultado-producto-matrices"
            class="tema-resultado"
        ></div>
    `;


    conectarMatricesEn(
        document.getElementById(
            "matriz-producto-entradas"
        ),
        renderizarResultadoProductoMatrices
    );


    document.getElementById(
        "btn-producto-matrices"
    ).addEventListener(
        "click",
        ejecutarProductoMatricesUI
    );


    renderizarResultadoProductoMatrices();
}


// ============================================================
// EJECUTAR PRODUCTO
// ============================================================

async function ejecutarProductoMatricesUI() {
    const boton =
        document.getElementById(
            "btn-producto-matrices"
        );

    ponerBotonCargandoMatriz(
        boton,
        true,
        "Multiplicando…"
    );

    try {
        estadoMatrices.producto.resultado =
            await multiplicarMatrices(
                copiarValoresMatriz(
                    "A"
                ),
                copiarValoresMatriz(
                    "B"
                )
            );

        renderizarResultadoProductoMatrices();

    } catch (error) {
        /*
         * Importante:
         *
         * No bloqueamos previamente la operación porque
         * Programa 3 también necesita demostrar la
         * validación de dimensiones incompatibles.
         *
         * Python devolverá una explicación matemática.
         */
        mostrarErrorMatriz(
            "resultado-producto-matrices",
            error.message
        );

    } finally {
        ponerBotonCargandoMatriz(
            boton,
            false,
            "Multiplicar A × B"
        );
    }
}


// ============================================================
// RESULTADO DEL PRODUCTO
// ============================================================

function renderizarResultadoProductoMatrices() {
    const contenedor =
        document.getElementById(
            "resultado-producto-matrices"
        );

    if (!contenedor) {
        return;
    }

    const r =
        estadoMatrices
            .producto
            .resultado;

    if (!r) {
        contenedor.innerHTML =
            "";

        return;
    }

    let html = `
        <div class="tema-panel resultado-panel">

            <h3 class="sec-titulo">
                Producto AB
            </h3>


            <div class="katex-display">

                $$

                ${matrizNormalLatex(
                    r.A
                )}

                ${matrizNormalLatex(
                    r.B
                )}

                =

                ${matrizNormalLatex(
                    r.resultado
                )}

                $$

            </div>


            <h3 class="sec-titulo">
                Regla fila-columna
            </h3>


            <div class="producto-pasos-grid">

                ${renderizarPasosProductoMatriz(
                    r.pasos
                )}

            </div>
    `;


    // ========================================================
    // COMPARACIÓN AB Y BA
    // ========================================================

    if (
        r.BA_definido
    ) {
        html += `
            <h3 class="sec-titulo">
                Comparación con BA
            </h3>


            <div class="katex-display">

                $$

                BA
                =
                ${matrizNormalLatex(
                    r.BA
                )}

                $$

            </div>


            <div class="estado-matematico ${
                r.AB_igual_BA
                    ? "estado-ok"
                    : "estado-info"
            }">

                <strong>

                    ${
                        r.AB_igual_BA

                            ? (
                                "En este caso AB = BA"
                            )

                            : (
                                "En este caso AB ≠ BA"
                            )
                    }

                </strong>


                <p>

                    La multiplicación de matrices
                    no es conmutativa en general.

                </p>

            </div>
        `;

    } else {
        html += `
            <div class="
                estado-matematico
                estado-info
            ">

                <strong>
                    BA no está definido.
                </strong>

                <p>

                    Las dimensiones permiten calcular AB,
                    pero no permiten calcular BA.

                </p>

            </div>
        `;
    }


    // ========================================================
    // ADVERTENCIAS VISTAS EN CLASE
    // ========================================================

    html += `
            <div class="advertencias-matrices">

                <h3 class="sec-titulo">
                    Observaciones
                </h3>

                <ul>

                    ${r.advertencias
                        .map(
                            advertencia => `
                                <li>

                                    ${escaparTextoMatriz(
                                        advertencia
                                    )}

                                </li>
                            `
                        )
                        .join("")}

                </ul>

            </div>

        </div>
    `;


    contenedor.innerHTML =
        html;


    renderizarKatex(
        contenedor
    );
}


// ============================================================
// PASOS FILA-COLUMNA
// ============================================================

function renderizarPasosProductoMatriz(
    pasos
) {
    return pasos
        .map(
            paso => {
                const fila =
                    paso.fila + 1;

                const columna =
                    paso.columna + 1;

                const suma =
                    paso.productos
                        .map(
                            producto => {
                                return (
                                    `\\left(${formatFrac(
                                        producto.a
                                    )}\\right)`
                                    +
                                    `\\left(${formatFrac(
                                        producto.b
                                    )}\\right)`
                                );
                            }
                        )
                        .join("+");

                return `
                    <div class="producto-paso-card">

                        <div class="katex-display">

                            $$

                            c_{${fila}${columna}}
                            =
                            ${suma}
                            =
                            ${formatFrac(
                                paso.resultado
                            )}

                            $$

                        </div>

                    </div>
                `;
            }
        )
        .join("");
}


// ============================================================
// TRANSPUESTA
// ============================================================

function renderizarTranspuestaMatriz() {
    const panel =
        document.getElementById(
            "matriz-panel-transpuesta"
        );

    if (!panel) {
        return;
    }

    panel.innerHTML = `
        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Transpuesta de una matriz
                    </h3>

                    <p>

                        Las filas de A se convierten
                        en las columnas de Aᵀ.

                    </p>

                </div>

            </div>


            <div id="matriz-transpuesta-entrada">

                ${htmlMatrizEntrada(
                    "A",
                    "Matriz A",
                    "trans"
                )}

            </div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-transponer-matriz"
                    class="btn-tema-principal"
                >
                    Calcular Aᵀ
                </button>

            </div>

        </div>


        <div
            id="resultado-transpuesta-matriz"
            class="tema-resultado"
        ></div>
    `;


    conectarMatricesEn(
        document.getElementById(
            "matriz-transpuesta-entrada"
        ),
        renderizarResultadoTranspuestaMatriz
    );


    document.getElementById(
        "btn-transponer-matriz"
    ).addEventListener(
        "click",
        ejecutarTranspuestaMatrizUI
    );


    renderizarResultadoTranspuestaMatriz();
}


// ============================================================
// EJECUTAR TRANSPUESTA
// ============================================================

async function ejecutarTranspuestaMatrizUI() {
    const boton =
        document.getElementById(
            "btn-transponer-matriz"
        );

    ponerBotonCargandoMatriz(
        boton,
        true,
        "Calculando…"
    );

    try {
        estadoMatrices.transpuesta.resultado =
            await transponerMatriz(
                copiarValoresMatriz(
                    "A"
                )
            );

        renderizarResultadoTranspuestaMatriz();

    } catch (error) {
        mostrarErrorMatriz(
            "resultado-transpuesta-matriz",
            error.message
        );

    } finally {
        ponerBotonCargandoMatriz(
            boton,
            false,
            "Calcular Aᵀ"
        );
    }
}


// ============================================================
// RESULTADO TRANSPUESTA
// ============================================================

function renderizarResultadoTranspuestaMatriz() {
    const contenedor =
        document.getElementById(
            "resultado-transpuesta-matriz"
        );

    if (!contenedor) {
        return;
    }

    const r =
        estadoMatrices
            .transpuesta
            .resultado;

    if (!r) {
        contenedor.innerHTML =
            "";

        return;
    }

    contenedor.innerHTML = `
        <div class="tema-panel resultado-panel">

            <h3 class="sec-titulo">
                Resultado
            </h3>


            <div class="resultado-matriz-doble">

                <div>

                    <div class="resultado-etiqueta">
                        A
                    </div>

                    <div class="katex-display">

                        $$${matrizNormalLatex(
                            r.A
                        )}$$

                    </div>

                </div>


                <div>

                    <div class="resultado-etiqueta">
                        Aᵀ
                    </div>

                    <div class="katex-display">

                        $$${matrizNormalLatex(
                            r.resultado
                        )}$$

                    </div>

                </div>

            </div>


            <p>

                La dimensión cambia de

                ${r.dimension_A[0]}
                ×
                ${r.dimension_A[1]}

                a

                ${r.dimension_transpuesta[0]}
                ×
                ${r.dimension_transpuesta[1]}.

            </p>

        </div>
    `;


    renderizarKatex(
        contenedor
    );
}


// ============================================================
// REDUCCIÓN POR FILAS
// ============================================================

function renderizarReduccionMatriz() {
    const panel =
        document.getElementById(
            "matriz-panel-reduccion"
        );

    if (!panel) {
        return;
    }

    panel.innerHTML = `
        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Reducción por filas
                    </h3>

                    <p>

                        Obtén la forma escalonada (REF) y
                        la forma escalonada reducida (RREF)
                        usando operaciones elementales
                        por filas.

                    </p>

                </div>

            </div>


            <div id="matriz-reduccion-entrada">

                ${htmlMatrizEntrada(
                    "A",
                    "Matriz A",
                    "red"
                )}

            </div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-reducir-matriz"
                    class="btn-tema-principal"
                >
                    Reducir matriz
                </button>

            </div>

        </div>


        <div
            id="resultado-reduccion-matriz"
            class="tema-resultado"
        ></div>
    `;


    conectarMatricesEn(
        document.getElementById(
            "matriz-reduccion-entrada"
        ),
        renderizarResultadoReduccionMatriz
    );


    document.getElementById(
        "btn-reducir-matriz"
    ).addEventListener(
        "click",
        ejecutarReduccionMatrizUI
    );


    renderizarResultadoReduccionMatriz();
}


// ============================================================
// EJECUTAR REDUCCIÓN
// ============================================================

async function ejecutarReduccionMatrizUI() {
    const boton =
        document.getElementById(
            "btn-reducir-matriz"
        );

    ponerBotonCargandoMatriz(
        boton,
        true,
        "Reduciendo…"
    );

    try {
        estadoMatrices.reduccion.resultado =
            await reducirMatriz(
                copiarValoresMatriz(
                    "A"
                )
            );

        renderizarResultadoReduccionMatriz();

    } catch (error) {
        mostrarErrorMatriz(
            "resultado-reduccion-matriz",
            error.message
        );

    } finally {
        ponerBotonCargandoMatriz(
            boton,
            false,
            "Reducir matriz"
        );
    }
}


// ============================================================
// RESULTADO REDUCCIÓN
// ============================================================

function renderizarResultadoReduccionMatriz() {
    const contenedor =
        document.getElementById(
            "resultado-reduccion-matriz"
        );

    if (!contenedor) {
        return;
    }

    const r =
        estadoMatrices
            .reduccion
            .resultado;

    if (!r) {
        contenedor.innerHTML =
            "";

        return;
    }

    const columnasPivote =
        (
            r.columnas_pivote
            || []
        )
            .map(
                columna =>
                    `C${Number(
                        columna
                    ) + 1}`
            );


    const posiciones =
        (
            r.posiciones_pivote
            || []
        )
            .map(
                posicion =>
                    (
                        `F${Number(
                            posicion[0]
                        ) + 1}, `
                        +
                        `C${Number(
                            posicion[1]
                        ) + 1}`
                    )
            );


    contenedor.innerHTML = `
        <div class="tema-panel resultado-panel">

            <h3 class="sec-titulo">
                Forma escalonada por filas (REF)
            </h3>


            <div class="katex-display">

                $$${matrizNormalLatex(
                    r.matriz_escalonada
                )}$$

            </div>


            <h3 class="sec-titulo">
                Forma escalonada reducida (RREF)
            </h3>


            <div class="katex-display">

                $$${matrizNormalLatex(
                    r.matriz_rref
                )}$$

            </div>


            <div class="resumen-datos">

                <p>

                    <strong>
                        Rango:
                    </strong>

                    ${r.rango}

                </p>


                <p>

                    <strong>
                        Columnas pivote:
                    </strong>

                    ${
                        columnasPivote.length

                            ? columnasPivote
                                .join(", ")

                            : "Ninguna"
                    }

                </p>


                <p>

                    <strong>
                        Posiciones pivote:
                    </strong>

                    ${
                        posiciones.length

                            ? posiciones
                                .join(" · ")

                            : "Ninguna"
                    }

                </p>

            </div>


            <h3 class="sec-titulo">
                Procedimiento de Gauss
            </h3>


            ${construirAcordeon(
                r.pasos_gauss || [],
                null,
                1,
                "red-g"
            )}


            <h3 class="sec-titulo">
                Procedimiento de Gauss-Jordan
            </h3>


            ${construirAcordeon(
                r.pasos_jordan || [],
                null,
                (
                    r.pasos_gauss
                    || []
                ).length + 1,
                "red-gj"
            )}

        </div>
    `;


    renderizarKatex(
        contenedor
    );
}


// ============================================================
// PROPIEDADES MATRICIALES
// ============================================================

const propiedadesMatricesConfig = {
    suma_conmutativa: {
        nombre:
            "Conmutatividad de la suma",

        formula:
            "A + B = B + A",

        matrices: [
            "A",
            "B",
        ],

        escalares: [],
    },


    suma_asociativa: {
        nombre:
            "Asociatividad de la suma",

        formula:
            "A + (B + C) = (A + B) + C",

        matrices: [
            "A",
            "B",
            "C",
        ],

        escalares: [],
    },


    identidad_aditiva: {
        nombre:
            "Identidad aditiva",

        formula:
            "A + 0 = A",

        matrices: [
            "A",
        ],

        escalares: [],
    },


    escalar_distributivo: {
        nombre:
            "Distributividad del escalar",

        formula:
            "r(A + B) = rA + rB",

        matrices: [
            "A",
            "B",
        ],

        escalares: [
            "r",
        ],
    },


    suma_escalares: {
        nombre:
            "Distributividad respecto a escalares",

        formula:
            "(r + s)A = rA + sA",

        matrices: [
            "A",
        ],

        escalares: [
            "r",
            "s",
        ],
    },


    asociativa_escalares: {
        nombre:
            "Asociatividad de escalares",

        formula:
            "r(sA) = (rs)A",

        matrices: [
            "A",
        ],

        escalares: [
            "r",
            "s",
        ],
    },


    producto_asociativo: {
        nombre:
            "Asociatividad del producto",

        formula:
            "A(BC) = (AB)C",

        matrices: [
            "A",
            "B",
            "C",
        ],

        escalares: [],
    },


    producto_distributivo_izquierda: {
        nombre:
            "Distributividad izquierda",

        formula:
            "A(B + C) = AB + AC",

        matrices: [
            "A",
            "B",
            "C",
        ],

        escalares: [],
    },


    producto_distributivo_derecha: {
        nombre:
            "Distributividad derecha",

        formula:
            "(B + C)A = BA + CA",

        matrices: [
            "A",
            "B",
            "C",
        ],

        escalares: [],
    },


    escalar_producto: {
        nombre:
            "Escalar y producto matricial",

        formula:
            "r(AB) = (rA)B = A(rB)",

        matrices: [
            "A",
            "B",
        ],

        escalares: [
            "r",
        ],
    },


    identidad_multiplicativa: {
        nombre:
            "Identidad multiplicativa",

        formula:
            "IₘA = A = AIₙ",

        matrices: [
            "A",
        ],

        escalares: [],
    },


    transpuesta_doble: {
        nombre:
            "Transpuesta de la transpuesta",

        formula:
            "(Aᵀ)ᵀ = A",

        matrices: [
            "A",
        ],

        escalares: [],
    },


    transpuesta_suma: {
        nombre:
            "Transpuesta de una suma",

        formula:
            "(A + B)ᵀ = Aᵀ + Bᵀ",

        matrices: [
            "A",
            "B",
        ],

        escalares: [],
    },


    transpuesta_escalar: {
        nombre:
            "Transpuesta de un múltiplo escalar",

        formula:
            "(rA)ᵀ = rAᵀ",

        matrices: [
            "A",
        ],

        escalares: [
            "r",
        ],
    },


    transpuesta_producto: {
        nombre:
            "Transpuesta de un producto",

        formula:
            "(AB)ᵀ = BᵀAᵀ",

        matrices: [
            "A",
            "B",
        ],

        escalares: [],
    },
};


// ============================================================
// OPCIONES DE PROPIEDADES
// ============================================================

function opcionesPropiedadesMatrices(
    seleccion
) {
    return Object.entries(
        propiedadesMatricesConfig
    )
        .map(
            (
                [
                    codigo,
                    config,
                ]
            ) => `
                <option
                    value="${codigo}"

                    ${
                        codigo === seleccion
                            ? "selected"
                            : ""
                    }
                >
                    ${config.formula}
                </option>
            `
        )
        .join("");
}


// ============================================================
// RENDERIZAR PROPIEDADES
// ============================================================

function renderizarPropiedadesMatrices() {
    const panel =
        document.getElementById(
            "matriz-panel-propiedades"
        );

    if (!panel) {
        return;
    }

    const estado =
        estadoMatrices.propiedades;

    const config =
        propiedadesMatricesConfig[
            estado.propiedad
        ];


    panel.innerHTML = `
        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Propiedades de las matrices
                    </h3>

                    <p>

                        Selecciona una propiedad.
                        NexoLineal pedirá únicamente
                        las matrices y escalares
                        necesarios para comprobarla.

                    </p>

                </div>

            </div>


            <div class="tema-controles">

                <div class="
                    tema-control
                    tema-control-ancho
                ">

                    <label for="matriz-propiedad-select">

                        Propiedad

                    </label>


                    <select id="matriz-propiedad-select">

                        ${opcionesPropiedadesMatrices(
                            estado.propiedad
                        )}

                    </select>

                </div>


                ${config.escalares
                    .map(
                        escalar => `
                            <div class="tema-control">

                                <label
                                    for="prop-escalar-${escalar}"
                                >
                                    Escalar ${escalar}
                                </label>

                                <input
                                    id="prop-escalar-${escalar}"

                                    data-prop-escalar="${escalar}"

                                    type="text"

                                    value="${escaparAtributoMatriz(
                                        estado[
                                            escalar
                                        ]
                                    )}"

                                    placeholder="Ej. 2"

                                    autocomplete="off"
                                >

                            </div>
                        `
                    )
                    .join("")}

            </div>


            <div class="propiedad-seleccionada">

                <strong>
                    ${config.nombre}
                </strong>

                <span>
                    ${config.formula}
                </span>

            </div>


            <div
                id="matriz-propiedades-entradas"
                class="matrices-entradas-grid"
            >

                ${config.matrices
                    .map(
                        nombre =>
                            htmlMatrizEntrada(
                                nombre,
                                `Matriz ${nombre}`,
                                "prop"
                            )
                    )
                    .join("")}

            </div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-comprobar-propiedad-matriz"
                    class="btn-tema-principal"
                >
                    Comprobar propiedad
                </button>

            </div>

        </div>


        <div
            id="resultado-propiedad-matriz"
            class="tema-resultado"
        ></div>
    `;


    const selector =
        document.getElementById(
            "matriz-propiedad-select"
        );


    selector.addEventListener(
        "change",
        () => {
            estado.propiedad =
                selector.value;

            estado.resultado =
                null;

            renderizarPropiedadesMatrices();
        }
    );


    panel.querySelectorAll(
        "[data-prop-escalar]"
    ).forEach(
        input => {
            input.addEventListener(
                "input",
                () => {
                    estado[
                        input.dataset
                            .propEscalar
                    ] =
                        input.value;

                    estado.resultado =
                        null;

                    renderizarResultadoPropiedadMatriz();
                }
            );
        }
    );


    conectarMatricesEn(
        document.getElementById(
            "matriz-propiedades-entradas"
        ),
        renderizarResultadoPropiedadMatriz
    );


    document.getElementById(
        "btn-comprobar-propiedad-matriz"
    ).addEventListener(
        "click",
        ejecutarPropiedadMatrizUI
    );


    renderizarResultadoPropiedadMatriz();
}


// ============================================================
// EJECUTAR PROPIEDAD
// ============================================================

async function ejecutarPropiedadMatrizUI() {
    const estado =
        estadoMatrices.propiedades;

    const config =
        propiedadesMatricesConfig[
            estado.propiedad
        ];

    const datos =
        {};


    config.matrices.forEach(
        nombre => {
            datos[nombre] =
                copiarValoresMatriz(
                    nombre
                );
        }
    );


    config.escalares.forEach(
        escalar => {
            datos[escalar] =
                estado[
                    escalar
                ];
        }
    );


    const boton =
        document.getElementById(
            "btn-comprobar-propiedad-matriz"
        );


    ponerBotonCargandoMatriz(
        boton,
        true,
        "Comprobando…"
    );


    try {
        estado.resultado =
            await comprobarPropiedadMatriz(
                estado.propiedad,
                datos
            );

        renderizarResultadoPropiedadMatriz();

    } catch (error) {
        mostrarErrorMatriz(
            "resultado-propiedad-matriz",
            error.message
        );

    } finally {
        ponerBotonCargandoMatriz(
            boton,
            false,
            "Comprobar propiedad"
        );
    }
}


// ============================================================
// RESULTADO PROPIEDAD
// ============================================================

function renderizarResultadoPropiedadMatriz() {
    const contenedor =
        document.getElementById(
            "resultado-propiedad-matriz"
        );

    if (!contenedor) {
        return;
    }

    const respuesta =
        estadoMatrices
            .propiedades
            .resultado;

    if (!respuesta) {
        contenedor.innerHTML =
            "";

        return;
    }

    const r =
        respuesta.propiedad;


    contenedor.innerHTML = `
        <div class="tema-panel resultado-panel">

            <h3 class="sec-titulo">

                ${escaparTextoMatriz(
                    r.nombre
                )}

            </h3>


            <div class="propiedad-formula-grande">

                ${escaparTextoMatriz(
                    r.formula
                )}

            </div>


            <div class="propiedad-lados-grid">

                ${r.lados
                    .map(
                        lado => `
                            <div class="propiedad-lado-card">

                                <div class="resultado-etiqueta">

                                    ${escaparTextoMatriz(
                                        lado.etiqueta
                                    )}

                                </div>


                                <div class="katex-display">

                                    $$${matrizNormalLatex(
                                        lado.matriz
                                    )}$$

                                </div>

                            </div>
                        `
                    )
                    .join("")}

            </div>


            <div class="estado-matematico ${
                r.cumple
                    ? "estado-ok"
                    : "estado-aviso"
            }">

                <strong>

                    ${
                        r.cumple

                            ? (
                                "✓ La propiedad se cumple"
                            )

                            : (
                                "✗ Los dos lados "
                                + "no coinciden"
                            )
                    }

                </strong>

            </div>

        </div>
    `;


    renderizarKatex(
        contenedor
    );
}


// ============================================================
// BOTÓN DE CARGA
// ============================================================

function ponerBotonCargandoMatriz(
    boton,
    cargando,
    texto
) {
    if (!boton) {
        return;
    }

    boton.disabled =
        cargando;

    boton.classList.toggle(
        "cargando",
        cargando
    );

    boton.textContent =
        texto;
}


// ============================================================
// MOSTRAR ERROR
// ============================================================

function mostrarErrorMatriz(
    idContenedor,
    mensaje
) {
    const contenedor =
        document.getElementById(
            idContenedor
        );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = `
        <div class="tema-panel resultado-panel">

            <div class="
                estado-matematico
                estado-aviso
            ">

                <strong>
                    No se pudo realizar la operación.
                </strong>

                <p>

                    ${escaparTextoMatriz(
                        mensaje
                    )}

                </p>

            </div>

        </div>
    `;
}


// ============================================================
// ACCESO EXTERNO AL ESTADO
// ============================================================

function obtenerEstadoMatrices() {
    return estadoMatrices;
}