"""Inicia los menús de consola o la ventana gráfica de NexoLineal.
Integra los módulos de las tareas 1 a 5 de Álgebra Lineal.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

import sys
from pathlib import Path
from modulos import modulo_matrices
from modulos.consola import menu_principal

def obtener_ruta_recurso(nombre_recurso):
    """Recibe el nombre de un recurso y devuelve su ruta local o empaquetada."""
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        ruta_base = Path(sys._MEIPASS)
    else:
        ruta_base = Path(__file__).resolve().parent

    return ruta_base / nombre_recurso

def iniciar_aplicacion():
    """Crea e inicia la ventana principal. Sin argumentos."""

    import webview

    ruta_index = obtener_ruta_recurso("index.html")
    ruta_icono = obtener_ruta_recurso("assets/icono.ico")

    webview.create_window(
        title="NexoLineal · Álgebra Lineal",
        url=str(ruta_index),
        width=1900,
        height=1000,
        min_size=(900, 600),
        maximized=True
    )

    webview.start(
        http_server=True,
        icon=str(ruta_icono)
    )

if __name__ == "__main__":
    try:
        if "--gui" in sys.argv:
            iniciar_aplicacion()
        else:
            menu_principal()
    except (EOFError, KeyboardInterrupt):
        print("\nHasta luego.")


