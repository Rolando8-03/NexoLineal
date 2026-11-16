"""Conecta la consola y la ventana con las operaciones vectoriales.
Integra combinación lineal e independencia de los programas 3 y 4.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

from python.vectores import ejecutar_tema
from python.relaciones_vectoriales import ejecutar_relaciones


def ejecutar_vectores_interfaz(datos):
    """Recibe vectores y escalares; devuelve operaciones y propiedades para la ventana."""
    return ejecutar_tema(datos)


def ejecutar_relaciones_interfaz(datos):
    """Recibe la solicitud; devuelve combinación, independencia o propiedades de Ax."""
    return ejecutar_relaciones(datos)


