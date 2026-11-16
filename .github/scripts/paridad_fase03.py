"""Valida evidencias independientes de los tres entornos."""
import json
from pathlib import Path
import sys
root = Path(sys.argv[1])
def read(platform, name):
    files = [p for p in (root / ("fase03-" + platform)).rglob(name) if "evidencia-fase03" in p.parts]
    assert len(files) == 1, (platform, name, files)
    return json.loads(files[0].read_text(encoding="utf-8"))
expected = [item["expected"] for item in read("web", "platform-cases.json")]
reports = {"web": read("web", "web.json"),
           "windows-fuente": read("windows", "windows-fuente.json"),
           "windows-ejecutable": read("windows", "windows-exe.json"),
           "android": read("android", "android.json")}
for platform, report in reports.items():
    assert report["approved"], (platform, report)
    responses = [case["response"] for case in report["cases"] if "response" in case]
    assert responses == expected, platform
manifests = [read(platform, "core-manifest.json") for platform in ("web", "windows", "android")]
assert manifests[0] == manifests[1] == manifests[2], "El código Python difiere entre plataformas."
summary = {"approved": True, "platforms": list(reports), "shared_contracts": len(expected),
           "identical_core_files": len(manifests[0]), "android_offline": reports["android"]["offline"]}
(root / "paridad.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print("NEXO_PARITY_REPORT=" + json.dumps(summary))
