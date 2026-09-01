"""Conversión de ecuaciones, matrices y resultados a Markdown con LaTeX."""


def numero_latex(valor):
    """Representa un entero o una fracción con notación LaTeX."""
    if valor.denominator == 1:
        return str(valor.numerator)

    signo = "-" if valor < 0 else ""
    return (
        signo
        + r"\frac{" + str(abs(valor.numerator)) + "}{" + str(valor.denominator) + "}"
    )


def bloque_latex(contenido):
    """Coloca una expresión en un bloque matemático independiente."""
    return "$$\n" + contenido + "\n$$"


def matriz_latex(matriz, numero_variables):
    """Construye una matriz aumentada con una separación antes de b."""
    columnas = "c" * numero_variables + "|c"
    filas = []

    for fila in matriz:
        valores = []
        for valor in fila:
            valores.append(numero_latex(valor))
        filas.append(" & ".join(valores))

    contenido = r" \\ ".join(filas)
    return (
        r"\left[\begin{array}{"
        + columnas
        + "}"
        + contenido
        + r"\end{array}\right]"
    )


def ecuacion_latex(coeficientes, independiente):
    """Convierte una fila de coeficientes en una ecuación."""
    izquierda = ""

    for columna, coeficiente in enumerate(coeficientes):
        if coeficiente == 0:
            continue

        magnitud = abs(coeficiente)
        variable = f"x_{{{columna + 1}}}"
        termino = variable if magnitud == 1 else numero_latex(magnitud) + variable

        if izquierda == "":
            izquierda = ("-" if coeficiente < 0 else "") + termino
        elif coeficiente < 0:
            izquierda += "-" + termino
        else:
            izquierda += "+" + termino

    if izquierda == "":
        izquierda = "0"

    return izquierda + "=" + numero_latex(independiente)


def sistema_latex(A, b):
    """Presenta todas las ecuaciones dentro de una llave de sistema."""
    ecuaciones = []
    for fila in range(len(A)):
        ecuaciones.append(ecuacion_latex(A[fila], b[fila]))

    return r"\begin{cases}" + r" \\ ".join(ecuaciones) + r"\end{cases}"


def expresion_latex(variable, expresion, variables_libres):
    """Escribe una variable básica o libre en términos de parámetros."""
    constante = expresion["constante"]
    terminos = expresion["terminos"]
    derecha = ""

    if constante != 0 or not terminos:
        derecha = numero_latex(constante)

    for libre in variables_libres:
        if libre not in terminos:
            continue

        coeficiente = terminos[libre]
        parametro = f"t_{{{variables_libres.index(libre) + 1}}}"
        magnitud = abs(coeficiente)
        termino = parametro if magnitud == 1 else numero_latex(magnitud) + parametro

        if derecha == "":
            derecha = ("-" if coeficiente < 0 else "") + termino
        elif coeficiente < 0:
            derecha += "-" + termino
        else:
            derecha += "+" + termino

    if derecha == "":
        derecha = "0"

    return f"x_{{{variable + 1}}}={derecha}"


def lista_soluciones_latex(expresiones, variables_libres):
    """Agrupa los valores o expresiones de todas las variables."""
    lineas = []

    for variable, expresion in enumerate(expresiones):
        lineas.append(expresion_latex(variable, expresion, variables_libres))

    return r"\begin{aligned}" + r" \\ ".join(lineas) + r"\end{aligned}"


