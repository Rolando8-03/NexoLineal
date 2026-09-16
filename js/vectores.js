// ============================================================
// vectores.js
// Interfaz del módulo de Vectores de NexoLineal.
// ============================================================


// ============================================================
// ESTADO DEL MÓDULO
// ============================================================

const estadoVectores = {

    inicializado: false,

    herramientaActiva:
        "operaciones",

    // --------------------------------------------------------
    // Operaciones básicas
    // --------------------------------------------------------

    operaciones: {

        operacion: "suma",

        dimension: 3,

        u: [
            "",
            "",
            "",
        ],

        v: [
            "",
            "",
            "",
        ],

        w: [
            "",
            "",
            "",
        ],

        c: "",
        d: "",

        resultado: null,
    },

    // --------------------------------------------------------
    // Vectores generadores
    //
    // Esta información es compartida entre:
    //
    // - Combinación lineal
    // - Independencia lineal
    //
    // De esta manera no hay que ingresar los vectores
    // nuevamente al cambiar de herramienta.
    // --------------------------------------------------------

    generadores: {

        dimension: 3,

        cantidad: 3,

        vectores: [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""],
        ],

        b: [
            "",
            "",
            "",
        ],

        resultadoCombinacion:
            null,

        resultadoIndependencia:
            null,
    },
};


// ============================================================
// INICIALIZAR MÓDULO
// ============================================================

function inicializarModuloVectores() {

    if (
        estadoVectores.inicializado
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
            + "para crear la vista de Vectores."
        );

        return;
    }


    const vista =
        document.createElement(
            "section"
        );


    vista.id =
        "vista-vectores";


    vista.className =
        "vista-tema vista-vectores";


    /*
     * Inicialmente permanece oculta.
     *
     * temas.js decidirá cuándo mostrarla desde
     * el menú lateral.
     */
    vista.style.display =
        "none";


    vista.innerHTML = `

        <div class="tema-contenedor">

            <div class="tema-encabezado">

                <div>

                    <div class="tema-etiqueta">
                        Álgebra vectorial
                    </div>

                    <h2 class="tema-titulo">
                        Vectores
                    </h2>

                    <p class="tema-descripcion">

                        Realiza operaciones en Rⁿ,
                        estudia combinaciones lineales
                        y determina independencia lineal.

                    </p>

                </div>

            </div>


            <nav
                class="tema-menu-interno"
                aria-label="Herramientas de vectores"
            >

                <button
                    type="button"
                    class="tema-menu-btn activo"
                    data-vector-herramienta="operaciones"
                >
                    Operaciones
                </button>


                <button
                    type="button"
                    class="tema-menu-btn"
                    data-vector-herramienta="combinacion"
                >
                    Combinación lineal
                </button>


                <button
                    type="button"
                    class="tema-menu-btn"
                    data-vector-herramienta="independencia"
                >
                    Independencia lineal
                </button>

            </nav>


            <div
                id="vector-panel-operaciones"
                class="vector-panel interno-activo"
            ></div>


            <div
                id="vector-panel-combinacion"
                class="vector-panel"
            ></div>


            <div
                id="vector-panel-independencia"
                class="vector-panel"
            ></div>

        </div>
    `;


    contenedor.appendChild(
        vista
    );


    conectarMenuVectores();


    renderizarOperacionesVectores();

    renderizarCombinacionLineal();

    renderizarIndependenciaLineal();


    estadoVectores.inicializado =
        true;
}


// ============================================================
// MOSTRAR / OCULTAR VISTA
// ============================================================

function mostrarVistaVectores() {

    inicializarModuloVectores();


    const vista =
        document.getElementById(
            "vista-vectores"
        );


    if (vista) {

        vista.style.display =
            "block";
    }


    activarHerramientaVectores(
        estadoVectores.herramientaActiva
    );
}


function ocultarVistaVectores() {

    const vista =
        document.getElementById(
            "vista-vectores"
        );


    if (vista) {

        vista.style.display =
            "none";
    }
}


// ============================================================
// MENÚ INTERNO
// ============================================================

function conectarMenuVectores() {

    document.querySelectorAll(
        "[data-vector-herramienta]"
    ).forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    activarHerramientaVectores(
                        boton.dataset
                            .vectorHerramienta
                    );
                }
            );
        }
    );
}


function activarHerramientaVectores(
    herramienta
) {

    estadoVectores.herramientaActiva =
        herramienta;


    document.querySelectorAll(
        "[data-vector-herramienta]"
    ).forEach(
        boton => {

            boton.classList.toggle(
                "activo",
                boton.dataset
                    .vectorHerramienta
                === herramienta
            );
        }
    );


    document.querySelectorAll(
        "#vista-vectores .vector-panel"
    ).forEach(
        panel => {

            panel.classList.remove(
                "interno-activo"
            );
        }
    );


    const panel =
        document.getElementById(
            `vector-panel-${herramienta}`
        );


    if (panel) {

        panel.classList.add(
            "interno-activo"
        );
    }


    /*
     * Volvemos a pintar desde el estado guardado.
     *
     * Esto garantiza que los valores permanezcan
     * aunque el usuario haya cambiado de herramienta.
     */
    if (
        herramienta === "operaciones"
    ) {

        renderizarOperacionesVectores();

    } else if (
        herramienta === "combinacion"
    ) {

        renderizarCombinacionLineal();

    } else if (
        herramienta === "independencia"
    ) {

        renderizarIndependenciaLineal();
    }
}


