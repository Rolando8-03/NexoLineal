"""Simpson compuesto refinado, con cota racional certificada para polinomios."""

from fractions import Fraction as F
from .functions import Function
from ..linear.context import integer
from ...domain.models import InputError
from ...parsing.numbers import parse_number


def integrate(data, ctx):
    f = Function(data["expresion"], ctx)
    a, b = parse_number(data["inferior"]), parse_number(data["superior"])
    tolerance = parse_number(data.get("tolerancia", "1e-8"))
    if not F(1, 10**20) <= tolerance <= 1:
        raise InputError("Tolerancia de integración entre 1e-20 y 1.")
    max_n = integer(
        data.get("max_subintervalos", 1024), "Máximo de subintervalos", 4, 4096
    )
    if max_n & (max_n - 1):
        raise InputError("El máximo debe ser potencia de dos: 4,8,…,4096.")
    f.continuous(a, b)
    table = []
    if a == b:
        return (
            {
                "valor": F(0),
                "tabla": [],
                "motivo_parada": "intervalo_nulo",
                "convergencia": True,
                "cota_garantizada": F(0),
            },
            "ok",
            [],
        )
    derivative_bound = None
    if f.polynomial is not None:
        M = max(abs(a), abs(b))
        derivative_bound = sum(
            (
                abs(v) * k * (k - 1) * (k - 2) * (k - 3) * M ** (k - 4)
                for k, v in f.polynomial.items()
                if k >= 4
            ),
            F(0),
        )

    def simpson(n):
        h = (b - a) / n
        values = []
        for j in range(n + 1):
            ctx.tick()
            values.append(f.exact(a + j * h))
        return (
            h
            * (
                values[0]
                + values[-1]
                + 4 * sum(values[1:-1:2], F(0))
                + 2 * sum(values[2:-1:2], F(0))
            )
            / 3
        )

    previous = simpson(2)
    n = 4
    warnings = (
        []
        if derivative_bound is not None
        else [
            "La estimación por refinamiento no es una cota garantizada para esta función."
        ]
    )
    while n <= max_n:
        value = simpson(n)
        estimate = abs(value - previous) / 15
        bound = (
            abs(b - a) ** 5 * derivative_bound / (180 * n**4)
            if derivative_bound is not None
            else None
        )
        row = {
            "subintervalos": n,
            "valor": value,
            "estimacion_error_no_garantizada": estimate,
            "cota_garantizada": bound,
        }
        table.append(row)
        ctx.emit("simpson_refinado", f"Simpson compuesto con {n} subintervalos.", row)
        ctx.progress(n * 99 // max_n)
        result = {
            "valor": value,
            "tabla": table,
            "metodo": "simpson_compuesto_refinado",
            "tolerancia": tolerance,
            "subintervalos": n,
            "cota_garantizada": bound,
            "estimacion_error_no_garantizada": estimate,
            "cota_derivada_cuarta": derivative_bound,
            "expresion": data["expresion"],
        }
        if (bound if bound is not None else estimate) <= tolerance:
            return (
                {
                    **result,
                    "convergencia": True,
                    "motivo_parada": (
                        "cota_suficiente"
                        if bound is not None
                        else "estimacion_suficiente"
                    ),
                },
                "ok",
                warnings,
            )
        previous = value
        n *= 2
    return (
        {**result, "convergencia": False, "motivo_parada": "maximo_de_subintervalos"},
        "iteration_limit",
        warnings,
    )
