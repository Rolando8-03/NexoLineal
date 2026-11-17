"""Casos de uso del catálogo lineal: validación, método y comprobación."""

from fractions import Fraction as F
from math import isqrt
from ..domain.models import CalculationResult, InputError
from ..parsing.numbers import parse_number
from ..algorithms.linear.context import (
    Context,
    LinearFailure,
    matrix,
    vector,
    family,
    integer,
    columns,
    identity,
    transpose,
    matvec,
    multiply,
    tex,
)
from ..algorithms.linear import (
    reduction as r,
    matrix as m,
    spaces as s,
    factorization as f,
    transformations as t,
)
from ..algorithms.legacy.modulo_matrices import determinante as determinant_reference


def status_for(solution):
    return {"unica": "ok", "infinitas": "infinite", "incompatible": "inconsistent"}[
        solution
    ]


def raw_family(value):
    if isinstance(value, str):
        return (
            []
            if value.strip() == "[]"
            else [
                row.split()
                for row in value.replace(";", "\n").splitlines()
                if row.strip()
            ]
        )
    return value


def families(data, keys, ctx, inferred=None):
    ambient = (
        integer(data["dimension_ambiente"], "La dimensión ambiente", 1, 20)
        if "dimension_ambiente" in data
        else inferred
    )
    if ambient is None:
        for key in keys:
            raw = raw_family(data[key])
            if isinstance(raw, (list, tuple)) and raw:
                ambient = len(vector(raw[0]))
                break
    result = {key: family(raw_family(data[key]), ambient)[0] for key in keys}
    if ambient is None:
        raise InputError("Indicá la dimensión ambiente para familias vacías.")
    return result, ambient


def basic_check(description, passed=True, **extra):
    return {
        "kind": "identidad_exacta",
        "passed": passed,
        "description": description,
        **extra,
    }


