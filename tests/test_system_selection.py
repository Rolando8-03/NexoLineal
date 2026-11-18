"""Regresión de selección y compatibilidad del sistema original."""
import unittest
from nexolineal.application.service import execute

class SystemSelectionTests(unittest.TestCase):
    def solve(self, selection=None, A="1 1;2 2", b="3 7"):
        data = {"A": A, "b": b}
        if selection is not None:
            data["resultados"] = selection
        return execute({"schema_version": "1.0", "operation_id": "sistemas.resolver", "input": data})

    def test_only_ranks_does_not_expose_solution_or_steps(self):
        result = self.solve("rangos")
        self.assertEqual(result["result"]["rango_A"], 1)
        self.assertEqual(result["result"]["rango_aumentada"], 2)
        self.assertNotIn("particular", result["result"])
        self.assertEqual(result["steps"], [])
        self.assertEqual(result["verification"], {})
        self.assertIsNone(result["error"])

    def test_both_methods_share_equivalent_solution(self):
        r = self.solve("gauss jordan solucion comprobacion", "1 1;1 -1", "3 1")
        self.assertEqual(r["result"]["particular"], ["2", "1"])
        self.assertEqual(r["result"]["gauss_jordan"]["matrix"], [["1","0","2"],["0","1","1"]])
        self.assertTrue(r["verification"]["passed"])

    def test_empty_selection_and_unknown_choices_rejected(self):
        for selection in ("", "otro"):
            self.assertEqual(self.solve(selection)["status"], "invalid_input")

    def test_original_request_remains_compatible(self):
        self.assertEqual(self.solve()["result"]["clasificacion"], "incompatible")

    def test_inconsistent_augmented_column_is_also_reduced(self):
        for selected in ("jordan", "gauss jordan"):
            answer = self.solve(selected, "1;0;0", "2 0 4")
            self.assertEqual(answer["result"]["gauss_jordan"]["matrix"],
                             [["1", "0"], ["0", "1"], ["0", "0"]])

    def test_gauss_only_keeps_back_substitution(self):
        answer = self.solve("gauss", "2", "1")
        self.assertIn("sustitucion", [step["kind"] for step in answer["steps"]])
        self.assertNotIn("particular", answer["result"])

    def test_exact_fraction(self):
        self.assertEqual(self.solve("solucion", "2", "1")["result"]["particular"], ["1/2"])

if __name__ == "__main__":
    unittest.main()
