"""Procedimientos manuales de eliminación de Gauss y Gauss-Jordan."""

from fractions import Fraction

from operaciones_fila import (
    buscar_pivote_menor,
    copiar_matriz,
    eliminar_denominadores,
    intercambiar_filas,
    multiplicar_fila,
    sumar_multiplo,
)


def construir_matriz_aumentada(A, b):
    """Forma la matriz aumentada [A|b]."""
    matriz = []
    for i in range(len(A)):
        fila = A[i][:]
        fila.append(b[i])
        matriz.append(fila)
    return matriz


def registrar_paso(pasos, titulo, operacion, matriz, mostrar_matriz=True):
    """Guarda la operación y una copia de la matriz obtenida."""
    pasos.append(
        {
            "titulo": titulo,
            "operacion": operacion,
            "matriz": copiar_matriz(matriz),
            "mostrar_matriz": mostrar_matriz,
        }
    )


def posiciones_pivote(matriz, numero_columnas):
    """Localiza el primer valor no nulo de cada fila."""
    pivotes = []

    for fila in range(len(matriz)):
        for columna in range(numero_columnas):
            if matriz[fila][columna] != 0:
                pivotes.append((fila, columna))
                break

    return pivotes


def aplicar_gauss(A, b):
    """Escalona [A|b] usando el menor pivote no nulo y k = -b/p."""
    matriz = construir_matriz_aumentada(A, b)
    pasos = []
    numero_filas = len(matriz)
    numero_variables = len(A[0])
    fila_pivote = 0

    registrar_paso(
        pasos,
        "Matriz aumentada inicial",
        {"tipo": "inicial"},
        matriz,
    )

    # Se recorre cada columna buscando un pivote en las filas aún no procesadas.
    for columna in range(numero_variables):
        if fila_pivote >= numero_filas:
            break

        fila_elegida = buscar_pivote_menor(matriz, fila_pivote, columna)

        # Una columna sin valores disponibles corresponde a una variable sin pivote.
        if fila_elegida is None:
            continue

        registrar_paso(
            pasos,
            "Elección del pivote",
            {
                "tipo": "pivote",
                "fila": fila_elegida,
                "columna": columna,
                "valor": matriz[fila_elegida][columna],
                "aumentada": False,
            },
            matriz,
            mostrar_matriz=False,
        )

        # Operación elemental: Fi <-> Fj.
        if fila_elegida != fila_pivote:
            intercambiar_filas(matriz, fila_pivote, fila_elegida)
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

        pivote = matriz[fila_pivote][columna]

        # Con k = -b/p se forma un cero debajo del pivote actual.
        for fila in range(fila_pivote + 1, numero_filas):
            numero_a_eliminar = matriz[fila][columna]
            if numero_a_eliminar == 0:
                continue

            k = -numero_a_eliminar / pivote
            sumar_multiplo(matriz, fila, fila_pivote, k)
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

            # Si aparecieron fracciones se multiplica toda la fila por su MCM.
            multiplo = eliminar_denominadores(matriz, fila)
            if multiplo > 1:
                registrar_paso(
                    pasos,
                    "Eliminación de denominadores",
                    {"tipo": "mcm", "fila": fila, "multiplo": multiplo},
                    matriz,
                )

        fila_pivote += 1

    # En un sistema inconsistente la última columna también contiene un pivote.
    # Se procesa para dejar una sola fila contradictoria y las filas nulas abajo.
    if fila_pivote < numero_filas:
        fila_elegida = buscar_pivote_menor(
            matriz, fila_pivote, numero_variables
        )

        if fila_elegida is not None:
            registrar_paso(
                pasos,
                "Pivote en la columna aumentada",
                {
                    "tipo": "pivote",
                    "fila": fila_elegida,
                    "columna": numero_variables,
                    "valor": matriz[fila_elegida][numero_variables],
                    "aumentada": True,
                },
                matriz,
                mostrar_matriz=False,
            )

            if fila_elegida != fila_pivote:
                intercambiar_filas(matriz, fila_pivote, fila_elegida)
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

            pivote = matriz[fila_pivote][numero_variables]
            for fila in range(fila_pivote + 1, numero_filas):
                numero_a_eliminar = matriz[fila][numero_variables]
                if numero_a_eliminar == 0:
                    continue

                k = -numero_a_eliminar / pivote
                sumar_multiplo(matriz, fila, fila_pivote, k)
                registrar_paso(
                    pasos,
                    "Cero debajo del pivote de la columna aumentada",
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

                multiplo = eliminar_denominadores(matriz, fila)
                if multiplo > 1:
                    registrar_paso(
                        pasos,
                        "Eliminación de denominadores",
                        {"tipo": "mcm", "fila": fila, "multiplo": multiplo},
                        matriz,
                    )

    # Una contradicción también es una fila no nula. Si quedó debajo de una
    # fila totalmente nula, se intercambian para completar la forma escalonada.
    for fila in range(numero_filas):
        if any(matriz[fila][columna] != 0 for columna in range(numero_variables + 1)):
            continue

        fila_no_nula = None
        for candidata in range(fila + 1, numero_filas):
            if any(
                matriz[candidata][columna] != 0
                for columna in range(numero_variables + 1)
            ):
                fila_no_nula = candidata
                break

        if fila_no_nula is not None:
            intercambiar_filas(matriz, fila, fila_no_nula)
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


def aplicar_gauss_jordan(matriz_escalonada):
    """Continúa desde Gauss hasta la forma escalonada reducida."""
    matriz = copiar_matriz(matriz_escalonada)
    pasos = []
    numero_columnas = len(matriz[0])

    registrar_paso(
        pasos,
        "Matriz donde terminó Gauss",
        {"tipo": "retomar"},
        matriz,
    )

    # Se trabaja desde el último pivote para crear ceros encima de cada uno.
    for fila in range(len(matriz) - 1, -1, -1):
        columna = None
        for candidata in range(numero_columnas):
            if matriz[fila][candidata] != 0:
                columna = candidata
                break

        if columna is None:
            continue

        pivote = matriz[fila][columna]

        # Operación elemental: convertir el pivote en 1.
        if pivote != 1:
            constante = Fraction(1, 1) / pivote
            multiplicar_fila(matriz, fila, constante)
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

        pivote = matriz[fila][columna]

        # Se vuelve a usar k = -b/p, ahora para crear ceros arriba.
        for fila_superior in range(fila):
            numero_a_eliminar = matriz[fila_superior][columna]
            if numero_a_eliminar == 0:
                continue

            k = -numero_a_eliminar / pivote
            sumar_multiplo(matriz, fila_superior, fila, k)
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

            multiplo = eliminar_denominadores(matriz, fila_superior)
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


def resolver_desde_escalonada(matriz, numero_variables):
    """Realiza sustitución regresiva, incluyendo variables libres."""
    pivotes = posiciones_pivote(matriz, numero_variables)
    columnas_pivote = []
    for _, columna in pivotes:
        columnas_pivote.append(columna)

    variables_libres = []
    for columna in range(numero_variables):
        if columna not in columnas_pivote:
            variables_libres.append(columna)

    expresiones = [None] * numero_variables

    # Cada variable libre se representa a sí misma como parámetro.
    for columna in variables_libres:
        expresiones[columna] = {
            "constante": Fraction(0),
            "terminos": {columna: Fraction(1)},
        }

    pasos = []

    # Desde la última ecuación se sustituyen las expresiones ya conocidas.
    for fila, columna_pivote in reversed(pivotes):
        constante = matriz[fila][-1]
        terminos = {}

        for columna in range(columna_pivote + 1, numero_variables):
            coeficiente = matriz[fila][columna]
            if coeficiente == 0:
                continue

            expresion_conocida = expresiones[columna]
            constante -= coeficiente * expresion_conocida["constante"]

            for libre, valor in expresion_conocida["terminos"].items():
                if libre not in terminos:
                    terminos[libre] = Fraction(0)
                terminos[libre] -= coeficiente * valor

        pivote = matriz[fila][columna_pivote]
        constante /= pivote

        for libre in list(terminos):
            terminos[libre] /= pivote
            if terminos[libre] == 0:
                del terminos[libre]

        expresiones[columna_pivote] = {
            "constante": constante,
            "terminos": terminos,
        }
        pasos.append(
            {
                "fila": fila,
                "variable": columna_pivote,
                "expresion": {
                    "constante": constante,
                    "terminos": terminos.copy(),
                },
            }
        )

    return variables_libres, expresiones, pasos
