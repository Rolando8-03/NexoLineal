"""Catálogo y ejecución de operaciones del contrato 1.0."""

from decimal import DecimalException
from ..domain.models import (
    Problem,
    Step,
    CalculationResult,
    InputError,
    DomainError,
    ResourceLimitError,
    ConvergenceError,
    CancelledError,
)
from ..parsing.numbers import parse_matrix
from ..algorithms.matrices import multiplicar_con_pasos
from ..algorithms.calculo import ejecutar_calculo
from .catalog import CATALOG
from .visuals import build_visualization
from .learning import THEOREMS, APPLICATIONS, contextualize
from .linear import execute_linear
from .numerical import execute_numerical
from .numerical_catalog import NUMERICAL_IDS
from ..algorithms.linear.context import Context, LinearFailure

OPERATIONS = {
    key: {"required": spec.required, "optional": spec.optional}
    for key, spec in CATALOG.items()
}
OPERATIONS["catalogo.operaciones"] = {"required": (), "optional": ()}


def _validate(problem):
    if problem.operation_id not in OPERATIONS:
        raise InputError("Operación no reconocida.")
    spec = OPERATIONS[problem.operation_id]
    missing = set(spec["required"]) - set(problem.input)
    unknown = set(problem.input) - set(spec["required"]) - set(spec["optional"])
    if missing or unknown:
        raise InputError("Datos faltantes o desconocidos para la operación.")
    if problem.operation_id in (
        "calculadora.evaluar",
        "calculo.definida",
        "calculo.derivar",
    ):
        if not isinstance(problem.input["expresion"], str):
            raise InputError("La expresión debe ser texto.")
        if "grados" in problem.input and type(problem.input["grados"]) is not bool:
            raise InputError("grados debe ser booleano.")
    spec = CATALOG.get(problem.operation_id)
    if spec is not None:
        for field in spec.fields:
            if (
                field["kind"] in ("expression", "text")
                and field["name"] in problem.input
                and not isinstance(problem.input[field["name"]], str)
            ):
                raise InputError("El campo " + field["name"] + " debe ser texto.")
            if field["kind"] == "select" and field["name"] in problem.input:
                if problem.input[field["name"]] not in field["choices"]:
                    raise InputError("Valor no permitido para " + field["name"] + ".")
    if set(problem.options) - {"include_steps", "include_visualization"}:
        raise InputError("Opción no reconocida.")
    for option in ("include_steps", "include_visualization"):
        if option in problem.options and type(problem.options[option]) is not bool:
            raise InputError(option + " debe ser booleano.")


def _product(problem, checkpoint=None, on_progress=None):
    A, B = parse_matrix(problem.input["A"]), parse_matrix(problem.input["B"])
    if len(A) * len(B) * len(B[0]) > 250000:
        raise ResourceLimitError("El producto supera 250000 términos.")
    matrix, raw_steps = multiplicar_con_pasos(A, B, checkpoint, on_progress)
    steps = [
        Step(
            i,
            "producto_fila_columna",
            "Producto de la fila por la columna.",
            data,
            "c_ij = sum_k(a_ik*b_kj)",
        )
        for i, data in enumerate(raw_steps)
    ]
    consistent = all(
        sum(term["producto"] for term in step["terminos"])
        == matrix[step["fila"]][step["columna"]]
        for step in raw_steps
    )
    return CalculationResult(
        problem.operation_id,
        problem.input,
        "ok",
        {"matrix": matrix},
        steps if problem.options.get("include_steps", True) else [],
        {"kind": "consistencia_de_pasos", "passed": consistent},
        metadata={
            "exact": True,
            "number_format": "rational_string",
            "index_base": 0,
            "method": "fila_columna",
            "source": "algorithms.matrices",
        },
    )


def execute(data, *, is_cancelled=None, on_progress=None):
    """Recibe una solicitud JSON y siempre devuelve el sobre público del contrato."""
    operation, inputs = "", {}

    def finish(result):
        response = result.to_dict()
        if problem.options.get("include_visualization", False):
            response["metadata"]["visualization"] = build_visualization(
                response, checkpoint
            )
            model = contextualize(response)
            if model is not None:
                response["metadata"]["application"] = model
                view = response["metadata"]["visualization"]
                if view.get("kind") == "system":
                    view["axes"] = [v["name"] for v in model["interpretation"]]
                    view["units"] = "; ".join(
                        v["name"] + " [" + v["unit"] + "]"
                        for v in model["interpretation"]
                    )
        checkpoint()
        return response

    def checkpoint():
        if is_cancelled is not None and is_cancelled():
            raise CancelledError("Cálculo cancelado.")

    try:
        problem = Problem.from_dict(data)
        operation, inputs = problem.operation_id, problem.input
        _validate(problem)
        checkpoint()
        if operation == "catalogo.operaciones":
            return CalculationResult(
                operation,
                inputs,
                "ok",
                {
                    "operations": [spec.to_dict() for spec in CATALOG.values()],
                    "theorems": THEOREMS,
                    "applications": APPLICATIONS,
                },
                metadata={"index_base": 0, "catalog_version": "0.8.0"},
            ).to_dict()
        if operation in NUMERICAL_IDS:
            result = execute_numerical(problem, Context(checkpoint, on_progress))
            checkpoint()
            return finish(result)
        if operation not in (
            "matrices.producto",
            "calculadora.evaluar",
            "calculo.definida",
            "calculo.derivar",
        ):
            result = execute_linear(problem, Context(checkpoint, on_progress))
            checkpoint()
            return finish(result)
        if operation == "matrices.producto":
            result = _product(problem, checkpoint, on_progress)
            checkpoint()
            return finish(result)
        payload = dict(inputs)
        if operation == "calculadora.evaluar":
            payload["accion"] = "basica"
        else:
            payload["accion"] = "calculo"
            payload["operacion"] = (
                "definida" if operation == "calculo.definida" else "derivar"
            )
        result = ejecutar_calculo(payload)
        checkpoint()
        exact = result.get("exactitud") == "exacta"
        return CalculationResult(
            operation,
            inputs,
            "ok",
            result,
            metadata={
                "exact": exact,
                "number_format": "text",
                "precision_bits": result.get("precision_bits"),
                "index_base": 0,
            },
        ).to_dict()
    except LinearFailure as error:
        return CalculationResult(
            operation,
            inputs,
            error.status,
            error.details,
            metadata={"index_base": 0},
            error={"code": error.status, "message": str(error)},
        ).to_dict()
    except DecimalException as error:
        return _error(operation, inputs, "domain_error", "decimal_range", str(error))
    except ArithmeticError as error:
        # Las excepciones aritméticas de dominio se mantienen en su categoría.
        if isinstance(error, (ZeroDivisionError, OverflowError)):
            return _error(operation, inputs, "domain_error", "domain", str(error))
        return _error(operation, inputs, "internal_error", "verification", str(error))
    except CancelledError as error:
        return _error(operation, inputs, "cancelled", "cancelled", str(error))
    except ConvergenceError as error:
        return _error(operation, inputs, "non_convergent", "convergence", str(error))
    except ResourceLimitError as error:
        return _error(operation, inputs, "limit_reached", "resource_limit", str(error))
    except (DomainError, ZeroDivisionError, OverflowError) as error:
        return _error(operation, inputs, "domain_error", "domain", str(error))
    except (InputError, ValueError, TypeError) as error:
        return _error(operation, inputs, "invalid_input", "input", str(error))


def _error(operation, inputs, status, code, message):
    return CalculationResult(
        operation,
        inputs,
        status,
        metadata={"index_base": 0},
        error={"code": code, "message": message},
    ).to_dict()
