"""Clasificación, solución y análisis de sistemas lineales en NexoLineal."""

from fractions import Fraction

from entrada_datos import validar_sistema
from formas_matriciales import analizar_forma
from metodos_eliminacion import (
    aplicar_gauss,
    aplicar_gauss_jordan,
    construir_matriz_aumentada,
    posiciones_pivote,
    resolver_desde_escalonada,
)


# ============================================================
# Conversión exacta
# ============================================================

def convertir_sistema_exacto(A, b):
    """
    Convierte A y b a Fraction.

    Esto permite conservar resultados exactos con:
    - enteros
    - decimales
    - fracciones
    """

    matriz = [
        [
            valor
            if isinstance(valor, Fraction)
            else Fraction(str(valor))
            for valor in fila
        ]
        for fila in A
    ]

    vector = [
        valor
        if isinstance(valor, Fraction)
        else Fraction(str(valor))
        for valor in b
    ]

    return matriz, vector


# ============================================================
# Rangos
# ============================================================

def calcular_rangos(
    matriz_escalonada,
    numero_variables
):
    """
    Calcula:

        rango(A)

    y:

        rango([A|b])

    utilizando la matriz aumentada ya escalonada.
    """

    rango_A = 0
    rango_aumentada = 0

    for fila in matriz_escalonada:

        hay_coeficiente = any(
            fila[columna] != 0
            for columna in range(
                numero_variables
            )
        )

        if hay_coeficiente:

            rango_A += 1

        if (
            hay_coeficiente
            or fila[-1] != 0
        ):

            rango_aumentada += 1

    return (
        rango_A,
        rango_aumentada,
    )


# ============================================================
# Inconsistencia
# ============================================================

def buscar_contradiccion(
    matriz,
    numero_variables
):
    """
    Busca una fila del tipo:

        0 0 ... 0 | c

    con:

        c != 0

    que representa una ecuación imposible:

        0 = c
    """

    for indice, fila in enumerate(
        matriz
    ):

        coeficientes_nulos = all(
            fila[columna] == 0
            for columna in range(
                numero_variables
            )
        )

        if (
            coeficientes_nulos
            and fila[-1] != 0
        ):

            return indice

    return None


# ============================================================
# Solución desde RREF
# ============================================================

def construir_expresiones_rref(
    matriz,
    numero_variables,
    variables_libres
):
    """
    Construye las expresiones paramétricas
    directamente desde la forma escalonada reducida.
    """

    expresiones = [
        {
            "constante": Fraction(0),
            "terminos": {},
        }
        for _ in range(
            numero_variables
        )
    ]

    # Cada variable libre se representa
    # mediante su propio parámetro.
    for libre in variables_libres:

        expresiones[
            libre
        ][
            "terminos"
        ][
            libre
        ] = Fraction(1)

    pivotes = posiciones_pivote(
        matriz,
        numero_variables,
    )

    for (
        fila,
        columna_pivote,
    ) in pivotes:

        expresiones[
            columna_pivote
        ][
            "constante"
        ] = matriz[fila][-1]

        for libre in variables_libres:

            coeficiente = -matriz[
                fila
            ][
                libre
            ]

            if coeficiente != 0:

                expresiones[
                    columna_pivote
                ][
                    "terminos"
                ][
                    libre
                ] = coeficiente

    return expresiones


def obtener_solucion_particular(
    expresiones
):
    """
    Obtiene una solución concreta asignando
    cero a todos los parámetros libres.
    """

    return [
        expresion[
            "constante"
        ]
        for expresion in expresiones
    ]


# ============================================================
# Comprobación
# ============================================================

