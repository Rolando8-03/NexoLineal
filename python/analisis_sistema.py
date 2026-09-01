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
        "A": [[str(v) for v in fila] for fila in A],
        "b": [str(v) for v in b],
        "numero_ecuaciones": len(A),
        "numero_variables": numero_variables,
        "matriz_inicial": [[str(v) for v in fila] for fila in matriz_inicial],
        "matriz_escalonada": [[str(v) for v in fila] for fila in matriz_escalonada],
        "matriz_rref": [[str(v) for v in fila] for fila in matriz_rref],
        "pasos_gauss": _serializar_pasos(pasos_gauss),
        "pasos_jordan": _serializar_pasos(pasos_jordan),
        "rango_A": rango_A,
        "rango_aumentada": rango_aumentada,
    }

    if rango_A < rango_aumentada:
        resultado["tipo"] = "inconsistente"
        resultado["clasificacion"] = "Sistema inconsistente: no tiene solución"
        resultado["conclusion"] = (
            "El rango de A es menor que el rango de la matriz aumentada. "
            "Aparece una ecuación imposible, por lo tanto el sistema no tiene solución."
        )
        fila_c = buscar_contradiccion(matriz_escalonada, numero_variables)
        resultado["fila_contradiccion"] = fila_c
        if fila_c is not None:
            resultado["fila_contradiccion_datos"] = [
                str(v) for v in matriz_escalonada[fila_c]
            ]
        return resultado

    variables_libres, expresiones_gauss, pasos_sustitucion = (
        resolver_desde_escalonada(matriz_escalonada, numero_variables)
    )
    expresiones_rref = construir_expresiones_rref(
        matriz_rref, numero_variables, variables_libres
    )
    solucion_particular = obtener_solucion_particular(expresiones_rref)

    resultado["variables_libres"] = variables_libres
    resultado["expresiones_gauss"] = _serializar_expresiones(expresiones_gauss)
    resultado["expresiones_rref"] = _serializar_expresiones(expresiones_rref)
    resultado["pasos_sustitucion"] = _serializar_sustitucion(pasos_sustitucion)
    resultado["solucion_particular"] = [str(v) for v in solucion_particular]
    resultado["comprobaciones"] = _serializar_comprobaciones(
        comprobar_solucion(A, b, solucion_particular)
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
        resultado["solucion"] = [str(v) for v in solucion_particular]
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


def _serializar_pasos(pasos):
    """Convierte pasos (con Fraction) a dicts con strings."""
    resultado = []
    for paso in pasos:
        p = {
            "titulo": paso["titulo"],
            "mostrar_matriz": paso["mostrar_matriz"],
            "operacion": _serializar_operacion(paso["operacion"]),
            "matriz": [[str(v) for v in fila] for fila in paso["matriz"]],
        }
        resultado.append(p)
    return resultado


def _serializar_operacion(op):
    """Convierte una operación con posibles Fraction a strings."""
    result = {}
    for k, v in op.items():
        if hasattr(v, "numerator"):
            result[k] = str(v)
        else:
            result[k] = v
    return result


def _serializar_expresiones(expresiones):
    """Convierte expresiones con Fraction a strings."""
    resultado = []
    for expr in expresiones:
        e = {
            "constante": str(expr["constante"]),
            "terminos": {str(k): str(v) for k, v in expr["terminos"].items()},
        }
        resultado.append(e)
    return resultado


def _serializar_sustitucion(pasos):
    """Serializa pasos de sustitución regresiva."""
    resultado = []
    for paso in pasos:
        p = {
            "fila": paso["fila"],
            "variable": paso["variable"],
            "expresion": {
                "constante": str(paso["expresion"]["constante"]),
                "terminos": {
                    str(k): str(v) for k, v in paso["expresion"]["terminos"].items()
                },
            },
        }
        resultado.append(p)
    return resultado


def _serializar_comprobaciones(comprobaciones):
    """Serializa comprobaciones con Fraction a strings."""
    resultado = []
    for comp in comprobaciones:
        c = {
            "ecuacion": comp["ecuacion"],
            "resultado": str(comp["resultado"]),
            "esperado": str(comp["esperado"]),
            "cumple": comp["cumple"],
            "terminos": [
                {
                    "coeficiente": str(t["coeficiente"]),
                    "valor": str(t["valor"]),
                    "producto": str(t["producto"]),
                }
                for t in comp["terminos"]
            ],
        }
        resultado.append(c)
    return resultado
