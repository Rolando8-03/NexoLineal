"""Invariantes independientes de geometría y modelos; no comparaciones con SVG."""

import copy
from fractions import Fraction as F
import unittest
from nexolineal.application.service import execute
from nexolineal.application.visuals import function_segments, clipped_equation
from nexolineal.application.learning import APPLICATIONS, THEOREMS
from nexolineal.algorithms.numerical.functions import Function
from nexolineal.algorithms.linear.context import Context


def run(op, data, **options):
    return execute(
        {
            "schema_version": "1.0",
            "operation_id": op,
            "input": data,
            "options": {"include_visualization": True, **options},
        }
    )


class GeometryTests(unittest.TestCase):
    def test_option_is_opt_in_and_does_not_change_solution(self):
        data = {"A": "1 2;2 4", "b": "3 6"}
        original = execute(
            {
                "schema_version": "1.0",
                "operation_id": "sistemas.resolver",
                "input": data,
            }
        )
        plotted = run("sistemas.resolver", data)
        plotted["metadata"].pop("visualization")
        self.assertEqual(original, plotted)

    def test_invalid_option_is_rejected(self):
        self.assertEqual(
            run("vectores.norma", {"u": "1 2"}, include_visualization="true")["status"],
            "invalid_input",
        )

    def test_2d_lines_satisfy_original_equations(self):
        A = [[F(1), F(2)], [F(-2), F(1)]]
        b = [F(3), F(1)]
        s = run("sistemas.resolver", {"A": "1 2;-2 1", "b": "3 1"})["metadata"][
            "visualization"
        ]
        self.assertEqual(s["dimension"], 2)
        for i in range(2):
            self.assertEqual(len(s["series"][i]["points"]), 2)
            for p in s["series"][i]["points"]:
                self.assertEqual(sum(a * F(x) for a, x in zip(A[i], p)), b[i])

    def test_vertical_and_horizontal_lines(self):
        self.assertEqual(
            clipped_equation([F(1), F(0)], F(2), F(4)), [[F(2), F(-4)], [F(2), F(4)]]
        )
        self.assertTrue(
            all(p[1] == 3 for p in clipped_equation([F(0), F(1)], F(3), F(4)))
        )

    def test_3d_planes_satisfy_original_equations(self):
        A = [[1, 2, 3], [0, 1, -1], [1, 0, 1]]
        b = [6, 0, 2]
        r = run("sistemas.resolver", {"A": A, "b": b})
        s = r["metadata"]["visualization"]
        self.assertEqual(s["dimension"], 3)
        for row, rhs, item in zip(A, b, s["series"]):
            self.assertGreaterEqual(len(item["points"]), 3)
            for p in item["points"]:
                self.assertEqual(sum(a * F(x) for a, x in zip(row, p)), rhs)

    def test_solution_line_lies_in_both_planes(self):
        r = run("sistemas.resolver", {"A": "1 1 0;0 1 1", "b": "2 3"})
        self.assertEqual(r["status"], "infinite")
        family = next(
            s
            for s in r["metadata"]["visualization"]["series"]
            if s["label"] == "Familia de soluciones"
        )
        for x, y, z in (map(F, p) for p in family["points"]):
            self.assertEqual(x + y, 2)
            self.assertEqual(y + z, 3)

    def test_inconsistent_system_has_no_solution_point(self):
        r = run("sistemas.resolver", {"A": "1 1;2 2", "b": "1 3"})
        self.assertEqual(r["status"], "inconsistent")
        self.assertFalse(
            any(
                s["label"] == "Solución particular"
                for s in r["metadata"]["visualization"]["series"]
            )
        )

    def test_zero_equations_explain_ambient_and_contradiction(self):
        for rhs, status in [("0", "infinite"), ("1", "inconsistent")]:
            r = run("sistemas.resolver", {"A": "0 0 0", "b": rhs})
            self.assertEqual(r["status"], status)
            self.assertTrue(
                any("0=" + rhs in n for n in r["metadata"]["visualization"]["notes"])
            )

    def test_large_dimension_does_not_fake_a_projection(self):
        r = run("sistemas.resolver", {"A": "1 0 0 0", "b": "1"})
        self.assertEqual(r["status"], "infinite")
        self.assertEqual(r["metadata"]["visualization"]["kind"], "unavailable")

    def test_transform_grid_is_image_of_source_grid(self):
        r = run("transformaciones.analizar", {"A": "1 2;0 -1"})
        grid = r["metadata"]["visualization"]["series"]
        for original, mapped in zip(grid[::2], grid[1::2]):
            for p, q in zip(original["points"], mapped["points"]):
                x, y = map(F, p)
                self.assertEqual(list(map(F, q)), [x + 2 * y, -y])

    def test_singular_transformation_can_collapse_lines(self):
        r = run("transformaciones.analizar", {"A": "1 0;0 0"})
        grid = r["metadata"]["visualization"]["series"]
        self.assertTrue(all(F(p[1]) == 0 for s in grid[1::2] for p in s["points"]))

    def test_projection_exact_and_orthogonal(self):
        r = run("vectores.proyeccion", {"u": "2 3 5", "v": "1 2 0"})
        p = list(map(F, r["result"]["proyeccion"]))
        d = list(map(F, r["result"]["componente_ortogonal"]))
        self.assertEqual([a + b for a, b in zip(p, d)], [2, 3, 5])
        self.assertEqual(d[0] + 2 * d[1], 0)
        self.assertTrue(r["verification"]["passed"])
        self.assertEqual(r["metadata"]["visualization"]["dimension"], 3)

    def test_projection_on_zero_is_not_applicable(self):
        self.assertEqual(
            run("vectores.proyeccion", {"u": "2 3", "v": "0 0"})["status"],
            "not_applicable",
        )

    def test_all_root_frames_reuse_exact_rows_and_steps(self):
        inputs = {
            "biseccion": {"inferior": "1", "superior": "2"},
            "falsa_posicion": {"inferior": "1", "superior": "2"},
            "newton": {"inicial": "2"},
            "secante": {"anterior": "1", "inicial": "2"},
        }
        for method, extra in inputs.items():
            r = run("raices." + method, {"expresion": "x^2-2", **extra})
            s = r["metadata"]["visualization"]
            self.assertEqual(s["kind"], "roots")
            for i, (row, frame, step) in enumerate(
                zip(r["result"]["tabla"], s["frames"], r["steps"])
            ):
                self.assertEqual(frame["values"], row)
                self.assertEqual(step["data"], row)
                self.assertEqual(frame["row"], i)
                self.assertEqual(frame["step"], i)
                pt = next(z for z in frame["series"] if z["label"] == "Punto actual")[
                    "points"
                ][0]
                self.assertEqual(list(map(F, pt)), [F(row["x"]), F(row["fx"])])

    def test_curves_never_bridge_a_pole_between_samples(self):
        ctx = Context()
        f = Function("1/(x-1/13)", ctx)
        segments, gaps = function_segments(f, F(-1), F(1), ctx)
        self.assertGreater(gaps, 0)
        for segment in segments:
            xs = [F(p[0]) for p in segment]
            self.assertFalse(min(xs) < F(1, 13) < max(xs))

    def test_logarithm_negative_half_is_omitted(self):
        ctx = Context()
        segments, gaps = function_segments(Function("ln(x)", ctx), F(-1), F(2), ctx)
        self.assertGreater(gaps, 0)
        self.assertTrue(all(F(p[0]) > 0 for s in segments for p in s))

    def test_residual_graph_uses_table_without_reinterpretation(self):
        for method in ("jacobi", "gauss_seidel"):
            r = run("iterativos." + method, {"A": "4 1;1 3", "b": "1 2"})
            s = r["metadata"]["visualization"]
            self.assertEqual(s["kind"], "residual")
            self.assertEqual(
                s["series"][0]["points"],
                [
                    [str(row["iteracion"]), row["norma_residual"]]
                    for row in r["result"]["tabla"]
                ],
            )

    def test_no_steps_has_rows_but_no_invented_step_indices(self):
        r = run(
            "raices.biseccion",
            {"expresion": "x^2-2", "inferior": "1", "superior": "2"},
            include_steps=False,
        )
        self.assertEqual(r["steps"], [])
        self.assertTrue(
            all(f["step"] is None for f in r["metadata"]["visualization"]["frames"])
        )

    def test_out_of_plot_range_does_not_destroy_math_result(self):
        r = run("vectores.suma", {"u": "10000000 0", "v": "0 1"})
        self.assertEqual(r["status"], "ok")
        self.assertEqual(r["result"]["vector"], ["10000000", "1"])
        self.assertEqual(r["metadata"]["visualization"]["kind"], "unavailable")

    def test_every_application_verifies_equations_and_restrictions(self):
        for app in APPLICATIONS:
            r = execute({**app["problem"], "options": {"include_visualization": True}})
            context = r["metadata"]["application"]
            self.assertEqual(context["id"], app["id"])
            self.assertTrue(context["passed"])
            self.assertTrue(all(context["checks"].values()))
            self.assertEqual(len(context["interpretation"]), 2)
            self.assertTrue(all(v["unit"] for v in context["interpretation"]))
        pop = execute(
            {**APPLICATIONS[-1]["problem"], "options": {"include_visualization": True}}
        )
        self.assertEqual(pop["result"]["matrix"], [["170"], ["130"]])

    def test_modified_application_is_not_mislabelled_as_verified_model(self):
        p = copy.deepcopy(APPLICATIONS[0]["problem"])
        p["input"]["b"] = "30 11"
        p["options"] = {"include_visualization": True}
        self.assertNotIn("application", execute(p)["metadata"])

    def test_theorems_have_hypotheses_sources_and_available_operations(self):
        from nexolineal.application.catalog import CATALOG

        self.assertEqual(len(THEOREMS), 12)
        for t in THEOREMS:
            self.assertTrue(t["hypotheses"])
            self.assertTrue(t["reference"]["url"].startswith("https://"))
            self.assertTrue(
                all(
                    any(k.startswith(prefix) for k in CATALOG)
                    for prefix in t["operations"]
                )
            )


if __name__ == "__main__":
    unittest.main()