// ============================================================
// UTILIDADES DE ESTADO
// ============================================================

function ajustarVector(
    vector,
    dimension
) {

    const nuevo =
        [];


    for (
        let i = 0;
        i < dimension;
        i++
    ) {

        nuevo.push(
            vector[i]
            ?? ""
        );
    }


    return nuevo;
}


function ajustarVectoresOperaciones(
    dimension
) {

    const estado =
        estadoVectores.operaciones;


    estado.dimension =
        dimension;


    estado.u =
        ajustarVector(
            estado.u,
            dimension
        );


    estado.v =
        ajustarVector(
            estado.v,
            dimension
        );


    estado.w =
        ajustarVector(
            estado.w,
            dimension
        );


    estado.resultado =
        null;
}


function ajustarGeneradores(
    dimension,
    cantidad
) {

    const estado =
        estadoVectores.generadores;


    const nuevosVectores =
        [];


    for (
        let j = 0;
        j < cantidad;
        j++
    ) {

        const anterior =
            estado.vectores[j]
            || [];


        nuevosVectores.push(
            ajustarVector(
                anterior,
                dimension
            )
        );
    }


    estado.dimension =
        dimension;


    estado.cantidad =
        cantidad;


    estado.vectores =
        nuevosVectores;


    estado.b =
        ajustarVector(
            estado.b,
            dimension
        );


    /*
     * Las dimensiones cambiaron.
     * Los resultados anteriores dejan de ser válidos.
     */
    estado.resultadoCombinacion =
        null;


    estado.resultadoIndependencia =
        null;
}


// ============================================================
// SELECTOR DE DIMENSIÓN
// ============================================================