def operacion_latex(operacion):
    """Explica en LaTeX una operación elemental registrada por el algoritmo."""
    tipo = operacion["tipo"]

    if tipo == "inicial":
        return r"[A\mid b]"

    if tipo == "retomar":
        return r"\text{Se retoma la matriz escalonada obtenida con Gauss.}"

    if tipo == "pivote":
        fila = operacion["fila"] + 1
        columna = operacion["columna"] + 1
        valor = numero_latex(operacion["valor"])
        nombre_columna = (
            "la columna aumentada"
            if operacion.get("aumentada")
            else f"la columna {columna}"
        )
        return (
            rf"p={valor},\quad \text{{menor valor absoluto no nulo disponible "
            rf"en {nombre_columna}, ubicado en }}F_{{{fila}}}"
        )

    if tipo == "intercambio":
        fila_a = operacion["fila_a"] + 1
        fila_b = operacion["fila_b"] + 1
        return rf"F_{{{fila_a}}}\leftrightarrow F_{{{fila_b}}}"

    if tipo == "mcm":
        fila = operacion["fila"] + 1
        multiplo = operacion["multiplo"]
        return (
            rf"\operatorname{{mcm}}={multiplo},\qquad "
            rf"F_{{{fila}}}\leftarrow {multiplo}F_{{{fila}}}"
        )

    if tipo == "normalizacion":
        fila = operacion["fila"] + 1
        constante = numero_latex(operacion["constante"])
        return rf"F_{{{fila}}}\leftarrow \left({constante}\right)F_{{{fila}}}"

    if tipo == "combinacion":
        destino = operacion["destino"] + 1
        origen = operacion["origen"] + 1
        p = numero_latex(operacion["p"])
        b = numero_latex(operacion["b"])
        k = numero_latex(operacion["k"])

        if operacion["k"] < 0:
            fila = (
                rf"F_{{{destino}}}\leftarrow F_{{{destino}}}"
                rf"-\left({numero_latex(abs(operacion['k']))}\right)F_{{{origen}}}"
            )
        else:
            fila = (
                rf"F_{{{destino}}}\leftarrow F_{{{destino}}}"
                rf"+\left({k}\right)F_{{{origen}}}"
            )

        return (
            r"k=-\frac{b}{p}"
            + rf"=-\frac{{\left({b}\right)}}{{\left({p}\right)}}={k},\qquad "
            + fila
        )

    return r"\text{Operación elemental por filas}"


def pasos_latex(pasos, numero_variables, numero_inicial=1):
    """Convierte una lista de pasos en una explicación Markdown."""
    partes = []

    for numero, paso in enumerate(pasos, start=numero_inicial):
        partes.append(f"### Paso {numero}. {paso['titulo']}\n")
        partes.append(bloque_latex(operacion_latex(paso["operacion"])))

        if paso["mostrar_matriz"]:
            partes.append(bloque_latex(matriz_latex(paso["matriz"], numero_variables)))

    return "\n\n".join(partes)


def resumen_latex(resultado):
    """Crea el resumen principal con clasificación y solución."""
    A = resultado["A"]
    b = resultado["b"]
    numero_variables = resultado["numero_variables"]
    texto = [
        f"# {resultado['clasificacion']}",
        "## Sistema original",
        bloque_latex(sistema_latex(A, b)),
        "## Matriz aumentada",
        bloque_latex(matriz_latex(resultado["matriz_inicial"], numero_variables)),
        "## Criterio de clasificación",
        bloque_latex(
            rf"\operatorname{{rango}}(A)={resultado['rango_A']},\qquad "
            rf"\operatorname{{rango}}([A\mid b])={resultado['rango_aumentada']},"
            rf"\qquad n={numero_variables}"
        ),
        resultado["conclusion"],
        "## Forma escalonada reducida",
        bloque_latex(matriz_latex(resultado["matriz_rref"], numero_variables)),
    ]

    if resultado["tipo"] == "inconsistente":
        fila = resultado["fila_contradiccion"]
        if fila is not None:
            contradiccion = resultado["matriz_escalonada"][fila]
            texto.extend(
                [
                    "## Fila contradictoria",
                    bloque_latex(matriz_latex([contradiccion], numero_variables)),
                    bloque_latex(
                        "0=" + numero_latex(contradiccion[-1]) + r",\qquad "
                        + numero_latex(contradiccion[-1])
                        + r"\neq 0"
                    ),
                ]
            )
        return "\n\n".join(texto)

    variables_libres = resultado["variables_libres"]

    if resultado["tipo"] == "unica":
        texto.extend(
            [
                "## Solución",
                bloque_latex(
                    lista_soluciones_latex(resultado["expresiones_rref"], variables_libres)
                ),
            ]
        )
    else:
        nombres = []
        for variable in variables_libres:
            nombres.append(f"x_{{{variable + 1}}}")

        texto.extend(
            [
                "## Variables libres",
                bloque_latex(r",\quad ".join(nombres)),
                "## Solución paramétrica general",
                bloque_latex(
                    lista_soluciones_latex(resultado["expresiones_rref"], variables_libres)
                ),
                "Cada parámetro puede tomar cualquier valor real.",
                "## Solución particular utilizada para comprobar",
                "Se asignó cero a cada parámetro libre:",
                bloque_latex(
                    lista_soluciones_latex(
                        [
                            {"constante": valor, "terminos": {}}
                            for valor in resultado["solucion_particular"]
                        ],
                        [],
                    )
                ),
            ]
        )

    return "\n\n".join(texto)


