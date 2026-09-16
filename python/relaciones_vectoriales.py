"""Combinación lineal e independencia lineal en NexoLineal."""

from fractions import Fraction

from analisis_sistema import resolver_sistema
from entrada_datos import leer_vector_celdas


# ============================================================
# Lectura y validación del conjunto de vectores
# ============================================================

def leer_conjunto_vectores(
    textos_vectores
):

    if not isinstance(
        textos_vectores,
        list
    ):
        raise ValueError(
            "El conjunto de vectores no es válido"
        )

    if not 1 <= len(
        textos_vectores
    ) <= 6:
        raise ValueError(
            "Debes ingresar entre 1 y 6 vectores"
        )

    vectores = []

    for indice, textos_vector in enumerate(
        textos_vectores
    ):

        vector = leer_vector_celdas(
            textos_vector,
            f"vector v{indice + 1}"
        )

        vectores.append(
            vector
        )

    # Todos los vectores deben pertenecer al mismo R^n.
    dimension = len(
        vectores[0]
    )

    for indice, vector in enumerate(
        vectores
    ):

        if len(vector) != dimension:

            raise ValueError(
                f"El vector v{indice + 1} tiene "
                f"dimensión {len(vector)}, pero "
                f"los demás pertenecen a R^{dimension}"
            )

    return vectores


# ============================================================
# Matriz formada por vectores columna
# ============================================================

def construir_matriz_columnas(
    vectores
):

    if not vectores:
        raise ValueError(
            "Debe existir al menos un vector"
        )

    dimension = len(
        vectores[0]
    )

    cantidad_vectores = len(
        vectores
    )

    matriz = []

    for componente in range(
        dimension
    ):

        fila = []

        for vector in range(
            cantidad_vectores
        ):

            fila.append(
                vectores[
                    vector
                ][
                    componente
                ]
            )

        matriz.append(
            fila
        )

    return matriz


# ============================================================
# Vector cero
# ============================================================

def construir_vector_cero(
    dimension
):
    """Construye el vector cero de R^n."""

    return [
        Fraction(0)
        for _ in range(
            dimension
        )
    ]


# ============================================================
# Combinación de vectores con coeficientes
# ============================================================

def calcular_combinacion(
    vectores,
    coeficientes
):
    """
    Calcula:

        c1*v1 + c2*v2 + ... + ck*vk

    Se utiliza para comprobar una solución obtenida
    mediante Gauss-Jordan.
    """

    if len(vectores) != len(
        coeficientes
    ):
        raise ValueError(
            "Debe existir un coeficiente "
            "por cada vector"
        )

    dimension = len(
        vectores[0]
    )

    resultado = [
        Fraction(0)
        for _ in range(
            dimension
        )
    ]

    for j in range(
        len(vectores)
    ):

        for i in range(
            dimension
        ):

            resultado[i] += (
                coeficientes[j]
                * vectores[j][i]
            )

    return resultado


# ============================================================
# COMBINACIÓN LINEAL
# ============================================================

def analizar_combinacion_lineal(
    textos_vectores,
    textos_b
):

    vectores = leer_conjunto_vectores(
        textos_vectores
    )

    dimension = len(
        vectores[0]
    )

    cantidad_vectores = len(
        vectores
    )

    # --------------------------------------------------------
    # Leer vector b
    # --------------------------------------------------------

    b = leer_vector_celdas(
        textos_b,
        "vector b"
    )

    if len(b) != dimension:

        raise ValueError(
            f"El vector b pertenece a R^{len(b)}, "
            f"pero los vectores generadores "
            f"pertenecen a R^{dimension}"
        )

    # --------------------------------------------------------
    # Construir A = [v1 v2 ... vk]
    # --------------------------------------------------------

    A = construir_matriz_columnas(
        vectores
    )

    # --------------------------------------------------------
    # Resolver:
    #
    #     A*c = b
    # --------------------------------------------------------

    sistema = resolver_sistema(
        A,
        b
    )

    # --------------------------------------------------------
    # Determinar pertenencia al generado
    # --------------------------------------------------------

    es_combinacion = (
        sistema["tipo"]
        != "inconsistente"
    )

    resultado = {
        "tipo_analisis":
            "combinacion_lineal",

        "dimension":
            dimension,

        "cantidad_vectores":
            cantidad_vectores,

        "vectores":
            serializar_conjunto(
                vectores
            ),

        "b":
            serializar_vector(
                b
            ),

        "matriz_columnas":
            serializar_matriz(
                A
            ),

        "es_combinacion_lineal":
            es_combinacion,

        # Guardamos todo el sistema porque la interfaz
        # podrá mostrar Gauss, Gauss-Jordan, pivotes,
        # rangos y demás información sin recalcular.
        "sistema":
            sistema,
    }

    # ========================================================
    # NO ES COMBINACIÓN LINEAL
    # ========================================================

    if not es_combinacion:

        resultado[
            "conclusion"
        ] = (
            "El vector b no es combinación lineal "
            "de los vectores ingresados porque el "
            "sistema Ac = b es inconsistente."
        )

        resultado[
            "coeficientes_particulares"
        ] = []

        resultado[
            "coeficientes_unicos"
        ] = False

        resultado[
            "comprobacion"
        ] = []

        return resultado

    # ========================================================
    # SÍ ES COMBINACIÓN LINEAL
    # ========================================================

    coeficientes_texto = sistema.get(
        "solucion_particular",
        []
    )

    coeficientes = [
        Fraction(
            coeficiente
        )
        for coeficiente
        in coeficientes_texto
    ]

    comprobacion = calcular_combinacion(
        vectores,
        coeficientes
    )

    coeficientes_unicos = (
        sistema["tipo"] == "unica"
    )

    resultado[
        "coeficientes_particulares"
    ] = [
        str(
            coeficiente
        )
        for coeficiente
        in coeficientes
    ]

    resultado[
        "coeficientes_unicos"
    ] = coeficientes_unicos

    resultado[
        "comprobacion"
    ] = serializar_vector(
        comprobacion
    )

    resultado[
        "comprobacion_correcta"
    ] = (
        comprobacion == b
    )

    if coeficientes_unicos:

        resultado[
            "conclusion"
        ] = (
            "El vector b sí es combinación lineal "
            "de los vectores ingresados y los "
            "coeficientes son únicos."
        )

    else:

        resultado[
            "conclusion"
        ] = (
            "El vector b sí es combinación lineal "
            "de los vectores ingresados. Existen "
            "distintas elecciones posibles de "
            "coeficientes porque hay variables libres."
        )

    return resultado


