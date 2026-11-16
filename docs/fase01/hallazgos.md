# Hallazgos de la versión recibida

En calculo_basico.ejecutar_calculo, con acción calculo, operación definida e intervalo [-1,1], 1/x produjo error de singularidad en la verificación local. Las expresiones 1/x+0 y 2*(1/x) devolvieron cero con etiqueta exacta. 1/x+1 devolvió 2. El control inspecciona la raíz del AST y necesita propagar las condiciones de dominio a expresiones compuestas. Esas integrales impropias ordinarias divergen.

La integral de x^2 en [-1,1] se presentó como 0.666666666667 con etiqueta exacta. La distinción entre valores exactos y aproximaciones requiere revisión.

formatFrac y fracAbsValor en js/app.js convierten componentes de fracciones a Number. Debe revisarse la representación de enteros superiores a Number.MAX_SAFE_INTEGER. La implementación Python conserva Fraction.

Las operaciones matriciales están repartidas entre python/operaciones_matrices.py y modulos/modulo_matrices.py. El contrato de resultados y la consolidación de duplicaciones corresponden a la estabilización posterior.

El workflow Pages recibido apunta a master. main es la rama nueva de incorporación. El README original menciona material PDF que debe cotejarse con los archivos realmente incluidos. La evaluación de accesibilidad completa, las interfaces Serio y Explorador y los instaladores quedan en las fases correspondientes.
