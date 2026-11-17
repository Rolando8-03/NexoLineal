"""Punto de entrada gráfico. Registra fallos de diagnóstico sin abrir terminal."""

import os
import time

os.environ["NEXO_PROCESS_START"] = str(time.perf_counter())
from pathlib import Path
import traceback
import sys
import threading
import faulthandler

if __name__ == "__main__":
    default_log = (
        Path(os.environ.get("LOCALAPPDATA", str(Path.home())))
        / "NexoLineal"
        / "logs"
        / "inicio"
    )
    diagnostic = Path(os.environ.get("NEXO_EVIDENCE", str(default_log)))
    diagnostic.parent.mkdir(parents=True, exist_ok=True)

    def thread_failed(arguments):
        diagnostic.with_name(diagnostic.name + ".error.log").write_text(
            "".join(
                traceback.format_exception(
                    arguments.exc_type, arguments.exc_value, arguments.exc_traceback
                )
            ),
            encoding="utf-8",
        )

    threading.excepthook = thread_failed
    trace = None
    if "--self-test" in sys.argv:
        trace = diagnostic.with_name(diagnostic.name + ".threads.log").open(
            "w", encoding="utf-8"
        )
        faulthandler.dump_traceback_later(25, repeat=True, file=trace)
    try:
        from apps.windows.main import main

        main()
        if trace:
            trace.write(
                "MAIN_RETURNED "
                + repr([(t.name, t.daemon) for t in threading.enumerate()])
                + "\n"
            )
            trace.flush()
    except Exception:
        diagnostic.with_name(diagnostic.name + ".error.log").write_text(
            traceback.format_exc(), encoding="utf-8"
        )
        if "--self-test" not in sys.argv:
            import ctypes

            ctypes.windll.user32.MessageBoxW(
                None,
                "No se pudo iniciar NexoLineal. Comprobá que WebView2 esté instalado. "
                "El detalle se guardó en "
                + str(diagnostic.with_name(diagnostic.name + ".error.log")),
                "NexoLineal",
                0x10,
            )
        raise SystemExit(1)
