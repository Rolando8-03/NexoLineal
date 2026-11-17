"""Proyecto local atómico, independiente del puerto o carpeta temporal del EXE."""

import json
import os
from pathlib import Path
import tempfile
import threading

MAX_BYTES = 2 * 1024 * 1024


def validate_content(content):
    if not isinstance(content, str) or len(content.encode("utf-8")) > MAX_BYTES:
        raise ValueError("El proyecto debe ser texto UTF-8 de hasta 2 MiB.")
    data = json.loads(content)
    if (
        not isinstance(data, dict)
        or data.get("format") != "NexoLineal.Project"
        or data.get("version") != 1
    ):
        raise ValueError("Formato de proyecto incompatible.")
    return content


class ProjectStore:
    def __init__(self, path=None):
        base = (
            Path(os.environ.get("LOCALAPPDATA", Path.home() / ".local/share"))
            / "NexoLineal"
        )
        self.path = Path(
            path or os.environ.get("NEXO_STATE_FILE", base / "workspace-v1.json")
        )
        self._lock = threading.Lock()

    def load(self):
        with self._lock:
            if not self.path.exists():
                return None
            if self.path.stat().st_size > MAX_BYTES:
                raise ValueError("El archivo guardado supera 2 MiB.")
            return validate_content(self.path.read_text(encoding="utf-8"))

    def save(self, content):
        validate_content(content)
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            descriptor, name = tempfile.mkstemp(
                prefix=".workspace-", suffix=".tmp", dir=self.path.parent
            )
            try:
                with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as out:
                    out.write(content)
                    out.flush()
                    os.fsync(out.fileno())
                os.replace(name, self.path)
            finally:
                if os.path.exists(name):
                    os.unlink(name)
