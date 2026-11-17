"""Proyecto transaccional por usuario, con migración conservadora del JSON anterior."""

from contextlib import contextmanager
from pathlib import Path
import os
import sqlite3
import threading
from .project_io import ProjectStore, validate_content


class SQLiteStore:
    def __init__(self, path=None, legacy=None):
        self.legacy = Path(legacy) if legacy else ProjectStore().path
        self.path = Path(
            path or os.environ.get("NEXO_DB_FILE", self.legacy.with_suffix(".sqlite3"))
        )
        self._lock = threading.Lock()

    @contextmanager
    def connection(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(self.path, timeout=10)
        try:
            with db:
                db.execute("PRAGMA synchronous=FULL")
                version = db.execute("PRAGMA user_version").fetchone()[0]
                if version not in (0, 1):
                    raise ValueError(
                        "Versión de almacenamiento no admitida; se conservó la base existente."
                    )
                db.execute(
                    "CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), content TEXT NOT NULL, updated_at TEXT NOT NULL)"
                )
                db.execute("PRAGMA user_version=1")
                yield db
        finally:
            db.close()

    def load(self):
        with self._lock, self.connection() as db:
            row = db.execute("SELECT content FROM workspace WHERE id=1").fetchone()
            if row:
                return validate_content(row[0])
            # Se conserva el archivo original aun después de confirmar la migración.
            raw = ProjectStore(self.legacy).load()
            if raw is None:
                return None
            db.execute(
                "INSERT OR IGNORE INTO workspace VALUES(1,?,strftime('%Y-%m-%dT%H:%M:%fZ','now'))",
                (raw,),
            )
            return validate_content(
                db.execute("SELECT content FROM workspace WHERE id=1").fetchone()[0]
            )

    def save(self, content):
        validate_content(content)
        with self._lock, self.connection() as db:
            db.execute(
                "INSERT INTO workspace VALUES(1,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(id) DO UPDATE SET content=excluded.content,updated_at=excluded.updated_at",
                (content,),
            )
