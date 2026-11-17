# Cierre de fase 07 — Visualización, teoría y aplicaciones

Fecha de verificación: **17 de noviembre de 2026**, America/Managua.

**B43–B48 terminados en el alcance básico del plan recibido.** NexoLineal 0.7.0 conecta resultados, pasos, tablas y escenas calculadas en Python. Ambas presentaciones ofrecen las mismas capacidades. Se conservan las 56 operaciones anteriores y se incorpora **proyección ortogonal sobre una recta**, para un total de **57 operaciones**.

## Bloques cerrados

| Bloque | Resultado revisable | Registro |
| --- | --- | --- |
| B43 | Rectas/planos, soluciones, cámara 3D, ejes y alternativa textual | [B43](../progreso/B43.md) |
| B44 | Vectores, combinaciones con coeficientes, proyección y cuadrícula lineal | [B44](../progreso/B44.md) |
| B45 | Función y geometría de los cuatro métodos de raíces, sin unir polos conocidos | [B45](../progreso/B45.md) |
| B46 | Residuales, selección fila/paso/gráfica, ampliación y retorno de foco | [B46](../progreso/B46.md) |
| B47 | 12 fichas con hipótesis/fuentes y cinco modelos con unidades/restricciones | [B47](../progreso/B47.md) |
| B48 | Procedimiento PDF, tablas CSV y 19 proyectos importables verificados | [B48](../progreso/B48.md) |

[Contrato visual](visualizacion.md) · [Teoría y aplicaciones](teoria-aplicaciones.md) · [PDF/CSV](exportaciones.md) · [Banco importable](banco.md) · [Pruebas](verificacion.md) · [Continuaciones](continuaciones.md) · [Plan recibido](plan.md)

Las seis ventanas de cinco horas son orientativas; no se presentan como 30 horas efectivamente transcurridas ni como ejecución automática en segundo plano.

## Evidencia aprobada

- **160 unittest**: 29 originales y 131 descubiertas; 29 nuevas de geometría, modelos y documentos.
- **8083 comprobaciones independientes en 553 solicitudes**, con SymPy 1.14.0: sistemas, proyecciones, combinaciones, transformaciones, raíces y modelos.
- Auditorías anteriores conservadas: **1572**, **12633** y **6473** comprobaciones.
- **136 contratos completos** y hashes de los **48 archivos Python comunes**, iguales en Worker, Windows y Android.
- Web: **142 casos** de contrato/regresión, incluidos los 57 formularios en cada modo. Además, **11 recorridos nuevos**, cinco escenas axe sin violaciones y **23 comprobaciones** de datos/exportación.
- Se conservan los **19 recorridos de experiencia**, siete escenas axe sin violaciones y **54 comprobaciones** de proyecto/validación/puentes.
- Windows: **143 casos desde Python y otros 143 desde EXE**, incluidos sincronización gráfica, PDF/CSV generados desde la interfaz y guardado nativo. Reapertura comprobada en un proceso nuevo para cada modalidad. Ejecutable PE=2, sin consola para el usuario final.
- Android: **143 casos del APK offline**, con sincronización, documentos, persistencia y Activity cerrada/relanzada.
- CSV web contrastado celda por celda y PDF multipágina abierto con **pypdf 7.1.0**; Windows contrasta también todas las filas CSV con Python. Los documentos nativos quedan en los artefactos.
- Banco de **19 proyectos** resuelto con Python y aceptado por el codec TypeScript de producción.
- Interfaz anterior: **11 recorridos** aprobados. TypeScript/Vite y auditoría npm aprobados; cero vulnerabilidades en el árbol fijado. Avisos de dependencias incluidos en las compilaciones.

El código compilado y aprobado es **`772c2e9e09551529bd74d8ce60dcd58698ea70a4`**. Los cambios posteriores de cierre son documentación y proyectos de demostración. Núcleo y regresiones habían aprobado `fc29644bf365c69d60952220c790bb4b250c500a`; el cambio posterior solo agrega los avisos de bibliotecas al empaquetado. El workflow de plataformas verifica también la batería Python completa y la auditoría nueva sobre la compilación final.

