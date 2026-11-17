"""Funciones seguras compartidas: AST permitido, dominio y evaluación acotada."""

import ast
from decimal import Decimal as D, localcontext, DecimalException
from fractions import Fraction as F
import math
from .. import calculo
from ..domains import validar_dominio
from ..linear.context import freeze
from ...domain.models import DomainError, InputError, ResourceLimitError
from ...parsing.numbers import parse_number

PRECISION = 40


def decimal(value):
    if isinstance(value, D):
        return value
    value = parse_number(value)
    return D(value.numerator) / D(value.denominator)


class Function:
    """No usa eval, exec, imports ni atributos proporcionados por el usuario."""

    def __init__(self, expression, ctx):
        if not isinstance(expression, str):
            raise InputError("La función debe ser texto.")
        self.expression, self.ctx = expression, ctx
        self.tree = calculo.analizar(expression, variable=True)
        if any(isinstance(n, ast.Name) and n.id == "Ans" for n in ast.walk(self.tree)):
            raise InputError(
                "Ans no forma parte del lenguaje de funciones; escribí su valor."
            )
        try:
            self.polynomial = calculo.simplificar_polinomio(self.tree)
        except ValueError:
            self.polynomial = None
        self.binary_functions = any(
            isinstance(n, ast.Call)
            and n.func.id not in ("ln", "log", "exp", "sqrt", "abs", "factorial")
            for n in ast.walk(self.tree)
        ) or any(
            isinstance(n, ast.Name) and n.id in ("pi", "e") for n in ast.walk(self.tree)
        )

    def exact(self, x):
        self.ctx.tick()
        if self.polynomial is not None:
            return freeze(sum((v * x**k for k, v in self.polynomial.items()), F(0)))
        return F(self.value(decimal(x)))

    def value(self, x):
        def visit(n):
            self.ctx.tick()
            if isinstance(n, ast.Constant):
                return decimal(getattr(n, "_literal", str(n.value)))
            if isinstance(n, ast.Name):
                return x if n.id == "x" else D(str(getattr(math, n.id)))
            if isinstance(n, ast.UnaryOp):
                v = visit(n.operand)
                return -v if isinstance(n.op, ast.USub) else v
            if isinstance(n, ast.BinOp):
                a, b = visit(n.left), visit(n.right)
                if isinstance(n.op, ast.Add):
                    return a + b
                if isinstance(n.op, ast.Sub):
                    return a - b
                if isinstance(n.op, ast.Mult):
                    return a * b
                if isinstance(n.op, ast.Div):
                    return a / b
                if b == 0:
                    return D(1)
                if abs(b) > 100 or abs(a) > D("1e7"):
                    raise ResourceLimitError("Potencia demasiado grande.")
                return a**b
            a = visit(n.args[0])
            name = n.func.id
            if name == "abs":
                return abs(a)
            if name == "sqrt":
                return a.sqrt()
            if name == "exp":
                return a.exp()
            if name == "ln":
                return a.ln()
            if name == "log":
                return a.log10()
            if name == "factorial":
                if a != int(a) or not 0 <= a <= 170:
                    raise DomainError("Factorial requiere entero entre 0 y 170.")
                return D(math.factorial(int(a)))
            return D(str(getattr(math, name)(float(a))))

        try:
            value = visit(self.tree)
            if not value.is_finite() or abs(value) > D("1e100"):
                raise DomainError("La función excede el intervalo numérico admitido.")
            return value
        except (DecimalException, ValueError, ZeroDivisionError, OverflowError) as e:
            raise DomainError("Evaluación fuera del dominio: " + str(e)) from None

    def continuous(self, a, b):
        self.ctx.tick()
        if a > b:
            a, b = b, a
        # Los polinomios son continuos; no es una conclusión obtenida de muestras.
        if self.polynomial is None:
            validar_dominio(
                self.tree, a, b, lambda node, x=0: self._domain_evaluate(node, x)
            )
        return True

    def _domain_evaluate(self, node, x):
        self.ctx.tick()
        return calculo.evaluar(node, x=x)

    def derivative(self, provided=None):
        if provided:
            return Function(provided, self.ctx), "proporcionada_por_usuario"
        try:
            text = calculo.ejecutar_calculo(
                {
                    "accion": "calculo",
                    "operacion": "derivar",
                    "expresion": self.expression,
                }
            )["expresion"]
            return Function(text, self.ctx), "reglas_simbolicas"
        except ValueError:
            raise InputError(
                "No se pudo construir la derivada admitida. Proporcioná f'(x) explícitamente."
            ) from None
