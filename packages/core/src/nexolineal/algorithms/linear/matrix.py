"""Operaciones matriciales, bloques y determinantes con hipótesis explícitas."""

from fractions import Fraction as F
from .context import (
    Context,
    matrix,
    integer,
    identity,
    transpose,
    multiply,
    equal_shape,
    freeze,
    tex,
    LinearFailure,
    InputError,
    ResourceLimitError,
)
from .reduction import reduce, rank, inverse
from ..legacy import modulo_matrices as docente


def square(A):
    if len(A) != len(A[0]):
        raise LinearFailure(
            "not_applicable", "Esta operación requiere una matriz cuadrada."
        )


def add(A, B, sign=1):
    equal_shape(A, B)
    return [[a + sign * b for a, b in zip(row, other)] for row, other in zip(A, B)]


def determinant(A, ctx, method="reduccion", axis="fila", index=0):
    square(A)
    n = len(A)
    if method == "sarrus":
        if n != 3:
            raise LinearFailure(
                "not_applicable", "Sarrus se aplica únicamente a matrices 3×3."
            )
        detail = docente.sarrus(A)
        ctx.emit(
            "sarrus",
            "Sumar los tres productos positivos y restar los tres negativos.",
            {
                "positivas": detail["positivas"],
                "negativas": detail["negativas"],
                "valor": detail["determinante"],
            },
            r"\det(A)=\sum p_i-\sum n_i",
        )
        value = detail["determinante"]
    elif method == "cofactores":
        if n > 6:
            raise ResourceLimitError(
                "El desarrollo por cofactores admite hasta orden 6."
            )
        index = integer(index, "El índice de desarrollo", 0, n - 1)
        terms = docente.expansion_cofactores(A, axis, index + 1)
        value = F(0)
        for term in terms:
            ctx.tick()
            value += term["termino"]
            ctx.emit(
                "cofactor",
                "Desarrollar el término de la expansión por cofactores.",
                {
                    "fila": term["fila"] - 1,
                    "columna": term["columna"] - 1,
                    "elemento": term["elemento"],
                    "menor": term["menor"],
                    "det_menor": term["det_menor"],
                    "cofactor": term["cofactor"],
                    "termino": term["termino"],
                },
                r"a_{ij}C_{ij}=a_{ij}(-1)^{i+j}\det(M_{ij})",
            )
    elif method == "reduccion":
        reduction = reduce(A, ctx, reduced=False)
        value = F((-1) ** reduction["swaps"])
        for i in range(n):
            value *= reduction["matrix"][i][i]
        value = freeze(value)
        ctx.emit(
            "determinante",
            "Corregir el signo de los intercambios y multiplicar la diagonal.",
            {
                "intercambios": reduction["swaps"],
                "valor": value,
                "triangular": reduction["matrix"],
            },
            r"\det(A)=(-1)^s\prod_i u_{ii}",
        )
    else:
        raise InputError("Método de determinante no admitido.")
    return value


def cofactor_matrix(A, ctx):
    square(A)
    if len(A) > 6:
        raise ResourceLimitError("La matriz de cofactores admite hasta orden 6.")
    result = []
    for i in range(len(A)):
        row = []
        for j in range(len(A)):
            ctx.tick()
            minor = docente.menor(A, i, j)
            value = (
                F((-1) ** (i + j)) * docente.procedimiento_determinante(minor)["valor"]
            )
            row.append(value)
            ctx.emit(
                "cofactor",
                f"Calcular el cofactor C({i+1},{j+1}).",
                {"fila": i, "columna": j, "menor": minor, "valor": value},
                f"C_{{{i+1},{j+1}}}=(-1)^{{{i+j+2}}}\\det(M_{{{i+1},{j+1}}})={tex(value)}",
            )
        result.append(row)
    return result


