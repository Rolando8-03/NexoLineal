"""Jacobi y Gauss-Seidel racionales; no se infiere divergencia de no dominancia."""

from fractions import Fraction as F
from .functions import decimal
from ..linear.context import matrix, vector, integer, matvec, freeze, identity
from ...domain.models import InputError
from ...parsing.numbers import parse_number


def norm(v, kind):
    if kind == "infinito":
        return max((abs(x) for x in v), default=F(0))
    if kind == "uno":
        return sum(map(abs, v), F(0))
    return F(decimal(sum((x * x for x in v), F(0))).sqrt())


def iterative(method, data, ctx):
    A = matrix(data["A"], square=True)
    n = len(A)
    b = vector(data["b"], n)
    if any(A[i][i] == 0 for i in range(n)):
        raise InputError(
            "La diagonal debe ser no nula; no se permutan filas automáticamente."
        )
    x = vector(data["inicial"], n) if "inicial" in data else [F(0)] * n
    atol = parse_number(data.get("tolerancia_absoluta", "1e-8"))
    rtol = parse_number(data.get("tolerancia_relativa", "1e-8"))
    if not F(1, 10**24) <= atol <= 1 or not 0 <= rtol <= 1:
        raise InputError("Tolerancia absoluta 1e-24…1 y relativa 0…1.")
    limit = integer(data.get("max_iteraciones", 100), "Máximo de iteraciones", 1, 200)
    kind = data.get("norma", "infinito")
    omega = parse_number(data.get("omega", "1"))
    if not 0 < omega < 2:
        raise InputError("El factor de relajación debe satisfacer 0 < ω < 2.")
    criterion = data.get("criterio", "paso_y_residual")
    if criterion not in ("paso_y_residual", "porcentaje_y_residual"):
        raise InputError("Elegí un criterio de parada disponible.")
    percent_limit = None
    if criterion == "porcentaje_y_residual":
        percent_limit = parse_number(data.get("porcentaje", "0.1"))
        if percent_limit <= 0:
            raise InputError("El porcentaje debe ser positivo.")
    dominance = [
        {"diagonal": abs(row[i]), "resto": sum(map(abs, row), F(0)) - abs(row[i])}
        for i, row in enumerate(A)
    ]
    dominant = all(row["diagonal"] > row["resto"] for row in dominance)

    def update(old, rhs):
        current = old[:]
        for i in range(n):
            ctx.tick(n)
            terms = sum(
                (
                    A[i][j]
                    * (current[j] if method == "gauss_seidel" and j < i else old[j])
                    for j in range(n)
                    if j != i
                ),
                F(0),
            )
            estimate = (rhs[i] - terms) / A[i][i]
            current[i] = freeze((1 - omega) * old[i] + omega * estimate)
        return current

    # Matriz de iteración exacta. Su norma infinito <1 es suficiente, no necesaria.
    images = [update(e, [F(0)] * n) for e in identity(n)]
    T = [list(row) for row in zip(*images)]
    q = max(sum(map(abs, row), F(0)) for row in T)
    table = []
    history = []
    warnings = []
    if kind == "dos":
        warnings.append(
            "La norma dos se aproxima con Decimal de 40 cifras; la cota certificada, si existe, corresponde a norma infinito."
        )
    if not dominant:
        warnings.append(
            "No hay dominancia diagonal estricta; esto no demuestra divergencia."
        )
    if q >= 1:
        warnings.append(
            "No se obtuvo una cota por contracción en norma infinito; el método puede converger."
        )
    result = {
        "metodo": "sor" if omega != 1 else method,
        "omega": omega,
        "norma": kind,
        "dominancia_por_fila": dominance,
        "criterio": criterion,
        "porcentaje_objetivo": percent_limit,
        "inicial": x[:],
        "dominancia_diagonal_estricta": dominant,
        "norma_infinito_matriz_iteracion": q,
        "matriz_iteracion": T,
        "contraccion_suficiente": q < 1,
        "tolerancia_absoluta": atol,
        "tolerancia_relativa": rtol,
        "max_iteraciones": limit,
        "tabla": table,
        "cota_garantizada": None,
        "norma_cota_garantizada": "infinito",
        "error_verdadero": None,
    }

    def residual(v):
        return [a - c for a, c in zip(matvec(A, v, ctx), b)]

    reference = vector(data["referencia"], n) if "referencia" in data else None
    if reference is not None and any(residual(reference)):
        raise InputError(
            "La referencia debe satisfacer Ax=b exactamente para llamarla solución de referencia."
        )

    def finish(status, reason, v, r):
        result.update(
            vector=v,
            residual=r,
            norma_residual=norm(r, kind),
            iteraciones=len(table),
            convergencia=status == "ok",
            motivo_parada=reason,
        )
        if reference is not None:
            result["error_verdadero"] = norm(
                [a - c for a, c in zip(v, reference)], kind
            )
        return result, status, warnings

    r = residual(x)
    threshold = atol + rtol * norm(b, kind)
    if norm(r, kind) <= threshold:
        return finish("ok", "residual_inicial_suficiente", x, r)
    for k in range(1, limit + 1):
        new = update(x, b)
        r = residual(new)
        delta = norm([a - c for a, c in zip(new, x)], kind)
        nr = norm(r, kind)
        step_threshold = atol + rtol * norm(new, kind)
        bound = (
            q / (1 - q) * norm([a - c for a, c in zip(new, x)], "infinito")
            if q < 1
            else None
        )
        result["cota_garantizada"] = bound
        # Una componente que permanece en cero aporta cambio nulo. Si llega
        # a cero desde otro valor, el cociente relativo no está definido.
        changes = [100 * abs((v - u) / v) if v else (None if u else F(0))
                   for v, u in zip(new, x)]
        percent = None if None in changes else max(changes)
        row = {
            "iteracion": k,
            "anterior": x[:],
            "vector": new[:],
            "residual": r,
            "norma_residual": nr,
            "error_aproximado_absoluto": delta,
            "cambio_porcentual_maximo": percent,
            "umbral_paso": step_threshold,
            "umbral_residual": threshold,
            "cota_error_infinito": bound,
        }
        if reference is not None:
            row["error_verdadero"] = norm([a - b for a, b in zip(new, reference)], kind)
        table.append(row)
        ctx.emit("iteracion_sistema", f"Iteración {k} de {method}.", row)
        ctx.progress(k * 99 // limit)
        small_step = (delta <= step_threshold if percent_limit is None
                      else percent is not None and percent <= percent_limit)
        if small_step and nr <= threshold:
            return finish("ok", criterion + "_suficientes", new, r)
        if new == x:
            return finish(
                "stagnated", "iterado_repetido_con_residual_no_suficiente", new, r
            )
        if new in history[-8:]:
            return finish("cycle_detected", "ciclo_detectado", new, r)
        history.append(x)
        x = new
    return finish("iteration_limit", "maximo_de_iteraciones", x, r)
