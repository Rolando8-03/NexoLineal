"""Análisis de forma escalonada y forma escalonada reducida."""


# ============================================================
# Validación
# ============================================================

def validar_matriz(matriz):
    """
    Comprueba que la matriz exista y sea rectangular.

    Devuelve:
        numero_filas, numero_columnas
    """

    if not isinstance(matriz, list):
        raise ValueError(
            "La matriz debe ser una lista de filas"
        )

    if not matriz:
        raise ValueError(
            "La matriz no puede estar vacía"
        )

    if not isinstance(matriz[0], list):
        raise ValueError(
            "La matriz debe contener filas"
        )

    if not matriz[0]:
        raise ValueError(
            "La matriz debe tener al menos una columna"
        )

    numero_columnas = len(
        matriz[0]
    )

    for i, fila in enumerate(matriz):

        if not isinstance(fila, list):
            raise ValueError(
                f"La fila {i + 1} no es válida"
            )

        if len(fila) != numero_columnas:
            raise ValueError(
                "Todas las filas deben tener "
                "la misma cantidad de columnas"
            )

    return (
        len(matriz),
        numero_columnas,
    )


# ============================================================
# Filas
# ============================================================

def es_fila_nula(fila):
    """Indica si todos los elementos de una fila son cero."""

    return all(
        valor == 0
        for valor in fila
    )


def obtener_filas_nulas(matriz):
    """Devuelve los índices de las filas completamente nulas."""

    return [
        i
        for i, fila in enumerate(matriz)
        if es_fila_nula(fila)
    ]


def obtener_filas_no_nulas(matriz):
    """Devuelve los índices de las filas que contienen algún valor no nulo."""

    return [
        i
        for i, fila in enumerate(matriz)
        if not es_fila_nula(fila)
    ]


# ============================================================
# Entradas principales y pivotes
# ============================================================

def entrada_principal(fila):
    """
    Devuelve la columna de la primera entrada no nula.

    Si la fila es completamente nula, devuelve None.
    """

    for columna, valor in enumerate(fila):

        if valor != 0:
            return columna

    return None


def obtener_posiciones_pivote(matriz):
    """
    Localiza la entrada principal de cada fila no nula.

    Devuelve:

        [
            (fila, columna),
            ...
        ]

    Estas posiciones serán las posiciones pivote
    cuando la matriz se encuentre en forma escalonada.
    """

    posiciones = []

    for i, fila in enumerate(matriz):

        columna = entrada_principal(
            fila
        )

        if columna is not None:

            posiciones.append(
                (
                    i,
                    columna,
                )
            )

    return posiciones


def obtener_columnas_pivote(matriz):
    """Devuelve las columnas que contienen entradas principales."""

    return [
        columna
        for _, columna in obtener_posiciones_pivote(
            matriz
        )
    ]


# ============================================================
# Rango
# ============================================================

def calcular_rango(matriz):
    """
    Calcula el rango de una matriz que ya está
    en forma escalonada o reducida.

    En una matriz escalonada:

        rango = número de filas no nulas
              = número de pivotes
    """

    return len(
        obtener_filas_no_nulas(
            matriz
        )
    )


# ============================================================
# Propiedades de forma escalonada
# ============================================================

def propiedad_filas_nulas_abajo(matriz):
    """
    Propiedad 1:

    Todas las filas no nulas deben aparecer
    encima de las filas completamente nulas.
    """

    nula_encontrada = False

    for fila in matriz:

        if es_fila_nula(fila):

            nula_encontrada = True

        elif nula_encontrada:

            return False

    return True


def propiedad_entradas_avanzan_derecha(matriz):
    """
    Propiedad 2:

    La entrada principal de cada fila no nula debe
    encontrarse a la derecha de la entrada principal
    de la fila anterior.
    """

    posiciones = obtener_posiciones_pivote(
        matriz
    )

    for i in range(
        len(posiciones) - 1
    ):

        columna_actual = (
            posiciones[i][1]
        )

        columna_siguiente = (
            posiciones[i + 1][1]
        )

        if columna_actual >= columna_siguiente:

            return False

    return True