def invert(A, ctx, method="gauss_jordan"):
    square(A)
    if method == "gauss_jordan":
        result = inverse(A, ctx)
    elif method == "adjugata":
        value = determinant(A, ctx, "cofactores")
        if not value:
            raise LinearFailure(
                "singular",
                "La matriz es singular; no existe inversa.",
                {"determinante": F(0)},
            )
        adjugate = transpose(cofactor_matrix(A, ctx))
        result = [[x / value for x in row] for row in adjugate]
        ctx.emit(
            "inversa_adjugata",
            "Dividir la adjugata por el determinante.",
            {"adjugata": adjugate, "determinante": value, "matriz": result},
            r"A^{-1}=\operatorname{adj}(A)/\det(A)",
        )
    else:
        raise InputError("Método de inversa no admitido.")
    checks = {
        "AA_inversa": multiply(A, result, ctx),
        "inversa_A": multiply(result, A, ctx),
    }
    checks.update(
        {
            "kind": "inversa_bilateral",
            "description": "AA⁻¹=A⁻¹A=I.",
            "passed": checks["AA_inversa"] == identity(len(A))
            and checks["inversa_A"] == identity(len(A)),
        }
    )
    return result, checks


def power(A, exponent, ctx):
    square(A)
    exponent = integer(exponent, "El exponente", -100, 100)
    base = invert(A, ctx)[0] if exponent < 0 else [row[:] for row in A]
    count = abs(exponent)
    result = identity(len(A))
    while count:
        ctx.tick()
        if count % 2:
            result = multiply(result, base, ctx)
            ctx.emit(
                "potencia",
                "Acumular un factor de la potencia.",
                {"matriz": result, "exponente_restante": count},
            )
        count //= 2
        if count:
            base = multiply(base, base, ctx)
    return result


def analyze(A, ctx):
    reduction = reduce(A, ctx)
    m, n = len(A), len(A[0])
    r = len(reduction["pivots"])
    types = {
        "rectangular": m != n,
        "fila": m == 1,
        "columna": n == 1,
        "nula": not any(any(row) for row in A),
    }
    if m == n:
        diagonal = all(A[i][j] == 0 for i in range(n) for j in range(n) if i != j)
        types.update(
            {
                "cuadrada": True,
                "diagonal": diagonal,
                "escalar": diagonal and all(A[i][i] == A[0][0] for i in range(n)),
                "identidad": A == identity(n),
                "simetrica": A == transpose(A),
                "antisimetrica": all(
                    A[i][j] == -A[j][i] for i in range(n) for j in range(n)
                ),
                "triangular_superior": all(
                    A[i][j] == 0 for i in range(n) for j in range(i)
                ),
                "triangular_inferior": all(
                    A[i][j] == 0 for i in range(n) for j in range(i + 1, n)
                ),
                "invertible": r == n,
            }
        )
    result = {
        "filas": m,
        "columnas": n,
        "rango": r,
        "pivotes": reduction["pivots"],
        "matrix": reduction["matrix"],
        "tipos": types,
    }
    if m == n:
        result["determinante"] = determinant(A, ctx)
        result["traza"] = sum((A[i][i] for i in range(n)), F(0))
    return result, {
        "kind": "equivalencia_filas",
        "description": "EA=R verifica las operaciones elementales.",
        "passed": multiply(reduction["E"], A, ctx) == reduction["matrix"],
    }


def elementary(A, axis, action, index, other, k, ctx):
    working = [r[:] for r in (transpose(A) if axis == "columna" else A)]
    index = integer(index, "El índice", 0, len(working) - 1)
    if action in ("intercambiar", "sumar"):
        other = integer(other, "El otro índice", 0, len(working) - 1)
        if other == index:
            raise InputError(
                "Los índices de las dos filas o columnas deben ser diferentes."
            )
    before = [r[:] for r in working]
    if action == "intercambiar":
        working[index], working[other] = working[other], working[index]
    elif action == "escalar":
        working[index] = [k * x for x in working[index]]
    elif action == "sumar":
        working[index] = [a + k * b for a, b in zip(working[index], working[other])]
    else:
        raise InputError("Operación elemental desconocida.")
    result = transpose(working) if axis == "columna" else working
    ctx.emit(
        "operacion_elemental",
        f"Aplicar {action} por {axis}.",
        {
            "eje": axis,
            "accion": action,
            "indice": index,
            "otro": other,
            "k": k,
            "antes": A,
            "matriz": result,
        },
    )
    return result


