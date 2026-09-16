from fractions import Fraction

from operaciones_fila import (
    buscar_pivote_menor,
    copiar_matriz,
    eliminar_denominadores,
    intercambiar_filas,
    multiplicar_fila,
    sumar_multiplo,
)


# ============================================================
# Utilidades
# ============================================================

def convertir_matriz_exacta(matriz):
    """
    Convierte todos los valores de una matriz a Fraction.

    Esto permite mantener resultados exactos incluso cuando
    estas funciones se llaman directamente desde otro módulo.
    """

    return [
        [
            valor
            if isinstance(valor, Fraction)
            else Fraction(str(valor))
            for valor in fila
        ]
        for fila in matriz
    ]


def validar_matriz_rectangular(matriz):
    """Comprueba que una matriz exista y sea rectangular."""

    if not matriz:
        raise ValueError(
            "La matriz no puede estar vacía"
        )

    if not matriz[0]:
        raise ValueError(
            "La matriz debe tener al menos una columna"
        )

    columnas = len(
        matriz[0]
    )

    for fila in matriz:

        if len(fila) != columnas:
            raise ValueError(
                "Todas las filas deben tener "
                "la misma cantidad de columnas"
            )


def construir_matriz_aumentada(A, b):

    matriz = []

    for i in range(len(A)):

        fila = A[i][:]

        fila.append(
            b[i]
        )

        matriz.append(
            fila
        )

    return matriz


def registrar_paso(
    pasos,
    titulo,
    operacion,
    matriz,
    mostrar_matriz=True
):
    """
    Guarda una operación y una copia de la matriz
    obtenida después de realizarla.
    """

    pasos.append(
        {
            "titulo": titulo,
            "operacion": operacion,
            "matriz": copiar_matriz(
                matriz
            ),
            "mostrar_matriz": mostrar_matriz,
        }
    )


def posiciones_pivote(
    matriz,
    numero_columnas=None
):

    if not matriz:
        return []

    if numero_columnas is None:
        numero_columnas = len(
            matriz[0]
        )

    numero_columnas = min(
        numero_columnas,
        len(matriz[0])
    )

    pivotes = []

    for fila in range(
        len(matriz)
    ):

        for columna in range(
            numero_columnas
        ):

            if matriz[fila][columna] != 0:

                pivotes.append(
                    (
                        fila,
                        columna,
                    )
                )

                break

    return pivotes


def columnas_pivote(
    matriz,
    numero_columnas=None
):
    """Devuelve únicamente las columnas donde existen pivotes."""

    return [
        columna
        for _, columna in posiciones_pivote(
            matriz,
            numero_columnas
        )
    ]


# ============================================================
# GAUSS PARA UNA MATRIZ LIBRE
# ============================================================

def aplicar_gauss_matriz(
    matriz_original
):

    validar_matriz_rectangular(
        matriz_original
    )

    matriz = convertir_matriz_exacta(
        matriz_original
    )

    pasos = []

    numero_filas = len(
        matriz
    )

    numero_columnas = len(
        matriz[0]
    )

    fila_pivote = 0

    registrar_paso(
        pasos,
        "Matriz inicial",
        {
            "tipo": "inicial_matriz",
        },
        matriz,
    )

    # Recorremos todas las columnas de la matriz.
    for columna in range(
        numero_columnas
    ):

        if fila_pivote >= numero_filas:
            break

        fila_elegida = buscar_pivote_menor(
            matriz,
            fila_pivote,
            columna
        )

        # Si toda la parte disponible de la columna
        # contiene ceros, se pasa a la siguiente.
        if fila_elegida is None:
            continue

        registrar_paso(
            pasos,
            "Elección del pivote",
            {
                "tipo": "pivote",
                "fila": fila_elegida,
                "columna": columna,
                "valor": matriz[
                    fila_elegida
                ][columna],
                "aumentada": False,
            },
            matriz,
            mostrar_matriz=False,
        )

        # Si el pivote no está en la fila activa,
        # se intercambian las filas.
        if fila_elegida != fila_pivote:

            intercambiar_filas(
                matriz,
                fila_pivote,
                fila_elegida
            )

            registrar_paso(
                pasos,
                "Intercambio de filas",
                {
                    "tipo": "intercambio",
                    "fila_a": fila_pivote,
                    "fila_b": fila_elegida,
                },
                matriz,
            )

        pivote = matriz[
            fila_pivote
        ][columna]

        # Crear ceros debajo del pivote.
        for fila in range(
            fila_pivote + 1,
            numero_filas
        ):

            numero_a_eliminar = matriz[
                fila
            ][columna]

            if numero_a_eliminar == 0:
                continue

            # k = -b/p
            k = (
                -numero_a_eliminar
                / pivote
            )

            sumar_multiplo(
                matriz,
                fila,
                fila_pivote,
                k
            )

            registrar_paso(
                pasos,
                "Cero debajo del pivote",
                {
                    "tipo": "combinacion",
                    "destino": fila,
                    "origen": fila_pivote,
                    "p": pivote,
                    "b": numero_a_eliminar,
                    "k": k,
                },
                matriz,
            )

            # Si aparecieron fracciones,
            # se eliminan mediante el MCM.
            multiplo = eliminar_denominadores(
                matriz,
                fila
            )

            if multiplo > 1:

                registrar_paso(
                    pasos,
                    "Eliminación de denominadores",
                    {
                        "tipo": "mcm",
                        "fila": fila,
                        "multiplo": multiplo,
                    },
                    matriz,
                )

        fila_pivote += 1

    return matriz, pasos


