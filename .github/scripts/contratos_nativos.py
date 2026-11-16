"""Datos de referencia del mismo contrato ejecutado con Python nativo."""
from pathlib import Path
import json
from nexolineal.application.service import execute

requests = [
    {"schema_version":"1.0", "operation_id":"matrices.producto",
     "input":{"A":[["9007199254740993/2"]], "B":[["1"]]}},
    {"schema_version":"1.0", "operation_id":"matrices.producto",
     "input":{"A":[["1", "2"]], "B":[["1"]]}},
    {"schema_version":"1.0", "operation_id":"calculo.definida",
     "input":{"expresion":"1/x+0", "inferior":"-1", "superior":"1"}},
]
output = Path("evidencia-ci")
output.mkdir(exist_ok=True)
(output/"contratos-nativos.json").write_text(json.dumps(
    [{"solicitud": request, "respuesta": execute(request)} for request in requests],
    ensure_ascii=False, indent=2
))
