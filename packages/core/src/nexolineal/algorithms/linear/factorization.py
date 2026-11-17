"""LU docente sin intercambios y PLU rectangular con PA=LU."""

from fractions import Fraction as F
from .context import (
    Context,
    identity,
    multiply,
    matvec,
    freeze,
    LinearFailure,
    InputError,
    tex,
)
from .reduction import solve


def factor(A, ctx, pivoting=False, b=None):
    m, n = len(A), len(A[0])
    U = [row[:] for row in A]
    L, P = identity(m), identity(m)
    row = 0
    pivots = []
    ctx.emit("factorizacion_inicial", "Iniciar U=A y L=P=I.", {"U": U, "L": L, "P": P})
    for col in range(n):
        if row == m:
            break
        available = [i for i in range(row, m) if U[i][col]]
        if not available:
            continue
        chosen = max(available, key=lambda i: abs(U[i][col])) if pivoting else row
        if not pivoting and not U[row][col]:
            raise LinearFailure(
                "not_applicable",
                "LU sin permutación requiere un intercambio. Elegí PLU.",
                {"fila": row, "columna": col},
            )
        if chosen != row:
            U[row], U[chosen] = U[chosen], U[row]
            P[row], P[chosen] = P[chosen], P[row]
            # Solo se permutan los multiplicadores de pivotes ya procesados.
            for j in range(row):
                L[row][j], L[chosen][j] = L[chosen][j], L[row][j]
            ctx.emit(
                "permutacion_plu",
                f"Permutar F{row+1} y F{chosen+1}; actualizar las columnas previas de L.",
                {"fila": row, "otra_fila": chosen, "P": P, "L": L, "U": U},
            )
        for i in range(row + 1, m):
            ctx.tick(n)
            multiplier = U[i][col] / U[row][col]
            L[i][row] = multiplier
            if multiplier:
                U[i] = freeze([a - multiplier * x for a, x in zip(U[i], U[row])])
                ctx.emit(
                    "eliminacion_lu",
                    f"Eliminar debajo del pivote de la columna {col+1}.",
                    {
                        "destino": i,
                        "origen": row,
                        "multiplicador": multiplier,
                        "L": L,
                        "U": U,
                    },
                    f"F_{{{i+1}}} \\leftarrow F_{{{i+1}}}-({tex(multiplier)})F_{{{row+1}}}",
                )
        pivots.append(col)
        row += 1
        ctx.progress(row * 90 // max(1, min(m, n)))
    PA, LU = multiply(P, A, ctx), multiply(L, U, ctx)
    result = {
        "P": P,
        "L": L,
        "U": U,
        "rango": len(pivots),
        "pivotes": pivots,
        "convencion": "PA=LU" if pivoting else "A=LU",
    }
    verification = {
        "kind": "factorizacion",
        "description": "PA=LU, L unitaria inferior y U escalonada.",
        "passed": PA == LU
        and all(
            L[i][i] == 1 and all(L[i][j] == 0 for j in range(i + 1, m))
            for i in range(m)
        ),
        "PA": PA,
        "LU": LU,
    }
    if b is not None:
        permuted = matvec(P, b, ctx)
        y = []
        for i in range(m):
            y.append(permuted[i] - sum((L[i][j] * y[j] for j in range(i)), F(0)))
            ctx.emit(
                "sustitucion_L",
                f"Resolver la componente y{i+1} de Ly=Pb.",
                {"componente": i, "valor": y[-1], "y": y},
            )
        solution = solve(U, y, ctx)
        result.update(
            {
                "b_permutado": permuted,
                "y": y,
                "sistema": solution,
                "clasificacion": solution["clasificacion"],
                "particular": solution["particular"],
                "direcciones": solution["direcciones"],
                "parametros": solution.get("parametros", []),
            }
        )
        verification["Ly"] = matvec(L, y, ctx)
        verification["passed"] = (
            verification["passed"] and verification["Ly"] == permuted
        )
        if solution["clasificacion"] != "incompatible":
            verification["Axp"] = matvec(A, solution["particular"], ctx)
            verification["Av"] = [matvec(A, v, ctx) for v in solution["direcciones"]]
            verification["passed"] = (
                verification["passed"]
                and verification["Axp"] == b
                and all(not any(v) for v in verification["Av"])
            )
        else:
            # El certificado de U se transforma al sistema original: U=L^-1 P A.
            cert = solution["certificado"]
            from .reduction import inverse

            E = multiply(inverse(L, Context(checkpoint=ctx.checkpoint)), P, ctx)
            witness = [
                sum((cert["y"][i] * E[i][j] for i in range(m)), F(0)) for j in range(m)
            ]
            left = [
                sum((witness[i] * A[i][j] for i in range(m)), F(0)) for j in range(n)
            ]
            right = sum((witness[i] * b[i] for i in range(m)), F(0))
            result["certificado_original"] = {"y": witness, "yA": left, "yb": right}
            verification["passed"] = (
                verification["passed"] and not any(left) and right != 0
            )
    return result, verification
