"""Referencia independiente de los algoritmos recibidos. SymPy se usa solo en pruebas."""
import json
import random
from fractions import Fraction
from pathlib import Path
import sympy as sp
from python.analisis_sistema import resolver_sistema
from modulos.modulo_matrices import determinante, inversa_gauss_jordan
from modulos.factorizacion import factorizar_lu

rng = random.Random(20261116)
checks = 0
counts = {"unica": 0, "infinitas": 0, "inconsistente": 0}
lu_applicable = 0

def matrix(data):
    return sp.Matrix([[sp.Rational(str(value)) for value in row] for row in data])

for rows in range(1, 7):
    for columns in range(1, 7):
        for case in range(8):
            A = [[Fraction(rng.randint(-4, 4), rng.randint(1, 5))
                  for _ in range(columns)] for _ in range(rows)]
            b = [Fraction(rng.randint(-4, 4), rng.randint(1, 5)) for _ in range(rows)]
            if case == 0:
                A[-1] = [Fraction(0)] * columns
            if case == 1 and rows > 1:
                A[-1] = A[0][:]
            reference, vector = matrix(A), sp.Matrix([sp.Rational(str(value)) for value in b])
            augmented = reference.row_join(vector)
            rank, augmented_rank = reference.rank(), augmented.rank()
            expected = "inconsistente" if rank < augmented_rank else "unica" if rank == columns else "infinitas"
            result = resolver_sistema(A, b)
            assert result["tipo"] == expected
            assert (result["rango_A"], result["rango_aumentada"]) == (rank, augmented_rank)
            assert matrix(result["matriz_rref"]) == augmented.rref()[0]
            checks += 3
            counts[expected] += 1
            if expected != "inconsistente":
                particular = sp.Matrix([sp.Rational(value) for value in result["solucion_particular"]])
                assert reference * particular == vector
                checks += 1
                for direction in result["direcciones"]:
                    assert reference * sp.Matrix([sp.Rational(value) for value in direction]) == sp.zeros(rows, 1)
                    checks += 1
            if rows == columns:
                assert sp.Rational(str(determinante(A))) == reference.det()
                checks += 1
                if reference.det():
                    inverse = matrix(inversa_gauss_jordan(A))
                    assert reference * inverse == sp.eye(rows) == inverse * reference
                    checks += 1
            try:
                factors = factorizar_lu(A)
            except ValueError as error:
                assert "intercambio" in str(error) or "pivoteo" in str(error)
            else:
                assert matrix(factors["L"]) * matrix(factors["U"]) == reference
                lu_applicable += 1
                checks += 1

report = {"semilla": 20261116, "sistemas": sum(counts.values()), "clasificaciones": counts,
          "comprobaciones": checks, "lu_aplicables": lu_applicable,
          "referencia": "SymPy " + sp.__version__, "fallos": 0}
output = Path("evidencia-ci")
output.mkdir(exist_ok=True)
(output/"auditoria-matematica.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report))
