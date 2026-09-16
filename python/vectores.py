"""Operaciones exactas con vectores en NexoLineal."""

from fractions import Fraction

from entrada_datos import (
    convertir_numero,
    leer_vector_celdas,
)


# ============================================================
# Validaciones
# ============================================================

def validar_misma_dimension(
    *vectores
):
    """
    Comprueba que todos los vectores recibidos
    tengan la misma dimensión.
    """

    if not vectores:
        raise ValueError(
            "Debe existir al menos un vector"
        )

    dimension = len(
        vectores[0]
    )

    for vector in vectores:

        if len(vector) != dimension:

            raise ValueError(
                "Todos los vectores deben tener "
                "la misma dimensión"
            )

    return dimension


# ============================================================
# Operaciones básicas
# ============================================================

def sumar(
    u,
    v
):
    """
    Suma dos vectores componente a componente.

        u + v
    """

    validar_misma_dimension(
        u,
        v
    )

    return [
        u[i] + v[i]
        for i in range(
            len(u)
        )
    ]


def restar(
    u,
    v
):
    """
    Resta dos vectores componente a componente.

        u - v
    """

    validar_misma_dimension(
        u,
        v
    )

    return [
        u[i] - v[i]
        for i in range(
            len(u)
        )
    ]


def multiplicar_escalar(
    escalar,
    vector
):
    """
    Multiplica un vector por un escalar.

        c u
    """

    escalar = Fraction(
        escalar
    )

    return [
        escalar * componente
        for componente in vector
    ]


def vector_opuesto(
    vector
):
    """
    Calcula el vector opuesto.

        -u
    """

    return multiplicar_escalar(
        -1,
        vector
    )


def vector_cero(
    dimension
):
    """
    Construye el vector cero de R^n.
    """

    return [
        Fraction(0)
        for _ in range(
            dimension
        )
    ]


def son_iguales(
    u,
    v
):
    """
    Dos vectores son iguales si tienen la misma
    dimensión y todas sus componentes coinciden.
    """

    if len(u) != len(v):
        return False

    return u == v


def norma_cuadrada(
    vector
):
    """
    Calcula:

        ||u||² = u1² + u2² + ... + un²

    No se calcula la raíz utilizando math para mantener
    el proyecto dentro de las restricciones de la clase.

    La interfaz mostrará:

        ||u|| = sqrt(norma_cuadrada)
    """

    total = Fraction(0)

    for componente in vector:

        total += (
            componente
            * componente
        )

    return total


# ============================================================
# Combinación con escalares conocidos
# ============================================================

def combinacion_dos_vectores(
    c,
    u,
    d,
    v
):
    """
    Calcula una combinación lineal con
    coeficientes conocidos:

        c u + d v

    Esto es diferente de determinar si b pertenece
    al generado por varios vectores.

    Ese problema se resolverá en
    relaciones_vectoriales.py.
    """

    validar_misma_dimension(
        u,
        v
    )

    cu = multiplicar_escalar(
        c,
        u
    )

    dv = multiplicar_escalar(
        d,
        v
    )

    return sumar(
        cu,
        dv
    )


# ============================================================
# Propiedades algebraicas de los vectores
# ============================================================

