"""Inventario verificable; no confunde una firma de CI con la del propietario."""

import argparse
import hashlib
import json
import os
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("target", choices=["web", "windows", "android"])
a = p.parse_args()
output = Path("evidencia-fase08")
output.mkdir(exist_ok=True)
if a.target == "web":
    root = Path("apps/frontend/dist")
    files = sorted(f for f in root.rglob("*") if f.is_file())
elif a.target == "windows":
    root = Path("dist")
    files = sorted(root.glob("*.exe"))
else:
    root = Path("apps/android/app/build/outputs/apk/release")
    files = [root / "app-release.apk"]
records = [
    {
        "file": f.relative_to(root).as_posix(),
        "bytes": f.stat().st_size,
        "sha256": hashlib.sha256(f.read_bytes()).hexdigest(),
    }
    for f in files
]
version = json.loads(Path("apps/frontend/dist/version.json").read_text())
assert version["target"] == a.target
assert version["source_sha"] == os.environ.get("GITHUB_SHA", version["source_sha"])
report = {**version, "files": records}
(output / (a.target + "-SHA256SUMS.txt")).write_text(
    "".join(r["sha256"] + "  " + r["file"] + "\n" for r in records)
)
(output / (a.target + "-distribucion-manifest.json")).write_text(
    json.dumps(report, indent=2) + "\n"
)
print("NEXO_DISTRIBUTION_MANIFEST=" + json.dumps(report))
