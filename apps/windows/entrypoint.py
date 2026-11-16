"""Punto de entrada gráfico. Registra fallos de diagnóstico sin abrir terminal."""
import os
from pathlib import Path
import traceback

if __name__ == "__main__":
    try:
        from apps.windows.main import main
        main()
    except Exception:
        diagnostic = Path(os.environ.get("NEXO_EVIDENCE", "nexolineal-error")) 
        diagnostic.with_name(diagnostic.name + ".error.log").write_text(traceback.format_exc(), encoding="utf-8")
        raise SystemExit(1)