def comprobar_solucion(
    A,
    b,
    solucion
):
    """
    Sustituye una solución en cada ecuación original.

    Comprueba que:

        Ax = b
    """

    comprobaciones = []

    for i in range(
        len(A)
    ):

        terminos = []

        total = Fraction(0)

        for j in range(
            len(A[i])
        ):

            producto = (
                A[i][j]
                * solucion[j]
            )

            terminos.append(
                {
                    "coeficiente": A[i][j],
                    "valor": solucion[j],
                    "producto": producto,
                }
            )

            total += producto

        comprobaciones.append(
            {
                "ecuacion": i + 1,
                "terminos": terminos,
                "resultado": total,
                "esperado": b[i],
                "cumple": (
                    total == b[i]
                ),
            }
        )

    return comprobaciones


# ============================================================
# Sistema homogéneo e independencia
# ============================================================

def analizar_naturaleza_sistema(
    b,
    rango_A,
    numero_variables
):
    """
    Analiza:

    - Sistema homogéneo o no homogéneo.
    - Solución trivial o no trivial.
    - Independencia de las columnas de A.
    """

    # --------------------------------------------------------
    # Homogeneidad
    # --------------------------------------------------------

    es_homogeneo = all(
        valor == 0
        for valor in b
    )

    # --------------------------------------------------------
    # Independencia de columnas
    # --------------------------------------------------------
    #
    # Las columnas de A son linealmente independientes
    # si cada columna contiene un pivote.
    #
    # Esto equivale a:
    #
    #     rango(A) = número de columnas de A
    # --------------------------------------------------------

    columnas_independientes = (
        rango_A
        == numero_variables
    )

    # --------------------------------------------------------
    # Solución trivial
    # --------------------------------------------------------

    if es_homogeneo:

        solo_solucion_trivial = (
            columnas_independientes
        )

        tiene_solucion_no_trivial = (
            not columnas_independientes
        )

        if solo_solucion_trivial:

            descripcion_homogenea = (
                "El sistema homogéneo tiene "
                "únicamente la solución trivial."
            )

        else:

            descripcion_homogenea = (
                "El sistema homogéneo tiene "
                "soluciones no triviales porque "
                "existen variables libres."
            )

    else:

        # Estos conceptos pertenecen al análisis
        # específico de Ax = 0.
        solo_solucion_trivial = None

        tiene_solucion_no_trivial = None

        descripcion_homogenea = None

    return {
        "es_homogeneo": es_homogeneo,

        "naturaleza_sistema": (
            "Sistema homogéneo"
            if es_homogeneo
            else "Sistema no homogéneo"
        ),

        "solo_solucion_trivial":
            solo_solucion_trivial,

        "tiene_solucion_no_trivial":
            tiene_solucion_no_trivial,

        "descripcion_homogenea":
            descripcion_homogenea,

        "columnas_linealmente_independientes":
            columnas_independientes,

        "columnas_linealmente_dependientes":
            not columnas_independientes,

        "descripcion_columnas": (
            "Las columnas de A son "
            "linealmente independientes."
            if columnas_independientes
            else
            "Las columnas de A son "
            "linealmente dependientes."
        ),
    }


# ============================================================
# Resolución completa
# ============================================================