def comprobar_propiedades(
    u,
    v,
    w,
    c,
    d
):
    """
    Comprueba las ocho propiedades algebraicas
    trabajadas para vectores.

    Para cada propiedad se calculan ambos lados
    de la igualdad.
    """

    validar_misma_dimension(
        u,
        v,
        w
    )

    c = Fraction(
        c
    )

    d = Fraction(
        d
    )

    cero = vector_cero(
        len(u)
    )

    menos_u = vector_opuesto(
        u
    )

    propiedades = []

    # --------------------------------------------------------
    # 1. Conmutatividad de la suma
    #
    # u + v = v + u
    # --------------------------------------------------------

    izquierda = sumar(
        u,
        v
    )

    derecha = sumar(
        v,
        u
    )

    propiedades.append(
        {
            "numero": 1,
            "nombre": "Conmutatividad de la suma",
            "formula": "u + v = v + u",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    # --------------------------------------------------------
    # 2. Asociatividad de la suma
    #
    # (u + v) + w = u + (v + w)
    # --------------------------------------------------------

    izquierda = sumar(
        sumar(
            u,
            v
        ),
        w
    )

    derecha = sumar(
        u,
        sumar(
            v,
            w
        )
    )

    propiedades.append(
        {
            "numero": 2,
            "nombre": "Asociatividad de la suma",
            "formula": "(u + v) + w = u + (v + w)",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    # --------------------------------------------------------
    # 3. Identidad aditiva
    #
    # u + 0 = u
    # --------------------------------------------------------

    izquierda = sumar(
        u,
        cero
    )

    derecha = u[:]

    propiedades.append(
        {
            "numero": 3,
            "nombre": "Identidad aditiva",
            "formula": "u + 0 = u",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    # --------------------------------------------------------
    # 4. Inverso aditivo
    #
    # u + (-u) = 0
    # --------------------------------------------------------

    izquierda = sumar(
        u,
        menos_u
    )

    derecha = cero

    propiedades.append(
        {
            "numero": 4,
            "nombre": "Inverso aditivo",
            "formula": "u + (-u) = 0",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    # --------------------------------------------------------
    # 5. Distributividad del escalar respecto
    #    a la suma de vectores
    #
    # c(u + v) = cu + cv
    # --------------------------------------------------------

    izquierda = multiplicar_escalar(
        c,
        sumar(
            u,
            v
        )
    )

    derecha = sumar(
        multiplicar_escalar(
            c,
            u
        ),
        multiplicar_escalar(
            c,
            v
        )
    )

    propiedades.append(
        {
            "numero": 5,
            "nombre": (
                "Distributividad del escalar "
                "respecto a la suma de vectores"
            ),
            "formula": "c(u + v) = cu + cv",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    # --------------------------------------------------------
    # 6. Distributividad respecto a la suma
    #    de escalares
    #
    # (c + d)u = cu + du
    # --------------------------------------------------------

    izquierda = multiplicar_escalar(
        c + d,
        u
    )

    derecha = sumar(
        multiplicar_escalar(
            c,
            u
        ),
        multiplicar_escalar(
            d,
            u
        )
    )

    propiedades.append(
        {
            "numero": 6,
            "nombre": (
                "Distributividad respecto "
                "a la suma de escalares"
            ),
            "formula": "(c + d)u = cu + du",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    # --------------------------------------------------------
    # 7. Asociatividad de la multiplicación
    #    por escalares
    #
    # c(du) = (cd)u
    # --------------------------------------------------------

    izquierda = multiplicar_escalar(
        c,
        multiplicar_escalar(
            d,
            u
        )
    )

    derecha = multiplicar_escalar(
        c * d,
        u
    )

    propiedades.append(
        {
            "numero": 7,
            "nombre": (
                "Asociatividad de la "
                "multiplicación por escalares"
            ),
            "formula": "c(du) = (cd)u",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    # --------------------------------------------------------
    # 8. Identidad multiplicativa
    #
    # 1u = u
    # --------------------------------------------------------

    izquierda = multiplicar_escalar(
        1,
        u
    )

    derecha = u[:]

    propiedades.append(
        {
            "numero": 8,
            "nombre": "Identidad multiplicativa",
            "formula": "1u = u",
            "izquierda": izquierda,
            "derecha": derecha,
            "cumple": izquierda == derecha,
        }
    )

    return propiedades


# ============================================================
# Serialización
# ============================================================

def serializar_vector(
    vector
):
    """Convierte un vector con Fraction a cadenas."""

    return [
        str(valor)
        for valor in vector
    ]


def serializar_propiedades(
    propiedades
):
    """Convierte los resultados de propiedades a JSON."""

    resultado = []

    for propiedad in propiedades:

        resultado.append(
            {
                "numero":
                    propiedad[
                        "numero"
                    ],

                "nombre":
                    propiedad[
                        "nombre"
                    ],

                "formula":
                    propiedad[
                        "formula"
                    ],

                "izquierda":
                    serializar_vector(
                        propiedad[
                            "izquierda"
                        ]
                    ),

                "derecha":
                    serializar_vector(
                        propiedad[
                            "derecha"
                        ]
                    ),

                "cumple":
                    propiedad[
                        "cumple"
                    ],
            }
        )

    return resultado


# ============================================================
# Operaciones para la interfaz
# ============================================================

def ejecutar_operacion(
    datos
):
    """
    Ejecuta únicamente la operación seleccionada
    en el menú interno de Vectores.

    Operaciones disponibles:

        igualdad
        suma
        resta
        opuesto
        escalar
        combinacion
        norma
        propiedades
    """

    operacion = datos.get(
        "operacion",
        ""
    )

    # ========================================================
    # IGUALDAD
    # ========================================================

    if operacion == "igualdad":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        v = leer_vector_celdas(
            datos.get("v", []),
            "vector v"
        )

        return {
            "operacion": "igualdad",
            "u": serializar_vector(u),
            "v": serializar_vector(v),
            "iguales": son_iguales(
                u,
                v
            ),
        }

    # ========================================================
    # SUMA
    # ========================================================

    if operacion == "suma":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        v = leer_vector_celdas(
            datos.get("v", []),
            "vector v"
        )

        resultado = sumar(
            u,
            v
        )

        return {
            "operacion": "suma",
            "u": serializar_vector(u),
            "v": serializar_vector(v),
            "resultado": serializar_vector(
                resultado
            ),
        }

    # ========================================================
    # RESTA
    # ========================================================

    if operacion == "resta":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        v = leer_vector_celdas(
            datos.get("v", []),
            "vector v"
        )

        resultado = restar(
            u,
            v
        )

        return {
            "operacion": "resta",
            "u": serializar_vector(u),
            "v": serializar_vector(v),
            "resultado": serializar_vector(
                resultado
            ),
        }

    # ========================================================
    # VECTOR OPUESTO
    # ========================================================

    if operacion == "opuesto":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        resultado = vector_opuesto(
            u
        )

        return {
            "operacion": "opuesto",
            "u": serializar_vector(u),
            "resultado": serializar_vector(
                resultado
            ),
        }

    # ========================================================
    # MULTIPLICACIÓN POR ESCALAR
    # ========================================================

    if operacion == "escalar":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        c = convertir_numero(
            datos.get("c", "")
        )

        resultado = (
            multiplicar_escalar(
                c,
                u
            )
        )

        return {
            "operacion": "escalar",
            "u": serializar_vector(u),
            "c": str(c),
            "resultado": serializar_vector(
                resultado
            ),
        }

    # ========================================================
    # COMBINACIÓN CON COEFICIENTES CONOCIDOS
    #
    # c u + d v
    # ========================================================

    if operacion == "combinacion":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        v = leer_vector_celdas(
            datos.get("v", []),
            "vector v"
        )

        c = convertir_numero(
            datos.get("c", "")
        )

        d = convertir_numero(
            datos.get("d", "")
        )

        resultado = (
            combinacion_dos_vectores(
                c,
                u,
                d,
                v
            )
        )

        return {
            "operacion": "combinacion",

            "u":
                serializar_vector(u),

            "v":
                serializar_vector(v),

            "c":
                str(c),

            "d":
                str(d),

            "cu":
                serializar_vector(
                    multiplicar_escalar(
                        c,
                        u
                    )
                ),

            "dv":
                serializar_vector(
                    multiplicar_escalar(
                        d,
                        v
                    )
                ),

            "resultado":
                serializar_vector(
                    resultado
                ),
        }

    # ========================================================
    # NORMA
    # ========================================================

    if operacion == "norma":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        norma2 = norma_cuadrada(
            u
        )

        return {
            "operacion": "norma",

            "u":
                serializar_vector(u),

            "norma2":
                str(
                    norma2
                ),

            # La interfaz representará:
            #
            # ||u|| = sqrt(norma2)
            #
            "norma_exacta":
                f"sqrt({norma2})",
        }

    # ========================================================
    # PROPIEDADES
    # ========================================================

    if operacion == "propiedades":

        u = leer_vector_celdas(
            datos.get("u", []),
            "vector u"
        )

        v = leer_vector_celdas(
            datos.get("v", []),
            "vector v"
        )

        w = leer_vector_celdas(
            datos.get("w", []),
            "vector w"
        )

        c = convertir_numero(
            datos.get("c", "")
        )

        d = convertir_numero(
            datos.get("d", "")
        )

        propiedades = (
            comprobar_propiedades(
                u,
                v,
                w,
                c,
                d
            )
        )

        return {
            "operacion": "propiedades",

            "u":
                serializar_vector(u),

            "v":
                serializar_vector(v),

            "w":
                serializar_vector(w),

            "c":
                str(c),

            "d":
                str(d),

            "propiedades":
                serializar_propiedades(
                    propiedades
                ),
        }

    raise ValueError(
        "Selecciona una operación válida "
        "para vectores"
    )


# ============================================================
# Punto de entrada desde JavaScript
# ============================================================

def ejecutar_tema(
    datos
):
    """
    Punto de entrada utilizado por Pyodide.
    """

    if datos.get(
        "accion"
    ) != "vectores":

        raise ValueError(
            "La operación solicitada "
            "no pertenece al módulo de vectores"
        )

    return ejecutar_operacion(
        datos
    )