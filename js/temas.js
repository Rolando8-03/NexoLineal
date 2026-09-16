// ============================================================
// temas.js
// Navegación principal de NexoLineal.
// ============================================================


// ============================================================
// ESTADO DE NAVEGACIÓN
// ============================================================

const estadoNavegacion = {
    vistaActiva: "sistemas",
};


// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        prepararNavegacionPrincipal();

        /*
         * La aplicación inicia en Sistemas lineales,
         * que continúa siendo la vista principal.
         */
        cambiarVistaPrincipal(
            "sistemas",
            false
        );
    }
);


// ============================================================
// PREPARAR MENÚ LATERAL
// ============================================================

function prepararNavegacionPrincipal() {
    const botones =
        document.querySelectorAll(
            "[data-vista]"
        );

    botones.forEach(
        boton => {
            /*
             * Evita instalar el mismo listener dos veces.
             */
            if (
                boton.dataset
                    .navegacionConectada
                === "true"
            ) {
                return;
            }

            boton.dataset
                .navegacionConectada =
                "true";

            boton.addEventListener(
                "click",
                () => {
                    const vista =
                        boton.dataset.vista;

                    cambiarVistaPrincipal(
                        vista
                    );
                }
            );
        }
    );
}


// ============================================================
// CAMBIAR VISTA
// ============================================================

function cambiarVistaPrincipal(
    vista,
    actualizarFoco = true
) {
    /*
     * Las tres vistas válidas serán:
     *
     * sistemas
     * vectores
     * matrices
     */
    const vistasPermitidas = [
        "sistemas",
        "vectores",
        "matrices",
    ];

    if (
        !vistasPermitidas.includes(
            vista
        )
    ) {
        console.warn(
            `Vista no reconocida: ${vista}`
        );

        return;
    }


    // --------------------------------------------------------
    // Guardar la vista que estamos abandonando
    // --------------------------------------------------------

    guardarEstadoVistaActual();


    // --------------------------------------------------------
    // Actualizar estado
    // --------------------------------------------------------

    estadoNavegacion.vistaActiva =
        vista;


    // --------------------------------------------------------
    // Actualizar menú lateral
    // --------------------------------------------------------

    actualizarMenuLateral(
        vista
    );


    // --------------------------------------------------------
    // Ocultar las tres vistas
    // --------------------------------------------------------

    ocultarVistaSistemas();

    ocultarVistaVectoresSegura();

    ocultarVistaMatricesSegura();


    // --------------------------------------------------------
    // Mostrar únicamente la seleccionada
    // --------------------------------------------------------

    if (
        vista === "sistemas"
    ) {
        mostrarVistaSistemas();

    } else if (
        vista === "vectores"
    ) {
        mostrarVistaVectoresSegura();

    } else if (
        vista === "matrices"
    ) {
        mostrarVistaMatricesSegura();
    }


    // --------------------------------------------------------
    // Accesibilidad / foco
    // --------------------------------------------------------

    if (
        actualizarFoco
    ) {
        enfocarVista(
            vista
        );
    }
}


// ============================================================
// GUARDAR ESTADO ANTES DE CAMBIAR
// ============================================================

function guardarEstadoVistaActual() {
    const actual =
        estadoNavegacion.vistaActiva;

    /*
     * Sistemas posee entradas creadas directamente
     * dentro de su vista.
     *
     * Antes de ocultarla hacemos una copia del contenido
     * por seguridad, aunque los inputs permanecerán vivos
     * en el DOM.
     */
    if (
        actual === "sistemas"
        && typeof guardarEstadoSistemas
            === "function"
    ) {
        guardarEstadoSistemas();
    }

    /*
     * Vectores y Matrices guardan sus valores en tiempo real
     * dentro de estadoVectores y estadoMatrices, por lo que
     * no necesitan reconstruirse ni volver a leerse aquí.
     */
}


// ============================================================
// MENÚ LATERAL
// ============================================================