# ============================================================
# GAUSS PARA SISTEMAS Ax = b
# ============================================================

def aplicar_gauss(A, b):

    if not A or not A[0]:
        raise ValueError(
            "La matriz A no puede estar vacía"
        )

    if len(A) != len(b):
        raise ValueError(
            "Debe existir un término independiente "
            "por cada fila de A"
        )

    A = convertir_matriz_exacta(
        A
    )

    b = [
        valor
        if isinstance(valor, Fraction)
        else Fraction(str(valor))
        for valor in b
    ]

    matriz = construir_matriz_aumentada(
        A,
        b
    )

    pasos = []

    numero_filas = len(
        matriz
    )

    numero_variables = len(
        A[0]
    )

    fila_pivote = 0

    registrar_paso(
        pasos,
        "Matriz aumentada inicial",
        {
            "tipo": "inicial",
        },
        matriz,
    )

    # Solo se recorren primero las columnas
    # correspondientes a las variables.
    for columna in range(
        numero_variables
    ):

        if fila_pivote >= numero_filas:
            break

        fila_elegida = buscar_pivote_menor(
            matriz,
            fila_pivote,
            columna
        )

        if fila_elegida is None:
            continue

        registrar_paso(
            pasos,
            "Elección del pivote",
            {
                "tipo": "pivote",
                "fila": fila_elegida,
                "columna": columna,
                "valor": matriz[
                    fila_elegida
                ][columna],
                "aumentada": False,
            },
            matriz,
            mostrar_matriz=False,
        )

        if fila_elegida != fila_pivote:

            intercambiar_filas(
                matriz,
                fila_pivote,
                fila_elegida
            )

            registrar_paso(
                pasos,
                "Intercambio de filas",
                {
                    "tipo": "intercambio",
                    "fila_a": fila_pivote,
                    "fila_b": fila_elegida,
                },
                matriz,
            )

        pivote = matriz[
            fila_pivote
        ][columna]

        for fila in range(
            fila_pivote + 1,
            numero_filas
        ):

            numero_a_eliminar = matriz[
                fila
            ][columna]

            if numero_a_eliminar == 0:
                continue

            k = (
                -numero_a_eliminar
                / pivote
            )

            sumar_multiplo(
                matriz,
                fila,
                fila_pivote,
                k
            )

            registrar_paso(
                pasos,
                "Cero debajo del pivote",
                {
                    "tipo": "combinacion",
                    "destino": fila,
                    "origen": fila_pivote,
                    "p": pivote,
                    "b": numero_a_eliminar,
                    "k": k,
                },
                matriz,
            )

            multiplo = eliminar_denominadores(
                matriz,
                fila
            )

            if multiplo > 1:

                registrar_paso(
                    pasos,
                    "Eliminación de denominadores",
                    {
                        "tipo": "mcm",
                        "fila": fila,
                        "multiplo": multiplo,
                    },
                    matriz,
                )

        fila_pivote += 1

    if fila_pivote < numero_filas:

        fila_elegida = buscar_pivote_menor(
            matriz,
            fila_pivote,
            numero_variables
        )

        if fila_elegida is not None:

            registrar_paso(
                pasos,
                "Pivote en la columna aumentada",
                {
                    "tipo": "pivote",
                    "fila": fila_elegida,
                    "columna": numero_variables,
                    "valor": matriz[
                        fila_elegida
                    ][numero_variables],
                    "aumentada": True,
                },
                matriz,
                mostrar_matriz=False,
            )

            if fila_elegida != fila_pivote:

                intercambiar_filas(
                    matriz,
                    fila_pivote,
                    fila_elegida
                )

                registrar_paso(
                    pasos,
                    "Intercambio de filas",
                    {
                        "tipo": "intercambio",
                        "fila_a": fila_pivote,
                        "fila_b": fila_elegida,
                    },
                    matriz,
                )

            pivote = matriz[
                fila_pivote
            ][numero_variables]

            for fila in range(
                fila_pivote + 1,
                numero_filas
            ):

                numero_a_eliminar = matriz[
                    fila
                ][numero_variables]

                if numero_a_eliminar == 0:
                    continue

                k = (
                    -numero_a_eliminar
                    / pivote
                )

                sumar_multiplo(
                    matriz,
                    fila,
                    fila_pivote,
                    k
                )

                registrar_paso(
                    pasos,
                    "Cero debajo del pivote "
                    "de la columna aumentada",
                    {
                        "tipo": "combinacion",
                        "destino": fila,
                        "origen": fila_pivote,
                        "p": pivote,
                        "b": numero_a_eliminar,
                        "k": k,
                    },
                    matriz,
                )

                multiplo = eliminar_denominadores(
                    matriz,
                    fila
                )

                if multiplo > 1:

                    registrar_paso(
                        pasos,
                        "Eliminación de denominadores",
                        {
                            "tipo": "mcm",
                            "fila": fila,
                            "multiplo": multiplo,
                        },
                        matriz,
                    )

    numero_columnas_total = (
        numero_variables + 1
    )

    for fila in range(
        numero_filas
    ):

        fila_nula = all(
            matriz[fila][columna] == 0
            for columna in range(
                numero_columnas_total
            )
        )

        if not fila_nula:
            continue

        fila_no_nula = None

        for candidata in range(
            fila + 1,
            numero_filas
        ):

            if any(
                matriz[candidata][columna] != 0
                for columna in range(
                    numero_columnas_total
                )
            ):

                fila_no_nula = candidata
                break

        if fila_no_nula is not None:

            intercambiar_filas(
                matriz,
                fila,
                fila_no_nula
            )

            registrar_paso(
                pasos,
                "Orden de las filas no nulas",
                {
                    "tipo": "intercambio",
                    "fila_a": fila,
                    "fila_b": fila_no_nula,
                },
                matriz,
            )

    return matriz, pasos


