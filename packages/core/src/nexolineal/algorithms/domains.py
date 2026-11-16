"""Comprobación conservadora del dominio en todo el intervalo de integración.

Las cotas se subdividen cuando su dependencia algebraica impide decidir.
Si no se establece un dominio continuo, se comunica la limitación del método.
No se interpreta una lista de muestras finitas como garantía de continuidad.
"""
import ast
import math
from ..domain.models import DomainError

def _bounds(n, left, right, evaluate):
    if not any(isinstance(node, ast.Name) and node.id == "x" for node in ast.walk(n)):
        value = float(evaluate(n))
        if not math.isfinite(value):
            raise DomainError("El valor debe ser finito.")
        return value, value
    if isinstance(n, ast.Name):
        return left, right
    if isinstance(n, ast.UnaryOp):
        lo, hi = _bounds(n.operand, left, right, evaluate)
        return (-hi, -lo) if isinstance(n.op, ast.USub) else (lo, hi)
    if isinstance(n, ast.BinOp):
        a, b = _bounds(n.left, left, right, evaluate)
        c, d = _bounds(n.right, left, right, evaluate)
        if isinstance(n.op, ast.Add):
            return a+c, b+d
        if isinstance(n.op, ast.Sub):
            return a-d, b-c
        if isinstance(n.op, ast.Mult):
            values = (a*c, a*d, b*c, b*d)
        elif isinstance(n.op, ast.Div):
            if c <= 0 <= d:
                raise DomainError("El denominador puede anularse en el intervalo.")
            values = (a/c, a/d, b/c, b/d)
        else:
            if c != d:
                if a <= 0:
                    raise DomainError("La potencia requiere base positiva en este intervalo.")
                values = (a**c, a**d, b**c, b**d)
            else:
                exponent = c
                if a <= 0 <= b and exponent < 0:
                    raise DomainError("La potencia negativa tiene una singularidad.")
                if a < 0 and not exponent.is_integer():
                    raise DomainError("La potencia no es real sobre todo el intervalo.")
                values = [a**exponent, b**exponent]
                if a <= 0 <= b and exponent > 0:
                    values.append(0.0)
        if not all(math.isfinite(value) for value in values):
            raise DomainError("La función excede el intervalo numérico disponible.")
        return min(values), max(values)
    if isinstance(n, ast.Call):
        a, b = _bounds(n.args[0], left, right, evaluate)
        name = n.func.id
        if name in ("sin", "cos"):
            if b-a >= 2*math.pi:
                return -1.0, 1.0
            offset = math.pi/2 if name == "sin" else 0
            points = [a, b]
            low = math.ceil((a-offset)/math.pi)
            high = math.floor((b-offset)/math.pi)
            points.extend(offset+k*math.pi for k in range(low, high+1))
            values = [getattr(math, name)(point) for point in points]
            return min(values), max(values)
        if name == "tan":
            if math.ceil((a-math.pi/2)/math.pi) <= math.floor((b-math.pi/2)/math.pi):
                raise DomainError("La tangente tiene una singularidad en el intervalo.")
            return math.tan(a), math.tan(b)
        if name in ("ln", "log") and a <= 0:
            raise DomainError("El logaritmo requiere argumento positivo.")
        if name == "sqrt" and a < 0:
            raise DomainError("La raíz requiere argumento no negativo.")
        if name in ("asin", "acos") and (a < -1 or b > 1):
            raise DomainError("El argumento debe pertenecer a [-1,1].")
        if name == "abs":
            return (0.0 if a <= 0 <= b else min(abs(a), abs(b))), max(abs(a), abs(b))
        if name == "factorial":
            raise DomainError("La integral de factorial variable no está admitida.")
        function = {"ln": math.log, "log": math.log10}.get(name, getattr(math, name, None))
        values = (function(a), function(b))
        if not all(math.isfinite(value) for value in values):
            raise DomainError("El valor de la función debe ser finito.")
        return min(values), max(values)
    raise DomainError("No se puede verificar el dominio de esta expresión.")

def validar_dominio(n, left, right, evaluate, depth=12):
    """Exige una función real continua en el intervalo cerrado usado por el método."""
    left, right = float(left), float(right)
    try:
        _bounds(n, left, right, evaluate)
    except (ValueError, ArithmeticError) as error:
        middle = (left+right)/2
        if depth == 0 or middle == left or middle == right:
            raise DomainError(
                "El intervalo contiene una singularidad o un dominio que el método "
                "de integral definida no puede verificar. " + str(error)
            ) from None
        validar_dominio(n, left, middle, evaluate, depth-1)
        validar_dominio(n, middle, right, evaluate, depth-1)
