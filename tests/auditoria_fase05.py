"""Contraste independiente con SymPy y reconstrucciones de cada tabla numérica."""

from collections import Counter
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
import itertools, json, random
from pathlib import Path
import sympy as s
from nexolineal.application.service import execute

rng = random.Random(2026111705)
checks = 0
calls = Counter()


def check(condition, details=""):
    global checks
    checks += 1
    if not condition:
        raise AssertionError(details)


def run(op, **data):
    calls[op] += 1
    r = execute({"schema_version": "1.0", "operation_id": op, "input": data})
    check(r["status"] == "ok", (op, data, r))
    check(r["verification"]["passed"], (op, r))
    return r["result"]


def rational(v):
    return s.Rational(str(v))


def approx_equal(a, b, tol=s.Rational(1, 10**25)):
    return abs(rational(a) - b) <= tol * (1 + abs(b))


x = s.Symbol("x", positive=True)
for c in [2, 3, 5, 7, 11, 13, 17, 19]:
    for method in ["biseccion", "falsa_posicion", "newton", "secante"]:
        args = {"expresion": f"x^2-{c}"}
        if method in ("biseccion", "falsa_posicion"):
            args.update(inferior="0", superior=str(c + 1))
        else:
            args["inicial"] = str(c)
            if method == "secante":
                args["anterior"] = "0"
        r = run("raices." + method, **args)
        value = rational(r["aproximacion"])
        truth = s.sqrt(c)
        check(abs(float(value) - float(truth)) < 1e-7, (method, c))
        for row in r["tabla"]:
            rx = rational(row["x"])
            fx = rx**2 - c
            check(approx_equal(row["fx"], fx), (method, row))
            check(rational(row["residual"]) == abs(rational(row["fx"])))
            if method in ("biseccion", "falsa_posicion"):
                a, b = rational(row["a"]), rational(row["b"])
                check(a < rx < b)
                check((a * a - c) * (b * b - c) <= 0)
                candidate = (
                    (a + b) / 2
                    if method == "biseccion"
                    else a - (a * a - c) * (b - a) / (b * b - a * a)
                )
                check(approx_equal(row["x"], candidate))
                bound = rational(row["cota_garantizada"])
                check(rx - bound <= truth <= rx + bound)
            else:
                old = rational(row["x_anterior"])
                old_f = old**2 - c
                if method == "newton":
                    candidate = old - old_f / (2 * old)
                else:
                    p = rational(row["anterior"])
                    candidate = old - old_f * (old - p) / (old_f - (p * p - c))
                check(approx_equal(row["x"], candidate), (method, row))
        check(r["aproximacion"] == r["tabla"][-1]["x"])
for method in ["jacobi", "gauss_seidel"]:
    for n in range(1, 5):
        for trial in range(4):
            A = s.Matrix(
                [
                    [rng.randint(-3, 3) if i != j else 0 for j in range(n)]
                    for i in range(n)
                ]
            )
            for i in range(n):
                A[i, i] = sum(abs(A[i, j]) for j in range(n)) + rng.randint(1, 5)
            truth = s.Matrix(
                [s.Rational(rng.randint(-5, 5), rng.randint(1, 4)) for i in range(n)]
            )
            b = A * truth
            r = run(
                "iterativos." + method,
                A=[[str(v) for v in row] for row in A.tolist()],
                b=[str(v) for v in b],
                referencia=[str(v) for v in truth],
            )
            diag = s.diag(*A.diagonal())
            lower = s.zeros(n)
            upper = s.zeros(n)
            for i in range(n):
                for j in range(n):
                    if i > j:
                        lower[i, j] = A[i, j]
                    elif i < j:
                        upper[i, j] = A[i, j]
            divisor = diag if method == "jacobi" else diag + lower
            T = -divisor.inv() * (lower + upper if method == "jacobi" else upper)
            constant = divisor.inv() * b
            for row in r["tabla"]:
                old = s.Matrix([rational(v) for v in row["anterior"]])
                new = s.Matrix([rational(v) for v in row["vector"]])
                check(new == T * old + constant)
                check(s.Matrix([rational(v) for v in row["residual"]]) == A * new - b)
                bound = row["cota_error_infinito"]
                if bound is not None:
                    check(max(abs(v) for v in new - truth) <= rational(bound))
            final = s.Matrix([rational(v) for v in r["vector"]])
            check(max(abs(v) for v in A * final - b) < s.Rational(1, 10**6))


