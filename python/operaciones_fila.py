"""Operaciones elementales usadas por Gauss y Gauss-Jordan."""


def copiar_matriz(matriz):
    """Crea una copia para conservar cada etapa del procedimiento."""
    copia = []
    for fila in matriz:
        copia.append(fila[:])
    return copia


def mcd(a, b):
    """Calcula el máximo común divisor con el algoritmo de Euclides."""
    a = abs(int(a))
    b = abs(int(b))

    while b != 0:
        residuo = a % b
        a = b
        b = residuo

    return a


def mcm(a, b):
    """Calcula el mínimo común múltiplo sin utilizar el módulo math."""
    a = abs(int(a))
    b = abs(int(b))

    if a == 0 or b == 0:
        return 0

    return (a * b) // mcd(a, b)


def mcm_denominadores(fila):
    """Obtiene el MCM de todos los denominadores presentes en una fila."""
    multiplo = 1
    for valor in fila:
        multiplo = mcm(multiplo, valor.denominator)
    return multiplo


def intercambiar_filas(matriz, fila_a, fila_b):
    """Operación elemental: intercambiar dos filas."""
    matriz[fila_a], matriz[fila_b] = matriz[fila_b], matriz[fila_a]


def multiplicar_fila(matriz, fila, constante):
    """Operación elemental: multiplicar una fila por un número no nulo."""
    if constante == 0:
        raise ValueError("No se puede multiplicar una fila por cero")

    for columna in range(len(matriz[fila])):
        matriz[fila][columna] *= constante


def sumar_multiplo(matriz, destino, origen, constante):
    """Operación elemental: sumar a una fila un múltiplo de otra."""
    for columna in range(len(matriz[destino])):
        matriz[destino][columna] += constante * matriz[origen][columna]


def eliminar_denominadores(matriz, fila):
    """Multiplica la fila por el MCM cuando contiene valores fraccionarios."""
    multiplo = mcm_denominadores(matriz[fila])

    if multiplo > 1:
        multiplicar_fila(matriz, fila, multiplo)

    return multiplo


def buscar_pivote_menor(matriz, fila_inicial, columna):
    """Busca el menor valor absoluto no nulo en la parte activa de la columna."""
    fila_elegida = None
    valor_menor = None

    for fila in range(fila_inicial, len(matriz)):
        valor = matriz[fila][columna]
        if valor == 0:
            continue

        if valor_menor is None or abs(valor) < valor_menor:
            valor_menor = abs(valor)
            fila_elegida = fila

    return fila_elegida

