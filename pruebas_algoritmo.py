"""Pruebas automáticas para los tres casos obligatorios de la guía."""

import unittest

from algebra_lineal import resolver_sistema


class PruebasEliminacionPorFilas(unittest.TestCase):
    def test_solucion_unica(self):
        A = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]
        b = [8, -11, -3]
        resultado = resolver_sistema(A, b)

        self.assertEqual(resultado["tipo"], "unica")
        esperada = [2, 3, -1]
        for obtenido, esperado in zip(resultado["solucion"], esperada):
            self.assertAlmostEqual(obtenido, esperado)
        self.assertTrue(all(item["cumple"] for item in resultado["comprobaciones"]))

    def test_infinitas_soluciones(self):
        A = [[1, 1, 1], [2, 2, 2], [1, -1, 1]]
        b = [3, 6, 1]
        resultado = resolver_sistema(A, b)

        self.assertEqual(resultado["tipo"], "infinitas")
        self.assertEqual(resultado["variables_libres"], [2])
        self.assertTrue(all(item["cumple"] for item in resultado["comprobaciones"]))

    def test_sistema_inconsistente(self):
        A = [[1, 1, 1], [2, 2, 2], [1, -1, 1]]
        b = [3, 7, 1]
        resultado = resolver_sistema(A, b)

        self.assertEqual(resultado["tipo"], "inconsistente")
        self.assertLess(resultado["rango_A"], resultado["rango_aumentada"])
        self.assertIsNotNone(resultado["fila_contradiccion"])

    def test_sistema_rectangular_unico(self):
        A = [[1, 1], [2, -1], [3, 0]]
        b = [3, 3, 6]
        resultado = resolver_sistema(A, b)

        self.assertEqual(resultado["tipo"], "unica")
        self.assertAlmostEqual(resultado["solucion"][0], 2)
        self.assertAlmostEqual(resultado["solucion"][1], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
