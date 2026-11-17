"""Copia la interfaz compilada y prepara referencias para el APK de prueba."""

from pathlib import Path
import hashlib
import json
import shutil
from nexolineal.application.service import execute

root = Path(__file__).resolve().parents[2]
dist = root / "apps/frontend/dist"
assets = root / "apps/android/app/src/main/assets"
destination = assets / "public"
if not (dist / "index.html").is_file():
    raise RuntimeError("Falta compilar el frontend para Android.")
shutil.rmtree(destination, ignore_errors=True)
shutil.copytree(dist, destination)
shutil.copy2(
    root / "apps/android/capacitor.config.json", assets / "capacitor.config.json"
)
(assets / "capacitor.plugins.json").write_text("[]")
fixtures = json.loads((root / "tests/fixtures/platform_contracts.json").read_text())
cases = [{"request": request, "expected": execute(request)} for request in fixtures]
test_assets = root / "apps/android/app/src/androidTest/assets"
test_assets.mkdir(parents=True, exist_ok=True)
(test_assets / "platform-cases.json").write_text(
    json.dumps(cases, ensure_ascii=False, indent=2)
)
shutil.copy2(
    root / "tests/fixtures/fase08-project.json", test_assets / "fase08-project.json"
)
manifest = []
source = root / "packages/core/src"
for file in sorted((source / "nexolineal").rglob("*.py")):
    manifest.append(
        {
            "path": file.relative_to(source).as_posix(),
            "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
        }
    )
(assets / "core-manifest.json").write_text(json.dumps(manifest, indent=2))
print(
    json.dumps(
        {
            "core_files": len(manifest),
            "cases": len(cases),
            "web_assets": len(list(destination.rglob("*"))),
        }
    )
)
