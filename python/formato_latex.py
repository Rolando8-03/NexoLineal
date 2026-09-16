"""Formato LaTeX para los resultados matemáticos de NexoLineal."""

from fractions import Fraction


# ============================================================
# CONVERSIÓN DE NÚMEROS
# ============================================================

def convertir_fraction(valor):
    """
    Convierte un valor a Fraction para poder formatearlo.

    Acepta:
    - Fraction
    - int
    - float
    - str
    """

    if isinstance(valor, Fraction):
        return valor

    texto = str(valor).strip().replace(",", ".")

    return Fraction(
        texto
    )


def numero_latex(valor):
    """
    Representa enteros y fracciones utilizando LaTeX.

    Ejemplos:

        3     -> 3
        -2    -> -2
        1/2   -> \\frac{1}{2}
        -3/4  -> -\\frac{3}{4}
    """

    valor = convertir_fraction(
        valor
    )

    if valor.denominator == 1:

        return str(
            valor.numerator
        )

    signo = (
        "-"
        if valor < 0
        else ""
    )

    return (
        signo
        + r"\frac{"
        + str(
            abs(
                valor.numerator
            )
        )
        + "}{"
        + str(
            valor.denominator
        )
        + "}"
    )


def numero_absoluto_latex(
    valor
):
    """Representa el valor absoluto de un número."""

    valor = abs(
        convertir_fraction(
            valor
        )
    )

    return numero_latex(
        valor
    )


# ============================================================
# BLOQUES MATEMÁTICOS
# ============================================================

def bloque_latex(
    contenido
):
    """
    Coloca una expresión dentro de un bloque
    matemático Markdown/LaTeX.
    """

    return (
        "$$\n"
        + contenido
        + "\n$$"
    )


# ============================================================
# MATRICES
# ============================================================

def matriz_normal_latex(
    matriz
):
    """
    Construye una matriz normal.

    Ejemplo:

        [ 1  2 ]
        [ 3  4 ]
    """

    if not matriz:
        return r"\begin{pmatrix}\end{pmatrix}"

    filas_latex = []

    for fila in matriz:

        valores = [
            numero_latex(
                valor
            )
            for valor in fila
        ]

        filas_latex.append(
            " & ".join(
                valores
            )
        )

    contenido = (
        r" \\ ".join(
            filas_latex
        )
    )

    return (
        r"\begin{pmatrix}"
        + contenido
        + r"\end{pmatrix}"
    )


def matriz_corchetes_latex(
    matriz
):
    """
    Construye una matriz utilizando corchetes.
    """

    if not matriz:
        return r"\left[\begin{array}{}\end{array}\right]"

    numero_columnas = len(
        matriz[0]
    )

    columnas = (
        "c"
        * numero_columnas
    )

    filas_latex = []

    for fila in matriz:

        filas_latex.append(
            " & ".join(
                numero_latex(
                    valor
                )
                for valor in fila
            )
        )

    return (
        r"\left[\begin{array}{"
        + columnas
        + "}"
        + r" \\ ".join(
            filas_latex
        )
        + r"\end{array}\right]"
    )


def matriz_aumentada_latex(
    matriz,
    numero_variables
):
    """
    Construye una matriz aumentada:

        [A | b]

    colocando una separación vertical antes
    de la columna de términos independientes.
    """

    columnas = (
        "c"
        * numero_variables
        + "|c"
    )

    filas_latex = []

    for fila in matriz:

        valores = [
            numero_latex(
                valor
            )
            for valor in fila
        ]

        filas_latex.append(
            " & ".join(
                valores
            )
        )

    contenido = (
        r" \\ ".join(
            filas_latex
        )
    )

    return (
        r"\left[\begin{array}{"
        + columnas
        + "}"
        + contenido
        + r"\end{array}\right]"
    )


def matriz_latex(
    matriz,
    numero_variables=None
):
    """
    Función compatible con el NexoLineal original.

    Si se proporciona numero_variables,
    se interpreta como matriz aumentada.

    Si es None, se genera una matriz normal.
    """

    if numero_variables is None:

        return matriz_corchetes_latex(
            matriz
        )

    return matriz_aumentada_latex(
        matriz,
        numero_variables
    )


