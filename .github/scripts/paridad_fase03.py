"""Valida evidencias independientes de los tres entornos."""

import json
from pathlib import Path
import sys

root = Path(sys.argv[1])


def read(platform, name):
    files = [
        p
        for p in (root / ("fase03-" + platform)).rglob(name)
        if "evidencia-fase03" in p.parts
    ]
    assert len(files) == 1, (platform, name, files)
    return json.loads(files[0].read_text(encoding="utf-8"))


expected = [item["expected"] for item in read("web", "platform-cases.json")]
reports = {
    "web": read("web", "web.json"),
    "windows-fuente": read("windows", "windows-fuente.json"),
    "windows-ejecutable": read("windows", "windows-exe.json"),
    "android": read("android", "android.json"),
}
for platform, report in reports.items():
    assert report["approved"], (platform, report)
    responses = [case["response"] for case in report["cases"] if "response" in case]
    assert responses == expected, platform
manifests = [
    read(platform, "core-manifest.json") for platform in ("web", "windows", "android")
]
assert (
    manifests[0] == manifests[1] == manifests[2]
), "El código Python difiere entre plataformas."


def experience(name):
    files = [
        p for p in (root / "fase03-web").rglob(name) if "evidencia-fase06" in p.parts
    ]
    assert len(files) == 1, (name, files)
    return json.loads(files[0].read_text(encoding="utf-8"))


ui = experience("ui.json")
codec = experience("estado.json")
assert ui["approved"] and codec["approved"]
assert all(not run["violations"] for run in ui["a11y"])
reopened = {
    name: read("windows", file)
    for name, file in [
        ("windows-fuente", "windows-fuente-reabrir.json"),
        ("windows-ejecutable", "windows-exe-reabrir.json"),
    ]
}
assert all(r["approved"] and r["persistence"]["reopened"] for r in reopened.values())
assert (
    reports["android"]["persistence"]["saved"]
    and reports["android"]["persistence"]["reopened"]
)
assert (
    reports["windows-fuente"]["persistence"]["saved"]
    and reports["windows-ejecutable"]["persistence"]["saved"]
)
summary = {
    "approved": True,
    "platforms": list(reports),
    "shared_contracts": len(expected),
    "identical_core_files": len(manifests[0]),
    "android_offline": reports["android"]["offline"],
    "workspace": {
        "web_reopened": True,
        "windows_source_reopened": True,
        "windows_exe_reopened": True,
        "android_reopened": True,
        "ui_cases": len(ui["cases"]),
        "codec_checks": codec["checks"],
        "accessibility_runs": len(ui["a11y"]),
        "accessibility_violations": 0,
    },
}
(root / "paridad.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print("NEXO_PARITY_REPORT=" + json.dumps(summary))
print(
    "NEXO_FULL_EVIDENCE="
    + json.dumps(
        {
            "summary": summary,
            "reports": reports,
            "reopened": reopened,
            "workspace_ui": ui,
            "project_codec": codec,
            "core_manifest": manifests[0],
        },
        ensure_ascii=False,
    )
)
