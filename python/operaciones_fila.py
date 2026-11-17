"""Aplica las operaciones elementales sobre filas de una matriz.
Implementa la base de los métodos de eliminación de sistemas.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

# Compatibilidad con la interfaz anterior; el código ejecutable reside en el núcleo.
from nexolineal.algorithms.legacy import operaciones_fila as _implementacion
__all__ = [name for name in vars(_implementacion) if not name.startswith("__")]
globals().update({name: getattr(_implementacion, name) for name in __all__})
