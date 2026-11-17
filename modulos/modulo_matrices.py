"""Calcula operaciones, determinantes, inversas y sus propiedades exactas.
Implementa el Módulo III y las sesiones 9, 10 y 11 de Álgebra Lineal.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

# Compatibilidad con la interfaz anterior; el código ejecutable reside en el núcleo.
from nexolineal.algorithms.legacy import modulo_matrices as _implementacion
__all__ = [name for name in vars(_implementacion) if not name.startswith("__")]
globals().update({name: getattr(_implementacion, name) for name in __all__})
