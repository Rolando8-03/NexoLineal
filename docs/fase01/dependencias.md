# Dependencias y ejecución actuales

El núcleo usa Python y su biblioteca estándar, incluido fractions.Fraction. Las pruebas locales se ejecutaron con Python 3.12.14. La verificación remota usa Python 3.12 y registra la versión instalada en sus artefactos.

La web se sirve desde index.html. Carga Pyodide 0.26.2, KaTeX 0.16.11, SweetAlert2 con selector de versión 11 y Tailwind mediante CDN. js/ejecutar_python.js copia los módulos al sistema virtual de Pyodide y llama runPython. La ejecución web actual requiere conexión a esos recursos externos.

main.py --gui depende de pywebview y abre la interfaz mediante su servidor HTTP. Abrir_ventana.bat y Abrir_consola.bat son lanzadores recibidos. El arranque gráfico nativo y los BAT requieren comprobación en Windows en una fase posterior.

La verificación gráfica de esta fase instala Playwright en una carpeta temporal del ejecutor CI. Sus dependencias y versión quedan registradas en el artefacto. Esta dependencia pertenece a las pruebas.
