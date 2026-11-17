"""Validación binaria y escritura atómica de documentos elegidos por el usuario."""

import base64
from pathlib import Path
import os
import tempfile

MAX_DOCUMENT_BYTES = 16 * 1024 * 1024
FORMATS = {
    "pdf": ("NexoLineal-procedimiento.pdf", "Procedimiento PDF (*.pdf)"),
    "csv": ("NexoLineal-tabla.csv", "Tabla CSV (*.csv)"),
}


def document_payload(data):
    if (
        not isinstance(data, dict)
        or data.get("kind") not in FORMATS
        or not isinstance(data.get("content"), str)
    ):
        raise ValueError("Tipo de documento no admitido.")
    if len(data["content"]) > (MAX_DOCUMENT_BYTES + 2) // 3 * 4:
        raise ValueError("El documento supera 16 MiB.")
    content = base64.b64decode(data["content"], validate=True)
    if len(content) > MAX_DOCUMENT_BYTES:
        raise ValueError("El documento supera 16 MiB.")
    if data["kind"] == "pdf" and not content.startswith(b"%PDF-"):
        raise ValueError("El documento no contiene un PDF.")
    if data["kind"] == "csv":
        content.decode("utf-8")
    return data["kind"], content


def save_document(destination, content):
    destination = Path(destination)
    fd, name = tempfile.mkstemp(
        prefix=".nexo-document-", suffix=".tmp", dir=destination.parent
    )
    try:
        with os.fdopen(fd, "wb") as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.replace(name, destination)
    finally:
        if os.path.exists(name):
            os.unlink(name)
