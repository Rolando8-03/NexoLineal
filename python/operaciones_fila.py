from fractions import Fraction

# ============================================================
# Utilidades generales
# ============================================================

def copiar_matriz(matriz):
    """Crea una copia independiente de una matriz."""

    return [
        fila[:]
        for fila in matriz
    ]


def es_fila_nula(fila, limite=None):
    """
    Comprueba si una fila contiene únicamente ceros.

    limite permite revisar solamente una parte de la fila.
    Esto será útil cuando se trabaje con matrices aumentadas.
    """

    if limite is None:
        limite = len(fila)

    return all(
        fila[columna] == 0
        for columna in range(limite)
    )


def primera_entrada_no_nula(fila, limite=None):
    """
    Devuelve la posición del primer elemento distinto de cero.

    Si toda la fila es nula, devuelve None.
    """

    if limite is None:
        limite = len(fila)

    for columna in range(limite):

        if fila[columna] != 0:
            return columna

    return None


# ============================================================
# MCD y MCM
# ============================================================

def mcd(a, b):
    """
    Calcula el máximo común divisor mediante
    el algoritmo de Euclides.
    """

    a = abs(
        int(a)
    )

    b = abs(
        int(b)
    )

    while b != 0:

        residuo = a % b

        a = b
        b = residuo

    return a


def mcm(a, b):
    """
    Calcula el mínimo común múltiplo
    sin utilizar funciones externas.
    """

    a = abs(
        int(a)
    )

    b = abs(
        int(b)
    )

    if a == 0 or b == 0:
        return 0

    return (
        a * b
    ) // mcd(a, b)


def mcm_denominadores(fila):
    """
    Obtiene el MCM de los denominadores
    presentes en una fila.

    Funciona tanto con Fraction como con enteros.
    """

    multiplo = 1

    for valor in fila:

        denominador = getattr(
            valor,
            "denominator",
            1
        )

        multiplo = mcm(
            multiplo,
            denominador
        )

    return multiplo


# ============================================================
# Validaciones
# ============================================================

def validar_fila(matriz, fila):
    """Comprueba que el índice de una fila exista."""

    if not matriz:
        raise ValueError(
            "La matriz no puede estar vacía"
        )

    if fila < 0 or fila >= len(matriz):
        raise ValueError(
            f"La fila {fila + 1} no existe"
        )


def validar_columna(matriz, columna):
    """Comprueba que el índice de una columna exista."""

    if not matriz or not matriz[0]:
        raise ValueError(
            "La matriz no puede estar vacía"
        )

    if columna < 0 or columna >= len(matriz[0]):
        raise ValueError(
            f"La columna {columna + 1} no existe"
        )


# ============================================================
# Operaciones elementales por filas
# ============================================================

def intercambiar_filas(
    matriz,
    fila_a,
    fila_b
):
    """
    Operación elemental:

        Fi ↔ Fj

    Intercambia dos filas de la matriz.
    """

    validar_fila(
        matriz,
        fila_a
    )

    validar_fila(
        matriz,
        fila_b
    )

    matriz[fila_a], matriz[fila_b] = (
        matriz[fila_b],
        matriz[fila_a]
    )


def multiplicar_fila(
    matriz,
    fila,
    constante
):
    """
    Operación elemental:

        Fi → cFi

    El escalar debe ser distinto de cero.
    """

    validar_fila(
        matriz,
        fila
    )

    constante = Fraction(
        constante
    )

    if constante == 0:
        raise ValueError(
            "No se puede multiplicar "
            "una fila por cero"
        )

    for columna in range(
        len(matriz[fila])
    ):

        matriz[fila][columna] *= (
            constante
        )


def sumar_multiplo(
    matriz,
    destino,
    origen,
    constante
):
    """
    Operación elemental:

        Fi → Fi + cFj

    destino:
        fila que será modificada.

    origen:
        fila utilizada en la operación.
    """

    validar_fila(
        matriz,
        destino
    )

    validar_fila(
        matriz,
        origen
    )

    if (
        len(matriz[destino])
        != len(matriz[origen])
    ):
        raise ValueError(
            "Las filas deben tener "
            "la misma cantidad de elementos"
        )

    constante = Fraction(
        constante
    )

    for columna in range(
        len(matriz[destino])
    ):

        matriz[destino][columna] += (
            constante
            * matriz[origen][columna]
        )


def sumar_fila(
    matriz,
    destino,
    origen
):
    """
    Caso particular:

        Fi → Fi + Fj
    """

    sumar_multiplo(
        matriz,
        destino,
        origen,
        Fraction(1)
    )


# ============================================================
# Eliminación de fracciones
# ============================================================

def eliminar_denominadores(
    matriz,
    fila
):
    """
    Multiplica una fila por el MCM de sus denominadores.
    Devuelve el multiplicador utilizado.
    """

    validar_fila(
        matriz,
        fila
    )

    multiplo = mcm_denominadores(
        matriz[fila]
    )

    if multiplo > 1:

        multiplicar_fila(
            matriz,
            fila,
            multiplo
        )

    return multiplo


# ============================================================
# Pivotes
# ============================================================

def buscar_pivote_menor(
    matriz,
    fila_inicial,
    columna
):
    """
    Busca el valor no nulo de menor valor absoluto
    en una columna, comenzando desde fila_inicial.
    """

    if not matriz:
        return None

    validar_columna(
        matriz,
        columna
    )

    if fila_inicial < 0:
        fila_inicial = 0

    if fila_inicial >= len(matriz):
        return None

    fila_elegida = None
    valor_menor = None

    for fila in range(
        fila_inicial,
        len(matriz)
    ):

        valor = matriz[fila][columna]

        if valor == 0:
            continue

        valor_absoluto = abs(
            valor
        )

        if (
            valor_menor is None
            or valor_absoluto < valor_menor
        ):

            valor_menor = (
                valor_absoluto
            )

            fila_elegida = fila

    return fila_elegida


# ============================================================
# Orden de filas
# ============================================================

def mover_filas_nulas_abajo(
    matriz
):
    """
    Coloca las filas completamente nulas
    debajo de todas las filas no nulas.

    Devuelve una lista con los intercambios realizados.
    """

    intercambios = []

    fila_destino = 0

    for fila_actual in range(
        len(matriz)
    ):

        if es_fila_nula(
            matriz[fila_actual]
        ):
            continue

        if fila_actual != fila_destino:

            intercambiar_filas(
                matriz,
                fila_destino,
                fila_actual
            )

            intercambios.append(
                (
                    fila_destino,
                    fila_actual
                )
            )

        fila_destino += 1

    return intercambios


# ============================================================
# Operación elemental manual
# ============================================================

def aplicar_operacion_fila(
    matriz_original,
    tipo,
    **datos
):
    """
    Aplica una operación elemental a una copia de la matriz.

    Devuelve la matriz resultante.
    """

    matriz = copiar_matriz(
        matriz_original
    )

    if tipo == "intercambio":

        intercambiar_filas(
            matriz,
            datos["fila_a"],
            datos["fila_b"]
        )

    elif tipo == "escalar":

        multiplicar_fila(
            matriz,
            datos["fila"],
            datos["constante"]
        )

    elif tipo == "suma":

        sumar_fila(
            matriz,
            datos["destino"],
            datos["origen"]
        )

    elif tipo == "combinacion":

        sumar_multiplo(
            matriz,
            datos["destino"],
            datos["origen"],
            datos["constante"]
        )

    else:

        raise ValueError(
            "Operación elemental no reconocida"
        )

    return matriz