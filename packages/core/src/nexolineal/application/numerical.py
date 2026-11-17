"""Fachada del contrato numérico: una ejecución alimenta tablas y resultado."""

from decimal import localcontext, Underflow
from ..algorithms.numerical.functions import Function, PRECISION
from ..algorithms.numerical.roots import roots
from ..algorithms.numerical.iterative import iterative
from ..algorithms.numerical.tools import errors, convert, sets
from ..algorithms.numerical.integration import integrate
from ..algorithms import calculo
from ..domain.models import CalculationResult
from ..parsing.numbers import parse_number

MESSAGES = {
    "iteration_limit": "Se alcanzó el máximo configurado sin satisfacer el criterio.",
    "stagnated": "El método se estancó sin satisfacer el criterio.",
    "breakdown": "No se puede efectuar la división requerida por el método.",
    "cycle_detected": "Se detectó repetición de iterados: el cálculo se detuvo.",
    "domain_error": "Un iterado o evaluación queda fuera del dominio admitido.",
}


def execute_numerical(problem, ctx):
    ctx.collect_steps = problem.options.get("include_steps", True)
    op, data = problem.operation_id, problem.input
    status = "ok"
    warnings = []
    exact = False
    with localcontext() as arithmetic:
        arithmetic.prec = PRECISION
        arithmetic.traps[Underflow] = True
        if op.startswith("raices."):
            result, status, warnings = roots(op.split(".")[1], data, ctx)
        elif op.startswith("iterativos."):
            result, status, warnings = iterative(op.split(".")[1], data, ctx)
        elif op == "errores.calcular":
            result = errors(data, ctx)
            exact = True
        elif op == "conversiones.bases":
            result = convert(data, ctx)
            exact = result["exacta"]
        elif op == "conjuntos.operar":
            result = sets(data, ctx)
            exact = True
        elif op == "funciones.evaluar":
            f = Function(data["expresion"], ctx)
            x = parse_number(data["punto"])
            result = {"expresion": data["expresion"], "punto": x, "valor": f.exact(x)}
            exact = f.polynomial is not None
            if f.binary_functions:
                warnings.append(
                    "Trigonometría y pi/e usan evaluación binaria de unas 15 cifras; 40 cifras es precisión de trabajo, no exactitud garantizada."
                )
            if "inferior" in data or "superior" in data:
                if not {"inferior", "superior"} <= data.keys():
                    raise ValueError("Indicá ambos extremos del intervalo.")
                a, b = parse_number(data["inferior"]), parse_number(data["superior"])
                if a > b:
                    raise ValueError("Los extremos deben estar ordenados.")
                f.continuous(a, b)
                result.update(dominio_intervalo_verificado=True, intervalo=[a, b])
            ctx.emit("funcion_segura", "Evaluar el árbol sintáctico permitido.", result)
        elif op == "calculo.primitiva":
            f = Function(data["expresion"], ctx)
            text = calculo.integrar(f.tree)
            result = {
                "expresion": text + " + C",
                "primitiva_sin_constante": text,
                "constante": "C",
                "validez": "En cada intervalo conectado del dominio original, con las reglas simbólicas admitidas.",
            }
            ctx.emit(
                "primitiva", "Aplicar reglas simbólicas admitidas y añadir C.", result
            )
            exact = True
        elif op == "calculo.numerica":
            result, status, warnings = integrate(data, ctx)
        else:
            raise ValueError("Operación numérica no reconocida.")
        checks = {
            "kind": "consistencia_ejecucion_numerica",
            "passed": True,
            "description": "Tabla, estado y resultado provienen de la misma ejecución; un criterio satisfecho no equivale por sí solo a una cota de error verdadero.",
        }
        if "tabla" in result:
            checks["filas_tabla"] = len(result["tabla"])
            if result["tabla"] and op.startswith("raices."):
                checks["passed"] = result["aproximacion"] == result["tabla"][-1][
                    "x"
                ] and result["residual"] == abs(result["tabla"][-1]["fx"])
            if result["tabla"] and op.startswith("iterativos."):
                checks["passed"] = result["vector"] == result["tabla"][-1]["vector"]
            if result["tabla"] and op == "calculo.numerica":
                checks["passed"] = result["valor"] == result["tabla"][-1]["valor"]
        if op == "conversiones.bases":
            checks["passed"] = result["comprobacion_inversa"]
        if not checks["passed"]:
            raise ArithmeticError("Tabla y resultado no coinciden.")
        ctx.progress(100)
        return CalculationResult(
            op,
            data,
            status,
            result,
            ctx.steps,
            checks,
            warnings,
            {
                "exact": exact,
                "number_format": "exact_text",
                "index_base": 0,
                "source": "algorithms.numerical",
                "precision_decimal_trabajo": None if exact else PRECISION,
            },
            {"code": status, "message": MESSAGES[status]} if status != "ok" else None,
        )
