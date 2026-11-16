"""Genera las respuestas de referencia a partir del núcleo instalado."""
from pathlib import Path
import hashlib
import json
import sys
from nexolineal.application.service import execute
root = Path(__file__).resolve().parents[2]
output = root/"evidencia-fase03"
output.mkdir(exist_ok=True)
requests = json.loads((root/"tests/fixtures/platform_contracts.json").read_text(encoding="utf-8"))
(output/"platform-cases.json").write_text(json.dumps(
    [{"request": request, "expected": execute(request)} for request in requests], ensure_ascii=False, indent=2
), encoding="utf-8")
source = root/"packages/core/src"
manifest = [{"path":file.relative_to(source).as_posix(),"sha256":hashlib.sha256(file.read_bytes()).hexdigest()}
            for file in sorted((source/"nexolineal").rglob("*.py"))]
(output/"core-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
(output/"python-version.txt").write_text(sys.version, encoding="utf-8")
