"""Comprueba el material archivado y registra diferencias del árbol actual."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[2]
manifest = json.loads((root / "docs/fase01/inventario.json").read_text())
reference = manifest["referencia_fuente"]
differences = []

def blob_id(data):
    header = ("blob " + str(len(data)) + "\0").encode()
    return hashlib.sha1(header + data).hexdigest()

for item in manifest["archivos"]:
    archived = subprocess.check_output(
        ["git", "show", reference + ":" + item["ruta"]], cwd=root
    )
    if blob_id(archived) != item["git_blob_sha"]:
        raise AssertionError("Origen distinto al inventario: " + item["ruta"])
    current = root / item["ruta"]
    if not current.is_file() or blob_id(current.read_bytes()) != item["git_blob_sha"]:
        differences.append(item["ruta"])

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.local = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("src", "href"):
            value = attrs.get(key, "")
            if value and not value.startswith(("http:", "https:", "#", "data:")):
                self.local.append(value.split("?")[0].split("#")[0])

parser = References()
parser.feed((root / "index.html").read_text())
missing = [value for value in parser.local if not (root / value).is_file()]
if missing:
    raise AssertionError("Recursos locales ausentes: " + repr(missing))
if len(parser.ids) != len(set(parser.ids)):
    raise AssertionError("Identificadores HTML duplicados")

commits = subprocess.check_output(["git", "rev-list", "HEAD"], cwd=root, text=True).splitlines()
empty = []
for commit in commits:
    changed = subprocess.check_output(
        ["git", "diff-tree", "--root", "--no-commit-id", "--name-only", "-r", commit],
        cwd=root, text=True
    ).strip()
    if not changed:
        empty.append(commit)
if empty:
    raise AssertionError("Commits vacíos: " + repr(empty))
result = {
    "archivos_origen_verificados": len(manifest["archivos"]),
    "referencia_origen": reference,
    "diferencias_actuales": differences,
    "recursos_ausentes": missing,
    "ids_html_duplicados": [],
    "commits_actuales": len(commits),
    "commits_vacios": empty,
}
output = root / "evidencia-ci"
output.mkdir(exist_ok=True)
(output / "origen.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False))
