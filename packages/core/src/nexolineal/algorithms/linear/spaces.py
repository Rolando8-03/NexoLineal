"""Espacios generados, bases y coordenadas sobre el cuerpo de los racionales."""

from fractions import Fraction as F
from .context import (
    Context,
    columns,
    transpose,
    matvec,
    multiply,
    identity,
    LinearFailure,
    InputError,
)
from .reduction import reduce, solve, kernel, rank, inverse


def basis(vectors, ambient, ctx=None):
    C = columns(vectors, ambient)
    reduction = reduce(C, ctx, trace=False)
    return [vectors[j][:] for j in reduction["pivots"]]


def fundamental(A, ctx):
    reduced = reduce(A, ctx)
    R, pivots = reduced["matrix"], reduced["pivots"]
    r = len(pivots)
    col = [[row[j] for row in A] for j in pivots]
    row = [x[:] for x in R[:r]]
    null = kernel(A, ctx)
    images = [matvec(A, v, ctx) for v in null]
    reconstructed = (
        multiply(columns(col, len(A)), R[:r], ctx)
        if r
        else [[F(0)] * len(A[0]) for _ in A]
    )
    row_equivalence = multiply(reduced["E"], A, ctx) == R
    verified = (
        r + len(null) == len(A[0])
        and all(not any(v) for v in images)
        and reconstructed == A
        and row_equivalence
    )
    return {
        "rango": r,
        "nulidad": len(null),
        "dimension_dominio": len(A[0]),
        "dimension_codominio": len(A),
        "base_columna": col,
        "base_fila": row,
        "base_nucleo": null,
        "pivotes": pivots,
        "matrix": R,
    }, {
        "kind": "rango_nulidad",
        "description": "Las columnas se extraen de A original; Av=0 y rango+nulidad=n.",
        "passed": verified,
        "Av": images,
        "columnas_reconstruidas": reconstructed,
        "equivalencia_filas": row_equivalence,
        "rango_mas_nulidad": r + len(null),
    }


def study(vectors, ambient, ctx):
    C = columns(vectors, ambient)
    reduced = reduce(C, ctx)
    pivots = reduced["pivots"]
    relations = kernel(C, ctx)
    images = [matvec(C, v, ctx) for v in relations]
    return {
        "dimension_ambiente": ambient,
        "cantidad": len(vectors),
        "dimension_generado": len(pivots),
        "independiente": len(pivots) == len(vectors),
        "base_generado": [vectors[j] for j in pivots],
        "relaciones_dependencia": relations,
    }, {
        "kind": "dependencia",
        "description": "Cada relación es no nula y su combinación de vectores es cero.",
        "passed": all(any(v) for v in relations) and all(not any(v) for v in images),
        "combinaciones_nulas": images,
    }


def membership(vectors, v, ambient, ctx):
    C = columns(vectors, ambient)
    solved = solve(C, v, ctx)
    contained = solved["clasificacion"] != "incompatible"
    result = {
        "pertenece": contained,
        "dimension_ambiente": ambient,
        "sistema_coeficientes": solved,
    }
    if contained:
        result["coeficientes"] = solved["particular"]
        result["reconstruccion"] = matvec(C, solved["particular"], ctx)
    return result, solved["verification"]


def validate_basis(vectors, ambient, ctx, full=False):
    if (
        len(basis(vectors, ambient, ctx)) != len(vectors)
        or full
        and len(vectors) != ambient
    ):
        raise LinearFailure(
            "not_applicable", "La familia no es una base válida del espacio declarado."
        )


def verify_basis(vectors, target, ambient, ctx):
    B = basis(vectors, ambient, ctx)
    target_basis = basis(target, ambient, ctx)
    same_span = (
        len(B) == len(target_basis) == len(basis(vectors + target, ambient, ctx))
    )
    independent = len(B) == len(vectors)
    relations = kernel(columns(vectors, ambient), ctx)
    relation_checks = [
        not any(matvec(columns(vectors, ambient), v, ctx)) and any(v) for v in relations
    ]
    reconstructions = []
    if same_span:
        for generators, objects in ((vectors, target), (target, vectors)):
            C = columns(generators, ambient)
            for v in objects:
                solved = solve(C, v, ctx, trace=False)
                reconstructions.append(
                    solved["clasificacion"] != "incompatible"
                    and matvec(C, solved["particular"], ctx) == v
                )
    return {
        "es_base": independent and same_span,
        "independiente": independent,
        "genera_objetivo": same_span,
        "relaciones_dependencia": relations,
        "dimension_ambiente": ambient,
        "dimension_objetivo": len(target_basis),
        "cantidad": len(vectors),
    }, {
        "kind": "base_espacio_objetivo",
        "description": "Se verifica independencia y coincidencia de los espacios generados.",
        "passed": all(relation_checks)
        and all(reconstructions)
        and (independent == (not relations)),
        "reconstrucciones_verificadas": reconstructions,
    }