# ============================================================
# VECTORES
# ============================================================

def vector_latex(
    vector
):
    """
    Representa un vector columna.

    Ejemplo:

        (1, 2, 3)

    se muestra como:

        [1]
        [2]
        [3]
    """

    contenido = (
        r" \\ ".join(
            numero_latex(
                valor
            )
            for valor in vector
        )
    )

    return (
        r"\begin{pmatrix}"
        + contenido
        + r"\end{pmatrix}"
    )


def vector_fila_latex(
    vector
):
    """Representa un vector como vector fila."""

    contenido = (
        " & ".join(
            numero_latex(
                valor
            )
            for valor in vector
        )
    )

    return (
        r"\begin{pmatrix}"
        + contenido
        + r"\end{pmatrix}"
    )


# ============================================================
# ECUACIONES LINEALES
# ============================================================

def ecuacion_latex(
    coeficientes,
    independiente
):
    """
    Convierte una fila de coeficientes
    en una ecuación lineal.

    Ejemplo:

        [2, -1, 3], 5

    produce:

        2x_1-x_2+3x_3=5
    """

    izquierda = ""

    for columna, coeficiente in enumerate(
        coeficientes
    ):

        coeficiente = convertir_fraction(
            coeficiente
        )

        if coeficiente == 0:
            continue

        magnitud = abs(
            coeficiente
        )

        variable = (
            f"x_{{{columna + 1}}}"
        )

        if magnitud == 1:

            termino = variable

        else:

            termino = (
                numero_latex(
                    magnitud
                )
                + variable
            )

        if izquierda == "":

            izquierda = (
                "-"
                if coeficiente < 0
                else ""
            ) + termino

        elif coeficiente < 0:

            izquierda += (
                "-"
                + termino
            )

        else:

            izquierda += (
                "+"
                + termino
            )

    if izquierda == "":
        izquierda = "0"

    return (
        izquierda
        + "="
        + numero_latex(
            independiente
        )
    )


def sistema_latex(
    A,
    b
):
    """
    Presenta un sistema completo utilizando
    una llave de ecuaciones.
    """

    ecuaciones = []

    for fila in range(
        len(A)
    ):

        ecuaciones.append(
            ecuacion_latex(
                A[fila],
                b[fila]
            )
        )

    return (
        r"\begin{cases}"
        + r" \\ ".join(
            ecuaciones
        )
        + r"\end{cases}"
    )


# ============================================================
# ECUACIÓN MATRICIAL
# ============================================================

def vector_variables_latex(
    cantidad_variables,
    simbolo="x"
):
    """
    Construye:

        x = (x1, x2, ..., xn)^T
    """

    variables = [
        f"{simbolo}_{{{i + 1}}}"
        for i in range(
            cantidad_variables
        )
    ]

    return (
        r"\begin{pmatrix}"
        + r" \\ ".join(
            variables
        )
        + r"\end{pmatrix}"
    )


def ecuacion_matricial_latex(
    A,
    b,
    simbolo="x"
):
    """
    Representa:

        Ax = b
    """

    numero_variables = len(
        A[0]
    )

    return (
        matriz_normal_latex(
            A
        )
        + vector_variables_latex(
            numero_variables,
            simbolo
        )
        + "="
        + vector_latex(
            b
        )
    )


# ============================================================
# ECUACIÓN VECTORIAL
# ============================================================

def obtener_columnas(
    matriz
):
    """Devuelve las columnas de una matriz como vectores."""

    if not matriz:
        return []

    numero_filas = len(
        matriz
    )

    numero_columnas = len(
        matriz[0]
    )

    return [
        [
            matriz[fila][columna]
            for fila in range(
                numero_filas
            )
        ]
        for columna in range(
            numero_columnas
        )
    ]


