"""Verifica el puente y un recorrido gráfico dentro de WebView2 real."""

import json
import os
from pathlib import Path
import platform
import sys
import time
import traceback
from nexolineal.application.service import execute
from .sqlite_store import SQLiteStore as ProjectStore


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
    try:
        snapshot = window.evaluate_js(
            "JSON.stringify({stage:document.querySelector('.app')?.dataset.startup,error:document.querySelector('#resultado')?.innerText,save:document.querySelector('#estado-guardado')?.textContent,body:document.body.innerText.slice(0,5000)})"
        )
    except Exception as error:
        snapshot = repr(error)
    raise AssertionError(
        "Tiempo agotado esperando " + expression + ". Estado: " + str(snapshot)
    )


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
    report = {
        "approved": False,
        "platform": platform.platform(),
        "python": sys.version,
        "cases": [],
    }
    output = Path(os.environ.get("NEXO_EVIDENCE", "evidencia-windows.json"))
    try:
        wait(
            window,
            "document.querySelector('#calcular') && !document.querySelector('#calcular').disabled",
        )
        report["distribution"] = {
            "frozen": bool(getattr(sys, "frozen", False)),
            "ready_after_entrypoint_ms": (
                time.perf_counter()
                - float(os.environ.get("NEXO_PROCESS_START", time.perf_counter()))
            )
            * 1000,
            "note": "El tiempo comienza después de la extracción de PyInstaller; no es arranque completo del proceso.",
        }
        if sys.platform == "win32":
            import ctypes
            from ctypes import wintypes

            class Memory(ctypes.Structure):
                _fields_ = [
                    ("cb", wintypes.DWORD),
                    ("PageFaultCount", wintypes.DWORD),
                ] + [
                    (name, ctypes.c_size_t)
                    for name in (
                        "PeakWorkingSetSize",
                        "WorkingSetSize",
                        "QuotaPeakPagedPoolUsage",
                        "QuotaPagedPoolUsage",
                        "QuotaPeakNonPagedPoolUsage",
                        "QuotaNonPagedPoolUsage",
                        "PagefileUsage",
                        "PeakPagefileUsage",
                    )
                ]

            memory = Memory()
            memory.cb = ctypes.sizeof(memory)
            get_memory = ctypes.windll.psapi.GetProcessMemoryInfo
            get_memory.argtypes = [
                wintypes.HANDLE,
                ctypes.POINTER(Memory),
                wintypes.DWORD,
            ]
            get_memory.restype = wintypes.BOOL
            if not get_memory(wintypes.HANDLE(-1), ctypes.byref(memory), memory.cb):
                raise ctypes.WinError()
            report["distribution"]["working_set_bytes"] = memory.WorkingSetSize
            assert memory.WorkingSetSize > 0
        if os.environ.get("NEXO_CROSS_PROJECT"):
            wait(window, "document.querySelector('#resultado').dataset.status === 'ok'")
            assert "7" in window.evaluate_js(
                "document.querySelector('#resultado').innerText"
            )
            import hashlib

            original = Path(os.environ["NEXO_STATE_FILE"]).read_bytes()
            report["cross_project"] = {
                "sha256": hashlib.sha256(original).hexdigest(),
                "from": "Chromium IndexedDB export",
                "to": "Windows SQLite",
                "recalculated": True,
            }
        if "--restore-test" in sys.argv:
            wait(window, "document.querySelector('#resultado').dataset.status === 'ok'")
            assert (
                window.evaluate_js("document.querySelector('#operacion').value")
                == "raices.biseccion"
            )
            assert window.evaluate_js("document.querySelector('#paso').value") == "2"
            assert (
                window.evaluate_js("document.querySelector('.app').dataset.mode")
                == "explorador"
            )
            assert (
                window.evaluate_js("document.querySelector('.app').dataset.theme")
                == "oscuro"
            )
            saved = json.loads(ProjectStore().load())
            assert saved["name"] == "Continuidad fase 06"
            assert saved["objects"][0]["name"] == "Función persistente"
            assert any(h["favorite"] for h in saved["history"])
            report["cases"].append(
                {
                    "name": "reapertura en proceso nuevo conserva entradas, paso, objetos y favoritos",
                    "passed": True,
                }
            )
            report["persistence"] = {
                "reopened": True,
                "adapter": "SQLite independiente del puerto",
            }
            report["approved"] = True
            return
        window.evaluate_js("document.querySelector('#calcular').click()")
        wait(window, "document.querySelector('#resultado').dataset.status === 'ok'")
        assert "7" in window.evaluate_js(
            "document.querySelector('#resultado').innerText"
        )
        window.evaluate_js("document.querySelector('#modo-explorador').click()")
        wait(window, "document.querySelector('.app').dataset.mode === 'explorador'")
        assert (
            window.evaluate_js("document.querySelector('.app').dataset.mode")
            == "explorador"
        )
        assert "7" in window.evaluate_js(
            "document.querySelector('#resultado').innerText"
        )
        report["cases"].append(
            {"name": "interfaz y cambio de presentación", "passed": True}
        )

        # Un sistema rectangular atraviesa el formulario React y el motor nativo.
        window.evaluate_js(
            "(()=>{const e=document.querySelector('#operacion');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'sistemas.resolver');e.dispatchEvent(new Event('change',{bubbles:true}));})();"
        )
        wait(window, "!!document.querySelector('#dato-b')")
        window.evaluate_js(
            "for(const [id,value] of [['matriz-a','1 2 3;2 4 6'],['dato-b','1 2']]){const e=document.getElementById(id);const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}"
        )
        window.evaluate_js("document.querySelector('#calcular').click()")
        wait(
            window, "document.querySelector('#resultado').dataset.status === 'infinite'"
        )
        window.evaluate_js("document.querySelector('#modo-serio').click()")
        assert (
            window.evaluate_js("document.querySelector('#resultado').dataset.status")
            == "infinite"
        )
        assert (
            window.evaluate_js("document.querySelector('#matriz-a').value")
            == "1 2 3;2 4 6"
        )
        report["cases"].append(
            {
                "name": "sistema rectangular desde formulario en ambos modos",
                "passed": True,
            }
        )

        window.evaluate_js(
            "(()=>{const e=document.querySelector('#operacion');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'raices.biseccion');e.dispatchEvent(new Event('change',{bubbles:true}));})();"
        )
        wait(window, "!!document.querySelector('#dato-tolerancia_x')")
        window.evaluate_js("document.querySelector('#calcular').click()")
        wait(window, "document.querySelector('#resultado').dataset.status === 'ok'")
        assert window.evaluate_js("!!document.querySelector('.iteration-table table')")
        window.evaluate_js("document.querySelector('#modo-explorador').click()")
        wait(window, "document.querySelector('.app').dataset.mode === 'explorador'")
        assert (
            window.evaluate_js("document.querySelector('#resultado').dataset.status")
            == "ok"
        )
        report["cases"].append(
            {
                "name": "bisección desde formulario nativo con tabla y cambio de modo",
                "passed": True,
            }
        )

        fixtures = Path(os.environ["NEXO_FIXTURES"])
        for i, problem in enumerate(json.loads(fixtures.read_text(encoding="utf-8"))):
            result = bridge(window, problem, "fixture-" + str(i))
            assert result == execute(problem)
            report["cases"].append(
                {"name": problem["operation_id"], "response": result, "passed": True}
            )

        window.evaluate_js(
            "void (async()=>{const d={requestId:'cancel-test'};"
            "await pywebview.api.prepare(d);await pywebview.api.cancel(d);"
            "window.__cancelResult=await pywebview.api.execute({...d,problem:"
            + json.dumps(
                {
                    "schema_version": "1.0",
                    "operation_id": "matrices.producto",
                    "input": {"A": [["2"]], "B": [["3"]]},
                }
            )
            + "});})();"
        )
        cancelled = wait(window, "window.__cancelResult")
        assert cancelled["response"]["status"] == "cancelled"
        recovered = bridge(
            window,
            {
                "schema_version": "1.0",
                "operation_id": "matrices.producto",
                "input": {"A": [["2"]], "B": [["3"]]},
            },
            "recovery",
        )
        assert recovered["result"]["matrix"] == [["6"]]
        report["cases"].append({"name": "cancelación y recuperación", "passed": True})
        window.evaluate_js(
            "document.querySelector('#tema-oscuro').click();document.querySelector('.steps').open=true;"
        )
        window.evaluate_js(
            "(()=>{const e=document.querySelector('#paso');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'2');e.dispatchEvent(new Event('change',{bubbles:true}));})();"
        )
        wait(
            window, "document.querySelector('.graph-content').dataset.frameRow === '2'"
        )
        assert (
            window.evaluate_js(
                "document.querySelector('tr[aria-selected=true]').dataset.rowIndex"
            )
            == "2"
        )
        window.evaluate_js(
            "document.querySelector('#ampliar-grafica').focus();document.querySelector('#ampliar-grafica').click()"
        )
        wait(window, "!!document.querySelector('dialog[open]')")
        window.evaluate_js(
            "document.querySelector('dialog .dialog-heading button').click()"
        )
        wait(window, "document.activeElement.id === 'ampliar-grafica'")
        report["cases"].append(
            {"name": "geometría, fila, paso y ampliación sincronizados", "passed": True}
        )
        document_dir = output.parent / (output.stem + "-documentos")
        os.environ["NEXO_DOCUMENT_DIR"] = str(document_dir)
        for kind, filename in [
            ("csv", "NexoLineal-tabla.csv"),
            ("pdf", "NexoLineal-procedimiento.pdf"),
        ]:
            destination = document_dir / filename
            window.evaluate_js(
                "document.querySelector('#exportar-" + kind + "').click()"
            )
            end = time.monotonic() + 45
            while time.monotonic() < end:
                if destination.exists():
                    break
                time.sleep(0.1)
            else:
                raise AssertionError("Falta exportación " + kind)
            wait(window, "!document.querySelector('#exportar-pdf').disabled")
        import csv

        with (document_dir / "NexoLineal-tabla.csv").open(
            encoding="utf-8-sig", newline=""
        ) as document:
            csv_rows = list(csv.DictReader(document))
        assert (
            csv_rows and csv_rows[0]["iteracion"] == "1" and "residual" in csv_rows[0]
        )
        from nexolineal.application.catalog import CATALOG

        fields = CATALOG["raices.biseccion"].fields
        ids = {"expresion": "expresion", "inferior": "inferior", "superior": "superior"}
        data = {
            field["name"]: window.evaluate_js(
                "document.getElementById("
                + json.dumps(ids.get(field["name"], "dato-" + field["name"]))
                + ").value"
            )
            for field in fields
        }
        data = {key: value for key, value in data.items() if value != ""}
        expected_rows = execute(
            {"schema_version": "1.0", "operation_id": "raices.biseccion", "input": data}
        )["result"]["tabla"]
        assert len(csv_rows) == len(expected_rows)
        for expected, actual in zip(expected_rows, csv_rows):
            assert all(
                actual[key] == ("" if value is None else str(value))
                for key, value in expected.items()
            )

        assert (
            (document_dir / "NexoLineal-procedimiento.pdf")
            .read_bytes()
            .startswith(b"%PDF-")
        )
        report["exports"] = {
            "pdf": True,
            "csv": True,
            "csv_rows": len(csv_rows),
            "test_destination": True,
        }
        report["cases"].append(
            {
                "name": "PDF y CSV producidos por la interfaz y guardados por el puente",
                "passed": True,
            }
        )
        window.evaluate_js(
            "document.querySelector('#expresion').closest('.input-field').querySelector('.save-input').click()"
        )
        wait(window, "!!document.querySelector('#object-name')")
        window.evaluate_js(
            "(()=>{const e=document.querySelector('#object-name');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Función persistente');e.dispatchEvent(new Event('input',{bubbles:true}));})();"
        )
        window.evaluate_js("document.querySelector('#confirmar-objeto').click()")
        wait(window, "!document.querySelector('dialog')")
        window.evaluate_js(
            "document.querySelector('nav button[data-route=historial]').click()"
        )
        wait(window, "!!document.querySelector('#project-name')")
        window.evaluate_js(
            "(()=>{const e=document.querySelector('#project-name');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Continuidad fase 06');e.dispatchEvent(new Event('input',{bubbles:true}));})();"
        )
        window.evaluate_js("document.querySelector('.favorite-button').click()")
        window.evaluate_js("document.querySelector('#abrir-json').click()")
        wait(window, "!!document.querySelector('#project-json')")
        portable = json.loads(
            window.evaluate_js("document.querySelector('#project-json').value")
        )
        assert portable["format"] == "NexoLineal.Project" and portable["version"] == 1
        assert portable["active"]["step"] == 2
        window.evaluate_js("document.querySelector('#importar-json').click()")
        wait(
            window,
            "!document.querySelector('dialog') && document.querySelector('#resultado').dataset.status === 'ok'",
        )
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            saved = json.loads(ProjectStore().load() or "{}")
            if (
                saved.get("name") == "Continuidad fase 06"
                and saved.get("active", {}).get("step") == 2
                and saved.get("objects")
                and any(h["favorite"] for h in saved.get("history", []))
            ):
                break
            time.sleep(0.1)
        else:
            raise AssertionError("No se confirmó el guardado del proyecto.")
        report["cases"].append(
            {
                "name": "objetos, favorito, tema y paso guardados desde la interfaz",
                "passed": True,
            }
        )
        report["persistence"] = {"saved": True, "adapter": "SQLite"}
        report["approved"] = True
    except Exception as error:
        report["error"] = repr(error)
        report["traceback"] = traceback.format_exc()
    finally:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        try:
            # PyInstaller --noconsole no proporciona los flujos de terminal.
            if not getattr(sys, "frozen", False):
                print(
                    "NEXO_WINDOWS_REPORT=" + json.dumps(report, ensure_ascii=False),
                    flush=True,
                )
        finally:
            window.destroy()
