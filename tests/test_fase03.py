"""Cancelación y aislamiento del motor común para las tres plataformas."""
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from nexolineal.application.service import execute
from nexolineal.platforms.jobs import JobPool

PROBLEM = {"schema_version":"1.0", "operation_id":"matrices.producto",
           "input":{"A":[["1","2"],["3","4"]],"B":[["1","0"],["0","1"]]}}

class PlatformControl(unittest.TestCase):
    def test_unchanged_default_contract(self):
        result = execute(PROBLEM)
        self.assertEqual(result["result"]["matrix"], [["1","2"],["3","4"]])
        self.assertTrue(result["verification"]["passed"])

    def test_cancel_before_execution(self):
        result = execute(PROBLEM, is_cancelled=lambda: True)
        self.assertEqual(result["status"], "cancelled")
        self.assertIsNone(result["result"])
        self.assertEqual(result["steps"], [])

    def test_cancel_during_rows(self):
        event = threading.Event()
        progress = []
        def update(value):
            progress.append(value)
            event.set()
        result = execute(PROBLEM, is_cancelled=event.is_set, on_progress=update)
        self.assertEqual(progress, [50])
        self.assertEqual(result["status"], "cancelled")
        self.assertIsNone(result["result"])

    def test_progress_reaches_completion(self):
        progress = []
        result = execute(PROBLEM, on_progress=progress.append)
        self.assertEqual(progress, [50, 100])
        self.assertEqual(result["status"], "ok")

    def test_pool_cancel_and_recover(self):
        pool = JobPool()
        pool.prepare("one")
        pool.cancel("one")
        self.assertEqual(pool.run("one", PROBLEM)["status"], "cancelled")
        pool.prepare("two")
        self.assertEqual(pool.run("two", PROBLEM)["status"], "ok")

    def test_duplicate_id(self):
        pool = JobPool()
        pool.prepare("same")
        with self.assertRaises(ValueError):
            pool.prepare("same")

    def test_missing_job(self):
        pool = JobPool()
        with self.assertRaises(ValueError):
            pool.run("missing", PROBLEM)
        self.assertFalse(pool.cancel("missing")["cancelled"])

    def test_concurrent_jobs_are_isolated(self):
        pool = JobPool()
        pool.prepare("cancel")
        pool.prepare("keep")
        pool.cancel("cancel")
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = dict(zip(("cancel","keep"), executor.map(lambda key: pool.run(key, PROBLEM), ("cancel","keep"))))
        self.assertEqual(results["cancel"]["status"], "cancelled")
        self.assertEqual(results["keep"]["status"], "ok")

    def test_pool_budget(self):
        pool = JobPool()
        for i in range(8):
            pool.prepare(str(i))
        with self.assertRaises(ValueError):
            pool.prepare("extra")
        pool.cancel_all()
        pool.prepare("again")
        self.assertEqual(pool.run("again", PROBLEM)["status"], "ok")

    def test_job_cleanup(self):
        pool = JobPool()
        for _ in range(12):
            pool.prepare("reused")
            self.assertEqual(pool.run("reused", PROBLEM)["status"], "ok")
        self.assertEqual(pool.progress("reused")["progress"], 100)

if __name__ == "__main__":
    unittest.main()
