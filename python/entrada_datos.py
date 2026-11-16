"""Valida las celdas y convierte enteros, decimales y fracciones.
Prepara las matrices y vectores para los métodos de Álgebra Lineal.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

from nexolineal.parsing.numbers import parse_number


def convertir_numero(texto):
    """Conserva la firma recibida y delega la conversión exacta."""
    return parse_number(texto)

def validar_dimension(texto, nombre, minimo=1, maximo=6):
    """Comprueba que una dimensión sea un entero dentro del límite permitido. Recibe texto, nombre, minimo, maximo."""
    try:
        valor = int(str(texto).strip())
    except ValueError:
        raise ValueError(f"{nombre} debe ser un número entero") from None

    if valor < minimo or valor > maximo:
        raise ValueError(f"{nombre} debe estar entre {minimo} y {maximo}")

    return valor


def leer_matriz_texto(textos_A, textos_b):
    """Convierte las celdas de texto en la matriz A y el vector b. Recibe textos_A, textos_b."""
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
    """Verifica que A y b describan un sistema rectangular válido. Recibe A, b."""
    if not A or not A[0]:
        raise ValueError("La matriz de coeficientes no puede estar vacía")

    if len(A) != len(b):
        raise ValueError("Debe existir un término independiente por ecuación")

    numero_columnas = len(A[0])
    for fila in A:
        if len(fila) != numero_columnas:
            raise ValueError("Todas las filas deben tener la misma cantidad de datos")

