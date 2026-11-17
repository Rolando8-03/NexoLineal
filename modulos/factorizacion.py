"""Resuelve Ax=b por Cramer, inversa y factorización LU sin intercambios.
Implementa los temas de determinantes y factorización de las semanas 7 y 8.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

# Compatibilidad con la interfaz anterior; el código ejecutable reside en el núcleo.
from nexolineal.algorithms.legacy import factorizacion as _implementacion
__all__ = [name for name in vars(_implementacion) if not name.startswith("__")]
globals().update({name: getattr(_implementacion, name) for name in __all__})
