from fractions import Fraction as F
from unittest import TestCase
from nexolineal.application.service import execute


def calculate(op, **data):
    return execute({"schema_version": "1.0", "operation_id": op, "input": data})


class EjercicioClase(TestCase):
    def test_sustitucion_por_fila_y_parada(self):
        data = dict(A="10 -1 2 0;-1 11 -1 3;2 -1 10 -1;0 3 -1 8",
                    b="6 25 -11 15", referencia="1 2 -1 1",
                    criterio="porcentaje_y_residual", porcentaje="0.1")
        for method, expected in [
            ("jacobi", ["3/5", "25/11", "-11/10", "15/8"]),
            ("gauss_seidel", ["3/5", "128/55", "-543/550", "3867/4400"])
        ]:
            res = calculate("iterativos." + method, **data)
            self.assertEqual(res["status"], "ok")
            out = res["result"]
            first, last = out["tabla"][0], out["tabla"][-1]
            self.assertEqual(first["vector"], expected)
            self.assertEqual(first["cambio_porcentual_maximo"], "100")
            self.assertEqual(out["motivo_parada"], "porcentaje_y_residual_suficientes")
            self.assertLessEqual(F(last["cambio_porcentual_maximo"]), F("0.1"))
            self.assertLessEqual(F(last["norma_residual"]), F(last["umbral_residual"]))
            self.assertEqual(out["error_verdadero"], last["error_verdadero"])
            self.assertTrue(out["dominancia_diagonal_estricta"])

    def test_relajacion_y_componente_cero(self):
        data = dict(A="4 1;2 3", b="1 2")
        base = calculate("iterativos.gauss_seidel", **data)["result"]
        self.assertEqual(base, calculate("iterativos.gauss_seidel", omega="1", **data)["result"])
        relaxed = calculate("iterativos.gauss_seidel", omega="1.2", **data)
        self.assertEqual(relaxed["status"], "ok")
        self.assertEqual(relaxed["result"]["tabla"][0]["vector"], ["3/10", "14/25"])
        self.assertEqual(calculate("iterativos.gauss_seidel", omega="2", **data)["status"], "invalid_input")
        r = calculate("iterativos.jacobi", A="1 0;0 1", b="0 1", inicial="1 0", criterio="porcentaje_y_residual")["result"]
        self.assertIsNone(r["tabla"][0]["cambio_porcentual_maximo"])
        self.assertEqual(r["tabla"][1]["cambio_porcentual_maximo"], "0")

    def test_consultas_misma_matriz(self):
        r = calculate("matrices.analizar", A="1 2;3 4", consultas="rango transpuesta")["result"]
        self.assertEqual(r, {"rango":2, "transpuesta":[["1","3"],["2","4"]]})
        r = calculate("determinantes.calcular", A="1 2;2 4", consultas="inversa")["result"]
        self.assertEqual(r["valor"], "0")
        self.assertIn("Sin inversa", r["inversa"])
