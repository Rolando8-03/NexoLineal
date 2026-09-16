"""Archivo principal de la Calculadora de Álgebra Lineal."""

import sys
from pathlib import Path
import webview

def obtener_ruta_recurso(nombre_recurso):
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        ruta_base = Path(sys._MEIPASS)
    else:
        ruta_base = Path(__file__).resolve().parent

    return ruta_base / nombre_recurso

def iniciar_aplicacion():
    """Crea e inicia la ventana principal."""

    ruta_index = obtener_ruta_recurso("index.html")
    ruta_icono = obtener_ruta_recurso("assets/icono.ico")

    webview.create_window(
        title="Calculadora de Álgebra Lineal",
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
    iniciar_aplicacion()

'''
Instalar dependencias:
pip install pywebview
pip install pyinstaller

Crear ejecutable:
py -m PyInstaller --noconfirm --clean --onefile --windowed --name "NexoLineal" 
--icon "assets\icono.ico" --add-data "index.html;." --add-data "css;css" 
--add-data "js;js" --add-data "python;python" --add-data "assets;assets" main.py
'''