def resolver_sistema(
    A,
    b
):
    """
    Resuelve el sistema:

        Ax = b

    y reúne toda la información necesaria
    para la interfaz de NexoLineal.
    """

    validar_sistema(
        A,
        b
    )

    A, b = convertir_sistema_exacto(
        A,
        b
    )

    numero_ecuaciones = len(
        A
    )

    numero_variables = len(
        A[0]
    )

    # --------------------------------------------------------
    # Matriz aumentada inicial
    # --------------------------------------------------------

    matriz_inicial = (
        construir_matriz_aumentada(
            A,
            b
        )
    )

    # --------------------------------------------------------
    # Gauss
    # --------------------------------------------------------

    (
        matriz_escalonada,
        pasos_gauss,
    ) = aplicar_gauss(
        A,
        b
    )

    # --------------------------------------------------------
    # Rangos
    # --------------------------------------------------------

    (
        rango_A,
        rango_aumentada,
    ) = calcular_rangos(
        matriz_escalonada,
        numero_variables,
    )

    # --------------------------------------------------------
    # Gauss-Jordan
    # --------------------------------------------------------

    (
        matriz_rref,
        pasos_jordan,
    ) = aplicar_gauss_jordan(
        matriz_escalonada
    )

    # --------------------------------------------------------
    # Pivotes
    # --------------------------------------------------------

    posiciones = posiciones_pivote(
        matriz_rref,
        numero_variables + 1,
    )

    columnas_pivote_A = []

    columnas_pivote_aumentada = []

    for _, columna in posiciones:

        columnas_pivote_aumentada.append(
            columna
        )

        if columna < numero_variables:

            columnas_pivote_A.append(
                columna
            )

    # --------------------------------------------------------
    # Variables libres
    # --------------------------------------------------------

    variables_libres = [
        columna
        for columna in range(
            numero_variables
        )
        if columna
        not in columnas_pivote_A
    ]

    # --------------------------------------------------------
    # Columnas de A como vectores
    # --------------------------------------------------------
    #
    # Esto se utilizará para mostrar:
    #
    #     x1*a1 + x2*a2 + ... + xn*an = b
    # --------------------------------------------------------

    columnas_vectores = [
        [
            str(
                A[
                    fila
                ][
                    columna
                ]
            )
            for fila in range(
                numero_ecuaciones
            )
        ]
        for columna in range(
            numero_variables
        )
    ]

    # --------------------------------------------------------
    # Homogeneidad e independencia
    # --------------------------------------------------------

    naturaleza = (
        analizar_naturaleza_sistema(
            b,
            rango_A,
            numero_variables,
        )
    )

    # --------------------------------------------------------
    # Parte A de las matrices transformadas
    # --------------------------------------------------------

    matriz_A_escalonada = [
        fila[
            :numero_variables
        ]
        for fila in matriz_escalonada
    ]

    matriz_A_rref = [
        fila[
            :numero_variables
        ]
        for fila in matriz_rref
    ]

    # --------------------------------------------------------
    # Resultado general
    # --------------------------------------------------------

    resultado = {

        # Sistema original
        "A": _serializar_matriz(
            A
        ),

        "b": _serializar_vector(
            b
        ),

        "numero_ecuaciones":
            numero_ecuaciones,

        "numero_variables":
            numero_variables,

        # Matrices
        "matriz_inicial":
            _serializar_matriz(
                matriz_inicial
            ),

        "matriz_escalonada":
            _serializar_matriz(
                matriz_escalonada
            ),

        "matriz_rref":
            _serializar_matriz(
                matriz_rref
            ),

        "matriz_A_escalonada":
            _serializar_matriz(
                matriz_A_escalonada
            ),

        "matriz_A_rref":
            _serializar_matriz(
                matriz_A_rref
            ),

        # Procedimiento
        "pasos_gauss":
            _serializar_pasos(
                pasos_gauss
            ),

        "pasos_jordan":
            _serializar_pasos(
                pasos_jordan
            ),

        # Rangos
        "rango_A":
            rango_A,

        "rango_aumentada":
            rango_aumentada,

        # Pivotes
        "numero_pivotes_A":
            len(
                columnas_pivote_A
            ),

        "columnas_pivote":
            columnas_pivote_A,

        "columnas_pivote_aumentada":
            columnas_pivote_aumentada,

        "posiciones_pivote":
            posiciones,

        # Variables
        "variables_basicas":
            columnas_pivote_A,

        "variables_libres":
            variables_libres,

        # Forma matricial
        "forma_inicial":
            analizar_forma(
                matriz_inicial
            ),

        "forma_escalonada":
            analizar_forma(
                matriz_escalonada
            ),

        "forma_rref":
            analizar_forma(
                matriz_rref
            ),

        # Ecuación vectorial
        "columnas_vectores":
            columnas_vectores,

        # b pertenece al generado de las columnas
        # de A exactamente cuando Ax=b es consistente.
        "es_combinacion_lineal":
            rango_A
            == rango_aumentada,

        # Para la interfaz
        "ecuacion_matricial":
            "Ax=b",

        # Sistema homogéneo e independencia
        **naturaleza,
    }

    # ========================================================
    # SISTEMA INCONSISTENTE
    # ========================================================

    if rango_A < rango_aumentada:

        resultado[
            "tipo"
        ] = "inconsistente"

        resultado[
            "clasificacion"
        ] = (
            "Sistema inconsistente: "
            "no tiene solución"
        )

        resultado[
            "conclusion"
        ] = (
            "El rango de A es menor que "
            "el rango de la matriz aumentada. "
            "Aparece una ecuación imposible, "
            "por lo tanto el sistema no tiene solución."
        )

        fila_contradiccion = (
            buscar_contradiccion(
                matriz_escalonada,
                numero_variables,
            )
        )

        resultado[
            "fila_contradiccion"
        ] = fila_contradiccion

        if fila_contradiccion is not None:

            resultado[
                "fila_contradiccion_datos"
            ] = [
                str(valor)
                for valor in matriz_escalonada[
                    fila_contradiccion
                ]
            ]

        # Estos campos se dejan definidos para que
        # JavaScript no tenga que comprobar si existen.
        resultado[
            "solucion_particular"
        ] = []

        resultado[
            "direcciones"
        ] = []

        resultado[
            "comprobaciones"
        ] = []

        return resultado

    # ========================================================
    # SISTEMA CONSISTENTE
    # ========================================================

    (
        variables_libres,
        expresiones_gauss,
        pasos_sustitucion,
    ) = resolver_desde_escalonada(
        matriz_escalonada,
        numero_variables,
    )

    # --------------------------------------------------------
    # Expresiones desde RREF
    # --------------------------------------------------------

    expresiones_rref = (
        construir_expresiones_rref(
            matriz_rref,
            numero_variables,
            variables_libres,
        )
    )

    # --------------------------------------------------------
    # Solución particular
    # --------------------------------------------------------

    solucion_particular = (
        obtener_solucion_particular(
            expresiones_rref
        )
    )

    resultado[
        "variables_libres"
    ] = variables_libres

    resultado[
        "expresiones_gauss"
    ] = _serializar_expresiones(
        expresiones_gauss
    )

    resultado[
        "expresiones_rref"
    ] = _serializar_expresiones(
        expresiones_rref
    )

    resultado[
        "pasos_sustitucion"
    ] = _serializar_sustitucion(
        pasos_sustitucion
    )

    resultado[
        "solucion_particular"
    ] = _serializar_vector(
        solucion_particular
    )

    # --------------------------------------------------------
    # Forma vectorial de la solución
    # --------------------------------------------------------
    #
    # x = p + t1*d1 + t2*d2 + ...
    #
    # p:
    #     solución particular
    #
    # d:
    #     vectores dirección
    # --------------------------------------------------------

    resultado[
        "direcciones"
    ] = [
        [
            str(
                expresion[
                    "terminos"
                ].get(
                    libre,
                    Fraction(0),
                )
            )
            for expresion
            in expresiones_rref
        ]
        for libre
        in variables_libres
    ]

    # --------------------------------------------------------
    # Comprobación
    # --------------------------------------------------------

    resultado[
        "comprobaciones"
    ] = _serializar_comprobaciones(
        comprobar_solucion(
            A,
            b,
            solucion_particular,
        )
    )

    # ========================================================
    # SOLUCIÓN ÚNICA
    # ========================================================

    if rango_A == numero_variables:

        resultado[
            "tipo"
        ] = "unica"

        resultado[
            "clasificacion"
        ] = (
            "Sistema consistente determinado: "
            "solución única"
        )

        resultado[
            "conclusion"
        ] = (
            "Los rangos son iguales al número "
            "de variables. Cada variable tiene "
            "pivote y existe una sola solución."
        )

        resultado[
            "solucion"
        ] = _serializar_vector(
            solucion_particular
        )

    # ========================================================
    # INFINITAS SOLUCIONES
    # ========================================================

    else:

        resultado[
            "tipo"
        ] = "infinitas"

        resultado[
            "clasificacion"
        ] = (
            "Sistema consistente indeterminado: "
            "infinitas soluciones"
        )

        resultado[
            "conclusion"
        ] = (
            "Los rangos son iguales, pero menores "
            "que el número de variables. Existen "
            "variables libres y por eso el sistema "
            "tiene infinitas soluciones."
        )

    return resultado