def ecuacion_vectorial_latex(
    A,
    b,
    simbolo="x"
):
    """
    Convierte:

        Ax = b

    en:

        x1*a1 + x2*a2 + ... + xn*an = b

    donde ai son las columnas de A.
    """

    columnas = obtener_columnas(
        A
    )

    terminos = []

    for indice, columna in enumerate(
        columnas
    ):

        termino = (
            f"{simbolo}_{{{indice + 1}}}"
            + vector_latex(
                columna
            )
        )

        terminos.append(
            termino
        )

    return (
        "+".join(
            terminos
        )
        + "="
        + vector_latex(
            b
        )
    )


# ============================================================
# COMBINACIÓN LINEAL
# ============================================================

def combinacion_lineal_latex(
    vectores,
    b=None,
    simbolo="c"
):
    """
    Construye:

        c1*v1 + c2*v2 + ... + ck*vk

    Si se proporciona b:

        c1*v1 + ... + ck*vk = b
    """

    terminos = []

    for indice, vector in enumerate(
        vectores
    ):

        terminos.append(
            f"{simbolo}_{{{indice + 1}}}"
            + vector_latex(
                vector
            )
        )

    expresion = (
        "+".join(
            terminos
        )
    )

    if b is not None:

        expresion += (
            "="
            + vector_latex(
                b
            )
        )

    return expresion


def combinacion_con_coeficientes_latex(
    vectores,
    coeficientes,
    resultado=None
):
    """
    Muestra una combinación utilizando
    coeficientes ya conocidos.

    Ejemplo:

        2v1 - v2 + 3v3 = b
    """

    terminos = []

    for indice, vector in enumerate(
        vectores
    ):

        coeficiente = convertir_fraction(
            coeficientes[indice]
        )

        if coeficiente == 0:
            continue

        magnitud = abs(
            coeficiente
        )

        vector_tex = vector_latex(
            vector
        )

        if magnitud == 1:

            termino = vector_tex

        else:

            termino = (
                r"\left("
                + numero_latex(
                    magnitud
                )
                + r"\right)"
                + vector_tex
            )

        if not terminos:

            if coeficiente < 0:

                termino = (
                    "-"
                    + termino
                )

        else:

            termino = (
                "-"
                + termino
                if coeficiente < 0
                else "+"
                + termino
            )

        terminos.append(
            termino
        )

    expresion = (
        "".join(
            terminos
        )
        if terminos
        else vector_latex(
            [
                0
                for _ in range(
                    len(vectores[0])
                )
            ]
        )
    )

    if resultado is not None:

        expresion += (
            "="
            + vector_latex(
                resultado
            )
        )

    return expresion


# ============================================================
# RELACIÓN DE DEPENDENCIA
# ============================================================

def relacion_dependencia_latex(
    vectores,
    coeficientes
):
    """
    Representa una relación no trivial:

        c1*v1 + ... + ck*vk = 0
    """

    dimension = len(
        vectores[0]
    )

    cero = [
        0
        for _ in range(
            dimension
        )
    ]

    return combinacion_con_coeficientes_latex(
        vectores,
        coeficientes,
        cero
    )


# ============================================================
# SOLUCIONES PARAMÉTRICAS
# ============================================================

def expresion_latex(
    variable,
    expresion,
    variables_libres
):
    """
    Escribe una variable básica o libre
    en términos de parámetros.
    """

    constante = convertir_fraction(
        expresion[
            "constante"
        ]
    )

    terminos = expresion[
        "terminos"
    ]

    derecha = ""

    if (
        constante != 0
        or not terminos
    ):

        derecha = numero_latex(
            constante
        )

    for libre in variables_libres:

        clave = libre

        # Después de serializar JSON algunas claves
        # pueden llegar como strings.
        if clave not in terminos:

            clave = str(
                libre
            )

        if clave not in terminos:
            continue

        coeficiente = convertir_fraction(
            terminos[
                clave
            ]
        )

        parametro = (
            f"t_{{{variables_libres.index(libre) + 1}}}"
        )

        magnitud = abs(
            coeficiente
        )

        termino = (
            parametro
            if magnitud == 1
            else
            numero_latex(
                magnitud
            )
            + parametro
        )

        if derecha == "":

            derecha = (
                "-"
                if coeficiente < 0
                else ""
            ) + termino

        elif coeficiente < 0:

            derecha += (
                "-"
                + termino
            )

        else:

            derecha += (
                "+"
                + termino
            )

    if derecha == "":
        derecha = "0"

    return (
        f"x_{{{variable + 1}}}"
        + "="
        + derecha
    )


