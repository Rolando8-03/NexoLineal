"""Auditoría con SymPy de vértices, proyecciones y cuadrículas; semilla fija."""

from fractions import Fraction as F
from pathlib import Path
import json
import random
import sympy as sp
from nexolineal.application.service import execute
from nexolineal.application.learning import APPLICATIONS


def audit():
    rng = random.Random(2026111707)
    checks = 0
    calls = 0

    def require(condition):
        nonlocal checks
        checks += 1
        if not condition:
            raise AssertionError("Invariante geométrica " + str(checks))

    def run(op, data):
        nonlocal calls
        calls += 1
        return execute(
            {
                "schema_version": "1.0",
                "operation_id": op,
                "input": data,
                "options": {"include_visualization": True},
            }
        )

    # El mismo sistema puede ser único, incompatible, indeterminado o degenerado.
    for dim in (2, 3):
        for trial in range(120):
            rows = rng.randrange(1, 5)
            A = [[rng.randrange(-4, 5) for _ in range(dim)] for _ in range(rows)]
            b = [rng.randrange(-5, 6) for _ in range(rows)]
            r = run("sistemas.resolver", {"A": A, "b": b})
            s = r["metadata"]["visualization"]
            require(s["kind"] == "system")
            for item in s["series"]:
                if item["label"].startswith("Ecuación "):
                    i = int(item["label"].split()[-1]) - 1
                    for p in item["points"]:
                        require(
                            (
                                sp.Matrix([A[i]])
                                * sp.Matrix([sp.Rational(x) for x in p])
                            )[0]
                            == b[i]
                        )
                elif item["label"] in (
                    "Solución particular",
                    "Familia de soluciones",
                    "Plano de soluciones",
                ):
                    for p in item["points"]:
                        require(
                            sp.Matrix(A) * sp.Matrix([sp.Rational(x) for x in p])
                            == sp.Matrix(b)
                        )
            require(
                (r["status"] == "inconsistent")
                == (sp.Matrix(A).rank() != sp.Matrix(A).row_join(sp.Matrix(b)).rank())
            )
    for dim in (2, 3):
        for trial in range(80):
            u = [rng.randrange(-7, 8) for _ in range(dim)]
            v = [rng.randrange(-7, 8) for _ in range(dim)]
            if not any(v):
                v[0] = 1
            r = run("vectores.proyeccion", {"u": u, "v": v})
            p = sp.Matrix([sp.Rational(x) for x in r["result"]["proyeccion"]])
            U, V = sp.Matrix(u), sp.Matrix(v)
            expected = (U.dot(V) / V.dot(V)) * V
            require(p == expected)
            require((U - p).dot(V) == 0)
            require(r["verification"]["passed"])
    for trial in range(40):
        a, b = rng.randrange(-5, 6), rng.randrange(-5, 6)
        r = run("vectores.generado", {"vectores": "1 1;1 -1", "v": [a + b, a - b]})
        items = r["metadata"]["visualization"]["series"]
        require(r["result"]["coeficientes"] == [str(a), str(b)])
        final = next(
            item for item in items if item["label"] == "Reconstrucción del objetivo"
        )
        require(list(map(F, final["points"][-1])) == [a + b, a - b])
    for trial in range(100):
        A = [[rng.randrange(-3, 4) for _ in range(2)] for _ in range(2)]
        r = run("transformaciones.analizar", {"A": A})
        items = r["metadata"]["visualization"]["series"]
        for source, target in zip(items[::2], items[1::2]):
            for p, q in zip(source["points"], target["points"]):
                require(
                    sp.Matrix(A) * sp.Matrix([sp.Rational(x) for x in p])
                    == sp.Matrix([sp.Rational(x) for x in q])
                )
    for method, extra in {
        "biseccion": {"inferior": "1", "superior": "2"},
        "falsa_posicion": {"inferior": "1", "superior": "2"},
        "newton": {"inicial": "2"},
        "secante": {"anterior": "1", "inicial": "2"},
    }.items():
        for constant in ("2", "3"):
            r = run("raices." + method, {"expresion": "x^2-" + constant, **extra})
            s = r["metadata"]["visualization"]
            for item in s["series"]:
                for x, y in item["points"]:
                    require(abs(F(y) - (F(x) ** 2 - int(constant))) < F(1, 10**30))
            for frame, row, step in zip(s["frames"], r["result"]["tabla"], r["steps"]):
                require(frame["values"] == row == step["data"])
                if "derivada_x" in row:
                    require(
                        abs(F(row["derivada_x"]) - 2 * F(row["x_anterior"]))
                        < F(1, 10**30)
                    )
                if "a" in row:
                    require(F(row["a"]) < F(row["x"]) < F(row["b"]))
    for app in APPLICATIONS:
        r = run(app["problem"]["operation_id"], app["problem"]["input"])
        require(r["metadata"]["application"]["passed"])
    report = {
        "approved": True,
        "seed": 2026111707,
        "reference": "SymPy " + sp.__version__,
        "calls": calls,
        "checks": checks,
        "systems": 240,
        "projections": 160,
        "combinations": 40,
        "transformations": 100,
        "root_examples": 8,
        "applications": 5,
    }
    out = Path("evidencia-fase07")
    out.mkdir(exist_ok=True)
    (out / "auditoria.json").write_text(json.dumps(report, indent=2) + "\n")
    print("NEXO_FASE07_AUDIT=" + json.dumps(report))


if __name__ == "__main__":
    audit()
