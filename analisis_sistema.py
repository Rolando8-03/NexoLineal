"""Clasificación, solución y comprobación de sistemas lineales."""

from fractions import Fraction

from entrada_datos import validar_sistema
from metodos_eliminacion import (
    aplicar_gauss,
    aplicar_gauss_jordan,
    construir_matriz_aumentada,
    posiciones_pivote,
    resolver_desde_escalonada,
)


def calcular_rangos(matriz, numero_variables):
    """Calcula rango(A) y rango([A|b]) contando filas no nulas."""
    rango_A = 0
    rango_aumentada = 0

    for fila in matriz:
        hay_coeficiente = False

        for columna in range(numero_variables):
            if fila[columna] != 0:
                hay_coeficiente = True
                break

        if hay_coeficiente:
            rango_A += 1

        if hay_coeficiente or fila[-1] != 0:
            rango_aumentada += 1

    return rango_A, rango_aumentada


def buscar_contradiccion(matriz, numero_variables):
    """Busca una fila que represente 0 = c, con c distinto de cero."""
    for indice, fila in enumerate(matriz):
        todos_cero = True

        for columna in range(numero_variables):
            if fila[columna] != 0:
                todos_cero = False
                break

        if todos_cero and fila[-1] != 0:
            return indice

    return None


def construir_expresiones_rref(matriz, numero_variables, variables_libres):
    """Lee la solución paramétrica directamente desde la matriz reducida."""
    expresiones = []
    for _ in range(numero_variables):
        expresiones.append({"constante": Fraction(0), "terminos": {}})

    for libre in variables_libres:
        expresiones[libre]["terminos"][libre] = Fraction(1)

    pivotes = posiciones_pivote(matriz, numero_variables)
    for fila, columna_pivote in pivotes:
        expresiones[columna_pivote]["constante"] = matriz[fila][-1]

        for libre in variables_libres:
            coeficiente = -matriz[fila][libre]
            if coeficiente != 0:
                expresiones[columna_pivote]["terminos"][libre] = coeficiente

    return expresiones


def obtener_solucion_particular(expresiones):
    """Asigna cero a las variables libres para obtener una solución concreta."""
    solucion = []
    for expresion in expresiones:
        solucion.append(expresion["constante"])
    return solucion


def comprobar_solucion(A, b, solucion):
    """Sustituye una solución en cada ecuación original."""
    comprobaciones = []

    for i in range(len(A)):
        terminos = []
        total = Fraction(0)

        for j in range(len(A[i])):
            producto = A[i][j] * solucion[j]
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
                "cumple": total == b[i],
            }
        )

    return comprobaciones


def resolver_sistema(A, b):
    """Coordina los métodos y devuelve todos los datos para la interfaz."""
    validar_sistema(A, b)
    numero_variables = len(A[0])
    matriz_inicial = construir_matriz_aumentada(A, b)

    matriz_escalonada, pasos_gauss = aplicar_gauss(A, b)
    rango_A, rango_aumentada = calcular_rangos(
        matriz_escalonada, numero_variables
    )
    matriz_rref, pasos_jordan = aplicar_gauss_jordan(matriz_escalonada)

    resultado = {
        "A": A,
        "b": b,
        "numero_ecuaciones": len(A),
        "numero_variables": numero_variables,
        "matriz_inicial": matriz_inicial,
        "matriz_escalonada": matriz_escalonada,
        "matriz_rref": matriz_rref,
        "pasos_gauss": pasos_gauss,
        "pasos_jordan": pasos_jordan,
        "rango_A": rango_A,
        "rango_aumentada": rango_aumentada,
    }

    # La desigualdad de rangos identifica inmediatamente una contradicción.
    if rango_A < rango_aumentada:
        resultado["tipo"] = "inconsistente"
        resultado["clasificacion"] = "Sistema inconsistente: no tiene solución"
        resultado["conclusion"] = (
            "El rango de A es menor que el rango de la matriz aumentada. "
            "Aparece una ecuación imposible, por lo tanto el sistema no tiene solución."
        )
        resultado["fila_contradiccion"] = buscar_contradiccion(
            matriz_escalonada, numero_variables
        )
        return resultado

    variables_libres, expresiones_gauss, pasos_sustitucion = (
        resolver_desde_escalonada(matriz_escalonada, numero_variables)
    )
    expresiones_rref = construir_expresiones_rref(
        matriz_rref, numero_variables, variables_libres
    )
    solucion_particular = obtener_solucion_particular(expresiones_rref)

    resultado["variables_libres"] = variables_libres
    resultado["expresiones_gauss"] = expresiones_gauss
    resultado["expresiones_rref"] = expresiones_rref
    resultado["pasos_sustitucion"] = pasos_sustitucion
    resultado["solucion_particular"] = solucion_particular
    resultado["comprobaciones"] = comprobar_solucion(
        A, b, solucion_particular
    )

    if rango_A == numero_variables:
        resultado["tipo"] = "unica"
        resultado["clasificacion"] = (
            "Sistema consistente determinado: solución única"
        )
        resultado["conclusion"] = (
            "Los rangos son iguales al número de variables. Cada variable tiene "
            "pivote y existe una sola solución."
        )
        resultado["solucion"] = solucion_particular
    else:
        resultado["tipo"] = "infinitas"
        resultado["clasificacion"] = (
            "Sistema consistente indeterminado: infinitas soluciones"
        )
        resultado["conclusion"] = (
            "Los rangos son iguales, pero menores que el número de variables. "
            "Existen variables libres y, por eso, el sistema tiene infinitas soluciones."
        )

    return resultado