def lista_soluciones_latex(
    expresiones,
    variables_libres
):
    """Agrupa todas las variables de una solución."""

    lineas = []

    for variable, expresion in enumerate(
        expresiones
    ):

        lineas.append(
            expresion_latex(
                variable,
                expresion,
                variables_libres
            )
        )

    return (
        r"\begin{aligned}"
        + r" \\ ".join(
            lineas
        )
        + r"\end{aligned}"
    )


# ============================================================
# OPERACIONES ELEMENTALES POR FILAS
# ============================================================

def operacion_latex(
    operacion
):
    """Convierte una operación elemental en LaTeX."""

    tipo = operacion[
        "tipo"
    ]

    if tipo == "inicial":

        return r"[A\mid b]"

    if tipo == "inicial_matriz":

        return r"A"

    if tipo == "retomar":

        return (
            r"\text{Se retoma la matriz escalonada "
            r"obtenida con Gauss.}"
        )

    if tipo == "pivote":

        fila = (
            int(
                operacion[
                    "fila"
                ]
            )
            + 1
        )

        columna = (
            int(
                operacion[
                    "columna"
                ]
            )
            + 1
        )

        valor = numero_latex(
            operacion[
                "valor"
            ]
        )

        nombre_columna = (
            "la columna aumentada"
            if operacion.get(
                "aumentada"
            )
            else
            f"la columna {columna}"
        )

        return (
            rf"p={valor},\quad "
            rf"\text{{pivote seleccionado en "
            rf"{nombre_columna}, fila }}F_{{{fila}}}"
        )

    if tipo == "intercambio":

        fila_a = (
            int(
                operacion[
                    "fila_a"
                ]
            )
            + 1
        )

        fila_b = (
            int(
                operacion[
                    "fila_b"
                ]
            )
            + 1
        )

        return (
            rf"F_{{{fila_a}}}"
            rf"\leftrightarrow "
            rf"F_{{{fila_b}}}"
        )

    if tipo == "mcm":

        fila = (
            int(
                operacion[
                    "fila"
                ]
            )
            + 1
        )

        multiplo = operacion[
            "multiplo"
        ]

        return (
            rf"\operatorname{{mcm}}={multiplo},"
            rf"\qquad "
            rf"F_{{{fila}}}"
            rf"\leftarrow "
            rf"{multiplo}F_{{{fila}}}"
        )

    if tipo == "normalizacion":

        fila = (
            int(
                operacion[
                    "fila"
                ]
            )
            + 1
        )

        constante = numero_latex(
            operacion[
                "constante"
            ]
        )

        return (
            rf"F_{{{fila}}}"
            rf"\leftarrow "
            rf"\left({constante}\right)"
            rf"F_{{{fila}}}"
        )

    if tipo == "combinacion":

        destino = (
            int(
                operacion[
                    "destino"
                ]
            )
            + 1
        )

        origen = (
            int(
                operacion[
                    "origen"
                ]
            )
            + 1
        )

        p = numero_latex(
            operacion[
                "p"
            ]
        )

        b = numero_latex(
            operacion[
                "b"
            ]
        )

        k_valor = convertir_fraction(
            operacion[
                "k"
            ]
        )

        k = numero_latex(
            k_valor
        )

        if k_valor < 0:

            fila_tex = (
                rf"F_{{{destino}}}"
                rf"\leftarrow "
                rf"F_{{{destino}}}"
                rf"-\left("
                + numero_latex(
                    abs(
                        k_valor
                    )
                )
                + rf"\right)"
                rf"F_{{{origen}}}"
            )

        else:

            fila_tex = (
                rf"F_{{{destino}}}"
                rf"\leftarrow "
                rf"F_{{{destino}}}"
                rf"+\left({k}\right)"
                rf"F_{{{origen}}}"
            )

        return (
            r"k=-\frac{b}{p}"
            + rf"=-\frac{{\left({b}\right)}}"
            + rf"{{\left({p}\right)}}"
            + rf"={k},\qquad "
            + fila_tex
        )

    return (
        r"\text{Operación elemental por filas}"
    )


