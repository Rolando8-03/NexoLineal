"""Condiciones, degeneraciones, contratos y decisiones del núcleo de fase 04."""

import copy
import json
from pathlib import Path
import threading
import unittest
from jsonschema import validate, ValidationError
from nexolineal.application.catalog import CATALOG
from nexolineal.application.service import execute

ROOT = Path(__file__).resolve().parents[1]


def request(op, inputs, options=None, **callbacks):
    return execute(
        {
            "schema_version": "1.0",
            "operation_id": op,
            "input": inputs,
            "options": options or {},
        },
        **callbacks
    )


class AlgebraContracts(unittest.TestCase):
    def test_catalog_examples_and_schemas(self):
        schema = json.loads(
            (ROOT / "packages/contracts/problem.schema.json").read_text()
        )
        response_schema = json.loads(
            (ROOT / "packages/contracts/result.schema.json").read_text()
        )
        examples = json.loads(
            (ROOT / "tests/fixtures/fase04_defaults.json").read_text()
        )
        self.assertEqual({x["operation_id"] for x in examples}, set(CATALOG))
        for example in examples:
            with self.subTest(operation=example["operation_id"]):
                validate(example, schema)
                result = execute(example)
                validate(result, response_schema)
                self.assertEqual(result["status"], "ok", result)
        catalog = request("catalogo.operaciones", {})
        self.assertEqual(len(catalog["result"]["operations"]), 44)

    def test_unique_rectangular_and_free_variables(self):
        out = request(
            "sistemas.resolver",
            {"A": [["0", "1", "2"], ["0", "2", "4"]], "b": ["3", "6"]},
        )
        self.assertEqual(out["status"], "infinite")
        self.assertEqual(out["result"]["variables_libres"], [0, 2])
        self.assertEqual(out["result"]["particular"], ["0", "3", "0"])
        self.assertEqual(
            out["result"]["direcciones"], [["1", "0", "0"], ["0", "-2", "1"]]
        )
        out = request(
            "sistemas.resolver",
            {"A": [["1", "0"], ["0", "1"], ["1", "1"]], "b": ["2", "3", "5"]},
        )
        self.assertEqual(out["result"]["particular"], ["2", "3"])

    def test_inconsistency_original_certificate(self):
        out = request(
            "sistemas.resolver", {"A": [["1", "2"], ["2", "4"]], "b": ["3", "7"]}
        )
        self.assertEqual(out["status"], "inconsistent")
        self.assertIsNone(out["result"]["particular"])
        self.assertTrue(out["verification"]["passed"])

    def test_singular_and_method_not_applicable(self):
        A = [["1", "2"], ["2", "4"]]
        self.assertEqual(request("matrices.inversa", {"A": A})["status"], "singular")
        self.assertEqual(
            request("sistemas.cramer", {"A": A, "b": ["1", "2"]})["status"],
            "not_applicable",
        )
        self.assertEqual(
            request("factorizacion.lu", {"A": [["0", "1"], ["1", "0"]]})["status"],
            "not_applicable",
        )
        self.assertEqual(
            request("factorizacion.plu", {"A": [["0", "1"], ["1", "0"]]})["status"],
            "ok",
        )

    def test_plu_swap_after_first_pivot(self):
        out = request(
            "factorizacion.plu",
            {
                "A": [["3", "3", "1"], ["1", "1", "2"], ["2", "4", "4"]],
                "b": ["1", "2", "3"],
            },
        )
        self.assertEqual(out["status"], "ok", out)
        self.assertEqual(out["verification"]["PA"], out["verification"]["LU"])

    def test_plu_singular_inconsistent_original_witness(self):
        out = request(
            "factorizacion.plu", {"A": [["0", "1"], ["0", "2"]], "b": ["0", "1"]}
        )
        self.assertEqual(out["status"], "inconsistent", out)
        self.assertNotEqual(out["result"]["certificado_original"]["yb"], "0")

    def test_sarrus_restricted(self):
        self.assertEqual(
            request(
                "determinantes.calcular",
                {"A": [["1", "0"], ["0", "1"]], "metodo": "sarrus"},
            )["status"],
            "not_applicable",
        )

    def test_adjugate_one_by_one(self):
        out = request("matrices.inversa", {"A": [["3/2"]], "metodo": "adjugata"})
        self.assertEqual(out["result"]["matrix"], [["2/3"]])

    def test_zero_power_does_not_require_inverse(self):
        out = request(
            "matrices.potencia", {"A": [["0", "0"], ["0", "0"]], "exponente": "0"}
        )
        self.assertEqual(out["result"]["matrix"], [["1", "0"], ["0", "1"]])
        self.assertEqual(
            request("matrices.potencia", {"A": [["0"]], "exponente": "-1"})["status"],
            "singular",
        )

    def test_trace_rectangular_is_not_applicable(self):
        self.assertEqual(
            request("matrices.traza", {"A": [["1", "2"]]})["status"], "not_applicable"
        )

    def test_blocks_conditions(self):
        for cuts in ([1, 1], [2, 1], [0], [3]):
            self.assertEqual(
                request(
                    "matrices.particionar",
                    {"A": [["1", "2"], ["3", "4"]], "cortes_filas": cuts},
                )["status"],
                "invalid_input",
            )
        out = request(
            "matrices.producto_bloques",
            {
                "A": [["1", "2", "3"], ["4", "5", "6"]],
                "B": [["1", "0"], ["0", "1"], ["1", "1"]],
                "cortes_filas": [1],
                "cortes_internos": [1, 2],
                "cortes_columnas": [1],
            },
        )
        self.assertEqual(out["result"]["matrix"], [["4", "5"], ["10", "11"]])

    def test_empty_and_dependent_families(self):
        out = request("vectores.analizar", {"vectores": [], "dimension_ambiente": 3})
        self.assertTrue(out["result"]["independiente"])
        self.assertEqual(out["result"]["base_generado"], [])
        out = request("vectores.analizar", {"vectores": [["0", "0"]]})
        self.assertFalse(out["result"]["independiente"])
        self.assertEqual(out["result"]["relaciones_dependencia"], [["1"]])

    def test_empty_span_and_zero_membership(self):
        self.assertTrue(
            request("vectores.generado", {"vectores": [], "v": ["0", "0"]})["result"][
                "pertenece"
            ]
        )
        self.assertFalse(
            request("vectores.generado", {"vectores": [], "v": ["1", "0"]})["result"][
                "pertenece"
            ]
        )

    def test_base_against_declared_target(self):
        plane = [["1", "0", "0"], ["0", "1", "0"]]
        self.assertFalse(
            request("espacios.base", {"vectores": plane})["result"]["es_base"]
        )
        self.assertTrue(
            request("espacios.base", {"vectores": plane, "objetivo": plane})["result"][
                "es_base"
            ]
        )
        self.assertTrue(
            request(
                "espacios.base",
                {"vectores": [], "objetivo": [], "dimension_ambiente": 3},
            )["result"]["es_base"]
        )

    def test_zero_subspaces(self):
        for op in ("espacios.suma", "espacios.interseccion"):
            out = request(op, {"U": [], "V": [], "dimension_ambiente": 3})
            self.assertEqual(out["result"]["base"], [])
            self.assertEqual(out["result"]["dimension"], 0)
        out = request(
            "espacios.interseccion", {"U": [["1", "0"], ["2", "0"]], "V": [["0", "1"]]}
        )
        self.assertEqual(out["result"]["base"], [])

    def test_proper_subspace_coordinates(self):
        base = [["1", "0", "1"], ["0", "1", "1"]]
        out = request("espacios.coordenadas", {"base": base, "v": ["2", "3", "5"]})
        self.assertEqual(out["result"]["coordenadas"], ["2", "3"])
        self.assertEqual(
            request("espacios.coordenadas", {"base": base, "v": ["2", "3", "6"]})[
                "status"
            ],
            "not_applicable",
        )

    def test_basis_orientation_and_mismatch(self):
        out = request(
            "espacios.cambio_base",
            {
                "base_origen": [["1", "0"], ["0", "1"]],
                "base_destino": [["1", "1"], ["1", "-1"]],
                "v": ["3", "1"],
            },
        )
        self.assertEqual(out["result"]["matrix"], [["1/2", "1/2"], ["1/2", "-1/2"]])
        self.assertEqual(out["result"]["coordenadas_destino"], ["2", "1"])
        self.assertEqual(
            request(
                "espacios.cambio_base",
                {"base_origen": [["1", "0"]], "base_destino": [["0", "1"]]},
            )["status"],
            "not_applicable",
        )

    def test_empty_coordinates_and_transition(self):
        self.assertEqual(
            request("espacios.coordenadas", {"base": [], "v": ["0", "0"]})["result"][
                "coordenadas"
            ],
            [],
        )
        out = request(
            "espacios.cambio_base",
            {
                "base_origen": [],
                "base_destino": [],
                "dimension_ambiente": 2,
                "v": ["0", "0"],
            },
        )
        self.assertEqual(out["result"]["matrix"], [])

    def test_transform_dimensions_and_basis_conditions(self):
        self.assertEqual(
            request("transformaciones.analizar", {"A": [["1", "2"]], "v": ["1"]})[
                "status"
            ],
            "invalid_input",
        )
        self.assertEqual(
            request(
                "transformaciones.componer", {"A": [["1", "2"]], "B": [["1", "2"]]}
            )["status"],
            "invalid_input",
        )
        self.assertEqual(
            request(
                "transformaciones.desde_imagenes",
                {"base_dominio": [["1", "0"], ["2", "0"]], "imagenes": [["1"], ["1"]]},
            )["status"],
            "not_applicable",
        )
        self.assertEqual(
            request(
                "transformaciones.representar",
                {
                    "A": [["1", "0"], ["0", "1"]],
                    "base_dominio": [["1", "0"]],
                    "base_codominio": [["1", "0"], ["0", "1"]],
                },
            )["status"],
            "not_applicable",
        )

    def test_arbitrary_functions_are_not_a_linearity_proof(self):
        self.assertEqual(
            request("transformaciones.analizar", {"A": "x*x"})["status"],
            "invalid_input",
        )
        self.assertEqual(
            request("espacios.base", {"vectores": "x^2+y^2=1"})["status"],
            "invalid_input",
        )

    def test_exact_norm_and_cross_restriction(self):
        self.assertEqual(
            request("vectores.norma", {"u": ["1", "1"]})["result"]["norma"], "sqrt(2)"
        )
        self.assertEqual(
            request("vectores.norma", {"u": ["3/2", "2"]})["result"]["norma"], "5/2"
        )
        self.assertEqual(
            request("vectores.producto_cruz", {"u": ["1", "2"], "v": ["3", "4"]})[
                "status"
            ],
            "not_applicable",
        )

    def test_zero_scaling_warning_and_indices(self):
        out = request(
            "matrices.elemental",
            {"A": [["1", "2"]], "accion": "escalar", "indice": 0, "k": "0"},
        )
        self.assertEqual(out["result"]["matrix"], [["0", "0"]])
        self.assertFalse(out["result"]["reversible"])
        self.assertTrue(out["warnings"])
        self.assertEqual(
            request(
                "matrices.elemental",
                {"A": [["1", "2"]], "accion": "sumar", "indice": 0, "otro": 0},
            )["status"],
            "invalid_input",
        )

    def test_false_generalizations_are_marked(self):
        out = request(
            "matrices.propiedades",
            {"A": [["1", "2"], ["0", "1"]], "B": [["2", "0"], ["0", "1"]]},
        )
        records = out["result"]["comparaciones_no_generales"]
        self.assertTrue(all(x["es_ley_general"] is False for x in records))
        self.assertFalse(records[0]["cumple_en_este_caso"])

    def test_inputs_are_not_mutated_and_steps_can_be_omitted(self):
        data = {"A": [["1/2", "1"], ["2", "3"]], "b": ["1", "4"]}
        original = copy.deepcopy(data)
        out = request("sistemas.resolver", data, {"include_steps": False})
        self.assertEqual(data, original)
        self.assertEqual(out["steps"], [])

    def test_cancellation_and_monotone_progress(self):
        event = threading.Event()
        out = request(
            "sistemas.resolver",
            {"A": [["1", "1"], ["1", "2"]], "b": ["1", "2"]},
            is_cancelled=event.is_set,
            on_progress=lambda _: event.set(),
        )
        self.assertEqual(out["status"], "cancelled")
        progress = []
        out = request(
            "espacios.cambio_base",
            {
                "base_origen": [["1", "0"], ["0", "1"]],
                "base_destino": [["1", "1"], ["1", "-1"]],
            },
            on_progress=progress.append,
        )
        self.assertEqual(progress, sorted(progress))
        self.assertEqual(progress[-1], 100)

    def test_limits_and_invalid_options(self):
        self.assertEqual(
            request("matrices.rref", {"A": [["1"]] * 21})["status"], "limit_reached"
        )
        self.assertEqual(
            request("matrices.potencia", {"A": [["1"]], "exponente": "101"})["status"],
            "invalid_input",
        )
        self.assertEqual(
            request("determinantes.calcular", {"A": [["1"]], "metodo": "inventado"})[
                "status"
            ],
            "invalid_input",
        )
        self.assertEqual(
            request("espacios.suma", {"U": [], "V": []})["status"], "invalid_input"
        )

    def test_manifest_matches_the_installed_core(self):
        manifest = json.loads((ROOT / "packages/core/python-files.json").read_text())
        actual = [
            p.relative_to(ROOT).as_posix()
            for p in sorted((ROOT / "packages/core/src/nexolineal").rglob("*.py"))
        ]
        self.assertEqual(manifest, actual)


if __name__ == "__main__":
    unittest.main()