def subspaces(U, V, ambient, ctx, intersection=False):
    BU, BV = basis(U, ambient, ctx), basis(V, ambient, ctx)
    sum_basis = basis(BU + BV, ambient, ctx)
    # [BU|-BV](a,b)=0 representa exactamente BU a = BV b.
    joined = [[a[i] for a in BU] + [-b[i] for b in BV] for i in range(ambient)]
    relations = kernel(joined, ctx)
    candidates = [matvec(columns(BU, ambient), v[: len(BU)], ctx) for v in relations]
    inter_basis = basis(candidates, ambient, ctx)
    selected = inter_basis if intersection else sum_basis
    checks = []
    for v in inter_basis:
        checks.extend(
            (
                solve(columns(BU, ambient), v, ctx, trace=False)["clasificacion"]
                != "incompatible",
                solve(columns(BV, ambient), v, ctx, trace=False)["clasificacion"]
                != "incompatible",
            )
        )
    dimension_identity = len(BU) + len(BV) == len(sum_basis) + len(inter_basis)
    return {
        "base": selected,
        "dimension": len(selected),
        "dimension_ambiente": ambient,
        "base_suma": sum_basis,
        "base_interseccion": inter_basis,
        "dimension_U": len(BU),
        "dimension_V": len(BV),
    }, {
        "kind": "suma_interseccion",
        "description": "La intersección pertenece a ambos espacios y satisface la fórmula de dimensiones.",
        "passed": all(checks) and dimension_identity,
        "formula_dimensiones": dimension_identity,
    }


def coordinates(base, v, ambient, ctx):
    validate_basis(base, ambient, ctx)
    result = solve(columns(base, ambient), v, ctx)
    if result["clasificacion"] == "incompatible":
        raise LinearFailure(
            "not_applicable", "El vector no pertenece al espacio de la base.", result
        )
    coeff = result["particular"]
    reconstructed = matvec(columns(base, ambient), coeff, ctx)
    return {
        "coordenadas": coeff,
        "reconstruccion": reconstructed,
        "dimension_ambiente": ambient,
        "dimension_base": len(base),
    }, {
        "kind": "coordenadas",
        "description": "B[v]B=v verifica las coordenadas.",
        "passed": reconstructed == v,
    }


def change_basis(source, target, ambient, ctx, v=None):
    validate_basis(source, ambient, ctx)
    validate_basis(target, ambient, ctx)
    if len(source) != len(target) or len(basis(source + target, ambient, ctx)) != len(
        source
    ):
        raise LinearFailure(
            "not_applicable", "Las bases deben generar el mismo subespacio."
        )
    cols = [coordinates(target, s, ambient, ctx)[0]["coordenadas"] for s in source]
    transition = transpose(cols)
    S, T = columns(source, ambient), columns(target, ambient)
    reconstructed = multiply(T, transition, ctx) if source else T
    result = {
        "matrix": transition,
        "convencion": "[v]_destino = P [v]_origen",
        "base_origen_columnas": S,
        "base_destino_columnas": T,
        "dimension": len(source),
    }
    checks = {
        "kind": "cambio_base",
        "description": "T P = S fija la orientación de la transición.",
        "passed": reconstructed == S,
        "TP": reconstructed,
        "S": S,
    }
    if v is not None:
        origin = coordinates(source, v, ambient, ctx)[0]["coordenadas"]
        destination = coordinates(target, v, ambient, ctx)[0]["coordenadas"]
        mapped = matvec(transition, origin, ctx) if source else []
        result.update(
            {"coordenadas_origen": origin, "coordenadas_destino": destination}
        )
        checks["passed"] = checks["passed"] and mapped == destination
    return result, checks