# ============================================================
# GAUSS-JORDAN
# ============================================================

def aplicar_gauss_jordan(
    matriz_escalonada
):

    validar_matriz_rectangular(
        matriz_escalonada
    )

    matriz = convertir_matriz_exacta(
        matriz_escalonada
    )

    pasos = []

    numero_columnas = len(
        matriz[0]
    )

    registrar_paso(
        pasos,
        "Matriz donde terminó Gauss",
        {
            "tipo": "retomar",
        },
        matriz,
    )

    # Se trabaja desde la última fila hacia arriba.
    for fila in range(
        len(matriz) - 1,
        -1,
        -1
    ):

        columna_pivote = None

        # Buscar la primera entrada distinta de cero.
        for columna in range(
            numero_columnas
        ):

            if matriz[fila][columna] != 0:

                columna_pivote = columna
                break

        # Fila completamente nula.
        if columna_pivote is None:
            continue

        pivote = matriz[
            fila
        ][columna_pivote]

        # ====================================================
        # Convertir el pivote en 1
        # ====================================================

        if pivote != 1:

            constante = (
                Fraction(1, 1)
                / pivote
            )

            multiplicar_fila(
                matriz,
                fila,
                constante
            )

            registrar_paso(
                pasos,
                "Pivote convertido en uno",
                {
                    "tipo": "normalizacion",
                    "fila": fila,
                    "pivote": pivote,
                    "constante": constante,
                },
                matriz,
            )

        pivote = matriz[
            fila
        ][columna_pivote]

        # ====================================================
        # Crear ceros encima del pivote
        # ====================================================

        for fila_superior in range(
            fila
        ):

            numero_a_eliminar = matriz[
                fila_superior
            ][columna_pivote]

            if numero_a_eliminar == 0:
                continue

            k = (
                -numero_a_eliminar
                / pivote
            )

            sumar_multiplo(
                matriz,
                fila_superior,
                fila,
                k
            )

            registrar_paso(
                pasos,
                "Cero arriba del pivote",
                {
                    "tipo": "combinacion",
                    "destino": fila_superior,
                    "origen": fila,
                    "p": pivote,
                    "b": numero_a_eliminar,
                    "k": k,
                },
                matriz,
            )

            multiplo = eliminar_denominadores(
                matriz,
                fila_superior
            )

            if multiplo > 1:

                registrar_paso(
                    pasos,
                    "Eliminación de denominadores",
                    {
                        "tipo": "mcm",
                        "fila": fila_superior,
                        "multiplo": multiplo,
                    },
                    matriz,
                )

    return matriz, pasos


