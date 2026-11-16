"""Conecta las entradas de la interfaz con el solucionador de sistemas.
Integra los programas 1 y 2: Gauss y Gauss-Jordan.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

from entrada_datos import leer_matriz_texto
from analisis_sistema import resolver_sistema


def resolver_desde_interfaz(datos):
    """Convierte los datos de la ventana y resuelve el sistema. Recibe datos."""
    A, b = leer_matriz_texto(
        datos["textos_A"],
        datos["textos_b"],
    )

    return resolver_sistema(A, b)
