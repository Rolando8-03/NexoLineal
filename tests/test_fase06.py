"""Persistencia local, límites y escritura atómica del adaptador Windows."""

import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor
from apps.windows.project_io import ProjectStore, validate_content, MAX_BYTES


class ProjectPersistence(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.path = Path(self.folder.name) / "perfil" / "workspace.json"
        self.store = ProjectStore(self.path)
        self.raw = json.dumps(
            {
                "format": "NexoLineal.Project",
                "version": 1,
                "name": "Álgebra",
                "values": ["9007199254740993/2", "0", ""],
            },
            ensure_ascii=False,
        )

    def tearDown(self):
        self.folder.cleanup()

    def test_no_file_is_empty_not_failure(self):
        self.assertIsNone(self.store.load())

    def test_roundtrip_fresh_instance_preserves_exact_text(self):
        self.store.save(self.raw)
        self.assertEqual(ProjectStore(self.path).load(), self.raw)

    def test_invalid_json_leaves_previous_file(self):
        self.store.save(self.raw)
        for raw in [
            "{",
            "[]",
            '{"format":"otro","version":1}',
            '{"format":"NexoLineal.Project","version":2}',
        ]:
            with self.assertRaises((ValueError, TypeError)):
                self.store.save(raw)
            self.assertEqual(self.store.load(), self.raw)

    def test_oversize_utf8_does_not_replace_project(self):
        self.store.save(self.raw)
        with self.assertRaises(ValueError):
            self.store.save("á" * (MAX_BYTES // 2 + 1))
        self.assertEqual(self.store.load(), self.raw)

    def test_write_failure_keeps_last_confirmed_state(self):
        self.store.save(self.raw)
        with patch(
            "apps.windows.project_io.os.replace",
            side_effect=OSError("disco no disponible"),
        ):
            with self.assertRaises(OSError):
                self.store.save(self.raw.replace("Álgebra", "Nuevo"))
        self.assertEqual(self.store.load(), self.raw)
        self.assertEqual(list(self.path.parent.glob("*.tmp")), [])

    def test_corrupt_existing_data_is_not_silently_deleted(self):
        self.path.parent.mkdir()
        self.path.write_text("no-json")
        with self.assertRaises(ValueError):
            self.store.load()
        self.assertEqual(self.path.read_text(), "no-json")

    def test_concurrent_saves_produce_one_complete_json(self):
        choices = [self.raw.replace("Álgebra", "Proyecto " + str(i)) for i in range(12)]
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(self.store.save, choices))
        self.assertIn(self.store.load(), choices)
        json.loads(self.path.read_text())

    def test_profile_override_has_fixed_location(self):
        with patch.dict(os.environ, {"NEXO_STATE_FILE": str(self.path)}):
            self.assertEqual(ProjectStore().path, self.path)

    def test_project_validation_rejects_non_text(self):
        for value in [None, {}, 4, False]:
            with self.assertRaises(ValueError):
                validate_content(value)