# ============================================================
# REDUCCIÓN COMPLETA DE UNA MATRIZ LIBRE
# ============================================================

def reducir_matriz(
    matriz_original
):

    validar_matriz_rectangular(
        matriz_original
    )

    original = convertir_matriz_exacta(
        matriz_original
    )

    escalonada, pasos_gauss = (
        aplicar_gauss_matriz(
            original
        )
    )

    reducida, pasos_jordan = (
        aplicar_gauss_jordan(
            escalonada
        )
    )

    pivotes = posiciones_pivote(
        reducida
    )

    columnas = [
        columna
        for _, columna in pivotes
    ]

    return {
        "matriz_original": original,
        "matriz_escalonada": escalonada,
        "matriz_rref": reducida,
        "posiciones_pivote": pivotes,
        "columnas_pivote": columnas,
        "pasos_gauss": pasos_gauss,
        "pasos_jordan": pasos_jordan,
    }


# ============================================================
# SUSTITUCIÓN REGRESIVA
# ============================================================

def resolver_desde_escalonada(
    matriz,
    numero_variables
):
    """
    Resuelve un sistema consistente a partir de su
    matriz escalonada.

    También identifica las variables libres y genera
    expresiones paramétricas cuando existen infinitas
    soluciones.
    """

    pivotes = posiciones_pivote(
        matriz,
        numero_variables
    )

    columnas_pivote_sistema = [
        columna
        for _, columna in pivotes
    ]

    variables_libres = [
        columna
        for columna in range(
            numero_variables
        )
        if columna
        not in columnas_pivote_sistema
    ]

    expresiones = [
        None
    ] * numero_variables

    # Cada variable libre se representa mediante
    # su propio parámetro.
    for columna in variables_libres:

        expresiones[columna] = {
            "constante": Fraction(0),
            "terminos": {
                columna: Fraction(1)
            },
        }

    pasos = []

    # Sustitución desde la última ecuación
    # hacia la primera.
    for fila, columna_pivote in reversed(
        pivotes
    ):

        constante = matriz[
            fila
        ][-1]

        terminos = {}

        for columna in range(
            columna_pivote + 1,
            numero_variables
        ):

            coeficiente = matriz[
                fila
            ][columna]

            if coeficiente == 0:
                continue

            expresion_conocida = (
                expresiones[columna]
            )

            constante -= (
                coeficiente
                * expresion_conocida[
                    "constante"
                ]
            )

            for (
                libre,
                valor,
            ) in expresion_conocida[
                "terminos"
            ].items():

                if libre not in terminos:

                    terminos[
                        libre
                    ] = Fraction(0)

                terminos[libre] -= (
                    coeficiente
                    * valor
                )

        pivote = matriz[
            fila
        ][columna_pivote]

        constante /= pivote

        for libre in list(
            terminos
        ):

            terminos[libre] /= (
                pivote
            )

            if terminos[libre] == 0:

                del terminos[
                    libre
                ]

        expresiones[
            columna_pivote
        ] = {
            "constante": constante,
            "terminos": terminos,
        }

        pasos.append(
            {
                "fila": fila,
                "variable": columna_pivote,
                "expresion": {
                    "constante": constante,
                    "terminos": (
                        terminos.copy()
                    ),
                },
            }
        )

    return (
        variables_libres,
        expresiones,
        pasos,
    )