"""Catálogo y ejecución de operaciones del contrato 1.0."""
from ..domain.models import (
    Problem, Step, CalculationResult, InputError, DomainError, ResourceLimitError,
)
from ..parsing.numbers import parse_matrix
from ..algorithms.matrices import multiplicar_con_pasos
from ..algorithms.calculo import ejecutar_calculo

OPERATIONS = {
    "matrices.producto": {"required": ("A", "B"), "optional": ()},
    "calculadora.evaluar": {"required": ("expresion",), "optional": ("ans", "grados")},
    "calculo.definida": {"required": ("expresion", "inferior", "superior"), "optional": ()},
    "calculo.derivar": {"required": ("expresion",), "optional": ("punto",)},
}

def _validate(problem):
    if problem.operation_id not in OPERATIONS:
        raise InputError("Operación no reconocida.")
    spec = OPERATIONS[problem.operation_id]
    missing = set(spec["required"]) - set(problem.input)
    unknown = set(problem.input) - set(spec["required"]) - set(spec["optional"])
    if missing or unknown:
        raise InputError("Datos faltantes o desconocidos para la operación.")
    if problem.operation_id != "matrices.producto":
        if not isinstance(problem.input["expresion"], str):
            raise InputError("La expresión debe ser texto.")
        if "grados" in problem.input and type(problem.input["grados"]) is not bool:
            raise InputError("grados debe ser booleano.")
    if set(problem.options) - {"include_steps"}:
        raise InputError("Opción no reconocida.")
    if "include_steps" in problem.options and type(problem.options["include_steps"]) is not bool:
        raise InputError("include_steps debe ser booleano.")

def _product(problem):
    A, B = parse_matrix(problem.input["A"]), parse_matrix(problem.input["B"])
    if len(A)*len(B)*len(B[0]) > 250000:
        raise ResourceLimitError("El producto supera 250000 términos.")
    matrix, raw_steps = multiplicar_con_pasos(A, B)
    steps = [
        Step(i, "producto_fila_columna", "Producto de la fila por la columna.",
             data, "c_ij = sum_k(a_ik*b_kj)")
        for i, data in enumerate(raw_steps)
    ]
    consistent = all(
        sum(term["producto"] for term in step["terminos"]) == matrix[step["fila"]][step["columna"]]
        for step in raw_steps
    )
    return CalculationResult(
        problem.operation_id, problem.input, "ok", {"matrix": matrix},
        steps if problem.options.get("include_steps", True) else [],
        {"kind": "consistencia_de_pasos", "passed": consistent},
        metadata={"exact": True, "number_format": "rational_string", "index_base": 0,
                  "method": "fila_columna", "source": "algorithms.matrices"},
    )

def execute(data):
    """Recibe una solicitud JSON y siempre devuelve el sobre público del contrato."""
    operation, inputs = "", {}
    try:
        problem = Problem.from_dict(data)
        operation, inputs = problem.operation_id, problem.input
        _validate(problem)
        if operation == "matrices.producto":
            return _product(problem).to_dict()
        payload = dict(inputs)
        if operation == "calculadora.evaluar":
            payload["accion"] = "basica"
        else:
            payload["accion"] = "calculo"
            payload["operacion"] = "definida" if operation == "calculo.definida" else "derivar"
        result = ejecutar_calculo(payload)
        exact = result.get("exactitud") == "exacta"
        return CalculationResult(
            operation, inputs, "ok", result,
            metadata={"exact": exact, "number_format": "text",
                      "precision_bits": result.get("precision_bits"), "index_base": 0},
        ).to_dict()
    except ResourceLimitError as error:
        return _error(operation, inputs, "limit_reached", "resource_limit", str(error))
    except (DomainError, ZeroDivisionError, OverflowError) as error:
        return _error(operation, inputs, "domain_error", "domain", str(error))
    except (InputError, ValueError, TypeError) as error:
        return _error(operation, inputs, "invalid_input", "input", str(error))

def _error(operation, inputs, status, code, message):
    return CalculationResult(
        operation, inputs, status, metadata={"index_base": 0},
        error={"code": code, "message": message},
    ).to_dict()