[Plataformas y paridad](https://github.com/Rolando8-03/NexoLineal/actions/runs/44084584029) · [Núcleo](https://github.com/Rolando8-03/NexoLineal/actions/runs/44083938448) · [Regresiones e interfaz anterior](https://github.com/Rolando8-03/NexoLineal/actions/runs/44083938368)

La ejecución inicial `44082185733` detectó nombres repetidos de regiones accesibles; no se presenta como aprobada. La revisión de pantalla y las pruebas específicas detectaron además la conversión incorrecta de racionales a píxeles y la escala espacial desigual. `9981ca058fe183afdf6f772c08b9470dc05d4210` corrige esos problemas y añade regresiones de coordenadas finitas/perpendicularidad. Las ejecuciones finales citadas verifican las correcciones y la incorporación posterior de combinaciones generales.

## Artefactos de esta versión

| Artefacto | Contenido | Descarga |
| --- | --- | --- |
| fase03-web | Web 0.7.0 offline, fuentes/avisos, informes, capturas, PDF y CSV de prueba | [ZIP web](https://github.com/Rolando8-03/NexoLineal/actions/runs/44084584029/artifacts/14328218914) |
| fase03-windows | EXE gráfico, informes, reaperturas y documentos exportados | [ZIP Windows](https://github.com/Rolando8-03/NexoLineal/actions/runs/44084584029/artifacts/14327904564) |
| fase03-android | APK debug, informe/captura offline y documentos exportados | [ZIP Android](https://github.com/Rolando8-03/NexoLineal/actions/runs/44084584029/artifacts/14327479492) |
| fase03-paridad | Comparación de contratos, fuentes, continuidad y exportaciones | [Informe](https://github.com/Rolando8-03/NexoLineal/actions/runs/44084584029/artifacts/14328488185) |

Los nombres `fase03-*` corresponden a la infraestructura reutilizada; el SHA identifica esta versión. Los ZIP de Actions caducan a los 30 días. [evidencias.json](evidencias.json) conserva fechas, versiones, SHA-256 de los artefactos, 544 huellas de respuestas, el manifiesto de las fuentes y los informes de los recorridos. Los comandos y workflows permiten regenerarlos.

## Límites y continuidad

No quedan pendientes de los criterios básicos B43–B48. Se conservan límites y ampliaciones explícitos: geometría R²/R³, cuadrícula R²→R² canónica, 201 muestras de función, magnitudes de coordenadas hasta 10^6 y ventanas de dibujo finitas. El dibujo es aproximado; las coordenadas, tablas y resultados conservan sus textos exactos. No se afirma convergencia, continuidad universal ni descubrimiento de todas las raíces por muestreo.

El PDF usa notación LaTeX textual y escapes de caracteres no cubiertos por su fuente; admite hasta 2 MiB de texto, 300 páginas y 16 MiB finales. La tabla CSV conserva todas sus columnas y protege textos que parezcan fórmulas. Los selectores nativos están implementados; las pruebas de documento usan destinos de evidencia explícitos y no automatizan su interacción gráfica.

Las pruebas acreditan Chromium, Windows Server 2022/WebView2 y Android API 35/x86_64 emulado, con bibliotecas ARM64 incluidas. No acreditan aún Windows 11, un teléfono físico ni accesibilidad universal. Los modelos son didácticos; las fichas y el banco no se equiparan a inventariar todos los ejercicios de todos los libros. Las [continuaciones](continuaciones.md) asignan esa revisión y las ampliaciones sin eliminarlas de alcance futuro.

Instaladores y firmas de distribución corresponden a fase 08. La siguiente fase requiere una instrucción posterior. `fase-07-visualizacion` conserva el desarrollo y `fase-07-base` conserva el cierre integrado en `main`. Los commits son reales, con la autoría del propietario, fechas reales y sin coautoría del asistente; las atribuciones recibidas permanecen.
