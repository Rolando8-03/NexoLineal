"""Contrato 1.0. Los índices de pasos y matrices comienzan en cero."""
from dataclasses import dataclass, field
from fractions import Fraction
from decimal import Decimal
import math

class InputError(ValueError):
    """La solicitud o sus datos no cumplen el contrato."""

class DomainError(ValueError):
    """La operación no está definida sobre los datos solicitados."""

class CancelledError(ValueError):
    """El solicitante canceló el cálculo antes de completarlo."""

class ConvergenceError(ValueError):
    """El método agotó su refinamiento sin alcanzar la precisión solicitada."""

class ResourceLimitError(ValueError):
    """La solicitud excede el presupuesto de cálculo admitido."""

def serializar(value):
    """Conserva las magnitudes matemáticas como texto, sin redondeo binario."""
    if isinstance(value, Fraction):
        if max(value.numerator.bit_length(), value.denominator.bit_length()) > 12000:
            raise ResourceLimitError("El resultado supera el límite de representación exacta.")
        return str(value)
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise InputError("El decimal debe ser finito.")
        return str(value)
    if isinstance(value, float):
        if not math.isfinite(value):
            raise InputError("El resultado debe ser finito.")
        return repr(value)
    if isinstance(value, dict):
        return {key: serializar(item) for key, item in value.items()}
    if isinstance(value, (tuple, list)):
        return [serializar(item) for item in value]
    return value

@dataclass(frozen=True)
class Problem:
    operation_id: str
    input: dict
    options: dict = field(default_factory=dict)
    schema_version: str = "1.0"

    @classmethod
    def from_dict(cls, data):
        if not isinstance(data, dict):
            raise InputError("La solicitud debe ser un objeto.")
        unknown = set(data) - {"schema_version", "operation_id", "input", "options"}
        if unknown:
            raise InputError("Campos desconocidos: " + ", ".join(sorted(unknown)))
        if data.get("schema_version") != "1.0":
            raise InputError("Versión de contrato no admitida.")
        operation = data.get("operation_id")
        if not isinstance(operation, str) or not operation:
            raise InputError("Falta operation_id.")
        inputs, options = data.get("input"), data.get("options", {})
        if not isinstance(inputs, dict) or not isinstance(options, dict):
            raise InputError("input y options deben ser objetos.")
        return cls(operation, inputs, options)

@dataclass(frozen=True)
class Step:
    id: int
    kind: str
    description: str
    data: dict
    formula: str = ""

    def __post_init__(self):
        if type(self.id) is not int or self.id < 0 or not isinstance(self.data, dict):
            raise InputError("El paso requiere un índice no negativo y datos estructurados.")

    def to_dict(self):
        return serializar(self.__dict__)

@dataclass
class CalculationResult:
    operation_id: str
    input: dict
    status: str
    result: object = None
    steps: list = field(default_factory=list)
    verification: dict = field(default_factory=dict)
    warnings: list = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    error: object = None
    schema_version: str = "1.0"

    def __post_init__(self):
        allowed = {"ok", "invalid_input", "domain_error", "limit_reached", "singular",
                   "inconsistent", "infinite", "not_applicable", "cancelled",
                   "non_convergent", "internal_error", "iteration_limit", "stagnated", "breakdown", "cycle_detected"}
        if self.status not in allowed:
            raise InputError("Estado de cálculo no reconocido.")

    def to_dict(self):
        return serializar({
            "schema_version": self.schema_version, "operation_id": self.operation_id,
            "input": self.input, "status": self.status, "result": self.result,
            "steps": [step.to_dict() for step in self.steps],
            "verification": self.verification, "warnings": self.warnings,
            "metadata": self.metadata, "error": self.error,
        })
