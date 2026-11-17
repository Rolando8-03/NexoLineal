"""Transformaciones lineales especificadas mediante matrices e imágenes de una base."""

from .context import columns, identity, multiply, matvec, transpose, InputError
from .reduction import inverse
from .spaces import fundamental, validate_basis


def analyze(A, ctx, v=None):
    spaces, checks = fundamental(A, ctx)
    m, n = len(A), len(A[0])
    result = {
        "matrix": A,
        "dimension_dominio": n,
        "dimension_codominio": m,
        "dominio": "R^" + str(n),
        "codominio": "R^" + str(m),
        "rango": spaces["rango"],
        "nulidad": spaces["nulidad"],
        "base_nucleo": spaces["base_nucleo"],
        "base_imagen": spaces["base_columna"],
        "inyectiva": spaces["rango"] == n,
        "sobreyectiva": spaces["rango"] == m,
        "biyectiva": spaces["rango"] == n == m,
        "linealidad": "La representación T(x)=Ax define una transformación lineal.",
    }
    if v is not None:
        result["imagen_vector"] = matvec(A, v, ctx)
    return result, checks


def from_images(base, images, ctx):
    n = len(base[0]) if base else 0
    validate_basis(base, n, ctx, full=True)
    if len(images) != n:
        raise InputError("Debe existir una imagen por vector de la base del dominio.")
    B, Y = columns(base, n), columns(images, len(images[0]))
    A = multiply(Y, inverse(B, ctx), ctx)
    reconstructed = multiply(A, B, ctx)
    ctx.emit(
        "matriz_desde_imagenes",
        "Resolver AB=Y para obtener A=YB⁻¹.",
        {"B": B, "Y": Y, "matriz": A},
        r"A=YB^{-1}",
    )
    return {
        "matrix": A,
        "dimension_dominio": n,
        "dimension_codominio": len(images[0]),
    }, {
        "kind": "imagenes_base",
        "description": "AB=Y verifica cada imagen de la base proporcionada.",
        "passed": reconstructed == Y,
        "AB": reconstructed,
        "Y": Y,
    }


def compose(A, B, ctx):
    result = multiply(A, B, ctx)
    tests = [
        matvec(A, matvec(B, v, ctx), ctx) == matvec(result, v, ctx)
        for v in identity(len(B[0]))
    ]
    ctx.emit(
        "composicion",
        "La matriz de T∘S es AB: primero se aplica B y después A.",
        {"A": A, "B": B, "matriz": result},
        r"[T\circ S]=AB",
    )
    return {
        "matrix": result,
        "dimension_dominio": len(B[0]),
        "dimension_codominio": len(A),
        "convencion": "T∘S: primero B, después A",
    }, {
        "kind": "composicion",
        "description": "La igualdad se comprueba en todos los vectores de una base del dominio.",
        "passed": all(tests),
    }


def represent(A, domain, codomain, ctx):
    n, m = len(A[0]), len(A)
    validate_basis(domain, n, ctx, full=True)
    validate_basis(codomain, m, ctx, full=True)
    B, C = columns(domain, n), columns(codomain, m)
    AB = multiply(A, B, ctx)
    M = multiply(inverse(C, ctx), AB, ctx)
    CM = multiply(C, M, ctx)
    ctx.emit(
        "representacion_bases",
        "Resolver CM=AB para representar T en las bases elegidas.",
        {"base_dominio": B, "base_codominio": C, "matriz": M},
        r"M=C^{-1}AB",
    )
    return {
        "matrix": M,
        "convencion": "[T(v)]_C = M [v]_B",
        "base_dominio_columnas": B,
        "base_codominio_columnas": C,
    }, {
        "kind": "representacion_bases",
        "description": "CM=AB verifica la orientación y las coordenadas.",
        "passed": CM == AB,
        "CM": CM,
        "AB": AB,
    }
