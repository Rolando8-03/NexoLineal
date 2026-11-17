"""Raíces con tablas de la misma ejecución y terminaciones diferenciadas."""

from decimal import Decimal as D
from fractions import Fraction as F
from .functions import Function, decimal
from ..linear.context import integer
from ...parsing.numbers import parse_number
from ...domain.models import InputError, DomainError


def settings(data):
    tx = parse_number(data.get("tolerancia_x", "1e-8"))
    tf = parse_number(data.get("tolerancia_f", "1e-8"))
    if not F(1, 10**24) <= tx <= 1 or not F(1, 10**24) <= tf <= 1:
        raise InputError("Las tolerancias deben estar entre 1e-24 y 1.")
    return (
        tx,
        tf,
        integer(data.get("max_iteraciones", 100), "Máximo de iteraciones", 1, 200),
    )


def roots(method, data, ctx):
    f = Function(data["expresion"], ctx)
    tx, tf, limit = settings(data)
    if f.binary_functions and min(tx, tf) < F(1, 10**12):
        raise InputError(
            "Las funciones trascendentales binarias requieren tolerancia ≥1e-12."
        )
    table = []
    warnings = []
    if f.binary_functions:
        warnings.append(
            "Trigonometría y constantes pi/e usan unas 15 cifras; el residual es aproximado."
        )
    result = {
        "expresion": f.expression,
        "metodo": method,
        "tolerancia_x": tx,
        "tolerancia_f": tf,
        "max_iteraciones": limit,
        "tabla": table,
        "cota_garantizada": None,
        "error_verdadero": None,
        "convergencia": False,
    }

    def finish(status, reason, x=None, fx=None):
        result.update(
            motivo_parada=reason, iteraciones=len(table), convergencia=status == "ok"
        )
        if x is not None:
            result.update(aproximacion=x, residual=abs(fx), valor_funcion=fx)
        return result, status, warnings

    def emit(row):
        table.append(row)
        ctx.emit(
            "iteracion_raiz",
            "Iteración " + str(len(table)) + " de " + method + ".",
            row,
        )
        ctx.progress(len(table) * 99 // limit)

    if method in ("biseccion", "falsa_posicion"):
        if f.polynomial is None:
            warnings.append(
                "La cota de intervalo es teórica: la evaluación aproximada de signos no certifica una cota de error verdadero."
            )
        a, b = parse_number(data["inferior"]), parse_number(data["superior"])
        if a >= b:
            raise InputError("El extremo inferior debe ser menor que el superior.")
        f.continuous(a, b)
        fa, fb = f.exact(a), f.exact(b)
        for x, fx in ((a, fa), (b, fb)):
            if fx == 0:
                result["cota_garantizada"] = F(0) if f.polynomial is not None else None
                return finish(
                    "ok",
                    (
                        "raiz_en_extremo"
                        if f.polynomial is not None
                        else "residual_cero_aproximado_en_extremo"
                    ),
                    x,
                    fx,
                )
        if (fa > 0) == (fb > 0):
            raise InputError("Se requiere cambio de signo en un intervalo continuo.")
        criterion = data.get(
            "criterio", "cota" if method == "biseccion" else "residual_y_paso"
        )
        result["criterio"] = criterion
        previous = None
        for k in range(1, limit + 1):
            ctx.tick()
            # La bisección conserva extremos y puntos medios racionales exactos.
            # Falsa posición redondea su nuevo punto a 40 cifras para acotar crecimiento.
            x = (
                (a + b) / 2
                if method == "biseccion"
                else F(
                    decimal(a)
                    - (
                        decimal(fa)
                        * (decimal(b) - decimal(a))
                        / (decimal(fb) - decimal(fa))
                    )
                )
            )
            if not a < x < b:
                return finish(
                    "stagnated",
                    "redondeo_sin_punto_interior",
                    previous if previous is not None else a,
                    f.exact(previous if previous is not None else a),
                )
            fx = f.exact(x)
            delta = abs(x - previous) if previous is not None else None
            bound = (b - a) / 2 if method == "biseccion" else max(x - a, b - x)
            certified = bound if f.polynomial is not None else None
            result["cota_garantizada"] = certified
            emit(
                {
                    "iteracion": k,
                    "a": a,
                    "b": b,
                    "fa": fa,
                    "fb": fb,
                    "x": x,
                    "fx": fx,
                    "residual": abs(fx),
                    "error_aproximado_absoluto": delta,
                    "cota_intervalo": bound,
                    "cota_garantizada": certified,
                }
            )
            passed = (
                bound <= tx
                if criterion == "cota"
                else (
                    abs(fx) <= tf
                    if criterion == "residual"
                    else abs(fx) <= tf
                    and (
                        bound <= tx
                        if criterion == "ambos"
                        else delta is not None and delta <= tx
                    )
                )
            )
            if fx == 0 or passed:
                if fx == 0 and f.polynomial is not None:
                    result["cota_garantizada"] = F(0)
                return finish(
                    "ok",
                    (
                        "raiz_exacta"
                        if fx == 0 and f.polynomial is not None
                        else "criterio_satisfecho"
                    ),
                    x,
                    fx,
                )
            if previous == x:
                return finish(
                    "stagnated", "punto_repetido_con_residual_no_suficiente", x, fx
                )
            if (fa > 0) == (fx > 0):
                a, fa = x, fx
            else:
                b, fb = x, fx
            previous = x
        return finish("iteration_limit", "maximo_de_iteraciones", x, fx)
    derivative = None
    if method == "newton":
        derivative, source = f.derivative(data.get("derivada"))
        result.update(derivada=derivative.expression, origen_derivada=source)
        if source == "proporcionada_por_usuario":
            warnings.append(
                "La derivada proporcionada se usa como dato; no se certifica su equivalencia simbólica con f."
            )
        x = decimal(data["inicial"])
        previous = None
    else:
        previous = decimal(data["anterior"])
        x = decimal(data["inicial"])
        if previous == x:
            raise InputError("Secante requiere dos semillas distintas.")
    criterion = data.get("criterio", "residual_y_paso")
    result["criterio"] = criterion
    fx = f.value(x)
    history = [x]
    if method == "secante" and f.value(previous) == 0:
        return finish(
            "ok", "residual_cero_en_primera_semilla", previous, f.value(previous)
        )
    if fx == 0:
        return finish("ok", "residual_cero_en_semilla", x, fx)
    if criterion == "residual" and abs(fx) <= decimal(tf):
        return finish("ok", "residual_inicial_suficiente", x, fx)
    for k in range(1, limit + 1):
        ctx.tick()
        try:
            if method == "newton":
                denominator = derivative.value(x)
                if denominator == 0:
                    return finish("breakdown", "derivada_nula", x, fx)
                next_x = x - fx / denominator
                formula = r"x_{k+1}=x_k-f(x_k)/f\prime(x_k)"
                extra = {"derivada_x": denominator}
            else:
                old_value = f.value(previous)
                denominator = fx - old_value
                if denominator == 0:
                    return finish("breakdown", "denominador_secante_nulo", x, fx)
                next_x = x - fx * (x - previous) / denominator
                formula = r"x_{k+1}=x_k-f(x_k)(x_k-x_{k-1})/(f(x_k)-f(x_{k-1}))"
                extra = {
                    "anterior": previous,
                    "f_anterior": old_value,
                    "denominador": denominator,
                }
            if abs(next_x) > D("1e100"):
                raise DomainError("El iterado excede 1e100.")
            next_f = f.value(next_x)
        except DomainError as e:
            return finish("domain_error", "evaluacion_no_admitida: " + str(e), x, fx)
        delta = abs(next_x - x)
        emit(
            {
                "iteracion": k,
                "x_anterior": x,
                "f_anterior_actual": fx,
                "x": next_x,
                "fx": next_f,
                "residual": abs(next_f),
                "error_aproximado_absoluto": delta,
                "formula": formula,
                **extra,
            }
        )
        if abs(next_f) <= decimal(tf) and (
            criterion == "residual" or delta <= decimal(tx)
        ):
            return finish("ok", "criterio_satisfecho", next_x, next_f)
        if next_x == x:
            return finish("stagnated", "precision_agotada", next_x, next_f)
        if next_x in history[-8:]:
            return finish("cycle_detected", "ciclo_detectado", next_x, next_f)
        previous, x, fx = x, next_x, next_f
        history.append(x)
    return finish("iteration_limit", "maximo_de_iteraciones", x, fx)
