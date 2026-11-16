"""Permite consultar determinantes desde la interfaz y la consola.
Reutiliza cofactores, Sarrus y reducción triangular del programa 5.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

from operaciones_matrices import analizar_determinante, _serializar
from modulos.modulo_matrices import matriz_exacta, determinante, determinante_cofactores, sarrus


def ejecutar_determinante_interfaz(datos):
    """Recibe A como texto o filas; devuelve su determinante serializado para la ventana."""
    return _serializar(analizar_determinante(matriz_exacta(datos.get("A", ""))))


def menu_determinantes():
    """Sin argumentos; muestra las opciones del módulo de determinantes en consola."""
    from modulos.consola import menu_matrices_cli
    menu_matrices_cli("determinantes")
