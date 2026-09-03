import webview
import os
ruta_actual = os.path.dirname(os.path.abspath(__file__))
ruta_index = os.path.join(ruta_actual, "..", "index.html")

if __name__ == '__main__':
    ventana = webview.create_window(
        'Calculadora de Álgebra Lineal', 
        url=ruta_index, 
        width=1200, 
        height=800
    )
    
    webview.start(http_server=True)
