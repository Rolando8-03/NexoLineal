"""Calcula y presenta operaciones exactas sobre matrices.
Implementa álgebra matricial, transposición y reducción por filas.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

# Compatibilidad con la interfaz anterior; el código ejecutable reside en el núcleo.
from nexolineal.algorithms.legacy import operaciones_matrices as _implementacion
__all__ = [name for name in vars(_implementacion) if not name.startswith("__")]
globals().update({name: getattr(_implementacion, name) for name in __all__})