# ============================================================
# PASOS DE GAUSS / GAUSS-JORDAN
# ============================================================

def pasos_latex(
    pasos,
    numero_variables=None,
    numero_inicial=1
):
    """
    Convierte una lista de operaciones por filas
    en Markdown con expresiones LaTeX.
    """

    partes = []

    for numero, paso in enumerate(
        pasos,
        start=numero_inicial
    ):

        partes.append(
            f"### Paso {numero}. "
            f"{paso['titulo']}\n"
        )

        partes.append(
            bloque_latex(
                operacion_latex(
                    paso[
                        "operacion"
                    ]
                )
            )
        )

        if paso[
            "mostrar_matriz"
        ]:

            if numero_variables is None:

                matriz_tex = (
                    matriz_corchetes_latex(
                        paso[
                            "matriz"
                        ]
                    )
                )

            else:

                matriz_tex = (
                    matriz_aumentada_latex(
                        paso[
                            "matriz"
                        ],
                        numero_variables
                    )
                )

            partes.append(
                bloque_latex(
                    matriz_tex
                )
            )

    return "\n\n".join(
        partes
    )


# ============================================================
# REGLA FILA-COLUMNA
# ============================================================

def paso_producto_latex(
    paso
):
    """
    Convierte el cálculo de una entrada del producto AB
    a una expresión LaTeX.

    Ejemplo:

        c_11 = 1(5) + 2(7) = 19
    """

    fila = (
        int(
            paso[
                "fila"
            ]
        )
        + 1
    )

    columna = (
        int(
            paso[
                "columna"
            ]
        )
        + 1
    )

    productos = []

    for termino in paso[
        "productos"
    ]:

        a = numero_latex(
            termino[
                "a"
            ]
        )

        b = numero_latex(
            termino[
                "b"
            ]
        )

        productos.append(
            rf"\left({a}\right)"
            rf"\left({b}\right)"
        )

    resultado = numero_latex(
        paso[
            "resultado"
        ]
    )

    return (
        rf"c_{{{fila}{columna}}}"
        + "="
        + "+".join(
            productos
        )
        + "="
        + resultado
    )


def pasos_producto_latex(
    pasos
):
    """
    Muestra el cálculo de cada entrada
    del producto matricial.
    """

    partes = []

    for paso in pasos:

        partes.append(
            bloque_latex(
                paso_producto_latex(
                    paso
                )
            )
        )

    return "\n\n".join(
        partes
    )


# ============================================================
# RESUMEN DE SISTEMAS
# ============================================================

