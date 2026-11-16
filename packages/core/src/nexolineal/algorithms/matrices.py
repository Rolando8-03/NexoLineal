"""Operaciones racionales compartidas por el núcleo y los adaptadores heredados."""
from fractions import Fraction
from ..parsing.numbers import parse_matrix, parse_number

def suma(A, B):
    A, B = parse_matrix(A), parse_matrix(B)
    if (len(A), len(A[0])) != (len(B), len(B[0])):
        raise ValueError("Suma y resta requieren matrices de las mismas dimensiones.")
    return [[a + b for a, b in zip(fa, fb)] for fa, fb in zip(A, B)]

def resta(A, B):
    return suma(A, escalar(B, -1))

def escalar(A, numero):
    value = parse_number(numero)
    return [[value * item for item in row] for row in parse_matrix(A)]

def transpuesta(A):
    A = parse_matrix(A)
    return [list(column) for column in zip(*A)]

def identidad(orden):
    if isinstance(orden, bool) or not isinstance(orden, int) or orden < 1:
        raise ValueError("El orden debe ser un entero positivo.")
    return [[Fraction(i == j) for j in range(orden)] for i in range(orden)]

def multiplicar_con_pasos(A, B, checkpoint=None, on_progress=None):
    """Fila por columna. Los pasos guardan los mismos sumandos usados al calcular."""
    A, B = parse_matrix(A), parse_matrix(B)
    if len(A[0]) != len(B):
        raise ValueError(
            f"No se puede multiplicar: Columnas de A [{len(A[0])}] ≠ Filas de B [{len(B)}]"
        )
    result, steps = [], []
    for i, row in enumerate(A):
        output = []
        for j in range(len(B[0])):
            if checkpoint is not None:
                checkpoint()
            terms = [{"a": a, "b": B[k][j], "producto": a * B[k][j]}
                     for k, a in enumerate(row)]
            total = sum((term["producto"] for term in terms), Fraction(0))
            output.append(total)
            steps.append({"fila": i, "columna": j, "terminos": terms, "resultado": total})
        result.append(output)
        if on_progress is not None:
            on_progress((i + 1) * 100 // len(A))
    return result, steps

def producto(A, B):
    return multiplicar_con_pasos(A, B)[0]
