"""Auditoría independiente del contrato público. SymPy se usa solo en pruebas."""

from collections import Counter
from fractions import Fraction
import json
from pathlib import Path
import random
import sympy as S
from nexolineal.application.service import execute

ROOT = Path(__file__).resolve().parents[1]


def M(rows):
    return S.Matrix([[S.Rational(str(x)) for x in row] for row in rows])


def cols(vectors, ambient):
    return (
        S.Matrix.hstack(*(M([v]).T for v in vectors))
        if vectors
        else S.zeros(ambient, 0)
    )


def values(mat):
    return [[str(x) for x in row] for row in mat.tolist()]


class Audit:
    def __init__(self):
        self.checks = 0
        self.calls = Counter()
        self.rng = random.Random(20261117)

    def check(self, condition, message):
        self.checks += 1
        if not condition:
            raise AssertionError(message)

    def call(self, op, data, status=None):
        self.calls[op] += 1
        response = execute({"schema_version": "1.0", "operation_id": op, "input": data})
        self.check(
            response["status"]
            not in ("internal_error", "invalid_input", "limit_reached"),
            (op, data, response),
        )
        if status:
            self.check(response["status"] == status, (op, data, response))
        if response["result"] is not None and response["status"] in (
            "ok",
            "infinite",
            "inconsistent",
        ):
            self.check(response["verification"].get("passed") is True, (op, response))
        return response

    def random_matrix(self, m, n):
        return S.Matrix(
            m,
            n,
            [
                S.Rational(self.rng.randint(-3, 3), self.rng.randint(1, 3))
                for _ in range(m * n)
            ],
        )

    def solution(self, A, b, response):
        result = response["result"]
        rank = A.rank()
        expected = (
            "inconsistent"
            if A.row_join(b).rank() > rank
            else "infinite" if rank < A.cols else "ok"
        )
        self.check(response["status"] == expected, ("clasificación", A, b, response))
        if expected != "inconsistent":
            x = M([result["particular"]]).T
            V = cols(result["direcciones"], A.cols)
            self.check(A * x == b, ("Axp=b", A, b, result))
            self.check(A * V == S.zeros(A.rows, V.cols), ("Av=0", A, result))
            self.check(
                V.cols == V.rank() == A.cols - rank, ("familia completa", A, result)
            )
        else:
            cert = result.get("certificado_original", result.get("certificado"))
            if cert:
                y = M([cert["y"]])
                self.check(
                    y * A == S.zeros(1, A.cols) and (y * b)[0] != 0,
                    ("certificado original", A, b, cert),
                )

    def replay(self, A, b, response):
        current = A.row_join(b)
        for index, step in enumerate(response["steps"]):
            self.check(step["id"] == index, "índices de pasos")
            d = step["data"]
            if step["kind"] not in ("intercambio", "escala_fila", "suma_filas"):
                continue
            self.check(M(d["antes"]) == current, "matriz anterior de un paso")
            if step["kind"] == "intercambio":
                current.row_swap(d["fila"], d["otra_fila"])
            elif step["kind"] == "escala_fila":
                i = d["fila"]
                k = S.Rational(d["factor"])
                current.row_op(i, lambda value, _: value * k)
            else:
                i, j = d["destino"], d["origen"]
                k = S.Rational(d["factor"])
                origin = list(current.row(j))
                current.row_op(i, lambda value, col: value + k * origin[col])
            self.check(M(d["matriz"]) == current, "operación de fila reproducible")
        self.check(
            current == M(response["result"]["matrix"]),
            "último estado del procedimiento",
        )

    def matrices_and_systems(self):
        for m in range(1, 6):
            for n in range(1, 6):
                for sample in range(3):
                    A = self.random_matrix(m, n) if sample else S.zeros(m, n)
                    data = {"A": values(A)}
                    R = A.rref()[0]
                    out = self.call("matrices.rref", data, "ok")
                    self.check(M(out["result"]["matrix"]) == R, "RREF de referencia")
                    ref = self.call("matrices.ref", data, "ok")
                    self.check(
                        M(ref["result"]["matrix"]).rref()[0] == R, "REF equivalente"
                    )
                    analysis = self.call("matrices.analizar", data, "ok")["result"]
                    self.check(analysis["rango"] == A.rank(), "rango")
                    fund = self.call("espacios.fundamentales", data, "ok")["result"]
                    C, N = cols(fund["base_columna"], m), cols(fund["base_nucleo"], n)
                    row = cols(fund["base_fila"], n)
                    self.check(
                        C.cols == C.rank() == A.rank(), "base columna independiente"
                    )
                    self.check(
                        A.row_join(C).rank() == A.rank(), "espacio columna original"
                    )
                    self.check(
                        row.cols == row.rank() == A.rank()
                        and A.T.row_join(row).rank() == A.rank(),
                        "espacio fila",
                    )
                    self.check(
                        N.cols == N.rank() == n - A.rank()
                        and A * N == S.zeros(m, N.cols),
                        "base núcleo y rango-nulidad",
                    )
                    x = self.random_matrix(n, 1)
                    b = A * x if sample % 2 else self.random_matrix(m, 1)
                    for method in ("gauss", "gauss_jordan"):
                        out = self.call(
                            "sistemas.resolver",
                            {**data, "b": [str(v) for v in b], "metodo": method},
                        )
                        self.solution(A, b, out)
                        self.replay(A, b, out)
                    for pivot in (False, True):
                        op = "factorizacion.plu" if pivot else "factorizacion.lu"
                        out = self.call(op, {**data, "b": [str(v) for v in b]})
                        if out["status"] == "not_applicable":
                            self.check(not pivot, "PLU admite pivoteo rectangular")
                            continue
                        f = out["result"]
                        P, L, U = M(f["P"]), M(f["L"]), M(f["U"])
                        self.check(P * A == L * U, "PA=LU")
                        self.check(
                            P * P.T == S.eye(m) and all(v in (0, 1) for v in P),
                            "P permutación",
                        )
                        self.check(
                            L.is_lower and all(L[i, i] == 1 for i in range(m)),
                            "L inferior unitaria",
                        )
                        self.solution(A, b, out)
                    B = self.random_matrix(m, n)
                    self.check(
                        M(
                            self.call("matrices.suma", {**data, "B": values(B)}, "ok")[
                                "result"
                            ]["matrix"]
                        )
                        == A + B,
                        "suma",
                    )
                    self.check(
                        M(
                            self.call("matrices.resta", {**data, "B": values(B)}, "ok")[
                                "result"
                            ]["matrix"]
                        )
                        == A - B,
                        "resta",
                    )
                    self.check(
                        M(
                            self.call("matrices.transpuesta", data, "ok")["result"][
                                "matrix"
                            ]
                        )
                        == A.T,
                        "transpuesta",
                    )
                    self.check(
                        M(
                            self.call("matrices.escalar", {**data, "k": "-2/3"}, "ok")[
                                "result"
                            ]["matrix"]
                        )
                        == -A * 2 / 3,
                        "escalar",
                    )
                    B = self.random_matrix(n, 3)
                    product = self.call(
                        "matrices.producto_bloques",
                        {
                            **data,
                            "B": values(B),
                            "cortes_filas": [1] if m > 1 else [],
                            "cortes_internos": [1] if n > 1 else [],
                            "cortes_columnas": [1],
                        },
                        "ok",
                    )
                    self.check(
                        M(product["result"]["matrix"]) == A * B, "producto por bloques"
                    )
                    self.check(
                        M(
                            self.call(
                                "matrices.producto", {**data, "B": values(B)}, "ok"
                            )["result"]["matrix"]
                        )
                        == A * B,
                        "producto común",
                    )
                    block_sum = self.call(
                        "matrices.suma_bloques",
                        {
                            **data,
                            "B": values(A),
                            "cortes_filas": [],
                            "cortes_columnas": [],
                        },
                        "ok",
                    )
                    self.check(
                        M(block_sum["result"]["matrix"]) == 2 * A, "suma por bloques"
                    )
                    split = self.call("matrices.particionar", data, "ok")["result"]
                    self.check(M(split["bloques"][0][0]) == A, "partición sin cortes")
                    self.call(
                        "matrices.propiedades",
                        {**data, "B": values(A), "C": values(A)},
                        "ok",
                    )
                    for axis, count in (("fila", m), ("columna", n)):
                        for action in (
                            ("intercambiar", "escalar", "sumar")
                            if count > 1
                            else ("escalar",)
                        ):
                            expected = A.copy()
                            k = S.Rational(-2, 3)
                            if action == "intercambiar":
                                (
                                    expected.row_swap
                                    if axis == "fila"
                                    else expected.col_swap
                                )(0, 1)
                            else:
                                old = expected.copy()
                                if axis == "fila":
                                    expected.row_op(
                                        0,
                                        lambda value, j: (
                                            value * k
                                            if action == "escalar"
                                            else value + k * old[1, j]
                                        ),
                                    )
                                else:
                                    expected.col_op(
                                        0,
                                        lambda value, i: (
                                            value * k
                                            if action == "escalar"
                                            else value + k * old[i, 1]
                                        ),
                                    )
                            out = self.call(
                                "matrices.elemental",
                                {
                                    **data,
                                    "eje": axis,
                                    "accion": action,
                                    "indice": 0,
                                    "otro": 1,
                                    "k": str(k),
                                },
                                "ok",
                            )
                            self.check(
                                M(out["result"]["matrix"]) == expected,
                                "operación por filas o columnas",
                            )
                    if m == n:
                        det = A.det()
                        for method in ("reduccion", "cofactores") + (
                            ("sarrus",) if n == 3 else ()
                        ):
                            d = self.call(
                                "determinantes.calcular",
                                {**data, "metodo": method},
                                "ok",
                            )["result"]["valor"]
                            self.check(
                                S.Rational(d) == det, "determinante por " + method
                            )
                        cof = self.call("determinantes.cofactores", data, "ok")[
                            "result"
                        ]
                        self.check(
                            M(cof["matrix"]) == A.cofactor_matrix(), "cofactores"
                        )
                        self.check(M(cof["adjugata"]) == A.adjugate(), "adjugata")
                        for method in ("gauss_jordan", "adjugata"):
                            out = self.call(
                                "matrices.inversa",
                                {**data, "metodo": method},
                                "ok" if det else "singular",
                            )
                            if det:
                                self.check(
                                    M(out["result"]["matrix"]) == A.inv(),
                                    "inversa por " + method,
                                )
                        for op in ("sistemas.cramer", "sistemas.inversa"):
                            out = self.call(
                                op,
                                {**data, "b": [str(v) for v in b]},
                                (
                                    "ok"
                                    if det
                                    else (
                                        "not_applicable"
                                        if op.endswith("cramer")
                                        else "singular"
                                    )
                                ),
                            )
                            if det:
                                self.solution(A, b, out)
                        self.check(
                            S.Rational(
                                self.call("matrices.traza", data, "ok")["result"][
                                    "valor"
                                ]
                            )
                            == S.trace(A),
                            "traza",
                        )
                        for exponent in (0, 3) + ((-2,) if det else ()):
                            out = self.call(
                                "matrices.potencia",
                                {**data, "exponente": exponent},
                                "ok",
                            )
                            self.check(
                                M(out["result"]["matrix"]) == A**exponent, "potencia"
                            )

    def spaces_and_coordinates(self):
        for d in range(1, 5):
            for a in range(4):
                for b in range(4):
                    U, V = self.random_matrix(d, a), self.random_matrix(d, b)
                    inputs = {
                        "U": values(U.T),
                        "V": values(V.T),
                        "dimension_ambiente": d,
                    }
                    for operation in ("suma", "interseccion"):
                        out = self.call("espacios." + operation, inputs, "ok")["result"]
                        B = cols(out["base"], d)
                        expected = (
                            U.row_join(V).rank()
                            if operation == "suma"
                            else U.rank() + V.rank() - U.row_join(V).rank()
                        )
                        self.check(
                            B.cols == B.rank() == expected, "dimensión de " + operation
                        )
                        if operation == "interseccion":
                            self.check(
                                U.row_join(B).rank() == U.rank()
                                and V.row_join(B).rank() == V.rank(),
                                "inclusión de la intersección",
                            )
                        else:
                            self.check(
                                B.row_join(U).row_join(V).rank() == B.rank(),
                                "generación de la suma",
                            )
                    study = self.call(
                        "vectores.analizar",
                        {"vectores": values(U.T), "dimension_ambiente": d},
                        "ok",
                    )["result"]
                    self.check(
                        study["independiente"] == (U.rank() == a), "independencia"
                    )
                    relations = cols(study["relaciones_dependencia"], a)
                    self.check(
                        U * relations == S.zeros(d, relations.cols)
                        and relations.rank() == a - U.rank(),
                        "relaciones de dependencia",
                    )
                    v = self.random_matrix(d, 1)
                    member = self.call(
                        "vectores.generado",
                        {"vectores": values(U.T), "v": [str(x) for x in v]},
                        "ok",
                    )["result"]
                    self.check(
                        member["pertenece"] == (U.row_join(v).rank() == U.rank()),
                        "pertenencia al generado",
                    )
                    target = values(U.T)
                    base = (
                        values(S.Matrix.hstack(*U.columnspace()).T) if U.rank() else []
                    )
                    verified = self.call(
                        "espacios.base",
                        {"vectores": base, "objetivo": target, "dimension_ambiente": d},
                        "ok",
                    )["result"]
                    self.check(
                        verified["es_base"], "base respecto de espacio declarado"
                    )
            B = S.eye(d)
            for i in range(d - 1):
                B[i, i + 1] = 2
            C = S.eye(d) * 2
            v = self.random_matrix(d, 1)
            args = {
                "base_origen": values(B.T),
                "base_destino": values(C.T),
                "v": [str(x) for x in v],
            }
            out = self.call("espacios.cambio_base", args, "ok")["result"]
            self.check(
                M(out["matrix"]) == C.inv() * B, "orientación del cambio de base"
            )
            out = self.call(
                "espacios.coordenadas",
                {"base": values(B.T), "v": [str(x) for x in v]},
                "ok",
            )["result"]
            self.check(M([out["coordenadas"]]).T == B.inv() * v, "coordenadas")

    def transformations_and_vectors(self):
        for m in range(1, 5):
            for n in range(1, 5):
                A = self.random_matrix(m, n)
                v = self.random_matrix(n, 1)
                analysis = self.call(
                    "transformaciones.analizar",
                    {"A": values(A), "v": [str(x) for x in v]},
                    "ok",
                )["result"]
                self.check(
                    analysis["inyectiva"] == (A.rank() == n)
                    and analysis["sobreyectiva"] == (A.rank() == m),
                    "clasificación transformación",
                )
                self.check(
                    M([analysis["imagen_vector"]]).T == A * v,
                    "evaluación transformación",
                )
                B = S.eye(n)
                C = S.eye(m) * 2
                if n > 1:
                    B[0, 1] = 3
                images = A * B
                out = self.call(
                    "transformaciones.desde_imagenes",
                    {"base_dominio": values(B.T), "imagenes": values(images.T)},
                    "ok",
                )["result"]
                self.check(M(out["matrix"]) == A, "matriz desde imágenes")
                out = self.call(
                    "transformaciones.representar",
                    {
                        "A": values(A),
                        "base_dominio": values(B.T),
                        "base_codominio": values(C.T),
                    },
                    "ok",
                )["result"]
                self.check(
                    M(out["matrix"]) == C.inv() * A * B, "representación en bases"
                )
                D = self.random_matrix(n, 3)
                out = self.call(
                    "transformaciones.componer", {"A": values(A), "B": values(D)}, "ok"
                )["result"]
                self.check(M(out["matrix"]) == A * D, "orientación de composición")
        for d in range(1, 6):
            for _ in range(6):
                u, v = self.random_matrix(d, 1), self.random_matrix(d, 1)
                inputs = {"u": [str(x) for x in u], "v": [str(x) for x in v]}
                for op, expected in (("suma", u + v), ("resta", u - v)):
                    self.check(
                        M(
                            [
                                self.call("vectores." + op, inputs, "ok")["result"][
                                    "vector"
                                ]
                            ]
                        ).T
                        == expected,
                        "operación vectorial",
                    )
                self.check(
                    S.Rational(
                        self.call("vectores.producto_punto", inputs, "ok")["result"][
                            "valor"
                        ]
                    )
                    == u.dot(v),
                    "producto punto",
                )
                norm = self.call("vectores.norma", {"u": inputs["u"]}, "ok")["result"]
                self.check(
                    S.simplify(S.sympify(norm["norma"]) - S.sqrt(u.dot(u))) == 0,
                    "norma exacta",
                )
                self.check(
                    M(
                        [
                            self.call(
                                "vectores.escalar", {"u": inputs["u"], "k": "0"}, "ok"
                            )["result"]["vector"]
                        ]
                    ).T
                    == S.zeros(d, 1),
                    "escalar cero",
                )
                if d == 3:
                    self.check(
                        M(
                            [
                                self.call("vectores.producto_cruz", inputs, "ok")[
                                    "result"
                                ]["vector"]
                            ]
                        ).T
                        == u.cross(v),
                        "producto cruz",
                    )

    def run(self):
        self.matrices_and_systems()
        self.spaces_and_coordinates()
        self.transformations_and_vectors()
        report = {
            "approved": True,
            "seed": 20261117,
            "reference": "SymPy " + S.__version__,
            "checks": self.checks,
            "calls": sum(self.calls.values()),
            "operations": dict(sorted(self.calls.items())),
        }
        output = ROOT / "evidencia-fase04"
        output.mkdir(exist_ok=True)
        (output / "auditoria.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print("NEXO_FASE04_AUDIT=" + json.dumps(report, ensure_ascii=False))
        return report


if __name__ == "__main__":
    Audit().run()