# ============================================================
# INDEPENDENCIA LINEAL
# ============================================================

def analizar_independencia_lineal(
    textos_vectores
):

    # --------------------------------------------------------
    # Leer vectores
    # --------------------------------------------------------

    vectores = leer_conjunto_vectores(
        textos_vectores
    )

    dimension = len(
        vectores[0]
    )

    cantidad_vectores = len(
        vectores
    )

    # --------------------------------------------------------
    # Construir A
    # --------------------------------------------------------

    A = construir_matriz_columnas(
        vectores
    )

    # --------------------------------------------------------
    # Construir el vector cero
    # --------------------------------------------------------

    cero = construir_vector_cero(
        dimension
    )

    # --------------------------------------------------------
    # Resolver:
    #
    #     A*c = 0
    # --------------------------------------------------------

    sistema = resolver_sistema(
        A,
        cero
    )

    # Un sistema homogéneo siempre es consistente.
    #
    # Si tiene solución única, esa solución necesariamente
    # es la trivial.
    #
    # Por tanto los vectores son independientes.
    independiente = (
        sistema[
            "tipo"
        ] == "unica"
    )

    resultado = {
        "tipo_analisis":
            "independencia_lineal",

        "dimension":
            dimension,

        "cantidad_vectores":
            cantidad_vectores,

        "vectores":
            serializar_conjunto(
                vectores
            ),

        "matriz_columnas":
            serializar_matriz(
                A
            ),

        "vector_cero":
            serializar_vector(
                cero
            ),

        "linealmente_independientes":
            independiente,

        "linealmente_dependientes":
            not independiente,

        "rango":
            sistema[
                "rango_A"
            ],

        "sistema":
            sistema,
    }

    # ========================================================
    # INDEPENDIENTES
    # ========================================================

    if independiente:

        resultado[
            "relacion_dependencia"
        ] = []

        resultado[
            "conclusion"
        ] = (
            "Los vectores son linealmente "
            "independientes porque la única "
            "solución de Ac = 0 es la solución "
            "trivial c = 0."
        )

        return resultado

    direcciones = sistema.get(
        "direcciones",
        []
    )

    relacion = []

    if direcciones:

        relacion = direcciones[
            0
        ]

    resultado[
        "relacion_dependencia"
    ] = relacion

    resultado[
        "conclusion"
    ] = (
        "Los vectores son linealmente dependientes "
        "porque el sistema homogéneo Ac = 0 tiene "
        "soluciones no triviales."
    )

    # --------------------------------------------------------
    # Comprobar la relación encontrada
    # --------------------------------------------------------

    if relacion:

        coeficientes = [
            Fraction(
                valor
            )
            for valor
            in relacion
        ]

        comprobacion = (
            calcular_combinacion(
                vectores,
                coeficientes
            )
        )

        resultado[
            "comprobacion_relacion"
        ] = serializar_vector(
            comprobacion
        )

        resultado[
            "relacion_correcta"
        ] = (
            comprobacion
            == cero
        )

    else:

        resultado[
            "comprobacion_relacion"
        ] = []

        resultado[
            "relacion_correcta"
        ] = False

    return resultado


# ============================================================
# Serialización
# ============================================================

def serializar_vector(
    vector
):
    """Convierte las componentes de un vector a cadenas."""

    return [
        str(valor)
        for valor in vector
    ]


def serializar_conjunto(
    vectores
):
    """Convierte un conjunto de vectores a cadenas."""

    return [
        serializar_vector(
            vector
        )
        for vector in vectores
    ]


def serializar_matriz(
    matriz
):
    """Convierte una matriz a cadenas."""

    return [
        [
            str(valor)
            for valor in fila
        ]
        for fila in matriz
    ]


# ============================================================
# Punto de entrada desde JavaScript
# ============================================================

def ejecutar_relaciones(
    datos
):
    """
    Selecciona el análisis solicitado desde
    el menú de Vectores.
    """

    accion = datos.get(
        "accion",
        ""
    )

    # --------------------------------------------------------
    # Combinación lineal
    # --------------------------------------------------------

    if accion == "combinacion_lineal":

        return analizar_combinacion_lineal(
            datos.get(
                "vectores",
                []
            ),
            datos.get(
                "b",
                []
            ),
        )

    # --------------------------------------------------------
    # Independencia lineal
    # --------------------------------------------------------

    if accion == "independencia_lineal":

        return analizar_independencia_lineal(
            datos.get(
                "vectores",
                []
            )
        )

    raise ValueError(
        "Selecciona un análisis vectorial válido"
    )