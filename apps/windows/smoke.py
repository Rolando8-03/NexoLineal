"""Verifica el puente y un recorrido gráfico dentro de WebView2 real."""
import json
import os
from pathlib import Path
import platform
import sys
import time
from nexolineal.application.service import execute

def wait(window, expression, timeout=90):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        try:
            value = window.evaluate_js(expression)
            if value:
                return value
        except Exception:
            pass
        time.sleep(0.1)
    raise AssertionError("Tiempo agotado esperando " + expression)

def bridge(window, problem, request_id):
    data = json.dumps({"requestId": request_id, "problem": problem}, ensure_ascii=False)
    window.evaluate_js(
        "void (async () => { try { const d=" + data + "; "
        "await pywebview.api.prepare({requestId:d.requestId});"
        "const r=await pywebview.api.execute(d); window.__nativeResult=r;"
        "} catch(e) { window.__nativeFailure=String(e); } })();"
    )
    result = wait(window, "window.__nativeResult || window.__nativeFailure")
    if isinstance(result, str):
        raise AssertionError(result)
    window.evaluate_js("window.__nativeResult=null;window.__nativeFailure=null;")
    return result["response"]

def run(window):
    report = {"approved": False, "platform": platform.platform(),
              "python": sys.version, "cases": []}
    output = Path(os.environ.get("NEXO_EVIDENCE", "evidencia-windows.json"))
    try:
        wait(window, "document.querySelector('#calcular') && !document.querySelector('#calcular').disabled")
        window.evaluate_js("document.querySelector('#calcular').click()")
        wait(window, "document.querySelector('#resultado').dataset.status === 'ok'")
        assert "7" in window.evaluate_js("document.querySelector('#resultado').innerText")
        window.evaluate_js("document.querySelector('#modo-explorador').click()")
        assert window.evaluate_js("document.querySelector('.app').dataset.mode") == "explorador"
        assert "7" in window.evaluate_js("document.querySelector('#resultado').innerText")
        report["cases"].append({"name": "interfaz y cambio de presentación", "passed": True})

        fixtures = Path(os.environ["NEXO_FIXTURES"])
        for i, problem in enumerate(json.loads(fixtures.read_text())):
            result = bridge(window, problem, "fixture-" + str(i))
            assert result == execute(problem)
            report["cases"].append({"name": problem["operation_id"], "response": result, "passed": True})

        window.evaluate_js(
            "void (async()=>{const d={requestId:'cancel-test'};"
            "await pywebview.api.prepare(d);await pywebview.api.cancel(d);"
            "window.__cancelResult=await pywebview.api.execute({...d,problem:"
            + json.dumps({"schema_version":"1.0","operation_id":"matrices.producto","input":{"A":[["2"]],"B":[["3"]]}})
            + "});})();"
        )
        cancelled = wait(window, "window.__cancelResult")
        assert cancelled["response"]["status"] == "cancelled"
        recovered = bridge(window, {"schema_version":"1.0","operation_id":"matrices.producto",
                                    "input":{"A":[["2"]],"B":[["3"]]}}, "recovery")
        assert recovered["result"]["matrix"] == [["6"]]
        report["cases"].append({"name":"cancelación y recuperación", "passed":True})
        report["approved"] = True
    except Exception as error:
        report["error"] = repr(error)
    finally:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2))
        print("NEXO_WINDOWS_REPORT=" + json.dumps(report, ensure_ascii=False), flush=True)
        window.destroy()