def procedimiento_gauss_jordan_latex(resultado):
    """Describe el recorrido completo desde [A|b] hasta la forma reducida."""
    numero_variables = resultado["numero_variables"]
    pasos_gauss = resultado["pasos_gauss"]
    pasos_jordan = resultado["pasos_jordan"]

    introduccion = (
        "# Resolución por Gauss-Jordan\n\n"
        "Primero se aplica Gauss para formar ceros debajo de cada pivote. "
        "Después se continúa desde la matriz escalonada, convirtiendo los pivotes "
        "en uno y formando ceros arriba."
    )

    primera_parte = pasos_latex(pasos_gauss, numero_variables)
    segunda_parte = pasos_latex(
        pasos_jordan, numero_variables, numero_inicial=len(pasos_gauss) + 1
    )
    final = (
        "## Resultado de Gauss-Jordan\n\n"
        + bloque_latex(matriz_latex(resultado["matriz_rref"], numero_variables))
    )

    return "\n\n".join([introduccion, primera_parte, segunda_parte, final])


def procedimiento_gauss_latex(resultado):
    """Retoma la matriz escalonada y explica la sustitución regresiva."""
    numero_variables = resultado["numero_variables"]
    texto = [
        "# Resolución por Gauss",
        (
            "Retomamos la matriz en el punto donde ya existen ceros debajo de los "
            "pivotes. El método de Gauss termina el escalonamiento aquí y continúa "
            "desde la última ecuación hacia la primera."
        ),
        "## Matriz escalonada",
        bloque_latex(matriz_latex(resultado["matriz_escalonada"], numero_variables)),
    ]

    if resultado["tipo"] == "inconsistente":
        fila = resultado["fila_contradiccion"]
        contradiccion = resultado["matriz_escalonada"][fila]
        texto.extend(
            [
                "## Conclusión por Gauss",
                bloque_latex(
                    "0=" + numero_latex(contradiccion[-1]) + r",\qquad "
                    + numero_latex(contradiccion[-1])
                    + r"\neq 0"
                ),
                "La sustitución regresiva no puede continuar porque la fila es contradictoria.",
            ]
        )
        return "\n\n".join(texto)

    texto.append("## Sustitución regresiva")
    for numero, paso in enumerate(resultado["pasos_sustitucion"], start=1):
        variable = paso["variable"]
        expresion = expresion_latex(
            variable, paso["expresion"], resultado["variables_libres"]
        )
        texto.append(
            f"**Sustitución {numero}.** Se despeja $x_{{{variable + 1}}}$ usando la "
            f"fila {paso['fila'] + 1}."
        )
        texto.append(bloque_latex(expresion))

    texto.extend(
        [
            "## Resultado obtenido con Gauss",
            bloque_latex(
                lista_soluciones_latex(
                    resultado["expresiones_gauss"], resultado["variables_libres"]
                )
            ),
        ]
    )
    return "\n\n".join(texto)


def comprobacion_latex(resultado):
    """Presenta la sustitución de una solución en las ecuaciones originales."""
    if resultado["tipo"] == "inconsistente":
        return (
            "# Comprobación\n\n"
            "El sistema es inconsistente, por lo tanto no existe una solución que "
            "pueda sustituirse en todas las ecuaciones."
        )

    texto = ["# Comprobación en las ecuaciones originales"]

    if resultado["tipo"] == "infinitas":
        texto.append(
            "Se comprueba la solución particular obtenida al asignar cero a las "
            "variables libres."
        )

    for comprobacion in resultado["comprobaciones"]:
        partes = []
        for termino in comprobacion["terminos"]:
            coeficiente = termino["coeficiente"]
            if coeficiente == 0:
                continue

            magnitud = numero_latex(abs(coeficiente))
            valor = numero_latex(termino["valor"])
            producto = magnitud + r"\left(" + valor + r"\right)"

            if not partes:
                partes.append(("-" if coeficiente < 0 else "") + producto)
            elif coeficiente < 0:
                partes.append("-" + producto)
            else:
                partes.append("+" + producto)

        izquierda = "".join(partes) if partes else "0"
        total = numero_latex(comprobacion["resultado"])
        esperado = numero_latex(comprobacion["esperado"])
        simbolo = r"\checkmark" if comprobacion["cumple"] else r"\times"

        texto.append(f"## Ecuación {comprobacion['ecuacion']}")
        texto.append(
            bloque_latex(
                izquierda + "=" + total + "=" + esperado + r"\qquad " + simbolo
            )
        )

    if all(item["cumple"] for item in resultado["comprobaciones"]):
        texto.append("La solución satisface todas las ecuaciones del sistema original.")

    return "\n\n".join(texto)
