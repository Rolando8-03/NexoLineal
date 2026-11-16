"""Ventana Windows del prototipo. La interfaz llama al Python incluido."""
from pathlib import Path
import json
import os
import sys
import webview
from nexolineal.platforms.jobs import JobPool

class NativeAPI:
    def __init__(self):
        self._pool = JobPool()

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

    def close(self):
        self._pool.cancel_all()

def interface_path():
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "ui" / "index.html"
    return Path(__file__).resolve().parents[1] / "frontend" / "dist" / "index.html"

def main():
    interface = interface_path()
    if not interface.is_file():
        raise RuntimeError("Compilá apps/frontend para Windows antes de iniciar la ventana.")
    api = NativeAPI()
    window = webview.create_window(
        "NexoLineal", url=str(interface), js_api=api,
        width=1220, height=900, min_size=(390, 620)
    )
    window.events.closed += api.close
    if "--self-test" in sys.argv:
        from apps.windows.smoke import run
        webview.start(run, (window,), gui="edgechromium", http_server=True)
        report = Path(os.environ.get("NEXO_EVIDENCE", "evidencia-windows.json"))
        if not report.is_file() or not json.loads(report.read_text())["approved"]:
            raise SystemExit(1)
    else:
        webview.start(gui="edgechromium", http_server=True)

if __name__ == "__main__":
    main()
