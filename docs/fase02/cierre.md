# Cierre de la fase 02

Estado completado para los criterios B05–B10. La fase incorpora 21 commits nuevos después de fase-01-base.

## Entregas verificadas

- B05 — Problemas, resultados, pasos, errores y esquemas JSON 1.0 definidos y probados.
- B06 — Núcleo instalable independiente de la interfaz. Imports normales, sin modificar sys.path, y un recorrido completo migrado.
- B07 — Racionales y decimales exactos, serialización textual, precisión declarada y valores pequeños conservados.
- B08 — 9007199254740993/2 preservado en la fórmula visible, en Ans y en la exportación JSON del producto.
- B09 — Dominio comprobado en expresiones compuestas e integrales. x² en [-1,1] devuelve 2/3 exacto. Los fallos distinguen dominio, presupuesto y convergencia.
- B10 — Producto con Step y comprobación común, automatización matemática, análisis estático y recorrido gráfico real.

Se retiraron Abrir_consola.bat, Abrir_ventana.bat y el menú de terminal. main.py utiliza el arranque gráfico de desarrollo. El README y la guía actual se ajustaron a esa decisión.

## Resultados ejecutados

La ejecución 43971834030 terminó correctamente sobre 424287d5acaf1bd3a1f7dc6f3af683b90427804c.

| Comprobación | Resultado |
| --- | --- |
| Conjunto anterior con las adaptaciones de interfaz documentadas | 29 pruebas aprobadas |
| Regresiones de la fase 02 | 32 pruebas aprobadas |
| Sistemas con referencia independiente | 288 sistemas, 1572 comprobaciones, cero fallos |
| LU aplicables contrastadas con la matriz original | 256 casos |
| Recorridos gráficos en Chromium | 11 casos aprobados, cero errores de página |
| Paridad Python nativo y Pyodide | Producto correcto, dimensiones incompatibles y error de dominio |
| Paquete fuera del proyecto | Importación y cálculo aprobados |
| Compilación Python y sintaxis JavaScript | Aprobadas |

[Ver ejecución, informes y capturas](https://github.com/Rolando8-03/NexoLineal/actions/runs/43971834030)

Las capturas muestran el resultado de la interfaz. El archivo producto-exportado.json conserva el número exacto. Los contratos nativos y el informe de auditoría están en el artefacto nexolineal-evidencias. Las ejecuciones de cierre vuelven a validar el contenido integrado.

## Recuperación y decisiones de implementación

La rama fase-02-base identifica el cierre recuperable. fase-01-base conserva el trabajo recibido. Los commits de esta fase están registrados en commits.json y en el historial Git.

El entorno local permaneció indisponible. La implementación se registró directamente en GitHub y las verificaciones se ejecutaron en GitHub Actions. Los criterios usados son B05–B10 del plan maestro guardado, con la retirada adicional de los lanzadores solicitada por el propietario.

Los dos casos anteriores de terminal se trasladaron a validación de datos y consulta de teoremas a través de los adaptadores. Las firmas y capacidades matemáticas válidas se conservaron. El producto y las operaciones elementales compartidas usan el núcleo. Los otros recorridos existentes conservan sus adaptadores y su migración ampliada está asignada a la fase 04.

El método actual de integral definida exige verificar un dominio real continuo en el intervalo cerrado. Las evaluaciones trascendentales y Simpson declaran aproximación. Los presupuestos y estados están descritos en contrato.md.

La siguiente fase estudia la viabilidad de web, Windows y Android sobre este núcleo.