# Conversión independiente de numerales finitos/periódicos por suma posicional.
def numeral_value(text, base):
    sign = -1 if text.startswith("-") else 1
    text = text.lstrip("+-")
    parts = text.split(".")
    whole = parts[0]
    fraction = parts[1] if len(parts) > 1 else ""
    repeat = ""
    if "(" in fraction:
        fraction, repeat = fraction.split("(")
        repeat = repeat[:-1]
    digits = "0123456789ABCDEF"
    v = sum(
        s.Integer(digits.index(c)) * base ** (len(whole) - i - 1)
        for i, c in enumerate(whole)
    )
    v += sum(
        s.Rational(digits.index(c), base ** (i + 1)) for i, c in enumerate(fraction)
    )
    if repeat:
        v += sum(
            s.Rational(digits.index(c), base ** (len(fraction) + i + 1))
            for i, c in enumerate(repeat)
        ) / (1 - s.Rational(1, base ** len(repeat)))
    return sign * v


for origin, target in itertools.product([2, 8, 10, 16], repeat=2):
    for text in ["0", "1", "-10", "10.1", "0.(1)", "-0.01"]:
        for precision in [3, 16]:
            r = run(
                "conversiones.bases",
                numero=text,
                base_origen=str(origin),
                base_destino=str(target),
                precision=str(precision),
            )
            original = numeral_value(text, origin)
            reconstructed = numeral_value(r["numeral"], target)
            check(rational(r["valor_racional"]) == original)
            check(rational(r["valor_conversion_inversa"]) == reconstructed)
            check(
                abs(original - reconstructed)
                == rational(r["error_absoluto_conversion"])
            )
            if r["exacta"]:
                check(reconstructed == original)
            else:
                check(abs(original - reconstructed) < s.Rational(1, target**precision))
for i in range(30):
    a = s.Rational(rng.randint(-20, 20), rng.randint(1, 9))
    ref = s.Rational(rng.randint(-20, 20), rng.randint(1, 9))
    r = run("errores.calcular", aproximado=str(a), referencia=str(ref), anterior="0")
    check(rational(r["respecto_referencia"]["absoluto"]) == abs(a - ref))
    if ref:
        check(rational(r["respecto_referencia"]["relativo"]) == abs(a - ref) / abs(ref))
    else:
        check(r["respecto_referencia"]["relativo"] is None)
for expression in [
    "x^2",
    "(x+1)^4",
    "sin(2*x+1)",
    "cos(3*x)",
    "exp(-2*x)",
    "1/x",
    "pi*x",
    "exp(1)*x",
    "2*sin(x)+x^3",
]:
    r = run("calculo.primitiva", expresion=expression)
    expression = s.sympify(
        expression.replace("^", "**"), locals={"x": x, "ln": s.log, "abs": s.Abs}
    )
    primitive = s.sympify(
        r["primitiva_sin_constante"].replace("^", "**"),
        locals={"x": x, "ln": s.log, "abs": s.Abs},
    )
    check(s.simplify(s.diff(primitive, x) - expression) == 0, primitive)
for degree in range(9):
    for a, b in [("0", "1"), ("1", "0")]:
        r = run(
            "calculo.numerica",
            expresion=f"x^{degree}",
            inferior=a,
            superior=b,
            tolerancia="1e-6",
        )
        truth = s.integrate(x**degree, (x, s.Rational(a), s.Rational(b)))
        for row in r["tabla"]:
            check(
                abs(rational(row["valor"]) - truth) <= rational(row["cota_garantizada"])
            )
        check(r["valor"] == r["tabla"][-1]["valor"])
for expression, point in [
    ("sqrt(x)", "2"),
    ("exp(x)", "1"),
    ("ln(x)", "2"),
    ("cos(x)", "1"),
    ("sin(x)", "0.5"),
    ("x^3-2*x", "-2"),
]:
    r = run("funciones.evaluar", expresion=expression, punto=point)
    reference = s.N(
        s.sympify(expression.replace("^", "**"), locals={"x": x, "ln": s.log}).subs(
            x, s.Rational(point)
        ),
        60,
    )
    check(abs(float(rational(r["valor"]) - reference)) < 1e-13)
U = {"a", "b", "c"}
for A, B in [({"a", "b"}, {"b", "c"}), (set(), U), (U, set()), (U, U)]:
    for method, expected in [
        ("union", A | B),
        ("interseccion", A & B),
        ("diferencia", A - B),
        ("diferencia_simetrica", A ^ B),
    ]:
        r = run("conjuntos.operar", A=sorted(A), B=sorted(B), operacion=method)
        check(set(r["conjunto"]) == expected)
    r = run(
        "conjuntos.operar", A=sorted(A), universo=sorted(U), operacion="complemento"
    )
    check(set(r["conjunto"]) == U - A)
report = {
    "approved": True,
    "seed": 2026111705,
    "reference": "SymPy " + s.__version__,
    "checks": checks,
    "calls": sum(calls.values()),
    "operations": dict(sorted(calls.items())),
}
p = Path("evidencia-fase05")
p.mkdir(exist_ok=True)
(p / "auditoria.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n"
)
print(json.dumps(report))