function opcionesDimension(
    valor
) {

    let html = "";


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
// VECTOR COMO CUADRÍCULA
// ============================================================

function htmlVectorEntrada(
    nombre,
    etiqueta,
    vector,
    prefijoId
) {

    const celdas =
        vector
            .map(
                (
                    valor,
                    indice
                ) => {

                    return `
                        <div class="vector-celda-fila">

                            <span class="vector-indice">
                                ${nombre}<sub>${indice + 1}</sub>
                            </span>

                            <input
                                type="text"
                                class="celda-vector"
                                id="${prefijoId}-${indice}"
                                data-vector-nombre="${nombre}"
                                data-vector-indice="${indice}"
                                value="${escaparAtributo(
                                    valor
                                )}"
                                placeholder="0"
                                autocomplete="off"
                                spellcheck="false"
                                inputmode="decimal"
                            >

                        </div>
                    `;
                }
            )
            .join("");


    return `
        <div class="vector-entrada-card">

            <div class="vector-entrada-titulo">
                ${etiqueta}
            </div>

            <div class="vector-matriz-entrada">

                <span
                    class="vector-corchete vector-corchete-izq"
                    aria-hidden="true"
                ></span>

                <div class="vector-celdas">
                    ${celdas}
                </div>

                <span
                    class="vector-corchete vector-corchete-der"
                    aria-hidden="true"
                ></span>

            </div>

        </div>
    `;
}


// ============================================================
// ESCAPAR VALORES HTML
// ============================================================

function escaparAtributo(
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


// ============================================================
// OPERACIONES CON VECTORES
// ============================================================

function renderizarOperacionesVectores() {

    const panel =
        document.getElementById(
            "vector-panel-operaciones"
        );


    if (!panel) {
        return;
    }


    const estado =
        estadoVectores.operaciones;


    panel.innerHTML = `

        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Operaciones con vectores
                    </h3>

                    <p>
                        Selecciona únicamente la operación
                        que deseas realizar.
                    </p>

                </div>

            </div>


            <div class="tema-controles">

                <div class="tema-control">

                    <label for="vector-operacion">
                        Operación
                    </label>

                    <select id="vector-operacion">

                        ${opcionesOperacionesVectores(
                            estado.operacion
                        )}

                    </select>

                </div>


                <div class="tema-control">

                    <label for="vector-dimension">
                        Dimensión
                    </label>

                    <select id="vector-dimension">

                        ${opcionesDimension(
                            estado.dimension
                        )}

                    </select>

                </div>

            </div>


            <div
                id="vector-operacion-campos"
                class="vector-operacion-campos"
            ></div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-calcular-vector"
                    class="btn-tema-principal"
                >
                    Calcular
                </button>

            </div>

        </div>


        <div
            id="resultado-operaciones-vectores"
            class="tema-resultado"
        ></div>
    `;


    const selectOperacion =
        document.getElementById(
            "vector-operacion"
        );


    const selectDimension =
        document.getElementById(
            "vector-dimension"
        );


    selectOperacion.addEventListener(
        "change",
        () => {

            guardarCamposOperacionVector();


            estado.operacion =
                selectOperacion.value;


            estado.resultado =
                null;


            renderizarCamposOperacionVector();

            renderizarResultadoOperacionVector();
        }
    );


    selectDimension.addEventListener(
        "change",
        () => {

            guardarCamposOperacionVector();


            ajustarVectoresOperaciones(
                parseInt(
                    selectDimension.value,
                    10
                )
            );


            renderizarCamposOperacionVector();

            renderizarResultadoOperacionVector();
        }
    );


    document.getElementById(
        "btn-calcular-vector"
    ).addEventListener(
        "click",
        ejecutarOperacionVectorSeleccionada
    );


    renderizarCamposOperacionVector();

    renderizarResultadoOperacionVector();
}


// ============================================================
// OPCIONES DE OPERACIONES
// ============================================================

function opcionesOperacionesVectores(
    seleccion
) {

    const opciones = [

        [
            "igualdad",
            "Igualdad u = v",
        ],

        [
            "suma",
            "Suma u + v",
        ],

        [
            "resta",
            "Resta u - v",
        ],

        [
            "opuesto",
            "Vector opuesto -u",
        ],

        [
            "escalar",
            "Multiplicación c·u",
        ],

        [
            "combinacion",
            "Combinación c·u + d·v",
        ],

        [
            "norma",
            "Norma de u",
        ],

        [
            "propiedades",
            "Propiedades algebraicas",
        ],
    ];


    return opciones
        .map(
            (
                [
                    valor,
                    texto,
                ]
            ) => {

                return `
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
                `;
            }
        )
        .join("");
}


// ============================================================
// CAMPOS SEGÚN OPERACIÓN
// ============================================================

function renderizarCamposOperacionVector() {

    const contenedor =
        document.getElementById(
            "vector-operacion-campos"
        );


    if (!contenedor) {
        return;
    }


    const estado =
        estadoVectores.operaciones;


    const operacion =
        estado.operacion;


    let html = `
        <div class="vector-grid-entradas">
    `;


    // --------------------------------------------------------
    // Vector u
    // --------------------------------------------------------

    html += htmlVectorEntrada(
        "u",
        "Vector u",
        estado.u,
        "vec-op-u"
    );


    // --------------------------------------------------------
    // Vector v
    // --------------------------------------------------------

    if (
        [
            "igualdad",
            "suma",
            "resta",
            "combinacion",
            "propiedades",
        ].includes(
            operacion
        )
    ) {

        html += htmlVectorEntrada(
            "v",
            "Vector v",
            estado.v,
            "vec-op-v"
        );
    }


    // --------------------------------------------------------
    // Vector w
    // --------------------------------------------------------

    if (
        operacion === "propiedades"
    ) {

        html += htmlVectorEntrada(
            "w",
            "Vector w",
            estado.w,
            "vec-op-w"
        );
    }


    html += `
        </div>
    `;


    // --------------------------------------------------------
    // Escalares
    // --------------------------------------------------------

    if (
        [
            "escalar",
            "combinacion",
            "propiedades",
        ].includes(
            operacion
        )
    ) {

        html += `
            <div class="vector-escalares">
        `;


        html += `
            <div class="tema-control">

                <label for="vector-escalar-c">
                    Escalar c
                </label>

                <input
                    id="vector-escalar-c"
                    type="text"
                    value="${escaparAtributo(
                        estado.c
                    )}"
                    placeholder="Ej. 2"
                    autocomplete="off"
                >

            </div>
        `;


        if (
            [
                "combinacion",
                "propiedades",
            ].includes(
                operacion
            )
        ) {

            html += `
                <div class="tema-control">

                    <label for="vector-escalar-d">
                        Escalar d
                    </label>

                    <input
                        id="vector-escalar-d"
                        type="text"
                        value="${escaparAtributo(
                            estado.d
                        )}"
                        placeholder="Ej. -1"
                        autocomplete="off"
                    >

                </div>
            `;
        }


        html += `
            </div>
        `;
    }


    contenedor.innerHTML =
        html;


    conectarInputsOperacionVector();
}


// ============================================================
// GUARDAR OPERACIONES EN TIEMPO REAL
// ============================================================

function conectarInputsOperacionVector() {

    document.querySelectorAll(
        "#vector-operacion-campos .celda-vector"
    ).forEach(
        input => {

            input.addEventListener(
                "input",
                () => {

                    guardarCamposOperacionVector();

                    estadoVectores.operaciones
                        .resultado = null;


                    renderizarResultadoOperacionVector();
                }
            );
        }
    );


    [
        "vector-escalar-c",
        "vector-escalar-d",
    ].forEach(
        id => {

            const input =
                document.getElementById(
                    id
                );


            if (!input) {
                return;
            }


            input.addEventListener(
                "input",
                () => {

                    guardarCamposOperacionVector();

                    estadoVectores.operaciones
                        .resultado = null;


                    renderizarResultadoOperacionVector();
                }
            );
        }
    );
}


function guardarCamposOperacionVector() {

    const estado =
        estadoVectores.operaciones;


    ["u", "v", "w"].forEach(
        nombre => {

            const vector =
                [];


            for (
                let i = 0;
                i < estado.dimension;
                i++
            ) {

                const input =
                    document.getElementById(
                        `vec-op-${nombre}-${i}`
                    );


                vector.push(
                    input
                        ? input.value
                        : (
                            estado[
                                nombre
                            ][i]
                            ?? ""
                        )
                );
            }


            estado[
                nombre
            ] = vector;
        }
    );


    const inputC =
        document.getElementById(
            "vector-escalar-c"
        );


    if (inputC) {

        estado.c =
            inputC.value;
    }


    const inputD =
        document.getElementById(
            "vector-escalar-d"
        );


    if (inputD) {

        estado.d =
            inputD.value;
    }
}


// ============================================================
// EJECUTAR OPERACIÓN
// ============================================================

async function ejecutarOperacionVectorSeleccionada() {

    guardarCamposOperacionVector();


    const estado =
        estadoVectores.operaciones;


    const boton =
        document.getElementById(
            "btn-calcular-vector"
        );


    if (!boton) {
        return;
    }


    const datos = {
        operacion:
            estado.operacion,

        u:
            estado.u.slice(),
    };


    if (
        [
            "igualdad",
            "suma",
            "resta",
            "combinacion",
            "propiedades",
        ].includes(
            estado.operacion
        )
    ) {

        datos.v =
            estado.v.slice();
    }


    if (
        estado.operacion
        === "propiedades"
    ) {

        datos.w =
            estado.w.slice();
    }


    if (
        [
            "escalar",
            "combinacion",
            "propiedades",
        ].includes(
            estado.operacion
        )
    ) {

        datos.c =
            estado.c;
    }


    if (
        [
            "combinacion",
            "propiedades",
        ].includes(
            estado.operacion
        )
    ) {

        datos.d =
            estado.d;
    }


    ponerBotonCargando(
        boton,
        true,
        "Calculando…"
    );


    try {

        estado.resultado =
            await ejecutarVectores(
                datos
            );


        renderizarResultadoOperacionVector();


    } catch (error) {

        mostrarErrorVector(
            "resultado-operaciones-vectores",
            error.message
        );


    } finally {

        ponerBotonCargando(
            boton,
            false,
            "Calcular"
        );
    }
}


// ============================================================
// RESULTADO DE OPERACIONES
// ============================================================

function renderizarResultadoOperacionVector() {

    const contenedor =
        document.getElementById(
            "resultado-operaciones-vectores"
        );


    if (!contenedor) {
        return;
    }


    const r =
        estadoVectores.operaciones
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
    // IGUALDAD
    // ========================================================

    if (
        r.operacion === "igualdad"
    ) {

        html += `
            <div class="resultado-vector-doble">

                <div class="katex-display">
                    $$u=${vectorLatexSistema(
                        r.u
                    )}$$
                </div>

                <div class="katex-display">
                    $$v=${vectorLatexSistema(
                        r.v
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
                            ? "u = v"
                            : "u ≠ v"
                    }
                </strong>

            </div>
        `;
    }


    // ========================================================
    // SUMA
    // ========================================================

    else if (
        r.operacion === "suma"
    ) {

        html += `
            <div class="katex-display">

                $$
                ${vectorLatexSistema(
                    r.u
                )}
                +
                ${vectorLatexSistema(
                    r.v
                )}
                =
                ${vectorLatexSistema(
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
                ${vectorLatexSistema(
                    r.u
                )}
                -
                ${vectorLatexSistema(
                    r.v
                )}
                =
                ${vectorLatexSistema(
                    r.resultado
                )}
                $$

            </div>
        `;
    }


    // ========================================================
    // OPUESTO
    // ========================================================

    else if (
        r.operacion === "opuesto"
    ) {

        html += `
            <div class="katex-display">

                $$
                -${vectorLatexSistema(
                    r.u
                )}
                =
                ${vectorLatexSistema(
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
                \\left(${formatFrac(
                    r.c
                )}\\right)
                ${vectorLatexSistema(
                    r.u
                )}
                =
                ${vectorLatexSistema(
                    r.resultado
                )}
                $$

            </div>
        `;
    }


    // ========================================================
    // COMBINACIÓN c u + d v
    // ========================================================

    else if (
        r.operacion === "combinacion"
    ) {

        html += `
            <div class="katex-display">

                $$
                \\left(${formatFrac(
                    r.c
                )}\\right)
                ${vectorLatexSistema(
                    r.u
                )}

                +

                \\left(${formatFrac(
                    r.d
                )}\\right)
                ${vectorLatexSistema(
                    r.v
                )}

                =

                ${vectorLatexSistema(
                    r.resultado
                )}
                $$

            </div>


            <div class="resultado-suboperaciones">

                <div class="katex-display">
                    $$cu=${vectorLatexSistema(
                        r.cu
                    )}$$
                </div>

                <div class="katex-display">
                    $$dv=${vectorLatexSistema(
                        r.dv
                    )}$$
                </div>

            </div>
        `;
    }


    // ========================================================
    // NORMA
    // ========================================================

    else if (
        r.operacion === "norma"
    ) {

        html += `
            <div class="katex-display">

                $$
                \\|u\\|^2
                =
                ${formatFrac(
                    r.norma2
                )}
                $$

            </div>


            <div class="katex-display">

                $$
                \\|u\\|
                =
                \\sqrt{
                    ${formatFrac(
                        r.norma2
                    )}
                }
                $$

            </div>
        `;
    }


    // ========================================================
    // PROPIEDADES
    // ========================================================

    else if (
        r.operacion === "propiedades"
    ) {

        html += `
            <div class="propiedades-lista">
        `;


        r.propiedades.forEach(
            propiedad => {

                html += `
                    <article class="propiedad-card">

                        <div class="propiedad-cabecera">

                            <span class="propiedad-numero">
                                ${propiedad.numero}
                            </span>

                            <div>

                                <strong>
                                    ${propiedad.nombre}
                                </strong>

                                <div class="propiedad-formula">
                                    ${propiedad.formula}
                                </div>

                            </div>

                        </div>


                        <div class="katex-display">

                            $$
                            ${vectorLatexSistema(
                                propiedad.izquierda
                            )}
                            =
                            ${vectorLatexSistema(
                                propiedad.derecha
                            )}
                            $$

                        </div>


                        <div class="estado-matematico ${
                            propiedad.cumple
                                ? "estado-ok"
                                : "estado-aviso"
                        }">

                            ${
                                propiedad.cumple
                                    ? "✓ Se cumple"
                                    : "✗ No se cumple"
                            }

                        </div>

                    </article>
                `;
            }
        );


        html += `
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
// COMBINACIÓN LINEAL
// ============================================================

function renderizarCombinacionLineal() {

    const panel =
        document.getElementById(
            "vector-panel-combinacion"
        );


    if (!panel) {
        return;
    }


    const estado =
        estadoVectores.generadores;


    panel.innerHTML = `

        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Combinación lineal
                    </h3>

                    <p>

                        Determina si el vector b puede escribirse
                        como combinación lineal de los vectores
                        generadores.

                    </p>

                </div>

            </div>


            <div class="tema-controles">

                <div class="tema-control">

                    <label for="comb-dimension">
                        Dimensión de los vectores
                    </label>

                    <select id="comb-dimension">

                        ${opcionesDimension(
                            estado.dimension
                        )}

                    </select>

                </div>


                <div class="tema-control">

                    <label for="comb-cantidad">
                        Cantidad de vectores
                    </label>

                    <select id="comb-cantidad">

                        ${opcionesDimension(
                            estado.cantidad
                        )}

                    </select>

                </div>

            </div>


            <div
                id="comb-generadores"
                class="generadores-grid"
            ></div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-combinacion-lineal"
                    class="btn-tema-principal"
                >
                    Analizar combinación lineal
                </button>

            </div>

        </div>


        <div
            id="resultado-combinacion-lineal"
            class="tema-resultado"
        ></div>
    `;


    conectarControlesGeneradores(
        "combinacion"
    );


    renderizarGeneradoresCombinacion();

    renderizarResultadoCombinacion();
}


// ============================================================
// GENERADORES DE COMBINACIÓN
// ============================================================

function renderizarGeneradoresCombinacion() {

    const contenedor =
        document.getElementById(
            "comb-generadores"
        );


    if (!contenedor) {
        return;
    }


    const estado =
        estadoVectores.generadores;


    let html = "";


    for (
        let j = 0;
        j < estado.cantidad;
        j++
    ) {

        html += htmlVectorEntrada(
            `v${j + 1}`,
            `Vector v${subindiceHTML(
                j + 1
            )}`,
            estado.vectores[j],
            `comb-v${j}`
        );
    }


    html += htmlVectorEntrada(
        "b",
        "Vector b",
        estado.b,
        "comb-b"
    );


    contenedor.innerHTML =
        html;


    conectarInputsGeneradores(
        "combinacion"
    );
}


// ============================================================
// INDEPENDENCIA LINEAL
// ============================================================

function renderizarIndependenciaLineal() {

    const panel =
        document.getElementById(
            "vector-panel-independencia"
        );


    if (!panel) {
        return;
    }


    const estado =
        estadoVectores.generadores;


    panel.innerHTML = `

        <div class="tema-panel">

            <div class="tema-panel-cabecera">

                <div>

                    <h3>
                        Independencia lineal
                    </h3>

                    <p>

                        Determina si la única solución de

                        c₁v₁ + c₂v₂ + ⋯ + cₖvₖ = 0

                        es la solución trivial.

                    </p>

                </div>

            </div>


            <div class="tema-controles">

                <div class="tema-control">

                    <label for="ind-dimension">
                        Dimensión de los vectores
                    </label>

                    <select id="ind-dimension">

                        ${opcionesDimension(
                            estado.dimension
                        )}

                    </select>

                </div>


                <div class="tema-control">

                    <label for="ind-cantidad">
                        Cantidad de vectores
                    </label>

                    <select id="ind-cantidad">

                        ${opcionesDimension(
                            estado.cantidad
                        )}

                    </select>

                </div>

            </div>


            <div
                id="ind-generadores"
                class="generadores-grid"
            ></div>


            <div class="tema-acciones">

                <button
                    type="button"
                    id="btn-independencia-lineal"
                    class="btn-tema-principal"
                >
                    Analizar independencia
                </button>

            </div>

        </div>


        <div
            id="resultado-independencia-lineal"
            class="tema-resultado"
        ></div>
    `;


    conectarControlesGeneradores(
        "independencia"
    );


    renderizarGeneradoresIndependencia();

    renderizarResultadoIndependencia();
}


// ============================================================
// GENERADORES DE INDEPENDENCIA
// ============================================================

function renderizarGeneradoresIndependencia() {

    const contenedor =
        document.getElementById(
            "ind-generadores"
        );


    if (!contenedor) {
        return;
    }


    const estado =
        estadoVectores.generadores;


    let html = "";


    for (
        let j = 0;
        j < estado.cantidad;
        j++
    ) {

        html += htmlVectorEntrada(
            `v${j + 1}`,
            `Vector v${subindiceHTML(
                j + 1
            )}`,
            estado.vectores[j],
            `ind-v${j}`
        );
    }


    contenedor.innerHTML =
        html;


    conectarInputsGeneradores(
        "independencia"
    );
}


// ============================================================
// CONTROLES COMPARTIDOS DE GENERADORES
// ============================================================

function conectarControlesGeneradores(
    tipo
) {

    const prefijo =
        tipo === "combinacion"
            ? "comb"
            : "ind";


    const selectorDimension =
        document.getElementById(
            `${prefijo}-dimension`
        );


    const selectorCantidad =
        document.getElementById(
            `${prefijo}-cantidad`
        );


    selectorDimension.addEventListener(
        "change",
        () => {

            guardarGeneradoresDesdeDOM(
                tipo
            );


            ajustarGeneradores(
                parseInt(
                    selectorDimension.value,
                    10
                ),
                estadoVectores.generadores
                    .cantidad
            );


            /*
             * Al compartir estado actualizamos también
             * la otra herramienta.
             */
            renderizarCombinacionLineal();

            renderizarIndependenciaLineal();


            activarHerramientaVectores(
                tipo
            );
        }
    );


    selectorCantidad.addEventListener(
        "change",
        () => {

            guardarGeneradoresDesdeDOM(
                tipo
            );


            ajustarGeneradores(
                estadoVectores.generadores
                    .dimension,
                parseInt(
                    selectorCantidad.value,
                    10
                )
            );


            renderizarCombinacionLineal();

            renderizarIndependenciaLineal();


            activarHerramientaVectores(
                tipo
            );
        }
    );


    const boton =
        document.getElementById(
            tipo === "combinacion"
                ? "btn-combinacion-lineal"
                : "btn-independencia-lineal"
        );


    boton.addEventListener(
        "click",
        tipo === "combinacion"
            ? ejecutarCombinacionLinealUI
            : ejecutarIndependenciaLinealUI
    );
}


// ============================================================
// INPUTS DE GENERADORES
// ============================================================

function conectarInputsGeneradores(
    tipo
) {

    const selector =
        tipo === "combinacion"
            ? "#comb-generadores .celda-vector"
            : "#ind-generadores .celda-vector";


    document.querySelectorAll(
        selector
    ).forEach(
        input => {

            input.addEventListener(
                "input",
                () => {

                    guardarGeneradoresDesdeDOM(
                        tipo
                    );


                    estadoVectores
                        .generadores
                        .resultadoCombinacion =
                        null;


                    estadoVectores
                        .generadores
                        .resultadoIndependencia =
                        null;


                    renderizarResultadoCombinacion();

                    renderizarResultadoIndependencia();
                }
            );
        }
    );
}


// ============================================================
// GUARDAR GENERADORES
// ============================================================

function guardarGeneradoresDesdeDOM(
    tipo
) {

    const estado =
        estadoVectores.generadores;


    const prefijo =
        tipo === "combinacion"
            ? "comb"
            : "ind";


    for (
        let j = 0;
        j < estado.cantidad;
        j++
    ) {

        for (
            let i = 0;
            i < estado.dimension;
            i++
        ) {

            const input =
                document.getElementById(
                    `${prefijo}-v${j}-${i}`
                );


            if (input) {

                estado.vectores[j][i] =
                    input.value;
            }
        }
    }


    /*
     * El vector b solamente existe en Combinación lineal.
     */
    if (
        tipo === "combinacion"
    ) {

        for (
            let i = 0;
            i < estado.dimension;
            i++
        ) {

            const inputB =
                document.getElementById(
                    `comb-b-${i}`
                );


            if (inputB) {

                estado.b[i] =
                    inputB.value;
            }
        }
    }
}


// ============================================================
// EJECUTAR COMBINACIÓN LINEAL
// ============================================================

async function ejecutarCombinacionLinealUI() {

    guardarGeneradoresDesdeDOM(
        "combinacion"
    );


    const estado =
        estadoVectores.generadores;


    const boton =
        document.getElementById(
            "btn-combinacion-lineal"
        );


    ponerBotonCargando(
        boton,
        true,
        "Analizando…"
    );


    try {

        estado.resultadoCombinacion =
            await analizarCombinacionLineal(
                estado.vectores.map(
                    vector =>
                        vector.slice()
                ),
                estado.b.slice()
            );


        renderizarResultadoCombinacion();


    } catch (error) {

        mostrarErrorVector(
            "resultado-combinacion-lineal",
            error.message
        );


    } finally {

        ponerBotonCargando(
            boton,
            false,
            "Analizar combinación lineal"
        );
    }
}


// ============================================================
// RESULTADO COMBINACIÓN LINEAL
// ============================================================

function renderizarResultadoCombinacion() {

    const contenedor =
        document.getElementById(
            "resultado-combinacion-lineal"
        );


    if (!contenedor) {
        return;
    }


    const r =
        estadoVectores.generadores
            .resultadoCombinacion;


    if (!r) {

        contenedor.innerHTML =
            "";

        return;
    }


    const sistema =
        r.sistema;


    const variablesC =
        vectorSimbolicoLatex(
            "c",
            r.cantidad_vectores
        );


    let html = `

        <div class="tema-panel resultado-panel">

            <h3 class="sec-titulo">
                Planteamiento
            </h3>


            <p>

                Los vectores generadores se colocan
                como columnas de una matriz A.

            </p>


            <div class="katex-display">

                $$

                A
                =
                ${matrizNormalLatex(
                    r.matriz_columnas
                )}

                $$

            </div>


            <div class="katex-display">

                $$

                ${matrizNormalLatex(
                    r.matriz_columnas
                )}

                ${variablesC}

                =

                ${vectorLatexSistema(
                    r.b
                )}

                $$

            </div>


            <h3 class="sec-titulo">
                Conclusión
            </h3>


            <div class="estado-matematico ${
                r.es_combinacion_lineal
                    ? "estado-ok"
                    : "estado-aviso"
            }">

                <strong>

                    ${
                        r.es_combinacion_lineal
                            ? (
                                "Sí es combinación lineal"
                            )
                            : (
                                "No es combinación lineal"
                            )
                    }

                </strong>

            </div>


            <p>
                ${r.conclusion}
            </p>
    `;


    // ========================================================
    // SI NO EXISTE COMBINACIÓN
    // ========================================================

    if (
        !r.es_combinacion_lineal
    ) {

        html += `

            <h3 class="sec-titulo">
                Forma escalonada reducida
            </h3>


            <div class="katex-display">

                $$${matrizLatex(
                    sistema.matriz_rref,
                    sistema.numero_variables
                )}$$

            </div>


            <div class="resumen-datos">

                <p>
                    <strong>
                        rango(A):
                    </strong>

                    ${sistema.rango_A}
                </p>

                <p>
                    <strong>
                        rango([A | b]):
                    </strong>

                    ${sistema.rango_aumentada}
                </p>

            </div>

        </div>
        `;


        contenedor.innerHTML =
            html;


        renderizarKatex(
            contenedor
        );


        return;
    }


    // ========================================================
    // COEFICIENTES
    // ========================================================

    html += `

        <h3 class="sec-titulo">
            Coeficientes encontrados
        </h3>


        <div class="katex-display">

            $$

            c
            =
            ${vectorLatexSistema(
                r.coeficientes_particulares
            )}

            $$

        </div>
    `;


    if (
        r.coeficientes_unicos
    ) {

        html += `

            <p>
                Los coeficientes son únicos.
            </p>
        `;

    } else {

        html += `

            <p>

                Esta es una elección particular de
                coeficientes. Existen otras porque
                el sistema tiene variables libres.

            </p>
        `;
    }


    // ========================================================
    // COMPROBACIÓN
    // ========================================================

    html += `

        <h3 class="sec-titulo">
            Comprobación
        </h3>


        <div class="katex-display">

            $$

            ${combinacionConCoeficientesLatexJS(
                r.vectores,
                r.coeficientes_particulares
            )}

            =

            ${vectorLatexSistema(
                r.comprobacion
            )}

            =

            ${vectorLatexSistema(
                r.b
            )}

            $$

        </div>


        <h3 class="sec-titulo">
            Gauss-Jordan
        </h3>


        <div class="katex-display">

            $$${matrizLatex(
                sistema.matriz_rref,
                sistema.numero_variables
            )}$$

        </div>


        ${construirAcordeon(
            [
                ...(sistema.pasos_gauss || []),
                ...(sistema.pasos_jordan || []),
            ],
            sistema.numero_variables,
            1,
            "comb"
        )}


        </div>
    `;


    contenedor.innerHTML =
        html;


    renderizarKatex(
        contenedor
    );
}


// ============================================================
// EJECUTAR INDEPENDENCIA
// ============================================================

async function ejecutarIndependenciaLinealUI() {

    guardarGeneradoresDesdeDOM(
        "independencia"
    );


    const estado =
        estadoVectores.generadores;


    const boton =
        document.getElementById(
            "btn-independencia-lineal"
        );


    ponerBotonCargando(
        boton,
        true,
        "Analizando…"
    );


    try {

        estado.resultadoIndependencia =
            await analizarIndependenciaLineal(
                estado.vectores.map(
                    vector =>
                        vector.slice()
                )
            );


        renderizarResultadoIndependencia();


    } catch (error) {

        mostrarErrorVector(
            "resultado-independencia-lineal",
            error.message
        );


    } finally {

        ponerBotonCargando(
            boton,
            false,
            "Analizar independencia"
        );
    }
}


// ============================================================
// RESULTADO INDEPENDENCIA
// ============================================================

function renderizarResultadoIndependencia() {

    const contenedor =
        document.getElementById(
            "resultado-independencia-lineal"
        );


    if (!contenedor) {
        return;
    }


    const r =
        estadoVectores.generadores
            .resultadoIndependencia;


    if (!r) {

        contenedor.innerHTML =
            "";

        return;
    }


    const sistema =
        r.sistema;


    let html = `

        <div class="tema-panel resultado-panel">


            <h3 class="sec-titulo">
                Planteamiento
            </h3>


            <p>

                Para estudiar independencia lineal se
                resuelve el sistema homogéneo

                $Ac=0$.

            </p>


            <div class="katex-display">

                $$

                ${matrizNormalLatex(
                    r.matriz_columnas
                )}

                ${vectorSimbolicoLatex(
                    "c",
                    r.cantidad_vectores
                )}

                =

                ${vectorLatexSistema(
                    r.vector_cero
                )}

                $$

            </div>


            <h3 class="sec-titulo">
                Resultado
            </h3>


            <div class="estado-matematico ${
                r.linealmente_independientes
                    ? "estado-ok"
                    : "estado-aviso"
            }">

                <strong>

                    ${
                        r.linealmente_independientes
                            ? (
                                "Linealmente independientes"
                            )
                            : (
                                "Linealmente dependientes"
                            )
                    }

                </strong>

            </div>


            <p>
                ${r.conclusion}
            </p>


            <div class="resumen-datos">

                <p>
                    <strong>
                        rango(A):
                    </strong>

                    ${r.rango}
                </p>

                <p>
                    <strong>
                        Cantidad de vectores:
                    </strong>

                    ${r.cantidad_vectores}
                </p>

            </div>
    `;


    // ========================================================
    // RELACIÓN DE DEPENDENCIA
    // ========================================================

    if (
        r.linealmente_dependientes
        && r.relacion_dependencia
        && r.relacion_dependencia.length
    ) {

        html += `

            <h3 class="sec-titulo">
                Relación de dependencia
            </h3>


            <p>

                Una solución no trivial para los
                coeficientes es:

            </p>


            <div class="katex-display">

                $$

                c
                =
                ${vectorLatexSistema(
                    r.relacion_dependencia
                )}

                $$

            </div>


            <div class="katex-display">

                $$

                ${combinacionConCoeficientesLatexJS(
                    r.vectores,
                    r.relacion_dependencia
                )}

                =

                ${vectorLatexSistema(
                    r.vector_cero
                )}

                $$

            </div>
        `;
    }


    // ========================================================
    // RREF
    // ========================================================

    html += `

        <h3 class="sec-titulo">
            Forma escalonada reducida
        </h3>


        <div class="katex-display">

            $$${matrizLatex(
                sistema.matriz_rref,
                sistema.numero_variables
            )}$$

        </div>


        <h3 class="sec-titulo">
            Procedimiento
        </h3>


        ${construirAcordeon(
            [
                ...(sistema.pasos_gauss || []),
                ...(sistema.pasos_jordan || []),
            ],
            sistema.numero_variables,
            1,
            "ind"
        )}


        </div>
    `;


    contenedor.innerHTML =
        html;


    renderizarKatex(
        contenedor
    );
}


// ============================================================
// VECTOR SIMBÓLICO
// ============================================================

function vectorSimbolicoLatex(
    simbolo,
    cantidad
) {

    const componentes =
        [];


    for (
        let i = 1;
        i <= cantidad;
        i++
    ) {

        componentes.push(
            `${simbolo}_{${i}}`
        );
    }


    return (
        "\\begin{pmatrix}"
        + componentes.join(
            " \\\\ "
        )
        + "\\end{pmatrix}"
    );
}


// ============================================================
// COMBINACIÓN CON COEFICIENTES
// ============================================================

function combinacionConCoeficientesLatexJS(
    vectores,
    coeficientes
) {

    const terminos =
        [];


    for (
        let i = 0;
        i < vectores.length;
        i++
    ) {

        const coeficiente =
            coeficientes[i]
            ?? "0";


        const valor =
            parseFrac(
                coeficiente
            );


        if (
            valor === 0
        ) {
            continue;
        }


        const magnitud =
            formatFrac(
                fracAbs(
                    coeficiente
                )
            );


        let termino =
            "";


        if (
            Math.abs(
                valor
            ) === 1
        ) {

            termino =
                vectorLatexSistema(
                    vectores[i]
                );

        } else {

            termino =
                `\\left(${magnitud}\\right)`
                + vectorLatexSistema(
                    vectores[i]
                );
        }


        if (
            terminos.length === 0
        ) {

            if (
                valor < 0
            ) {

                termino =
                    "-"
                    + termino;
            }

        } else {

            termino =
                (
                    valor < 0
                        ? "-"
                        : "+"
                )
                + termino;
        }


        terminos.push(
            termino
        );
    }


    if (
        !terminos.length
    ) {

        return (
            "0"
        );
    }


    return terminos.join(
        ""
    );
}


// ============================================================
// SUBÍNDICES PARA TEXTO
// ============================================================

function subindiceHTML(
    numero
) {

    return (
        `<sub>${numero}</sub>`
    );
}


// ============================================================
// BOTÓN DE CARGA
// ============================================================

function ponerBotonCargando(
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

function mostrarErrorVector(
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

            <div class="estado-matematico estado-aviso">

                <strong>
                    No se pudo realizar la operación.
                </strong>

                <p>
                    ${mensaje}
                </p>

            </div>

        </div>
    `;
}


// ============================================================
// ACCESO EXTERNO AL ESTADO
// ============================================================

function obtenerEstadoVectores() {

    return estadoVectores;
}