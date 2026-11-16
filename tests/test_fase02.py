"""Regresiones específicas de los contratos y correcciones de la fase 02."""
import ast
import json
import math
from fractions import Fraction as F
from pathlib import Path
import subprocess
import sys
import unittest
from decimal import Decimal
from nexolineal.application.service import execute
from nexolineal.parsing.numbers import parse_number, parse_matrix
from nexolineal.domain.models import DomainError, InputError, serializar
from nexolineal.algorithms.calculo import analizar, evaluar, ejecutar_calculo, numero
from nexolineal.algorithms.matrices import producto
from python.operaciones_matrices import ejecutar_matrices
from jsonschema import validate

ROOT = Path(__file__).resolve().parents[1]

def request(operation, inputs, options=None):
    return {"schema_version": "1.0", "operation_id": operation,
            "input": inputs, "options": options or {}}

def integral(expression, a="-1", b="1"):
    return ejecutar_calculo({"accion": "calculo", "operacion": "definida",
                            "expresion": expression, "inferior": a, "superior": b})

class Contracts(unittest.TestCase):
    def test_exact_product(self):
        data = request("matrices.producto", {"A": [["1/2", "2"]], "B": [["2"], ["3"]]})
        result = execute(data)
        self.assertEqual(result["result"]["matrix"], [["7"]])
        self.assertTrue(result["metadata"]["exact"])
        self.assertTrue(result["verification"]["passed"])
        validate(data, json.loads((ROOT/"packages/contracts/problem.schema.json").read_text()))
        validate(result, json.loads((ROOT/"packages/contracts/result.schema.json").read_text()))

    def test_large_fraction_round_trip(self):
        result = execute(request("matrices.producto", {"A": [["9007199254740993/2"]], "B": [["1"]]}))
        copied = json.loads(json.dumps(result))
        self.assertEqual(copied["result"]["matrix"], [["9007199254740993/2"]])
        self.assertEqual(copied["steps"][0]["data"]["terminos"][0]["a"], "9007199254740993/2")

    def test_step_values(self):
        result = execute(request("matrices.producto", {"A": [["1", "2"]], "B": [["3"], ["4"]]}))
        step = result["steps"][0]
        self.assertEqual(step["id"], 0)
        self.assertEqual(step["data"]["fila"], 0)
        self.assertEqual(step["data"]["resultado"], "11")
        self.assertEqual([t["producto"] for t in step["data"]["terminos"]], ["3", "8"])

    def test_step_option(self):
        result = execute(request("matrices.producto", {"A": [["2"]], "B": [["3"]]}, {"include_steps": False}))
        self.assertEqual(result["steps"], [])
        self.assertEqual(result["result"]["matrix"], [["6"]])

    def test_invalid_requests(self):
        cases = [None, [], {}, {"schema_version": "9"}, request("desconocida", {}),
                 request("matrices.producto", {"A": [["1"]]}),
                 request("matrices.producto", {"A": [["1"]], "B": [["2"]]}, {"include_steps": "sí"}),
                 request("calculadora.evaluar", {"expresion": "1", "grados": "no"})]
        schema = json.loads((ROOT/"packages/contracts/result.schema.json").read_text())
        for data in cases:
            with self.subTest(data=data):
                result = execute(data)
                self.assertEqual(result["status"], "invalid_input")
                validate(result, schema)

    def test_dimension_error(self):
        result = execute(request("matrices.producto", {"A": [["1", "2"]], "B": [["3"]]}))
        self.assertEqual(result["status"], "invalid_input")
        self.assertIsNone(result["result"])
        self.assertTrue(result["error"]["message"])

    def test_domain_status(self):
        for expression in ["1/0", "sqrt(-1)", "ln(-1)"]:
            with self.subTest(expression=expression):
                result = execute(request("calculadora.evaluar", {"expresion": expression}))
                self.assertEqual(result["status"], "domain_error")

    def test_resource_limit(self):
        result = execute(request("matrices.producto", {"A": [["1"*1001]], "B": [["1"]]}))
        self.assertEqual(result["status"], "limit_reached")

    def test_legacy_adapter_contract(self):
        result = ejecutar_matrices({"A": "1/2 2", "B": "2\n3"})
        self.assertEqual(result["producto_AB"], [["7"]])
        self.assertEqual(result["contrato_producto"]["result"]["matrix"], [["7"]])
        self.assertEqual(result["pasos_AB"][0]["resultado"], "7")