def resumen_latex(
    resultado
):
    """
    Genera un resumen textual del sistema resuelto.
    """

    A = resultado[
        "A"
    ]

    b = resultado[
        "b"
    ]

    numero_variables = resultado[
        "numero_variables"
    ]

    texto = [
        f"# {resultado['clasificacion']}",

        "## Sistema original",

        bloque_latex(
            sistema_latex(
                A,
                b
            )
        ),

        "## Ecuación matricial",

        bloque_latex(
            ecuacion_matricial_latex(
                A,
                b
            )
        ),

        "## Ecuación vectorial",

        bloque_latex(
            ecuacion_vectorial_latex(
                A,
                b
            )
        ),

        "## Matriz aumentada",

        bloque_latex(
            matriz_aumentada_latex(
                resultado[
                    "matriz_inicial"
                ],
                numero_variables
            )
        ),

        "## Naturaleza del sistema",

        resultado[
            "naturaleza_sistema"
        ],

        "## Criterio de clasificación",

        bloque_latex(
            rf"\operatorname{{rango}}(A)="
            rf"{resultado['rango_A']},\qquad "
            rf"\operatorname{{rango}}([A\mid b])="
            rf"{resultado['rango_aumentada']},\qquad "
            rf"n={numero_variables}"
        ),

        resultado[
            "conclusion"
        ],

        "## Forma escalonada reducida",

        bloque_latex(
            matriz_aumentada_latex(
                resultado[
                    "matriz_rref"
                ],
                numero_variables
            )
        ),
    ]

    if resultado.get(
        "descripcion_homogenea"
    ):

        texto.extend(
            [
                "## Sistema homogéneo",
                resultado[
                    "descripcion_homogenea"
                ],
            ]
        )

    texto.extend(
        [
            "## Independencia de las columnas de A",
            resultado[
                "descripcion_columnas"
            ],
        ]
    )

    if resultado[
        "tipo"
    ] == "inconsistente":

        fila = resultado.get(
            "fila_contradiccion"
        )

        if fila is not None:

            contradiccion = resultado[
                "matriz_escalonada"
            ][
                fila
            ]

            texto.extend(
                [
                    "## Fila contradictoria",

                    bloque_latex(
                        matriz_aumentada_latex(
                            [
                                contradiccion
                            ],
                            numero_variables
                        )
                    ),

                    bloque_latex(
                        "0="
                        + numero_latex(
                            contradiccion[
                                -1
                            ]
                        )
                        + r",\qquad "
                        + numero_latex(
                            contradiccion[
                                -1
                            ]
                        )
                        + r"\neq0"
                    ),
                ]
            )

        return "\n\n".join(
            texto
        )

    variables_libres = resultado[
        "variables_libres"
    ]

    if resultado[
        "tipo"
    ] == "unica":

        texto.extend(
            [
                "## Solución",

                bloque_latex(
                    lista_soluciones_latex(
                        resultado[
                            "expresiones_rref"
                        ],
                        variables_libres
                    )
                ),
            ]
        )

    else:

        nombres = [
            f"x_{{{variable + 1}}}"
            for variable
            in variables_libres
        ]

        texto.extend(
            [
                "## Variables libres",

                bloque_latex(
                    r",\quad ".join(
                        nombres
                    )
                ),

                "## Solución paramétrica general",

                bloque_latex(
                    lista_soluciones_latex(
                        resultado[
                            "expresiones_rref"
                        ],
                        variables_libres
                    )
                ),

                (
                    "Cada parámetro puede tomar "
                    "cualquier valor real."
                ),
            ]
        )

    return "\n\n".join(
        texto
    )


# ============================================================
# PROCEDIMIENTO GAUSS-JORDAN
# ============================================================

def procedimiento_gauss_jordan_latex(
    resultado
):
    """Describe el procedimiento completo de Gauss-Jordan."""

    numero_variables = resultado[
        "numero_variables"
    ]

    pasos_gauss = resultado[
        "pasos_gauss"
    ]

    pasos_jordan = resultado[
        "pasos_jordan"
    ]

    introduccion = (
        "# Resolución por Gauss-Jordan\n\n"
        "Primero se aplica Gauss para formar ceros "
        "debajo de cada pivote. Después se continúa "
        "desde la matriz escalonada, convirtiendo los "
        "pivotes en uno y formando ceros arriba."
    )

    primera_parte = pasos_latex(
        pasos_gauss,
        numero_variables
    )

    segunda_parte = pasos_latex(
        pasos_jordan,
        numero_variables,
        numero_inicial=(
            len(
                pasos_gauss
            )
            + 1
        )
    )

    final = (
        "## Resultado de Gauss-Jordan\n\n"
        + bloque_latex(
            matriz_aumentada_latex(
                resultado[
                    "matriz_rref"
                ],
                numero_variables
            )
        )
    )

    return "\n\n".join(
        [
            introduccion,
            primera_parte,
            segunda_parte,
            final,
        ]
    )


# ============================================================
# PROCEDIMIENTO GAUSS
# ============================================================

