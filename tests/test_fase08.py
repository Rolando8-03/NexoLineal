"""Persistencia transaccional real, migración y recuperación ante fallos."""

import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from apps.windows.sqlite_store import SQLiteStore
from apps.windows.project_io import ProjectStore


class SQLitePersistence(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.db = self.root / "workspace.sqlite3"
        self.legacy = self.root / "workspace.json"
        self.store = SQLiteStore(self.db, self.legacy)
        self.raw = json.dumps(
            {
                "format": "NexoLineal.Project",
                "version": 1,
                "name": "Álgebra",
                "value": "9007199254740993/2",
            },
            ensure_ascii=False,
        )

    def tearDown(self):
        self.directory.cleanup()

    def test_empty_database(self):
        self.assertIsNone(self.store.load())
        self.assertEqual(self.db.read_bytes()[:16], b"SQLite format 3\x00")

    def test_roundtrip_and_fresh_instance(self):
        self.store.save(self.raw)
        self.assertEqual(SQLiteStore(self.db, self.legacy).load(), self.raw)
        with sqlite3.connect(self.db) as db:
            self.assertEqual(db.execute("PRAGMA integrity_check").fetchone()[0], "ok")

    def test_migrate_without_deleting_legacy(self):
        ProjectStore(self.legacy).save(self.raw)
        self.assertEqual(self.store.load(), self.raw)
        self.assertEqual(self.legacy.read_text(), self.raw)
        self.store.save(self.raw.replace("Álgebra", "Nuevo"))
        self.assertEqual(self.legacy.read_text(), self.raw)

    def test_database_wins_over_legacy(self):
        self.store.save(self.raw)
        ProjectStore(self.legacy).save(self.raw.replace("Álgebra", "Anterior"))
        self.assertEqual(self.store.load(), self.raw)

    def test_bad_migration_preserves_original(self):
        self.legacy.write_text("no-json")
        with self.assertRaises(ValueError):
            self.store.load()
        self.assertEqual(self.legacy.read_text(), "no-json")
        with sqlite3.connect(self.db) as db:
            self.assertEqual(
                db.execute("SELECT count(*) FROM workspace").fetchone()[0], 0
            )

    def test_bad_write_preserves_committed_document(self):
        self.store.save(self.raw)
        with self.assertRaises(ValueError):
            self.store.save("{bad")
        self.assertEqual(self.store.load(), self.raw)

    def test_rollback_on_failed_update(self):
        self.store.save(self.raw)
        with sqlite3.connect(self.db) as db:
            db.execute(
                "CREATE TRIGGER reject_update BEFORE UPDATE ON workspace BEGIN SELECT RAISE(ABORT,'fallo controlado'); END"
            )
        with self.assertRaises(sqlite3.DatabaseError):
            self.store.save(self.raw.replace("Álgebra", "Nuevo"))
        self.assertEqual(self.store.load(), self.raw)

    def test_unknown_schema_version_does_not_reset(self):
        self.store.save(self.raw)
        with sqlite3.connect(self.db) as db:
            db.execute("PRAGMA user_version=99")
        with self.assertRaises(ValueError):
            self.store.load()
        with sqlite3.connect(self.db) as db:
            self.assertEqual(
                db.execute("SELECT content FROM workspace").fetchone()[0], self.raw
            )

    def test_concurrent_instances_keep_complete_documents(self):
        self.store.load()
        choices = [self.raw.replace("Álgebra", "Proyecto " + str(i)) for i in range(12)]

        def save(raw):
            SQLiteStore(self.db, self.legacy).save(raw)

        with ThreadPoolExecutor(max_workers=4) as workers:
            list(workers.map(save, choices))
        self.assertIn(self.store.load(), choices)

    def test_corrupt_database_is_not_overwritten(self):
        self.db.write_bytes(b"original-corrupto")
        with self.assertRaises(sqlite3.DatabaseError):
            self.store.load()
        self.assertEqual(self.db.read_bytes(), b"original-corrupto")


if __name__ == "__main__":
    unittest.main()
