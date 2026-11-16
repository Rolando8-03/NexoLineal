"""Punto de entrada gráfico. Registra fallos de diagnóstico sin abrir terminal."""
import os
from pathlib import Path
import traceback
import sys
import threading
import faulthandler

if __name__ == "__main__":
    diagnostic = Path(os.environ.get("NEXO_EVIDENCE", "nexolineal-error"))
    trace = None
    if "--self-test" in sys.argv:
        trace = diagnostic.with_name(diagnostic.name + ".threads.log").open("w", encoding="utf-8")
        faulthandler.dump_traceback_later(25, repeat=True, file=trace)
    try:
        from apps.windows.main import main
        main()
        if trace:
            trace.write("MAIN_RETURNED " + repr([(t.name, t.daemon) for t in threading.enumerate()]) + "\n")
            trace.flush()
    except Exception:
        diagnostic = Path(os.environ.get("NEXO_EVIDENCE", "nexolineal-error")) 
        diagnostic.with_name(diagnostic.name + ".error.log").write_text(traceback.format_exc(), encoding="utf-8")
        raise SystemExit(1)