class NumbersAndCalculus(unittest.TestCase):
    def test_exact_literals(self):
        for text, expected in [("0.1", F(1,10)), ("0,125", F(1,8)), ("-3/7", F(-3,7)),
                               ("1e-20", F(1,10**20)), ("9007199254740993", F(9007199254740993))]:
            with self.subTest(text=text):
                self.assertEqual(parse_number(text), expected)
        self.assertEqual(parse_number(Decimal("0.10000000000000000001")), F(10000000000000000001,10**20))
        self.assertEqual(serializar(F(9007199254740993,2)), "9007199254740993/2")

    def test_invalid_numbers(self):
        for value in ["", "1/0", "nan", "inf", True, None, float("inf"), float(2**54)]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    parse_number(value)

    def test_matrix_shape(self):
        for value in [[], [[]], [[1], [1,2]], ["a"], ""]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    parse_matrix(value)

    def test_exact_arithmetic(self):
        result = ejecutar_calculo({"accion": "basica", "expresion": "0.1+0.2"})
        self.assertEqual(result["valor"], "3/10")
        self.assertEqual(result["exactitud"], "exacta")

    def test_long_decimal(self):
        expression = "0.10000000000000000001"
        self.assertEqual(evaluar(analizar(expression)), F(10000000000000000001,10**20))

    def test_small_values(self):
        self.assertEqual(numero(F(1,10**20)), "1/100000000000000000000")
        self.assertNotEqual(numero(1e-20), "0")
        self.assertEqual(ejecutar_calculo({"accion": "basica", "expresion": "1e-20"})["valor"], "1/100000000000000000000")

    def test_ans_rational(self):
        self.assertEqual(ejecutar_calculo({"accion":"basica", "expresion":"Ans*3", "ans":"1/3"})["valor"], "1")

    def test_polynomial_integral(self):
        result = integral("x^2")
        self.assertEqual(result["valor"], "2/3")
        self.assertEqual(result["exactitud"], "exacta")
        self.assertIsNone(result["precision_bits"])

    def test_reversed_interval(self):
        self.assertEqual(integral("x^2", "1", "-1")["valor"], "-2/3")

    def test_transcendental_integral_is_approximate(self):
        result = integral("sin(x)", "0", "pi")
        self.assertAlmostEqual(float(result["valor"]), 2.0)
        self.assertEqual(result["tipo"], "aproximada")
        self.assertEqual(result["precision_bits"], 53)

    def test_composed_singularities(self):
        for expression in ["1/x", "1/x+0", "2*(1/x)", "1/x+1", "0*(1/x)", "x/x"]:
            with self.subTest(expression=expression):
                with self.assertRaisesRegex(DomainError, "singularidad|dominio"):
                    integral(expression)

    def test_shifted_and_irrational_poles(self):
        for expression, a, b in [("1/(x-0.12345)", "-1", "1"),
                                  ("1/(x^2-2)", "-2", "2"),
                                  ("tan(x)", "0", "2")]:
            with self.subTest(expression=expression):
                with self.assertRaises(DomainError):
                    integral(expression, a, b)

    def test_safe_rational_integral(self):
        result = integral("1/(x*x+1)")
        self.assertEqual(result["tipo"], "aproximada")
        self.assertAlmostEqual(float(result["valor"]), math.pi/2, places=6)

    def test_log_domain(self):
        with self.assertRaises(DomainError):
            integral("ln(x)", "-1", "1")

    def test_parser_rejects_code(self):
        for text in ["__import__('os')", "x.__class__", "[1,2]", "lambda:1"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    analizar(text, variable=True)

class Packaging(unittest.TestCase):
    def test_installed_package_outside_project(self):
        command = "from nexolineal.application.service import execute; assert execute({'schema_version':'1.0','operation_id':'matrices.producto','input':{'A':[['2']],'B':[['3']]}})['result']['matrix']==[['6']]"
        subprocess.run([sys.executable, "-I", "-c", command], cwd="/tmp", check=True)

    def test_imports_do_not_mutate_sys_path(self):
        command = "import sys; before=sys.path[:]; import modulos.modulo_sistemas, modulos.modulo_matrices; assert sys.path==before"
        subprocess.run([sys.executable, "-c", command], cwd=ROOT, check=True)

    def test_no_sys_path_mutation(self):
        for folder in [ROOT/"packages/core/src", ROOT/"python", ROOT/"modulos"]:
            for path in folder.rglob("*.py"):
                tree = ast.parse(path.read_text())
                for node in ast.walk(tree):
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                        self.assertNotEqual(ast.unparse(node.func), "sys.path.insert", str(path))
                        self.assertNotEqual(ast.unparse(node.func), "sys.path.append", str(path))

    def test_terminal_launchers_retired(self):
        for filename in ["Abrir_consola.bat", "Abrir_ventana.bat", "modulos/consola.py"]:
            self.assertFalse((ROOT/filename).exists())

if __name__ == "__main__":
    unittest.main()