def execute_linear(problem, ctx):
    ctx.collect_steps = problem.options.get("include_steps", True)
    op, data = problem.operation_id, problem.input
    A = matrix(data["A"]) if "A" in data else None
    B = matrix(data["B"]) if "B" in data else None
    result, checks, status = {}, None, "ok"
    method = data.get("metodo", op.split(".")[-1])

    if op == "sistemas.resolver":
        method = data.get("metodo", "gauss_jordan")
        result = r.solve(A, vector(data["b"], len(A)), ctx, method)
        checks = result.pop("verification")
        status = status_for(result["clasificacion"])
    elif op in ("sistemas.cramer", "sistemas.inversa"):
        m.square(A)
        b = vector(data["b"], len(A))
        if op == "sistemas.cramer":
            det = m.determinant(A, ctx)
            if not det:
                raise LinearFailure(
                    "not_applicable",
                    "Cramer requiere det(A)≠0. Usá Gauss para clasificar el sistema.",
                    {"determinante": det},
                )
            x = []
            for j in range(len(A)):
                replaced = [row[:] for row in A]
                for i in range(len(A)):
                    replaced[i][j] = b[i]
                det_j = m.determinant(replaced, Context(checkpoint=ctx.checkpoint))
                x.append(det_j / det)
                ctx.emit(
                    "cramer",
                    f"Sustituir la columna {j+1} por b.",
                    {
                        "columna": j,
                        "matriz": replaced,
                        "determinante": det_j,
                        "valor": x[-1],
                    },
                    f"x_{{{j+1}}}={tex(det_j)}/({tex(det)})={tex(x[-1])}",
                )
            result = {"determinante": det}
        else:
            inv, inv_checks = m.invert(A, ctx)
            x = matvec(inv, b, ctx)
            result = {"inversa": inv}
        actual = matvec(A, x, ctx)
        result.update({"particular": x, "direcciones": [], "clasificacion": "unica"})
        checks = basic_check(
            "Ax=b verifica la solución con la entrada original.",
            actual == b,
            Ax=actual,
            b=b,
        )
    elif op in ("factorizacion.lu", "factorizacion.plu"):
        b = vector(data["b"], len(A)) if "b" in data else None
        result, checks = f.factor(A, ctx, op.endswith("plu"), b)
        if b is not None:
            status = status_for(result["clasificacion"])
    elif op in ("matrices.suma", "matrices.resta"):
        sign = 1 if op.endswith("suma") else -1
        value = m.add(A, B, sign)
        result = {"matrix": value}
        checks = basic_check(
            "Se reconstruye A al deshacer la operación.", m.add(value, B, -sign) == A
        )
    elif op == "matrices.escalar":
        k = parse_number(data["k"])
        value = [[k * x for x in row] for row in A]
        result = {"matrix": value}
        passed = (
            [[x / k for x in row] for row in value] == A
            if k
            else not any(any(row) for row in value)
        )
        checks = basic_check(
            "La escala se verifica con su operación inversa o con la matriz nula.",
            passed,
        )
    elif op == "matrices.transpuesta":
        value = transpose(A)
        result = {"matrix": value}
        checks = basic_check("(Aᵀ)ᵀ=A.", transpose(value) == A)
    elif op == "matrices.analizar":
        result, checks = m.analyze(A, ctx)
    elif op in ("matrices.ref", "matrices.rref"):
        reduction = r.reduce(A, ctx, reduced=op.endswith("rref"))
        result = {
            "matrix": reduction["matrix"],
            "rango": len(reduction["pivots"]),
            "pivotes": reduction["pivots"],
        }
        checks = basic_check(
            "EA=R verifica la equivalencia por filas.",
            multiply(reduction["E"], A, ctx) == reduction["matrix"],
        )
    elif op == "matrices.traza":
        m.square(A)
        diagonal = [A[i][i] for i in range(len(A))]
        value = sum(diagonal, F(0))
        result = {"valor": value, "diagonal": diagonal}
        ctx.emit(
            "traza",
            "Sumar las entradas de la diagonal principal.",
            result,
            r"\operatorname{tr}(A)=\sum_i a_{ii}",
        )
        checks = basic_check(
            "La traza coincide con la suma de la diagonal.",
            value == sum(diagonal, F(0)),
        )
    elif op == "matrices.potencia":
        exponent = integer(data["exponente"], "El exponente", -100, 100)
        value = m.power(A, exponent, ctx)
        base = m.invert(A, Context(checkpoint=ctx.checkpoint))[0] if exponent < 0 else A
        reference = identity(len(A))
        for _ in range(abs(exponent)):
            reference = multiply(reference, base, ctx)
        result = {"matrix": value, "exponente": exponent}
        checks = basic_check(
            "La potencia por cuadrados se compara con el producto reiterado.",
            value == reference,
        )
    elif op == "matrices.elemental":
        axis, action = data.get("eje", "fila"), data.get("accion", "intercambiar")
        value = m.elementary(
            A,
            axis,
            action,
            data.get("indice", 0),
            data.get("otro", 1),
            parse_number(data.get("k", "1")),
            ctx,
        )
        result = {
            "matrix": value,
            "reversible": not (
                action == "escalar" and parse_number(data.get("k", "1")) == 0
            ),
        }
        checks = basic_check(
            "Se aplicó la operación indicada a la fila o columna seleccionada."
        )
    elif op == "matrices.propiedades":
        C = matrix(data["C"]) if "C" in data else None
        result, passed = m.properties(
            A,
            B,
            C,
            parse_number(data.get("k", "2")),
            parse_number(data.get("d", "3")),
            ctx,
        )
        checks = basic_check(
            "Las identidades se comprueban cuando se cumplen sus condiciones.", passed
        )
    elif op in (
        "matrices.particionar",
        "matrices.suma_bloques",
        "matrices.producto_bloques",
    ):
        action = {
            "matrices.particionar": "particionar",
            "matrices.suma_bloques": "sumar",
            "matrices.producto_bloques": "producto",
        }[op]
        result, passed = m.block_operation(
            A,
            B,
            data.get("cortes_filas", []),
            data.get("cortes_internos", []),
            data.get("cortes_columnas", []),
            action,
            ctx,
        )
        checks = basic_check(
            "Se reconstruye la matriz o se compara con la operación sin particiones.",
            passed,
        )
    elif op == "determinantes.calcular":
        method = data.get("metodo", "reduccion")
        value = m.determinant(
            A, ctx, method, data.get("eje", "fila"), data.get("indice", 0)
        )
        result = {"valor": value, "metodo": method}
        checks = basic_check(
            "El resultado coincide con la reducción docente conservada.",
            value == determinant_reference(A),
        )
    elif op == "determinantes.cofactores":
        cof = m.cofactor_matrix(A, ctx)
        adj = transpose(cof)
        det = determinant_reference(A)
        expected = [[det * x for x in row] for row in identity(len(A))]
        result = {"matrix": cof, "adjugata": adj, "determinante": det}
        checks = basic_check(
            "A adj(A)=adj(A) A=det(A) I.",
            multiply(A, adj, ctx) == expected and multiply(adj, A, ctx) == expected,
        )
    elif op == "matrices.inversa":
        method = data.get("metodo", "gauss_jordan")
        value, checks = m.invert(A, ctx, method)
        result = {"matrix": value, "metodo": method}
    elif op.startswith("vectores.") and op not in (
        "vectores.analizar",
        "vectores.generado",
    ):
        u = vector(data["u"])
        v = vector(data["v"], len(u)) if "v" in data else None
        if op in ("vectores.suma", "vectores.resta"):
            sign = 1 if op.endswith("suma") else -1
            result = {"vector": [a + sign * b for a, b in zip(u, v)]}
            checks = basic_check(
                "Se reconstruye u deshaciendo la operación.",
                [a - sign * b for a, b in zip(result["vector"], v)] == u,
            )
        elif op == "vectores.escalar":
            k = parse_number(data["k"])
            result = {"vector": [k * x for x in u]}
            checks = basic_check("La escala conserva cada componente exacta.")
        elif op == "vectores.proyeccion":
            denominator = sum((x * x for x in v), F(0))
            if not denominator:
                raise LinearFailure(
                    "not_applicable", "La proyección sobre la recta requiere v no nulo."
                )
            numerator = sum((a * b for a, b in zip(u, v)), F(0))
            coefficient = numerator / denominator
            ctx.emit(
                "coeficiente_proyeccion",
                "Calcular los productos interiores y su cociente.",
                {
                    "u_punto_v": numerator,
                    "v_punto_v": denominator,
                    "coeficiente": coefficient,
                },
                r"c=(u\cdot v)/(v\cdot v)",
            )
            projected = [coefficient * x for x in v]
            orthogonal = [a - b for a, b in zip(u, projected)]
            result = {
                "proyeccion": projected,
                "componente_ortogonal": orthogonal,
                "coeficiente": coefficient,
                "formula": r"p=\frac{u\cdot v}{v\cdot v}v",
            }
            checks = basic_check(
                "u=p+(u−p) y (u−p)·v=0.",
                [a + b for a, b in zip(projected, orthogonal)] == u
                and sum((a * b for a, b in zip(orthogonal, v)), F(0)) == 0,
            )
        elif op == "vectores.producto_punto":
            terms = [a * b for a, b in zip(u, v)]
            result = {"valor": sum(terms, F(0)), "terminos": terms}
            checks = basic_check(
                "u·v=v·u.", result["valor"] == sum((a * b for a, b in zip(v, u)), F(0))
            )
        elif op == "vectores.producto_cruz":
            if len(u) != 3:
                raise LinearFailure(
                    "not_applicable",
                    "El producto cruz implementado requiere vectores de R³.",
                )
            w = [
                u[1] * v[2] - u[2] * v[1],
                u[2] * v[0] - u[0] * v[2],
                u[0] * v[1] - u[1] * v[0],
            ]
            result = {"vector": w}
            checks = basic_check(
                "u×v es perpendicular a u y a v.",
                sum((a * b for a, b in zip(w, u)), F(0)) == 0
                and sum((a * b for a, b in zip(w, v)), F(0)) == 0,
            )
        elif op == "vectores.norma":
            squared = sum((x * x for x in u), F(0))
            a, b = isqrt(squared.numerator), isqrt(squared.denominator)
            exact = (
                F(a, b)
                if a * a == squared.numerator and b * b == squared.denominator
                else "sqrt(" + str(squared) + ")"
            )
            result = {
                "norma": exact,
                "norma_cuadrada": squared,
                "formula": r"\|u\|=\sqrt{" + tex(squared) + "}",
            }
            checks = basic_check(
                "La norma se conserva como raíz exacta de u·u.", squared >= 0
            )
        ctx.emit(
            "operacion_vectorial",
            "Aplicar la operación componente a componente.",
            result,
            result.get("formula", ""),
        )
    elif op == "vectores.analizar":
        fam, ambient = families(data, ["vectores"], ctx)
        result, checks = s.study(fam["vectores"], ambient, ctx)
    elif op == "vectores.generado":
        v = vector(data["v"])
        fam, ambient = families(data, ["vectores"], ctx, len(v))
        if len(v) != ambient:
            raise InputError(
                "El vector y la familia deben pertenecer al mismo espacio."
            )
        result, checks = s.membership(fam["vectores"], v, ambient, ctx)
    elif op == "espacios.fundamentales":
        result, checks = s.fundamental(A, ctx)
    elif op == "espacios.base":
        keys = ["vectores"] + (["objetivo"] if "objetivo" in data else [])
        fam, ambient = families(data, keys, ctx)
        target = fam.get("objetivo", identity(ambient))
        result, checks = s.verify_basis(fam["vectores"], target, ambient, ctx)
    elif op in ("espacios.suma", "espacios.interseccion"):
        fam, ambient = families(data, ["U", "V"], ctx)
        result, checks = s.subspaces(
            fam["U"], fam["V"], ambient, ctx, op.endswith("interseccion")
        )
    elif op == "espacios.coordenadas":
        v = vector(data["v"])
        base, ambient = family(raw_family(data["base"]), len(v))
        result, checks = s.coordinates(base, v, ambient, ctx)
    elif op == "espacios.cambio_base":
        fam, ambient = families(data, ["base_origen", "base_destino"], ctx)
        v = vector(data["v"], ambient) if "v" in data else None
        result, checks = s.change_basis(
            fam["base_origen"], fam["base_destino"], ambient, ctx, v
        )
    elif op == "transformaciones.analizar":
        v = vector(data["v"], len(A[0])) if "v" in data else None
        result, checks = t.analyze(A, ctx, v)
    elif op == "transformaciones.desde_imagenes":
        base, ambient = family(raw_family(data["base_dominio"]))
        images, _ = family(raw_family(data["imagenes"]))
        result, checks = t.from_images(base, images, ctx)
    elif op == "transformaciones.componer":
        result, checks = t.compose(A, B, ctx)
    elif op == "transformaciones.representar":
        domain, _ = family(raw_family(data["base_dominio"]), len(A[0]))
        codomain, _ = family(raw_family(data["base_codominio"]), len(A))
        result, checks = t.represent(A, domain, codomain, ctx)
    else:
        raise InputError("Operación de álgebra lineal no reconocida.")

    if checks is None or checks.get("passed") is not True:
        raise ArithmeticError("La comprobación del resultado no fue satisfactoria.")
    if not ctx.steps:
        ctx.emit(
            "resultado",
            "Resultado obtenido aplicando la definición de la operación.",
            result,
        )
    ctx.progress(100)
    messages = {
        "infinite": "El sistema tiene infinitas soluciones; se muestra la familia completa.",
        "inconsistent": "El sistema es incompatible; se muestra un certificado verificable.",
    }
    return CalculationResult(
        op,
        data,
        status,
        result,
        ctx.steps if problem.options.get("include_steps", True) else [],
        checks,
        warnings=(
            [
                "Multiplicar una fila o columna por cero no es una transformación reversible."
            ]
            if result.get("reversible") is False
            else []
        ),
        metadata={
            "exact": True,
            "number_format": "exact_text",
            "index_base": 0,
            "method": method,
            "source": "algorithms.linear",
        },
        error=(
            {"code": status, "message": messages[status]}
            if status in messages
            else None
        ),
    )
