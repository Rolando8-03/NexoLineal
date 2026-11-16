# Cierre de la fase 01

Estado completado de la incorporación y verificación del trabajo recibido.

## Resultado

main contiene 62 commits nuevos al registrar este cierre. Los primeros 45 incorporan los 45 archivos originales. Se agregan 12 commits de documentación y seguimiento, uno de exclusiones y cuatro de herramientas y automatización de verificación. Los 21 commits heredados quedan fuera de ese conteo y permanecen recuperables en el respaldo privado entregado.

La rama fase-01-base identifica el cierre de esta fase. Puede recuperarse mediante git switch fase-01-base después de clonar. El commit de código y verificaciones inmediatamente anterior al documento es de6cb3bb80f7b50c147b1ef73e1e40c0aa956876.

## Evidencia ejecutada

La ejecución 43961464463 terminó correctamente sobre de6cb3bb80f7b50c147b1ef73e1e40c0aa956876. Pasaron las 29 pruebas matemáticas originales, los controles de sintaxis de los tres JavaScript, git fsck y la verificación del inventario.

Se comprobaron los 45 archivos de origen. La comparación contra sus identificadores de contenido no encontró diferencias actuales. Los recursos locales HTML existen y sus identificadores son únicos. El historial remoto auditado contiene commits con cambios reales.

Chromium cargó Pyodide y ejecutó el recorrido HTML -> Python -> resultado visible. Introdujo A=[[2,1],[1,-1]], b=[5,1] mediante las celdas y comprobó solución única [2,1]. Después calculó (8+2)/5=2 desde Calculadora. Los dos casos aprobaron sin errores de página. Las capturas y los informes JSON se conservan en fase-01-evidencias dentro de la ejecución.

[Ver la ejecución y sus artefactos](https://github.com/Rolando8-03/NexoLineal/actions/runs/43961464463)

El workflow también se ejecuta sobre el commit de este documento para verificar la referencia completa del cierre.

## Recuperación del original

El archivo privado NexoLineal_Fase_01_62_Commits_Locales.zip, ya entregado al propietario, conserva el ZIP original intacto, la historia local preparada, los registros iniciales y docs/origen/historial_original.bundle. La restauración del bundle comprobó sus 21 commits. Las dos extracciones del original coincidieron y la copia local de cierre se recuperó desde un clon independiente.

El SHA-256 del ZIP fuente es 3a22a03feb8d04693d85642020825067bb350df96d8f9a2d11eb9dfffa0ba3b7. El inventario remoto y la verificación automática conservan la identidad de los contenidos publicados.

## Decisiones y continuidad

Por instrucción del propietario se creó una historia nueva de incorporación en el repositorio vacío. Los commits remotos tienen identificadores y fechas de publicación diferentes a los locales porque se registraron mediante la conexión GitHub. Conservan la autoría humana y la descripción de las incorporaciones. No se agregó coautoría del asistente.

El entorno local quedó indisponible durante la publicación. La documentación y la automatización de cierre se completaron directamente en GitHub. La prueba gráfica se ejecutó en Chromium dentro de GitHub Actions.

El alcance verificado es la calculadora recibida. Los defectos anteriores están documentados en hallazgos.md. La fase 02 parte de esta referencia para estabilizar el núcleo. Los instaladores Windows y Android, los modos visuales y las ampliaciones matemáticas corresponden a las fases de reestructuración previstas.
