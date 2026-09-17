"""Lectura y validación de los datos ingresados por el usuario."""

from fractions import Fraction


def convertir_numero(texto):
    """Convierte enteros, decimales o fracciones en un valor exacto."""
    limpio = str(texto).strip().replace(",", ".")

    if limpio == "":
        raise ValueError("hay una celda vacía")

    try:
        return Fraction(limpio)
    except (ValueError, ZeroDivisionError):
        raise ValueError(f"'{texto}' no es un número válido") from None


def validar_dimension(texto, nombre, minimo=1, maximo=6):
    """Comprueba que una dimensión sea un entero dentro del límite permitido."""
    try:
        valor = int(str(texto).strip())
    except ValueError:
        raise ValueError(f"{nombre} debe ser un número entero") from None

    if valor < minimo or valor > maximo:
        raise ValueError(f"{nombre} debe estar entre {minimo} y {maximo}")

    return valor


def leer_matriz_texto(textos_A, textos_b):
    """Convierte las celdas de texto en la matriz A y el vector b."""
    A = []
    b = []

    for i in range(len(textos_A)):
        fila = []
        for j in range(len(textos_A[i])):
            try:
                fila.append(convertir_numero(textos_A[i][j]))
            except ValueError as error:
                raise ValueError(f"Error en la ecuación {i + 1}, x{j + 1}: {error}") from error

        try:
            termino = convertir_numero(textos_b[i])
        except ValueError as error:
            raise ValueError(
                f"Error en el término independiente de la ecuación {i + 1}: {error}"
            ) from error

        A.append(fila)
        b.append(termino)

    validar_sistema(A, b)
    return A, b


def validar_sistema(A, b):
    """Verifica que A y b describan un sistema rectangular válido."""
    if not A or not A[0]:
        raise ValueError("La matriz de coeficientes no puede estar vacía")

    if len(A) != len(b):
        raise ValueError("Debe existir un término independiente por ecuación")

    numero_columnas = len(A[0])
    for fila in A:
        if len(fila) != numero_columnas:
            raise ValueError("Todas las filas deben tener la misma cantidad de datos")