# ============================================================
# SERIALIZACIÓN
# ============================================================

def _serializar_matriz(
    matriz
):
    """Convierte una matriz con Fraction a cadenas."""

    return [
        [
            str(valor)
            for valor in fila
        ]
        for fila in matriz
    ]


def _serializar_vector(
    vector
):
    """Convierte un vector con Fraction a cadenas."""

    return [
        str(valor)
        for valor in vector
    ]


def _serializar_pasos(
    pasos
):
    """Convierte los pasos de eliminación a datos serializables."""

    resultado = []

    for paso in pasos:

        resultado.append(
            {
                "titulo":
                    paso["titulo"],

                "mostrar_matriz":
                    paso[
                        "mostrar_matriz"
                    ],

                "operacion":
                    _serializar_operacion(
                        paso[
                            "operacion"
                        ]
                    ),

                "matriz":
                    _serializar_matriz(
                        paso[
                            "matriz"
                        ]
                    ),
            }
        )

    return resultado


def _serializar_operacion(
    operacion
):
    """Convierte los Fraction de una operación a cadenas."""

    resultado = {}

    for clave, valor in operacion.items():

        if isinstance(
            valor,
            Fraction
        ):

            resultado[
                clave
            ] = str(
                valor
            )

        else:

            resultado[
                clave
            ] = valor

    return resultado


