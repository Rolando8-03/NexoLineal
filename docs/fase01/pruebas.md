# Verificación de la línea de partida

La ejecución local inicial y final de `python -B pruebas.py -v` aprobó las 29 pruebas originales con Python 3.12.14. Los tres archivos JavaScript aprobaron node --check. El repositorio local fue clonado a otra carpeta y su referencia de cierre recuperada. El bundle original se clonó y se comprobaron sus 21 commits.

El workflow Verificación de la línea de partida repite las pruebas Python, valida la sintaxis JavaScript y realiza dos operaciones desde Chromium con el Python real de Pyodide. El estado vigente de cada ejecución se consulta en Actions y sus evidencias se conservan como fase-01-evidencias.

```sh
python -B pruebas.py -v
node --check js/app.js
node --check js/ejecutar_python.js
node --check js/programa5.js
git fsck --full
```

El resultado visual comprueba el sistema 2x2 con A=[[2,1],[1,-1]], b=[5,1], solución [2,1], y la expresión (8+2)/5=2. La prueba utiliza los formularios y botones de la aplicación, espera la carga real de Pyodide y conserva capturas y un informe JSON. Su resultado efectivo depende de la ejecución concreta enlazada en el cierre.

Estos controles tienen alcance de incorporación. Las versiones instalables y la cobertura matemática ampliada corresponden a fases posteriores.
