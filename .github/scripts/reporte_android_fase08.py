"""Extrae el resultado del APK no depurable sin usar run-as ni habilitar depuración."""

import json
from pathlib import Path

p = Path("evidencia-fase08/android-instrumentacion.log")
text = p.read_text()
assert "OK (1 test)" in text and "FAILURES" not in text, text
line = next(
    line
    for line in text.splitlines()
    if "INSTRUMENTATION_STATUS: nexo_distribution=" in line
)
r = json.loads(line.split("=", 1)[1])
assert r["approved"] and r["debuggable"] is False and r["offline"]
p.with_name("android-release.json").write_text(json.dumps(r, indent=2) + "\n")
print(json.dumps(r))