def cuts(value, size, name):
    if isinstance(value, str):
        value = value.replace(",", " ").split()
    if not isinstance(value, (list, tuple)):
        raise InputError(name + " debe ser una lista de cortes.")
    result = [integer(x, name, 1, size - 1) for x in value]
    if result != sorted(set(result)):
        raise InputError(name + " debe estar en orden creciente y sin repeticiones.")
    return [0] + result + [size]


def partition(A, row_cuts, col_cuts):
    return [
        [
            [
                row[col_cuts[j] : col_cuts[j + 1]]
                for row in A[row_cuts[i] : row_cuts[i + 1]]
            ]
            for j in range(len(col_cuts) - 1)
        ]
        for i in range(len(row_cuts) - 1)
    ]


def assemble(blocks):
    return [
        [x for block in block_row for x in block[i]]
        for block_row in blocks
        for i in range(len(block_row[0]))
    ]


def block_operation(A, B, row_cuts, inner_cuts, col_cuts, method, ctx):
    rows = cuts(row_cuts, len(A), "Los cortes de filas")
    if method == "particionar":
        cols = cuts(col_cuts, len(A[0]), "Los cortes de columnas")
        blocks = partition(A, rows, cols)
        return {
            "bloques": blocks,
            "cortes_filas": rows,
            "cortes_columnas": cols,
        }, assemble(blocks) == A
    if method == "sumar":
        equal_shape(A, B)
        cols = cuts(col_cuts, len(A[0]), "Los cortes de columnas")
        X, Y = partition(A, rows, cols), partition(B, rows, cols)
        blocks = [[add(a, b) for a, b in zip(rx, ry)] for rx, ry in zip(X, Y)]
        expected = add(A, B)
    elif method == "producto":
        if len(A[0]) != len(B):
            raise InputError("Las particiones internas requieren columnas(A)=filas(B).")
        inner = cuts(inner_cuts, len(A[0]), "Los cortes internos")
        cols = cuts(col_cuts, len(B[0]), "Los cortes de columnas")
        X, Y = partition(A, rows, inner), partition(B, inner, cols)
        blocks = []
        for i in range(len(X)):
            row = []
            for j in range(len(Y[0])):
                terms = [multiply(X[i][k], Y[k][j], ctx) for k in range(len(Y))]
                value = terms[0]
                for term in terms[1:]:
                    value = add(value, term)
                row.append(value)
                ctx.emit(
                    "producto_bloques",
                    f"Calcular el bloque C({i+1},{j+1}).",
                    {"fila": i, "columna": j, "sumandos": terms, "matriz": value},
                    r"C_{ij}=\sum_k A_{ik}B_{kj}",
                )
            blocks.append(row)
        expected = multiply(A, B, ctx)
    else:
        raise InputError("Operación por bloques desconocida.")
    result = assemble(blocks)
    return {"matrix": result, "bloques": blocks}, result == expected


