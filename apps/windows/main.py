"""Ventana Windows del prototipo. La interfaz llama al Python incluido."""

from pathlib import Path
import json
import os
import sys
import webview
from nexolineal.platforms.jobs import JobPool
from .project_io import ProjectStore, validate_content, MAX_BYTES
from .documents import document_payload, save_document, FORMATS


class NativeAPI:
    def __init__(self):
        self._pool = JobPool()
        self._store = ProjectStore()
        self._window = None

    def _id(self, data):
        if not isinstance(data, dict):
            raise ValueError("Datos de puente inválidos.")
        return data.get("requestId")

    def prepare(self, data):
        return self._pool.prepare(self._id(data))

    def execute(self, data):
        return {"response": self._pool.run(self._id(data), data.get("problem"))}

    def cancel(self, data):
        return self._pool.cancel(self._id(data))

    def progress(self, data):
        return self._pool.progress(self._id(data))

    def load_state(self):
        return {"content": self._store.load()}

    def save_state(self, data):
        self._store.save(data.get("content"))
        return {"saved": True}

    def export_project(self, data):
        content = validate_content(data.get("content"))
        paths = self._window.create_file_dialog(
            webview.FileDialog.SAVE,
            save_filename="NexoLineal-proyecto.json",
            file_types=("Proyecto JSON (*.json)",),
        )
        if not paths:
            return {"cancelled": True}
        destination = Path(paths if isinstance(paths, str) else paths[0])
        ProjectStore(destination).save(content)
        return {"cancelled": False}

    def export_document(self, data):
        kind, content = document_payload(data)
        name, filter = FORMATS[kind]
        paths = self._window.create_file_dialog(
            webview.FileDialog.SAVE, save_filename=name, file_types=(filter,)
        )
        if not paths:
            return {"cancelled": True}
        save_document(paths if isinstance(paths, str) else paths[0], content)
        return {"cancelled": False}

    def import_project(self):
        paths = self._window.create_file_dialog(
            webview.FileDialog.OPEN,
            allow_multiple=False,
            file_types=("Proyecto JSON (*.json)",),
        )
        if not paths:
            return {"cancelled": True}
        source = Path(paths if isinstance(paths, str) else paths[0])
        if source.stat().st_size > MAX_BYTES:
            raise ValueError("El archivo supera 2 MiB.")
        return {
            "cancelled": False,
            "content": validate_content(source.read_text(encoding="utf-8")),
        }

    def close(self):
        self._pool.cancel_all()


def interface_path():
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "ui" / "index.html"
    return Path(__file__).resolve().parents[1] / "frontend" / "dist" / "index.html"


def main():
    interface = interface_path()
    if not interface.is_file():
        raise RuntimeError(
            "Compilá apps/frontend para Windows antes de iniciar la ventana."
        )
    api = NativeAPI()
    window = webview.create_window(
        "NexoLineal",
        url=str(interface),
        js_api=api,
        width=1220,
        height=900,
        min_size=(390, 620),
    )
    api._window = window
    window.events.closed += api.close
    if "--self-test" in sys.argv:
        from apps.windows.smoke import run

        webview.start(run, (window,), gui="edgechromium", http_server=True)
        report = Path(os.environ.get("NEXO_EVIDENCE", "evidencia-windows.json"))
        if (
            not report.is_file()
            or not json.loads(report.read_text(encoding="utf-8"))["approved"]
        ):
            raise SystemExit(1)
    else:
        webview.start(gui="edgechromium", http_server=True)


if __name__ == "__main__":
    main()
