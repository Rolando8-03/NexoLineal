"""Funciones de presentación para ecuaciones, matrices y resultados."""

TOLERANCIA = 1e-10
SUBINDICES = str.maketrans("0123456789-", "₀₁₂₃₄₅₆₇₈₉₋")


def subindice(numero):
    """Convierte 12 en ₁₂ para mostrar x₁₂ sin depender de LaTeX."""
    return str(numero).translate(SUBINDICES)


def aproximar_fraccion(valor, maximo_denominador=100):
    """Busca una fracción sencilla equivalente, sin usar librerías externas."""
    mejor_numerador = 0
    mejor_denominador = 1
    mejor_error = abs(valor)

    for denominador in range(1, maximo_denominador + 1):
        numerador = round(valor * denominador)
        error = abs(valor - numerador / denominador)
        if error < mejor_error:
            mejor_error = error
            mejor_numerador = numerador
            mejor_denominador = denominador

    if mejor_error < 1e-9 and mejor_denominador != 1:
        return f"{mejor_numerador}/{mejor_denominador}"
    return None


def formatear_numero(valor):
    """Muestra enteros, fracciones sencillas o decimales sin ruido numérico."""
    if abs(valor) < TOLERANCIA:
        return "0"

    entero = round(valor)
    if abs(valor - entero) < 1e-9:
        return str(entero)

    fraccion = aproximar_fraccion(valor)
    if fraccion is not None:
        return fraccion

    if abs(valor) >= 1_000_000 or abs(valor) < 0.0001:
        return f"{valor:.5e}"

    texto = f"{valor:.6f}".rstrip("0").rstrip(".")
    return "0" if texto == "-0" else texto


def formatear_matriz(matriz, columnas_coeficientes=None):
    """Representa una matriz con corchetes Unicode y separador de aumentada."""
    if not matriz:
        return "[]"

    textos = []
    anchos = [0] * len(matriz[0])
    for fila in matriz:
        fila_texto = []
        for j, valor in enumerate(fila):
            texto = formatear_numero(valor)
            fila_texto.append(texto)
            if len(texto) > anchos[j]:
                anchos[j] = len(texto)
        textos.append(fila_texto)

    lineas = []
    ultima = len(textos) - 1
    for i, fila in enumerate(textos):
        if len(textos) == 1:
            izquierda, derecha = "[", "]"
        elif i == 0:
            izquierda, derecha = "⎡", "⎤"
        elif i == ultima:
            izquierda, derecha = "⎣", "⎦"
        else:
            izquierda, derecha = "⎢", "⎥"

        celdas = []
        for j, texto in enumerate(fila):
            celdas.append(texto.rjust(anchos[j]))

        if columnas_coeficientes is not None:
            antes = "  ".join(celdas[:columnas_coeficientes])
            despues = "  ".join(celdas[columnas_coeficientes:])
            contenido = f" {antes} │ {despues} "
        else:
            contenido = " " + "  ".join(celdas) + " "

        lineas.append(izquierda + contenido + derecha)

    return "\n".join(lineas)


def formatear_ecuacion(coeficientes, independiente):
    """Convierte una fila de A y un valor de b en una ecuación legible."""
    partes = []

    for j, coeficiente in enumerate(coeficientes):
        if abs(coeficiente) < TOLERANCIA:
            continue

        magnitud = abs(coeficiente)
        variable = f"x{subindice(j + 1)}"
        if abs(magnitud - 1.0) < TOLERANCIA:
            termino = variable
        else:
            termino = f"{formatear_numero(magnitud)}{variable}"

        if not partes:
            partes.append(("-" if coeficiente < 0 else "") + termino)
        else:
            partes.append((" - " if coeficiente < 0 else " + ") + termino)

    izquierda = "".join(partes) if partes else "0"
    return f"{izquierda} = {formatear_numero(independiente)}"


def formatear_lista_ecuaciones(A, b):
    """Devuelve el sistema completo con una ecuación por línea."""
    lineas = []
    for i in range(len(A)):
        lineas.append(f"E{i + 1}:  {formatear_ecuacion(A[i], b[i])}")
    return "\n".join(lineas)


def formatear_expresion_parametrica(indice_variable, expresion, libres):
    """Presenta xi = constante + coeficientes por parámetros libres."""
    nombre = f"x{subindice(indice_variable + 1)}"
    constante = expresion["constante"]
    terminos = expresion["terminos"]
    partes = []

    if abs(constante) > TOLERANCIA or not terminos:
        partes.append(formatear_numero(constante))

    for columna_libre in libres:
        if columna_libre not in terminos:
            continue

        coeficiente = terminos[columna_libre]
        parametro = f"t{subindice(libres.index(columna_libre) + 1)}"
        magnitud = abs(coeficiente)
        termino = parametro if abs(magnitud - 1.0) < TOLERANCIA else (
            f"{formatear_numero(magnitud)}{parametro}"
        )

        if not partes:
            partes.append(("-" if coeficiente < 0 else "") + termino)
        else:
            partes.append((" - " if coeficiente < 0 else " + ") + termino)

    return f"{nombre} = {''.join(partes) if partes else '0'}"


def parsear_numero(texto):
    """Acepta enteros, decimales con punto/coma y fracciones como 3/4."""
    limpio = texto.strip().replace(",", ".")
    if not limpio:
        raise ValueError("hay una celda vacía")

    if "/" in limpio:
        partes = limpio.split("/")
        if len(partes) != 2:
            raise ValueError(f"'{texto}' no es una fracción válida")
        numerador = float(partes[0])
        denominador = float(partes[1])
        if abs(denominador) < TOLERANCIA:
            raise ValueError("el denominador no puede ser cero")
        return numerador / denominador

    return float(limpio)

