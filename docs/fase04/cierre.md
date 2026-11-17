# Cierre de fase 04 — Cobertura de álgebra lineal

Fecha local de verificación: 16 de noviembre de 2026 (America/Managua).

**B17–B26 están terminados en el alcance del núcleo básico.** La versión 0.4.0 ofrece 44 operaciones compartidas, de las que 41 son de álgebra lineal y tres son herramientas de cálculo heredadas. La fase incorpora 40 operaciones al contrato compartido de fase 03. Las dos presentaciones ofrecen las mismas entradas, resultados, procedimientos y comprobaciones, sin una consola para el usuario final.

## Cierre por bloque

| Bloque | Resultado verificado | Registro |
| --- | --- | --- |
| B17 | Gauss/Gauss-Jordan rectangular, rangos y clasificación | [B17](../progreso/B17.md) |
| B18 | Particular, libres, direcciones y certificado original de incompatibilidad | [B18](../progreso/B18.md) |
| B19 | Operaciones, tipos, propiedades, rango y REF/RREF | [B19](../progreso/B19.md) |
| B20 | Particiones, suma/producto por bloques, traza y potencias | [B20](../progreso/B20.md) |
| B21 | Tres determinantes y dos inversas; restricciones y comprobación bilateral | [B21](../progreso/B21.md) |
| B22 | LU sin permutaciones, PLU con PA=LU, Cramer e inversa | [B22](../progreso/B22.md) |
| B23 | Vectores, norma, generado, independencia y dependencia | [B23](../progreso/B23.md) |
| B24 | Bases, espacios fundamentales, suma/intersección y rango-nulidad | [B24](../progreso/B24.md) |
| B25 | Coordenadas, reconstrucción y cambio de base con orientación explícita | [B25](../progreso/B25.md) |
| B26 | Transformaciones, evaluación, composición, imágenes y representación en bases | [B26](../progreso/B26.md) |

## Evidencia ejecutada

- 100 pruebas unittest: 29 originales y 71 del núcleo/plataformas.
- Auditoría nueva con SymPy 1.14.0: 2376 solicitudes a las 41 operaciones lineales, 12633 comprobaciones, cero fallos.
- Auditoría anterior: 288 sistemas y 1572 comprobaciones, cero fallos.
- Los 44 ejemplos cumplen los esquemas de solicitud y respuesta.
- Web: 73 contratos completos en Worker real; 44 formularios en cada modo, exportación exacta, recuperación de carga, cancelación, conservación de entradas/paso y recorrido móvil sin desbordamiento. Son 78 casos de informe, uno de los cuales agrupa los 88 formularios.
- Windows: 76 casos desde Python y otros 76 desde el EXE, incluidos 73 contratos, formulario rectangular en ambos modos y cancelación/recuperación. El ejecutable tiene subsistema gráfico PE=2 y termina correctamente.
- Android: 76 casos del APK instalado en emulador API 35/x86_64 sin conexión. El APK incluye Python también para ARM64.
- Paridad: respuestas JSON completas idénticas en los cuatro recorridos y hashes idénticos de los 38 archivos Python de las tres compilaciones.
- Interfaz anterior: 11 casos gráficos aprobados en Actions.
- TypeScript/Vite y la auditoría npm aprobaron; cero vulnerabilidades en el árbol fijado.

Los resultados corresponden al código `6f949696925a2112026fa6078301dea9d053668a`. Los cambios posteriores de cierre son documentación; integrar main vuelve a ejecutar las verificaciones. [Evidencias permanentes](evidencias.json) conserva versiones reales, SHA, inventario de artefactos, hashes de fuentes y huellas SHA-256 de cada respuesta completa. Los datos detallados pueden regenerarse mediante [verificacion.md](verificacion.md).

[Plataformas y paridad aprobadas](https://github.com/Rolando8-03/NexoLineal/actions/runs/44006540331) · [Núcleo aprobado](https://github.com/Rolando8-03/NexoLineal/actions/runs/44006540419) · [Regresiones e interfaz anterior aprobadas](https://github.com/Rolando8-03/NexoLineal/actions/runs/44006540588)

## Artefactos de esta revisión

| Artefacto | Contenido | Descarga |
| --- | --- | --- |
| fase03-web | Web 0.4.0, Python empaquetado, informes y capturas | [ZIP web](https://github.com/Rolando8-03/NexoLineal/actions/runs/44006540331/artifacts/14294014572) |
| fase03-windows | NexoLineal-Prototipo.exe e informes de ambos recorridos | [ZIP Windows](https://github.com/Rolando8-03/NexoLineal/actions/runs/44006540331/artifacts/14295016498) |
| fase03-android | app-debug.apk, informe offline y captura | [ZIP Android](https://github.com/Rolando8-03/NexoLineal/actions/runs/44006540331/artifacts/14293699414) |
| fase03-paridad | Comparación conjunta de los 73 contratos y los 38 fuentes | [Informe](https://github.com/Rolando8-03/NexoLineal/actions/runs/44006540331/artifacts/14295380291) |

Los nombres fase03-* identifican la infraestructura reutilizada, no una compilación antigua: estos enlaces corresponden al SHA de fase 04 indicado. Los artefactos caducan a los 30 días; las instrucciones y las evidencias del repositorio permiten reproducirlos. El APK universal ocupa 44856418 bytes, aproximadamente 42.78 MiB, antes de comprimirlo en el ZIP de Actions.

## Límites y continuación

[Catálogo](cobertura.md), [contrato](contrato.md) y [arquitectura](arquitectura.md) describen las condiciones reales: racionales, dimensiones hasta 20 en operaciones nuevas, cofactores/adjugata hasta orden 6, Sarrus solo 3×3 y presupuestos explícitos. No se demuestra linealidad ni pertenencia a un subespacio definido por funciones arbitrarias mediante muestreo.

No quedan pendientes de B17–B26. Geometría adicional, Gram-Schmidt, QR, Cholesky, mínimos cuadrados, autovalores, SVD y pseudoinversa mantienen especificación y bloques propios en [ampliaciones.md](ampliaciones.md). No se presentan como implementadas.

El cierre permite comenzar fase 05; no la ejecuta automáticamente. La experiencia animada completa y el historial continúan en fase 06. Instalador Windows, firma permanente del APK, actualizaciones y validación física de destinos corresponden a fase 08. La verificación actual acredita Chromium, Windows Server 2022/WebView2 y Android 15 emulado; no sustituye ensayos en Windows 11 o teléfonos ARM64 físicos.

Las ramas fase-01-base, fase-02-base y fase-03-base conservan las entregas anteriores. La fase actual se desarrolla en fase-04-algebra y se conserva al integrar mediante fase-04-base. El historial mantiene atribuciones, fechas reales y commits de trabajo verificable, sin coautoría del asistente ni cuotas artificiales por bloque.