function actualizarMenuLateral(
    vistaActiva
) {
    document.querySelectorAll(
        "[data-vista]"
    ).forEach(
        boton => {
            const activo =
                boton.dataset.vista
                === vistaActiva;

            boton.classList.toggle(
                "activo",
                activo
            );

            boton.setAttribute(
                "aria-pressed",
                String(
                    activo
                )
            );

            if (activo) {
                boton.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {
                boton.removeAttribute(
                    "aria-current"
                );
            }
        }
    );
}


// ============================================================
// SISTEMAS LINEALES
// ============================================================

function obtenerVistaSistemas() {
    /*
     * En tu diseño actual la sección completa de
     * Sistemas lineales es el elemento #main.
     *
     * No vamos a recrearlo.
     */
    return document.getElementById(
        "main"
    );
}


function ocultarVistaSistemas() {
    const vista =
        obtenerVistaSistemas();

    if (!vista) {
        return;
    }

    vista.hidden =
        true;
}


function mostrarVistaSistemas() {
    const vista =
        obtenerVistaSistemas();

    if (!vista) {
        return;
    }

    vista.hidden =
        false;


    /*
     * No llamamos siempre a restaurarEstadoSistemas().
     *
     * El DOM nunca fue eliminado, así que los inputs,
     * resultados y pestañas continúan exactamente donde
     * estaban.
     *
     * restaurarEstadoSistemas() queda únicamente como
     * mecanismo de respaldo si alguna vez la vista fuese
     * reconstruida.
     */
}


// ============================================================
// VECTORES
// ============================================================

function ocultarVistaVectoresSegura() {
    if (
        typeof ocultarVistaVectores
        === "function"
    ) {
        ocultarVistaVectores();

        return;
    }

    const vista =
        document.getElementById(
            "vista-vectores"
        );

    if (vista) {
        vista.style.display =
            "none";
    }
}


function mostrarVistaVectoresSegura() {
    /*
     * vectores.js crea esta vista la primera vez
     * que se necesita.
     */
    if (
        typeof mostrarVistaVectores
        === "function"
    ) {
        mostrarVistaVectores();

        return;
    }

    console.error(
        "vectores.js no se ha cargado correctamente."
    );
}


// ============================================================
// MATRICES
// ============================================================

function ocultarVistaMatricesSegura() {
    if (
        typeof ocultarVistaMatrices
        === "function"
    ) {
        ocultarVistaMatrices();

        return;
    }

    const vista =
        document.getElementById(
            "vista-matrices"
        );

    if (vista) {
        vista.style.display =
            "none";
    }
}


function mostrarVistaMatricesSegura() {
    /*
     * matrices.js crea esta vista la primera vez
     * que el usuario entra en Matrices.
     */
    if (
        typeof mostrarVistaMatrices
        === "function"
    ) {
        mostrarVistaMatrices();

        return;
    }

    console.error(
        "matrices.js no se ha cargado correctamente."
    );
}


// ============================================================
// ENFOCAR VISTA
// ============================================================

function enfocarVista(
    vista
) {
    /*
     * No obligamos a mover el foco hacia un input.
     * Solo llevamos el contenido principal al comienzo
     * cuando el usuario cambia de módulo.
     */

    let elemento =
        null;


    if (
        vista === "sistemas"
    ) {
        elemento =
            document.getElementById(
                "main"
            );

    } else if (
        vista === "vectores"
    ) {
        elemento =
            document.getElementById(
                "vista-vectores"
            );

    } else if (
        vista === "matrices"
    ) {
        elemento =
            document.getElementById(
                "vista-matrices"
            );
    }


    if (!elemento) {
        return;
    }


    /*
     * scrollTo es menos invasivo que scrollIntoView
     * para una aplicación de escritorio con menú fijo.
     */
    const contenedorScroll =
        document.querySelector(
            ".contenido"
        );


    if (
        contenedorScroll
        && typeof contenedorScroll.scrollTo
            === "function"
    ) {
        contenedorScroll.scrollTo(
            {
                top: 0,
                behavior: "smooth",
            }
        );
    }
}


// ============================================================
// OBTENER VISTA ACTUAL
// ============================================================

function obtenerVistaActiva() {
    return estadoNavegacion.vistaActiva;
}


// ============================================================
// RESTAURAR UNA VISTA DESDE FUERA
// ============================================================

function abrirVista(
    vista
) {
    /*
     * Permite que otra parte de la aplicación pueda hacer:
     *
     *     abrirVista("matrices")
     *
     * sin simular un clic en el menú.
     */
    cambiarVistaPrincipal(
        vista
    );
}