"""Datos exactos, presupuestos y registro de pasos del álgebra lineal."""

from dataclasses import dataclass, field
from fractions import Fraction as F
import re
from ...domain.models import Step, InputError, ResourceLimitError
from ...parsing.numbers import parse_matrix, parse_number

MAX_DIMENSION = 20


class LinearFailure(ValueError):
    """El problema es válido, pero el método o la representación no son aplicables."""

    def __init__(self, status, message, details=None):
        super().__init__(message)
        self.status, self.details = status, details


@dataclass
class Context:
    checkpoint: object = None
    on_progress: object = None
    steps: list = field(default_factory=list)
    work: int = 0
    collect_steps: bool = True
    last_progress: int = 0

    def tick(self, amount=1):
        if self.checkpoint is not None:
            self.checkpoint()
        self.work += amount
        if self.work > 250000:
            raise ResourceLimitError(
                "El recorrido supera 250000 operaciones elementales."
            )

    def emit(self, kind, description, data, formula=""):
        self.tick()
        if not self.collect_steps:
            return
        if len(self.steps) >= 1200:
            raise ResourceLimitError("El procedimiento supera 1200 pasos.")
        # Las matrices se copian al registrar, antes de la siguiente operación de fila.
        self.steps.append(
            Step(len(self.steps), kind, description, freeze(data), formula)
        )

    def progress(self, value):
        if self.on_progress is not None:
            self.last_progress = max(self.last_progress, min(100, value))
            self.on_progress(self.last_progress)


def freeze(value):
    if isinstance(value, F):
        if max(value.numerator.bit_length(), value.denominator.bit_length()) > 12000:
            raise ResourceLimitError(
                "La aritmética supera el presupuesto de representación exacta."
            )
        return value
    if isinstance(value, dict):
        return {key: freeze(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [freeze(item) for item in value]
    return value


def matrix(value, square=False):
    data = parse_matrix(value, square=square)
    if len(data) > MAX_DIMENSION or len(data[0]) > MAX_DIMENSION:
        raise ResourceLimitError(
            "Las operaciones de esta área admiten hasta 20 filas y 20 columnas."
        )
    return data


def integer(value, name, minimum=None, maximum=None):
    if isinstance(value, bool) or not (
        type(value) is int
        or isinstance(value, str)
        and re.fullmatch(r"[+-]?[0-9]+", value.strip())
    ):
        raise InputError(name + " debe ser un entero.")
    result = int(value)
    if (
        minimum is not None
        and result < minimum
        or maximum is not None
        and result > maximum
    ):
        raise InputError(name + " está fuera del intervalo permitido.")
    return result


def vector(value, size=None):
    if isinstance(value, str):
        value = value.replace(";", " ").split()
    if (
        not isinstance(value, (list, tuple))
        or not value
        or any(isinstance(x, (list, tuple, dict)) for x in value)
    ):
        raise InputError(
            "Escribe un vector no vacío con componentes separadas por espacios."
        )
    if len(value) > MAX_DIMENSION:
        raise ResourceLimitError("El vector admite hasta 20 componentes.")
    result = [parse_number(x) for x in value]
    if size is not None and len(result) != size:
        raise InputError("El vector debe tener " + str(size) + " componentes.")
    return result


def family(value, ambient=None):
    """Una fila de entrada representa un vector; la familia vacía es válida."""
    if isinstance(value, str):
        value = [
            row.split() for row in value.replace(";", "\n").splitlines() if row.strip()
        ]
    if not isinstance(value, (list, tuple)):
        raise InputError("Los vectores deben formar una lista.")
    if len(value) > MAX_DIMENSION:
        raise ResourceLimitError("Se admiten hasta 20 vectores por familia.")
    result = [vector(row) for row in value]
    dimension = len(result[0]) if result else ambient
    if dimension is None:
        raise InputError("Indicá la dimensión ambiente cuando la familia esté vacía.")
    dimension = integer(dimension, "La dimensión ambiente", 1, MAX_DIMENSION)
    if (
        ambient is not None
        and dimension != ambient
        or any(len(v) != dimension for v in result)
    ):
        raise InputError("Los vectores deben pertenecer al mismo espacio ambiente.")
    return result, dimension


def columns(vectors, ambient):
    return [[v[i] for v in vectors] for i in range(ambient)]


def identity(n):
    return [[F(i == j) for j in range(n)] for i in range(n)]


def transpose(A):
    return [list(row) for row in zip(*A)] if A and A[0] else []


def dot(u, v, ctx=None):
    if len(u) != len(v):
        raise InputError("Las dimensiones de los vectores no coinciden.")
    if ctx is not None:
        ctx.tick(len(u))
    return freeze(sum((a * b for a, b in zip(u, v)), F(0)))


def matvec(A, v, ctx=None):
    return [dot(row, v, ctx) for row in A]


def multiply(A, B, ctx=None):
    if not A or not B or len(A[0]) != len(B):
        raise InputError("Las dimensiones no permiten el producto.")
    cols = transpose(B)
    return [[dot(row, col, ctx) for col in cols] for row in A]


def equal_shape(A, B):
    if len(A) != len(B) or len(A[0]) != len(B[0]):
        raise InputError("Las matrices deben tener las mismas dimensiones.")


def tex(value):
    value = F(value)
    if value.denominator == 1:
        return str(value.numerator)
    sign = "-" if value < 0 else ""
    return (
        sign
        + r"\frac{"
        + str(abs(value.numerator))
        + "}{"
        + str(value.denominator)
        + "}"
    )
