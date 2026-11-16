"""Conversión única de enteros, decimales y fracciones a Fraction."""
from fractions import Fraction
from decimal import Decimal
import math
import re
from ..domain.models import InputError, ResourceLimitError

def parse_number(value):
    if isinstance(value, bool) or value is None:
        raise InputError("Escribe un número.")
    if isinstance(value, Fraction):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise InputError("El número debe ser finito.")
        if value.is_integer() and abs(value) > 2**53-1:
            raise InputError("Envía los enteros grandes como texto para conservar su exactitud.")
    if isinstance(value, Decimal) and not value.is_finite():
        raise InputError("El decimal debe ser finito.")
    text = str(value).strip().replace(",", ".")
    if not text:
        raise InputError("hay una celda vacía")
    if len(text) > 1000:
        raise ResourceLimitError("El número supera 1000 caracteres.")
    exponent = re.search(r"[eE]([+-]?[0-9]+)$", text)
    if exponent and abs(int(exponent.group(1))) > 1000:
        raise ResourceLimitError("El exponente decimal supera el límite de 1000.")
    try:
        return Fraction(text)
    except (ValueError, ZeroDivisionError, OverflowError):
        raise InputError("'" + text + "' no es un número válido") from None

def parse_matrix(data, square=False):
    if isinstance(data, str):
        data = [row.split() for row in data.replace(";", "\n").splitlines() if row.strip()]
    if (not isinstance(data, (list, tuple)) or not data
            or not isinstance(data[0], (list, tuple)) or not data[0]):
        raise InputError("La matriz no puede estar vacía.")
    if any(not isinstance(row, (list, tuple)) or len(row) != len(data[0]) for row in data):
        raise InputError("Todas las filas deben tener la misma cantidad de elementos.")
    if square and len(data) != len(data[0]):
        raise InputError("La operación requiere una matriz cuadrada.")
    return [[parse_number(value) for value in row] for row in data]