def _serializar_expresiones(
    expresiones
):
    """Serializa las expresiones paramétricas."""

    resultado = []

    for expresion in expresiones:

        resultado.append(
            {
                "constante":
                    str(
                        expresion[
                            "constante"
                        ]
                    ),

                "terminos": {
                    str(indice):
                        str(valor)

                    for (
                        indice,
                        valor,
                    ) in expresion[
                        "terminos"
                    ].items()
                },
            }
        )

    return resultado


def _serializar_sustitucion(
    pasos
):
    """Serializa los pasos de sustitución regresiva."""

    resultado = []

    for paso in pasos:

        resultado.append(
            {
                "fila":
                    paso["fila"],

                "variable":
                    paso[
                        "variable"
                    ],

                "expresion": {

                    "constante":
                        str(
                            paso[
                                "expresion"
                            ][
                                "constante"
                            ]
                        ),

                    "terminos": {
                        str(indice):
                            str(valor)

                        for (
                            indice,
                            valor,
                        ) in paso[
                            "expresion"
                        ][
                            "terminos"
                        ].items()
                    },
                },
            }
        )

    return resultado


def _serializar_comprobaciones(
    comprobaciones
):
    """Serializa la comprobación de la solución."""

    resultado = []

    for comprobacion in comprobaciones:

        resultado.append(
            {
                "ecuacion":
                    comprobacion[
                        "ecuacion"
                    ],

                "resultado":
                    str(
                        comprobacion[
                            "resultado"
                        ]
                    ),

                "esperado":
                    str(
                        comprobacion[
                            "esperado"
                        ]
                    ),

                "cumple":
                    comprobacion[
                        "cumple"
                    ],

                "terminos": [
                    {
                        "coeficiente":
                            str(
                                termino[
                                    "coeficiente"
                                ]
                            ),

                        "valor":
                            str(
                                termino[
                                    "valor"
                                ]
                            ),

                        "producto":
                            str(
                                termino[
                                    "producto"
                                ]
                            ),
                    }

                    for termino
                    in comprobacion[
                        "terminos"
                    ]
                ],
            }
        )

    return resultado