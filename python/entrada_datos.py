from fractions import Fraction

# ============================================================
# Conversión de números
# ============================================================

def convertir_numero(valor):
    """
    Convierte un dato ingresado por el usuario en un número exacto.

    Se utiliza Fraction para conservar resultados exactos.
    """

    if isinstance(valor, Fraction):
        return valor

    limpio = str(valor).strip().replace(",", ".")

    if limpio == "":
        raise ValueError("hay una celda vacía")

    try:
        return Fraction(limpio)

    except (ValueError, ZeroDivisionError):
        raise ValueError(
            f"'{valor}' no es un número válido"
        ) from None


# ============================================================
# Validación de dimensiones
# ============================================================

def validar_dimension(
    valor,
    nombre,
    minimo=1,
    maximo=6
):
    """
    Comprueba que una dimensión sea un número entero
    dentro del intervalo permitido.
    """

    try:
        dimension = int(
            str(valor).strip()
        )

    except (ValueError, TypeError):
        raise ValueError(
            f"{nombre} debe ser un número entero"
        ) from None

    if dimension < minimo or dimension > maximo:
        raise ValueError(
            f"{nombre} debe estar entre "
            f"{minimo} y {maximo}"
        )

    return dimension


# ============================================================
# Lectura de vectores desde celdas
# ============================================================

def leer_vector_celdas(
    textos,
    nombre="vector"
):
    """
    Convierte una lista de celdas en un vector.
    """

    if not isinstance(textos, list):
        raise ValueError(
            f"El {nombre} debe recibirse como una lista"
        )

    if not 1 <= len(textos) <= 6:
        raise ValueError(
            f"El {nombre} debe tener entre "
            "1 y 6 componentes"
        )

    vector = []

    for indice, texto in enumerate(textos):
        try:
            valor = convertir_numero(
                texto
            )

        except ValueError as error:
            raise ValueError(
                f"Error en {nombre}, "
                f"componente {indice + 1}: "
                f"{error}"
            ) from error

        vector.append(
            valor
        )

    return vector


# ============================================================
# Lectura de matrices desde cuadrículas
# ============================================================

def leer_matriz_celdas(
    textos,
    nombre="matriz"
):
    if not isinstance(textos, list):
        raise ValueError(
            f"La {nombre} debe recibirse "
            "como una lista de filas"
        )

    if not textos:
        raise ValueError(
            f"La {nombre} no puede estar vacía"
        )

    if not 1 <= len(textos) <= 6:
        raise ValueError(
            f"La {nombre} debe tener entre "
            "1 y 6 filas"
        )

    if not isinstance(textos[0], list):
        raise ValueError(
            f"La {nombre} debe contener filas"
        )

    if not textos[0]:
        raise ValueError(
            f"La {nombre} debe tener "
            "al menos una columna"
        )

    numero_columnas = len(
        textos[0]
    )

    if not 1 <= numero_columnas <= 6:
        raise ValueError(
            f"La {nombre} debe tener entre "
            "1 y 6 columnas"
        )

    matriz = []

    for i, fila_texto in enumerate(textos):

        if not isinstance(fila_texto, list):
            raise ValueError(
                f"La fila {i + 1} de la "
                f"{nombre} no es válida"
            )

        if len(fila_texto) != numero_columnas:
            raise ValueError(
                f"Todas las filas de la {nombre} "
                "deben tener la misma cantidad "
                "de columnas"
            )

        fila = []

        for j, texto in enumerate(fila_texto):

            try:
                valor = convertir_numero(
                    texto
                )

            except ValueError as error:
                raise ValueError(
                    f"Error en {nombre}, "
                    f"fila {i + 1}, "
                    f"columna {j + 1}: "
                    f"{error}"
                ) from error

            fila.append(
                valor
            )

        matriz.append(
            fila
        )

    return matriz


# ============================================================
# Validación general de matrices
# ============================================================

def validar_matriz(
    matriz,
    nombre="matriz"
):
    """
    Comprueba que una matriz exista y sea rectangular.

    Devuelve:
        filas, columnas
    """

    if not isinstance(matriz, list):
        raise ValueError(
            f"La {nombre} no es válida"
        )

    if not matriz:
        raise ValueError(
            f"La {nombre} no puede estar vacía"
        )

    if not isinstance(matriz[0], list):
        raise ValueError(
            f"La {nombre} debe contener filas"
        )

    if not matriz[0]:
        raise ValueError(
            f"La {nombre} debe tener "
            "al menos una columna"
        )

    numero_columnas = len(
        matriz[0]
    )

    for i, fila in enumerate(matriz):

        if not isinstance(fila, list):
            raise ValueError(
                f"La fila {i + 1} de la "
                f"{nombre} no es válida"
            )

        if len(fila) != numero_columnas:
            raise ValueError(
                f"Todas las filas de la {nombre} "
                "deben tener la misma cantidad "
                "de columnas"
            )

    return (
        len(matriz),
        numero_columnas,
    )


# ============================================================
# Sistemas lineales
# ============================================================

def validar_sistema(
    A,
    b
):
    """
    Verifica que A y b formen un sistema Ax = b válido.
    """

    filas, _ = validar_matriz(
        A,
        "matriz de coeficientes"
    )

    if not isinstance(b, list):
        raise ValueError(
            "El vector b no es válido"
        )

    if len(b) != filas:
        raise ValueError(
            "Debe existir un término independiente "
            "por cada ecuación"
        )


def leer_matriz_texto(
    textos_A,
    textos_b
):
    """
    Lee la matriz aumentada utilizada actualmente
    por la sección Sistemas lineales.

    La interfaz envía por separado:

        textos_A -> matriz de coeficientes
        textos_b -> términos independientes
    """

    A = leer_matriz_celdas(
        textos_A,
        "matriz de coeficientes"
    )

    b = leer_vector_celdas(
        textos_b,
        "vector b"
    )

    validar_sistema(
        A,
        b
    )

    return A, b