def properties(A, B, C, k, d, ctx):
    """Las hipótesis fallidas quedan visibles como casos no aplicables."""
    records = []

    def check(name, left=None, right=None, applicable=True, reason=""):
        records.append(
            {
                "nombre": name,
                "estado": "verificada" if applicable else "not_applicable",
                "izquierda": left,
                "derecha": right,
                "passed": left == right if applicable else None,
                "condicion": reason,
            }
        )

    m, n = len(A), len(A[0])
    check("(Aᵀ)ᵀ=A", transpose(transpose(A)), A)
    zero = [[F(0)] * n for _ in range(m)]
    check("A+0=A", add(A, zero), A)
    check("A+(-A)=0", add(A, [[-v for v in row] for row in A]), zero)
    check("AI=A", multiply(A, identity(n), ctx), A)
    check("IA=A", multiply(identity(m), A, ctx), A)
    check(
        "k(dA)=(kd)A",
        [[k * (d * x) for x in row] for row in A],
        [[k * d * x for x in row] for row in A],
    )
    check(
        "(k+d)A=kA+dA",
        [[(k + d) * x for x in row] for row in A],
        add([[k * x for x in row] for row in A], [[d * x for x in row] for row in A]),
    )
    if B is not None:
        same = (m, n) == (len(B), len(B[0]))
        check(
            "A+B=B+A",
            add(A, B) if same else None,
            add(B, A) if same else None,
            same,
            "A y B deben tener igual tamaño.",
        )
        check(
            "(A+B)ᵀ=Aᵀ+Bᵀ",
            transpose(add(A, B)) if same else None,
            add(transpose(A), transpose(B)) if same else None,
            same,
            "A y B deben tener igual tamaño.",
        )
        check(
            "k(A+B)=kA+kB",
            [[k * x for x in row] for row in add(A, B)] if same else None,
            (
                add(
                    [[k * x for x in row] for row in A],
                    [[k * x for x in row] for row in B],
                )
                if same
                else None
            ),
            same,
            "A y B deben tener igual tamaño.",
        )
        can = len(A[0]) == len(B)
        check(
            "(AB)ᵀ=BᵀAᵀ",
            transpose(multiply(A, B, ctx)) if can else None,
            multiply(transpose(B), transpose(A), ctx) if can else None,
            can,
            "El producto AB debe estar definido.",
        )
        if C is not None:
            same3 = same and (m, n) == (len(C), len(C[0]))
            check(
                "(A+B)+C=A+(B+C)",
                add(add(A, B), C) if same3 else None,
                add(A, add(B, C)) if same3 else None,
                same3,
                "Las tres matrices deben tener igual tamaño.",
            )
            composable = can and len(B[0]) == len(C)
            check(
                "(AB)C=A(BC)",
                multiply(multiply(A, B, ctx), C, ctx) if composable else None,
                multiply(A, multiply(B, C, ctx), ctx) if composable else None,
                composable,
                "Ambos productos deben estar definidos.",
            )
            distributive = (len(B), len(B[0])) == (len(C), len(C[0])) and can
            check(
                "A(B+C)=AB+AC",
                multiply(A, add(B, C), ctx) if distributive else None,
                add(multiply(A, B, ctx), multiply(A, C, ctx)) if distributive else None,
                distributive,
                "B+C y AB deben estar definidos.",
            )
    if m == n:
        det = determinant(A, Context(checkpoint=ctx.checkpoint))
        detT = determinant(transpose(A), Context(checkpoint=ctx.checkpoint))
        check("det(Aᵀ)=det(A)", detT, det)
        scaled = [[k * v for v in row] for row in A]
        check(
            "det(kA)=kⁿdet(A)",
            determinant(scaled, Context(checkpoint=ctx.checkpoint)),
            k**n * det,
        )
        if B is not None and len(B) == n and len(B[0]) == n:
            detB = determinant(B, Context(checkpoint=ctx.checkpoint))
            check(
                "det(AB)=det(A)det(B)",
                determinant(multiply(A, B, ctx), Context(checkpoint=ctx.checkpoint)),
                det * detB,
            )
        if n > 1:
            for axis in ("fila", "columna"):
                for action in ("intercambiar", "escalar", "sumar"):
                    changed = elementary(
                        A, axis, action, 0, 1, k, Context(checkpoint=ctx.checkpoint)
                    )
                    expected = (
                        -det
                        if action == "intercambiar"
                        else k * det if action == "escalar" else det
                    )
                    check(
                        "det tras " + action + " por " + axis,
                        determinant(changed, Context(checkpoint=ctx.checkpoint)),
                        expected,
                    )
    else:
        check(
            "Propiedades del determinante",
            applicable=False,
            reason="La matriz debe ser cuadrada.",
        )
    if B is None:
        check(
            "Propiedades con B",
            applicable=False,
            reason="Agregá B para consultar identidades entre dos matrices.",
        )
    comparisons = []
    if B is not None and len(A) == len(A[0]) == len(B) == len(B[0]):
        comparisons.append(
            {
                "enunciado": "AB=BA",
                "cumple_en_este_caso": multiply(A, B, ctx) == multiply(B, A, ctx),
                "es_ley_general": False,
            }
        )
        comparisons.append(
            {
                "enunciado": "det(A+B)=det(A)+det(B)",
                "cumple_en_este_caso": determinant(
                    add(A, B), Context(checkpoint=ctx.checkpoint)
                )
                == determinant(A, Context(checkpoint=ctx.checkpoint))
                + determinant(B, Context(checkpoint=ctx.checkpoint)),
                "es_ley_general": False,
            }
        )
    return {"propiedades": records, "comparaciones_no_generales": comparisons}, all(
        record["passed"] is not False for record in records
    )
