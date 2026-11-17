"""Eliminación racional con operaciones equivalentes y certificados verificables."""

from fractions import Fraction as F
from .context import (
    Context,
    identity,
    matvec,
    multiply,
    freeze,
    tex,
    InputError,
    LinearFailure,
)


def reduce(A, ctx=None, reduced=True, pivot_limit=None, trace=True):
    """Devuelve R y E con EA=R. El límite evita pivotar sobre el término b."""
    ctx = ctx or Context()
    R = [row[:] for row in A]
    m, total = len(R), len(R[0]) if R else 0
    n = total if pivot_limit is None else pivot_limit
    E, pivots, row, swaps = identity(m), [], 0, 0
    if trace:
        ctx.emit("matriz_inicial", "Matriz inicial del procedimiento.", {"matriz": R})
    for col in range(n):
        ctx.tick()
        if row == m:
            break
        chosen = next((i for i in range(row, m) if R[i][col]), None)
        if chosen is None:
            continue
        if chosen != row:
            before = [r[:] for r in R]
            R[row], R[chosen] = R[chosen], R[row]
            E[row], E[chosen] = E[chosen], E[row]
            swaps += 1
            if trace:
                ctx.emit(
                    "intercambio",
                    f"Intercambiar F{row+1} y F{chosen+1}.",
                    {"fila": row, "otra_fila": chosen, "antes": before, "matriz": R},
                    f"F_{{{row+1}}} \\leftrightarrow F_{{{chosen+1}}}",
                )
        pivot = R[row][col]
        if reduced and pivot != 1:
            before = [r[:] for r in R]
            factor = 1 / pivot
            R[row] = freeze([x * factor for x in R[row]])
            E[row] = freeze([x * factor for x in E[row]])
            if trace:
                ctx.emit(
                    "escala_fila",
                    f"Normalizar el pivote de F{row+1}.",
                    {"fila": row, "factor": factor, "antes": before, "matriz": R},
                    f"F_{{{row+1}}} \\leftarrow ({tex(factor)})F_{{{row+1}}}",
                )
        targets = range(m) if reduced else range(row + 1, m)
        for i in targets:
            ctx.tick(total + m)
            if i == row or R[i][col] == 0:
                continue
            factor = -R[i][col] / R[row][col]
            before = [r[:] for r in R]
            R[i] = freeze([a + factor * b for a, b in zip(R[i], R[row])])
            E[i] = freeze([a + factor * b for a, b in zip(E[i], E[row])])
            if trace:
                ctx.emit(
                    "suma_filas",
                    f"Eliminar la entrada de F{i+1}, columna {col+1}.",
                    {
                        "destino": i,
                        "origen": row,
                        "factor": factor,
                        "antes": before,
                        "matriz": R,
                    },
                    f"F_{{{i+1}}} \\leftarrow F_{{{i+1}}}+({tex(factor)})F_{{{row+1}}}",
                )
        pivots.append(col)
        row += 1
        ctx.progress(row * 90 // max(1, min(m, n)))
    return {"matrix": R, "E": E, "pivots": pivots, "swaps": swaps}


def rank(A, ctx=None):
    return len(reduce(A, ctx, trace=False)["pivots"])


def solve(A, b, ctx=None, method="gauss_jordan", trace=True):
    ctx = ctx or Context()
    m, n = len(A), len(A[0])
    if len(b) != m:
        raise InputError("Debe existir un término independiente por ecuación.")
    augmented = [row[:] + [value] for row, value in zip(A, b)]
    reduction = reduce(
        augmented, ctx, reduced=method == "gauss_jordan", pivot_limit=n, trace=trace
    )
    R, pivots = reduction["matrix"], reduction["pivots"]
    free = [j for j in range(n) if j not in pivots]
    contradiction = next((i for i, r in enumerate(R) if not any(r[:n]) and r[n]), None)
    base = {
        "matrix": R,
        "rango_A": len(pivots),
        "rango_aumentada": len(pivots) + (contradiction is not None),
        "pivotes": pivots,
        "variables_libres": free,
        "metodo": method,
        "dimension_dominio": n,
    }
    if contradiction is not None:
        y = reduction["E"][contradiction]
        left = [sum((y[i] * A[i][j] for i in range(m)), F(0)) for j in range(n)]
        right = sum((y[i] * b[i] for i in range(m)), F(0))
        certificate = {"fila": contradiction, "y": y, "yA": left, "yb": right}
        return {
            **base,
            "clasificacion": "incompatible",
            "particular": None,
            "direcciones": [],
            "certificado": certificate,
            "verification": {
                "kind": "certificado_incompatibilidad",
                "passed": not any(left) and right != 0,
                "description": "yᵀA=0 e yᵀb≠0 certifican la incompatibilidad.",
            },
        }

    def back_substitute(rhs, seed):
        x = seed[:]
        for i in range(len(pivots) - 1, -1, -1):
            ctx.tick(n)
            j = pivots[i]
            x[j] = (rhs[i] - sum((R[i][k] * x[k] for k in range(j + 1, n)), F(0))) / R[
                i
            ][j]
            if trace and rhs is b_reduced:
                ctx.emit(
                    "sustitucion",
                    f"Obtener la componente x{j+1} de la solución particular.",
                    {"componente": j, "valor": x[j], "vector": x},
                    f"x_{{{j+1}}}={tex(x[j])}",
                )
        return freeze(x)

    b_reduced = [r[n] for r in R]
    particular = back_substitute(b_reduced, [F(0)] * n)
    directions = []
    for j in free:
        seed = [F(k == j) for k in range(n)]
        directions.append(back_substitute([F(0)] * m, seed))
    actual = matvec(A, particular, ctx)
    residual = [x - y for x, y in zip(actual, b)]
    homogeneous = [matvec(A, v, ctx) for v in directions]
    passed = actual == b and all(not any(v) for v in homogeneous)
    return {
        **base,
        "clasificacion": "infinitas" if free else "unica",
        "particular": particular,
        "direcciones": directions,
        "parametros": ["t" + str(i + 1) for i in range(len(free))],
        "familia": (
            "x = xp + " + " + ".join(f"t{i+1} v{i+1}" for i in range(len(free)))
            if free
            else "x = xp"
        ),
        "verification": {
            "kind": "familia_soluciones",
            "passed": passed,
            "description": "Axp=b y Av=0 se comprueban con A y b originales.",
            "Axp": actual,
            "b": b,
            "residual": residual,
            "Av": homogeneous,
        },
    }


def kernel(A, ctx=None):
    data = solve(A, [F(0)] * len(A), ctx, trace=False)
    return data["direcciones"]


def inverse(A, ctx=None):
    ctx = ctx or Context()
    n = len(A)
    if n != len(A[0]):
        raise LinearFailure(
            "not_applicable", "La inversa requiere una matriz cuadrada."
        )
    R = reduce([row + unit for row, unit in zip(A, identity(n))], ctx, pivot_limit=n)[
        "matrix"
    ]
    if any(R[i][:n] != identity(n)[i] for i in range(n)):
        raise LinearFailure(
            "singular",
            "La matriz es singular; no existe inversa.",
            {"rango": rank(A, ctx)},
        )
    result = [row[n:] for row in R]
    return result