def procedimiento_gauss_latex(
    resultado
):
    """Describe Gauss y la sustitución regresiva."""

    numero_variables = resultado[
        "numero_variables"
    ]

    texto = [
        "# Resolución por Gauss",

        (
            "Se forma una matriz escalonada creando ceros "
            "debajo de cada pivote. Después se utiliza "
            "sustitución regresiva desde la última ecuación."
        ),

        "## Matriz escalonada",

        bloque_latex(
            matriz_aumentada_latex(
                resultado[
                    "matriz_escalonada"
                ],
                numero_variables
            )
        ),
    ]

    if resultado[
        "tipo"
    ] == "inconsistente":

        fila = resultado[
            "fila_contradiccion"
        ]

        contradiccion = resultado[
            "matriz_escalonada"
        ][
            fila
        ]

        texto.extend(
            [
                "## Conclusión por Gauss",

                bloque_latex(
                    "0="
                    + numero_latex(
                        contradiccion[
                            -1
                        ]
                    )
                    + r",\qquad "
                    + numero_latex(
                        contradiccion[
                            -1
                        ]
                    )
                    + r"\neq0"
                ),
            ]
        )

        return "\n\n".join(
            texto
        )

    texto.append(
        "## Sustitución regresiva"
    )

    for numero, paso in enumerate(
        resultado[
            "pasos_sustitucion"
        ],
        start=1
    ):

        variable = paso[
            "variable"
        ]

        expresion = expresion_latex(
            variable,
            paso[
                "expresion"
            ],
            resultado[
                "variables_libres"
            ]
        )

        texto.append(
            f"**Sustitución {numero}.** "
            f"Se despeja $x_{{{variable + 1}}}$ "
            f"utilizando la fila {paso['fila'] + 1}."
        )

        texto.append(
            bloque_latex(
                expresion
            )
        )

    texto.extend(
        [
            "## Resultado obtenido con Gauss",

            bloque_latex(
                lista_soluciones_latex(
                    resultado[
                        "expresiones_gauss"
                    ],
                    resultado[
                        "variables_libres"
                    ]
                )
            ),
        ]
    )

    return "\n\n".join(
        texto
    )


# ============================================================
# COMPROBACIÓN DE SISTEMAS
# ============================================================

def comprobacion_latex(
    resultado
):
    """Muestra la sustitución de una solución en Ax=b."""

    if resultado[
        "tipo"
    ] == "inconsistente":

        return (
            "# Comprobación\n\n"
            "El sistema es inconsistente, por lo tanto "
            "no existe una solución que pueda comprobarse."
        )

    texto = [
        "# Comprobación en las ecuaciones originales"
    ]

    if resultado[
        "tipo"
    ] == "infinitas":

        texto.append(
            "Se comprueba la solución particular obtenida "
            "asignando cero a los parámetros libres."
        )

    for comprobacion in resultado[
        "comprobaciones"
    ]:

        partes = []

        for termino in comprobacion[
            "terminos"
        ]:

            coeficiente = convertir_fraction(
                termino[
                    "coeficiente"
                ]
            )

            if coeficiente == 0:
                continue

            valor = numero_latex(
                termino[
                    "valor"
                ]
            )

            magnitud = numero_latex(
                abs(
                    coeficiente
                )
            )

            producto_tex = (
                magnitud
                + r"\left("
                + valor
                + r"\right)"
            )

            if not partes:

                partes.append(
                    (
                        "-"
                        if coeficiente < 0
                        else ""
                    )
                    + producto_tex
                )

            elif coeficiente < 0:

                partes.append(
                    "-"
                    + producto_tex
                )

            else:

                partes.append(
                    "+"
                    + producto_tex
                )

        izquierda = (
            "".join(
                partes
            )
            if partes
            else "0"
        )

        total = numero_latex(
            comprobacion[
                "resultado"
            ]
        )

        esperado = numero_latex(
            comprobacion[
                "esperado"
            ]
        )

        simbolo = (
            r"\checkmark"
            if comprobacion[
                "cumple"
            ]
            else r"\times"
        )

        texto.append(
            f"## Ecuación "
            f"{comprobacion['ecuacion']}"
        )

        texto.append(
            bloque_latex(
                izquierda
                + "="
                + total
                + "="
                + esperado
                + r"\qquad "
                + simbolo
            )
        )

    if all(
        item[
            "cumple"
        ]
        for item in resultado[
            "comprobaciones"
        ]
    ):

        texto.append(
            "La solución satisface todas las ecuaciones "
            "del sistema original."
        )

    return "\n\n".join(
        texto
    )