def propiedad_ceros_debajo(matriz):
    """
    Propiedad 3:

    Debajo de cada entrada principal
    todas las entradas deben ser cero.
    """

    posiciones = obtener_posiciones_pivote(
        matriz
    )

    for fila_pivote, columna_pivote in posiciones:

        for fila in range(
            fila_pivote + 1,
            len(matriz)
        ):

            if matriz[
                fila
            ][
                columna_pivote
            ] != 0:

                return False

    return True


def propiedad_pivotes_uno(matriz):
    """
    Propiedad 4:

    Cada entrada principal debe ser igual a 1.
    """

    posiciones = obtener_posiciones_pivote(
        matriz
    )

    for fila, columna in posiciones:

        if matriz[fila][columna] != 1:

            return False

    return True


def propiedad_pivotes_unicos(matriz):
    """
    Propiedad 5:

    Cada pivote 1 debe ser el único elemento
    distinto de cero de su columna.
    """

    posiciones = obtener_posiciones_pivote(
        matriz
    )

    for fila_pivote, columna_pivote in posiciones:

        for fila in range(
            len(matriz)
        ):

            if fila == fila_pivote:
                continue

            if matriz[
                fila
            ][
                columna_pivote
            ] != 0:

                return False

    return True


# ============================================================
# Análisis completo
# ============================================================

def analizar_forma(matriz):
    """
    Analiza una matriz sin modificarla.

    Determina si se encuentra en:

    - Forma escalonada por filas (REF)
    - Forma escalonada reducida por filas (RREF)
    - Ninguna de las anteriores

    También devuelve información sobre pivotes,
    filas nulas y rango.
    """

    numero_filas, numero_columnas = (
        validar_matriz(
            matriz
        )
    )

    # --------------------------------------------------------
    # Las cinco propiedades vistas en clase
    # --------------------------------------------------------

    nulas_abajo = (
        propiedad_filas_nulas_abajo(
            matriz
        )
    )

    derecha = (
        propiedad_entradas_avanzan_derecha(
            matriz
        )
    )

    ceros_abajo = (
        propiedad_ceros_debajo(
            matriz
        )
    )

    unos = (
        propiedad_pivotes_uno(
            matriz
        )
    )

    unicos = (
        propiedad_pivotes_unicos(
            matriz
        )
    )

    propiedades = [
        nulas_abajo,
        derecha,
        ceros_abajo,
        unos,
        unicos,
    ]

    # --------------------------------------------------------
    # Clasificación
    # --------------------------------------------------------

    escalonada = all(
        propiedades[:3]
    )

    reducida = all(
        propiedades
    )

    if reducida:

        clasificacion = (
            "Forma escalonada reducida"
        )

    elif escalonada:

        clasificacion = (
            "Solo forma escalonada"
        )

    else:

        clasificacion = (
            "No está en forma escalonada"
        )

    # --------------------------------------------------------
    # Información adicional
    # --------------------------------------------------------

    posiciones_pivote = (
        obtener_posiciones_pivote(
            matriz
        )
    )

    columnas_pivote = [
        columna
        for _, columna in posiciones_pivote
    ]

    filas_nulas = (
        obtener_filas_nulas(
            matriz
        )
    )

    filas_no_nulas = (
        obtener_filas_no_nulas(
            matriz
        )
    )

    # El rango mediante filas no nulas solamente representa
    # directamente el rango cuando la matriz está escalonada.
    if escalonada:

        rango = len(
            filas_no_nulas
        )

    else:

        rango = None

    return {
        # Dimensiones
        "numero_filas": numero_filas,
        "numero_columnas": numero_columnas,

        # Cinco propiedades originales
        "propiedades": propiedades,

        # Clasificación
        "escalonada": escalonada,
        "reducida": reducida,
        "clasificacion": clasificacion,

        # Pivotes
        "posiciones_pivote": posiciones_pivote,
        "columnas_pivote": columnas_pivote,
        "cantidad_pivotes": len(
            posiciones_pivote
        ),

        # Filas
        "filas_nulas": filas_nulas,
        "filas_no_nulas": filas_no_nulas,
        "cantidad_filas_nulas": len(
            filas_nulas
        ),

        # Rango
        "rango": rango,
    }