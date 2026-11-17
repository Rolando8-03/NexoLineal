"""Regresiones numéricas: significado de error, estados, dominio y herramientas."""

import copy
import json
from decimal import Decimal
from fractions import Fraction as F
from pathlib import Path
import threading
import unittest
from jsonschema import validate
from nexolineal.application.service import execute
from nexolineal.application.catalog import CATALOG
from nexolineal.algorithms.numerical.functions import Function
from nexolineal.algorithms.linear.context import Context
from nexolineal.domain.models import InputError

ROOT = Path(__file__).resolve().parents[1]


def call(op, **data):
    return execute({"schema_version": "1.0", "operation_id": op, "input": data})


def root(method="biseccion", **extra):
    data = {"expresion": "x^2-2"}
    data.update(
        {"inferior": "1", "superior": "2"}
        if method in ("biseccion", "falsa_posicion")
        else {"inicial": "1.5", **({"anterior": "1"} if method == "secante" else {})}
    )
    return call("raices." + method, **{**data, **extra})


class NumericalContracts(unittest.TestCase):
    def test_56_examples_schemas_and_catalog(self):
        examples = json.loads(
            (ROOT / "tests/fixtures/fase05_defaults.json").read_text()
        )
        self.assertEqual(len(examples), 56)
        self.assertEqual({e["operation_id"] for e in examples}, set(CATALOG))
        for e in examples:
            with self.subTest(operation=e["operation_id"]):
                validate(
                    e,
                    json.loads(
                        (ROOT / "packages/contracts/problem.schema.json").read_text()
                    ),
                )
                out = execute(e)
                validate(
                    out,
                    json.loads(
                        (ROOT / "packages/contracts/result.schema.json").read_text()
                    ),
                )
                self.assertEqual(out["status"], "ok", out)

    def test_function_parser_is_not_python_execution(self):
        for expression in [
            "__import__('os')",
            "x.__class__",
            "[x for x in (1,)]",
            "lambda x:x",
            "True",
            "open(1)",
            "sin(x=1)",
            "Ans+x",
        ]:
            with self.subTest(expression=expression):
                self.assertEqual(
                    call("funciones.evaluar", expresion=expression, punto="1")[
                        "status"
                    ],
                    "invalid_input",
                )

    def test_function_domains_and_intervals(self):
        for expression, a, b in [
            ("1/x", "-1", "1"),
            ("tan(x)", "1", "2"),
            ("ln(x)", "-1", "2"),
            ("sqrt(x)", "-1", "2"),
        ]:
            out = call(
                "funciones.evaluar",
                expresion=expression,
                punto="1",
                inferior=a,
                superior=b,
            )
            self.assertEqual(out["status"], "domain_error", out)
        self.assertEqual(
            call("funciones.evaluar", expresion="exp(x)", punto="-1e7")["status"],
            "domain_error",
        )
        self.assertEqual(
            root(expresion="1/x", inferior="-1", superior="1")["status"], "domain_error"
        )
        self.assertEqual(
            call("funciones.evaluar", expresion="sqrt(x)", punto="-1")["status"],
            "domain_error",
        )
        self.assertEqual(
            call("funciones.evaluar", expresion="x", punto="1", inferior="0")["status"],
            "invalid_input",
        )

    def test_bisection_endpoint_and_exact_bound(self):
        out = root(expresion="x-1")
        self.assertEqual(out["result"]["iteraciones"], 0)
        self.assertEqual(out["result"]["cota_garantizada"], "0")
        out = root()
        r = out["result"]
        x = F(r["aproximacion"])
        bound = F(r["cota_garantizada"])
        self.assertLessEqual(bound, F("1e-8"))
        self.assertLess(abs(float(x) - 2**0.5), float(bound))
        self.assertEqual(r["aproximacion"], r["tabla"][-1]["x"])
        self.assertIsNone(r["error_verdadero"])
        self.assertLess(
            abs(float(F(r["aproximacion_decimal"])) - 2**0.5),
            float(F(r["cota_decimal"])),
        )
        self.assertTrue(out["verification"]["passed"])

    def test_bad_interval_and_nonpolynomial_bound(self):
        self.assertEqual(root(expresion="x^2+1")["status"], "invalid_input")
        self.assertEqual(root(inferior="2", superior="1")["status"], "invalid_input")
        out = root(expresion="cos(x)-x", inferior="0", superior="1")
        self.assertEqual(out["status"], "ok")
        self.assertIsNone(out["result"]["cota_garantizada"])
        self.assertTrue(out["warnings"])

    def test_root_iteration_limit(self):
        for method in ["biseccion", "falsa_posicion", "newton", "secante"]:
            out = root(
                method, max_iteraciones="1", tolerancia_x="1e-20", tolerancia_f="1e-20"
            )
            self.assertEqual(out["status"], "iteration_limit", out)
            self.assertFalse(out["result"]["convergencia"])
            self.assertEqual(len(out["result"]["tabla"]), 1)

    def test_false_position_stagnation_is_not_root_error(self):
        out = root(
            "falsa_posicion",
            expresion="x^10-1",
            inferior="0",
            superior="2",
            max_iteraciones="2",
        )
        self.assertEqual(out["status"], "iteration_limit")
        r = out["result"]
        self.assertIsNone(r["error_verdadero"])
        self.assertGreater(F(r["residual"]), F("1e-8"))
        self.assertNotEqual(
            F(r["residual"]), F(r["tabla"][-1]["error_aproximado_absoluto"])
        )

    def test_newton_null_derivative_cycle_and_domain(self):
        self.assertEqual(root("newton", inicial="0")["status"], "breakdown")
        out = root("newton", expresion="x^3-2*x+2", inicial="0")
        self.assertEqual(out["status"], "cycle_detected", out)
        out = root("newton", expresion="ln(x)", inicial="3")
        self.assertEqual(out["status"], "domain_error", out)
        self.assertIn("tabla", out["result"])

    def test_newton_explicit_and_unsupported_derivatives(self):
        self.assertEqual(root("newton", derivada=False)["status"], "invalid_input")
        self.assertEqual(root("newton", derivada="2*x")["status"], "ok")
        self.assertEqual(
            root("newton", expresion="abs(x)-1")["status"], "invalid_input"
        )
        out = root("newton", expresion="x^(-2)-1", inicial="-0.8")
        self.assertEqual(out["status"], "ok", out)
        self.assertLess(
            abs(Decimal(out["result"]["aproximacion"]) + 1), Decimal("1e-8")
        )

    def test_stagnation_preserves_actual_last_iterate(self):
        out = root("newton", expresion="1e100*(x-1)+1", inicial="1")
        self.assertEqual(out["status"], "stagnated", out)
        self.assertFalse(out["result"]["convergencia"])
        self.assertEqual(out["result"]["residual"], "1")
        self.assertEqual(out["result"]["aproximacion"], out["result"]["tabla"][-1]["x"])

    def test_secant_seeds_and_denominator(self):
        self.assertEqual(
            root("secante", inicial="1", anterior="1")["status"], "invalid_input"
        )
        self.assertEqual(
            root("secante", expresion="x^2+1", inicial="1", anterior="-1")["status"],
            "breakdown",
        )
        out = root("secante", expresion="x-1", anterior="1")
        self.assertEqual(out["result"]["iteraciones"], 0)

    def test_invalid_tolerances_limits_and_trig_precision(self):
        for extra in [
            {"tolerancia_x": "0"},
            {"tolerancia_f": "1e-30"},
            {"max_iteraciones": "0"},
            {"max_iteraciones": "201"},
            {"max_iteraciones": True},
        ]:
            self.assertEqual(root(**extra)["status"], "invalid_input")
        self.assertEqual(
            root(
                expresion="cos(x)-x", inferior="0", superior="1", tolerancia_x="1e-20"
            )["status"],
            "invalid_input",
        )

    def test_jacobi_seidel_norms_reference_and_bound(self):
        for method in ["jacobi", "gauss_seidel"]:
            for norm in ["infinito", "uno", "dos"]:
                out = call(
                    "iterativos." + method,
                    A="4 1;2 3",
                    b="1 2",
                    norma=norm,
                    referencia="1/10 3/5",
                )
                self.assertEqual(out["status"], "ok", out)
                r = out["result"]
                self.assertEqual(r["vector"], r["tabla"][-1]["vector"])
                self.assertLessEqual(
                    max(
                        abs(F(a) - b)
                        for a, b in zip(r["vector"], [F("1/10"), F("3/5")])
                    ),
                    F(r["cota_garantizada"]),
                )
        self.assertEqual(
            call("iterativos.jacobi", A="1 0;0 1", b="1 2", referencia="0 0")["status"],
            "invalid_input",
        )

    def test_no_dominance_does_not_prove_divergence(self):
        out = call("iterativos.gauss_seidel", A="1 2;1 3", b="3 4")
        self.assertEqual(out["status"], "ok", out)
        self.assertFalse(out["result"]["dominancia_diagonal_estricta"])
        self.assertTrue(out["warnings"])

    def test_iterative_zero_diagonal_bad_shape_cycle_and_limit(self):
        self.assertEqual(
            call("iterativos.jacobi", A="0 1;1 2", b="1 2")["status"], "invalid_input"
        )
        self.assertEqual(
            call("iterativos.jacobi", A="1 2 3", b="1")["status"], "invalid_input"
        )
        out = call("iterativos.jacobi", A="1 1;1 1", b="1 1")
        self.assertEqual(out["status"], "cycle_detected", out)
        out = call("iterativos.jacobi", A="1 2;2 1", b="1 1", max_iteraciones="3")
        self.assertEqual(out["status"], "iteration_limit", out)

    def test_error_measures_and_zero_denominators(self):
        out = call("errores.calcular", aproximado="2", referencia="0", anterior="1")[
            "result"
        ]
        self.assertEqual(out["respecto_referencia"]["absoluto"], "2")
        self.assertIsNone(out["respecto_referencia"]["relativo"])
        self.assertEqual(out["aproximado"]["relativo"], "1/2")
        out = call("errores.calcular", aproximado="0", anterior="1")["result"]
        self.assertIsNone(out["aproximado"]["porcentual"])
        self.assertEqual(
            call("errores.calcular", aproximado="1")["status"], "invalid_input"
        )

    def test_base_conversion_periods_and_truncation(self):
        exact = call(
            "conversiones.bases", numero="-0.(3)", base_origen="10", base_destino="2"
        )["result"]
        self.assertEqual(exact["numeral"], "-0.(01)")
        self.assertTrue(exact["exacta"])
        limited = call(
            "conversiones.bases",
            numero="0.1",
            base_origen="10",
            base_destino="2",
            precision="3",
        )
        self.assertEqual(limited["result"]["numeral"], "0.000")
        self.assertFalse(limited["metadata"]["exact"])
        self.assertLess(
            F(limited["result"]["error_absoluto_conversion"]),
            F(limited["result"]["cota_garantizada_conversion"]),
        )
        self.assertEqual(
            call("conversiones.bases", numero="2", base_origen="2", base_destino="10")[
                "status"
            ],
            "invalid_input",
        )
        self.assertEqual(
            call("conversiones.bases", numero="1", base_origen="3", base_destino="10")[
                "status"
            ],
            "invalid_input",
        )

    def test_large_conversion_remainders_are_exact_text(self):
        out = call(
            "conversiones.bases",
            numero="0.12345678901234567",
            base_origen="10",
            base_destino="2",
            precision="3",
        )
        self.assertEqual(out["status"], "ok")
        self.assertTrue(
            all(isinstance(step["data"]["residuo"], str) for step in out["steps"])
        )
        self.assertEqual(out["steps"][0]["data"]["residuo"], "24691357802469134")

    def test_sets_universe_empty_duplicates_and_cartesian(self):
        out = call("conjuntos.operar", A="a\na\nb", B="b\nc")["result"]
        self.assertEqual(out["conjunto"], ["a", "b", "c"])
        self.assertEqual(
            call("conjuntos.operar", A="[]", operacion="complemento", universo="a\nb")[
                "result"
            ]["conjunto"],
            ["a", "b"],
        )
        self.assertEqual(
            call("conjuntos.operar", A="a", operacion="complemento")["status"],
            "invalid_input",
        )
        self.assertEqual(
            call("conjuntos.operar", A="a", operacion="complemento", universo="b")[
                "status"
            ],
            "invalid_input",
        )
        self.assertEqual(
            call("conjuntos.operar", A="a", B="b", operacion="producto_cartesiano")[
                "result"
            ]["conjunto"],
            [["a", "b"]],
        )

    def test_primitives_preserve_symbolic_constants(self):
        out = call("calculo.primitiva", expresion="pi*x")
        self.assertEqual(out["status"], "ok")
        self.assertIn("pi", out["result"]["expresion"])
        self.assertNotIn("3.14159", out["result"]["expresion"])
        self.assertEqual(call("calculo.primitiva", expresion="1/x")["status"], "ok")
        self.assertEqual(
            call("calculo.primitiva", expresion="exp(-x^2)")["status"], "invalid_input"
        )

    def test_numeric_integral_bound_orientation_limit_domain(self):
        out = call("calculo.numerica", expresion="x^4", inferior="0", superior="1")
        self.assertEqual(out["status"], "ok", out)
        self.assertLessEqual(
            abs(F(out["result"]["valor"]) - F(1, 5)),
            F(out["result"]["cota_garantizada"]),
        )
        reversed = call("calculo.numerica", expresion="x^4", inferior="1", superior="0")
        self.assertEqual(F(out["result"]["valor"]), -F(reversed["result"]["valor"]))
        self.assertEqual(
            call(
                "calculo.numerica",
                expresion="x^4",
                inferior="0",
                superior="1",
                max_subintervalos="4",
                tolerancia="1e-20",
            )["status"],
            "iteration_limit",
        )
        self.assertEqual(
            call("calculo.numerica", expresion="1/x", inferior="-1", superior="1")[
                "status"
            ],
            "domain_error",
        )
        self.assertEqual(
            call(
                "calculo.numerica",
                expresion="x",
                inferior="0",
                superior="1",
                max_subintervalos="6",
            )["status"],
            "invalid_input",
        )
        self.assertEqual(
            call("calculo.numerica", expresion="x", inferior="0", superior="0")[
                "result"
            ]["valor"],
            "0",
        )

    def test_cancellation_progress_and_no_step_option(self):
        problem = {
            "schema_version": "1.0",
            "operation_id": "raices.biseccion",
            "input": {"expresion": "x^2-2", "inferior": "1", "superior": "2"},
        }
        original = copy.deepcopy(problem)
        stop = threading.Event()
        progress = []

        def update(x):
            progress.append(x)
            stop.set()

        out = execute(problem, is_cancelled=stop.is_set, on_progress=update)
        self.assertEqual(out["status"], "cancelled")
        self.assertIsNone(out["result"])
        self.assertEqual(original, problem)
        out = execute({**problem, "options": {"include_steps": False}})
        self.assertEqual(out["status"], "ok")
        self.assertEqual(out["steps"], [])
        self.assertTrue(out["result"]["tabla"])
