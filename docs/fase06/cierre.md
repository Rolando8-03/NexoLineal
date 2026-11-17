# Cierre de fase 06 — Menú y experiencia de usuario

Fecha de verificación: **17 de noviembre de 2026**, America/Managua.

**B35–B42 terminados en el alcance del plan recibido.** NexoLineal 0.6.0 integra menú principal, formularios mínimos, objetos reutilizables, presentaciones Serio y Explorador, tema independiente, historial y proyectos portables. Conserva las **56 operaciones** y el núcleo matemático común de web, Windows y Android. El usuario final trabaja en la interfaz gráfica.

## Bloques cerrados

| Bloque | Resultado revisable | Registro |
| --- | --- | --- |
| B35 | Diez destinos reales, buscador matemático y disponibilidad del catálogo | [B35](../progreso/B35.md) |
| B36 | Operandos necesarios, dimensiones inferidas, cero/vacío y validación localizada | [B36](../progreso/B36.md) |
| B37 | Matrices, vectores, bases o familias y funciones reutilizables | [B37](../progreso/B37.md) |
| B38 | Presentación académica, resultado breve y procedimientos desplegables | [B38](../progreso/B38.md) |
| B39 | Explorador animado con nombres matemáticos y las mismas capacidades | [B39](../progreso/B39.md) |
| B40 | Modo y tema separados, continuidad de estado, teclado, tacto y movimiento reducido | [B40](../progreso/B40.md) |
| B41 | Historial persistente, búsqueda, favoritos, editar y repetir | [B41](../progreso/B41.md) |
| B42 | Proyecto JSON versión 1 y reapertura en los tres destinos | [B42](../progreso/B42.md) |

[Experiencia y navegación](experiencia.md) · [Formato y matriz de persistencia](proyectos.md) · [Verificación reproducible](verificacion.md) · [Plan recibido](plan.md)

Las ventanas de cinco horas del plan son orientativas. Este cierre no afirma que hayan transcurrido 40 horas ni implica actividad automática en segundo plano.

## Verificación aprobada

- **131 pruebas unittest**: 29 originales y 102 descubiertas, incluidas nueve nuevas de almacenamiento Windows.
- **50 comprobaciones** del codec y validación TypeScript reales y de los adaptadores de almacenamiento nativo.
- **19 recorridos de experiencia** en Chromium; exportación/importación, reutilización exacta, historial y cierre/reapertura del perfil.
- **Siete análisis axe**, con cero violaciones en las escenas probadas; cuatro combinaciones de modo/tema, biblioteca, historial y móvil. Teclado, foco, Escape y movimiento reducido verificados además por recorrido.
- Web: **119 casos**, incluidos **113 contratos completos**, 56 formularios en cada modo, tablas, pasos, exactitud, cancelación y recuperación.
- Windows: **118 casos desde Python y otros 118 desde EXE**; cada modalidad se cierra y se vuelve a abrir en un proceso nuevo, conservando el proyecto y el paso. Ejecutable gráfico PE=2, sin consola para el usuario final.
- Android: **118 casos** en APK instalado sin conexión, con archivo privado, objetos, favorito, tema, paso y Activity cerrada/relanzada.
- **Paridad completa de las 113 respuestas JSON y los 46 archivos Python** usados por las tres compilaciones. El agregador exige también la continuidad del proyecto y los informes de experiencia.
- Auditorías matemáticas conservadas: **1572**, **12633** y **6473** comprobaciones independientes; las 56 entradas predeterminadas cumplen los esquemas.
- Interfaz anterior: **11 recorridos** aprobados. Compilación TypeScript/Vite y auditoría npm aprobadas.

El código ejecutado y aprobado es **`6a2a1016f473c9ebaa766271bb5eacb5ec6b1b5e`**. Los commits posteriores de cierre solo incorporan documentación. El workflow exclusivo de núcleo había aprobado `32cb782ddfe052f160ba9c513fbef0de91d10868`; las correcciones posteriores de interfaz/puentes se verificaron además con la batería Python completa en los workflows de plataformas y regresiones.

[Plataformas y paridad](https://github.com/Rolando8-03/NexoLineal/actions/runs/44052146177) · [Regresiones e interfaz anterior](https://github.com/Rolando8-03/NexoLineal/actions/runs/44052146192) · [Núcleo matemático](https://github.com/Rolando8-03/NexoLineal/actions/runs/44049597598)

La primera ejecución de plataformas, `44049597585`, falló: se detectaron el bloqueo de un proxy nativo al tratarlo como promesa, una reapertura Windows pendiente y una carrera de foco móvil. El commit `6a2a1016f473c9ebaa766271bb5eacb5ec6b1b5e` incorpora la corrección, diagnóstico y regresiones. La ejecución aprobada indicada arriba verifica esas correcciones; la ejecución fallida permanece visible en Actions.

## Artefactos

| Artefacto | Contenido | Descarga |
| --- | --- | --- |
| fase03-web | Web 0.6.0 con recursos incluidos, informes y capturas de ambos modos/temas | [ZIP web](https://github.com/Rolando8-03/NexoLineal/actions/runs/44052146177/artifacts/14314870240) |
| fase03-windows | EXE gráfico, informes de ejecución y reapertura desde Python y EXE | [ZIP Windows](https://github.com/Rolando8-03/NexoLineal/actions/runs/44052146177/artifacts/14314611161) |
| fase03-android | app-debug.apk, informe offline y captura | [ZIP Android](https://github.com/Rolando8-03/NexoLineal/actions/runs/44052146177/artifacts/14314855431) |
| fase03-paridad | Comparación conjunta y continuidad de proyecto | [Informe](https://github.com/Rolando8-03/NexoLineal/actions/runs/44052146177/artifacts/14313483977) |

Los nombres históricos `fase03-*` pertenecen a la infraestructura de compilación. Estos enlaces corresponden al código 0.6.0 indicado. Los ZIP de Actions caducan a los 30 días. [evidencias.json](evidencias.json) conserva sus SHA-256, fechas, versiones, huellas de las respuestas, manifiesto de las fuentes y resultados de pruebas. Los workflows permiten regenerarlos.

## Condiciones y continuidad

No quedan pendientes de los criterios básicos B35–B42. La persistencia dispone de una [matriz de soporte explícita](proyectos.md): localStorage por origen/perfil en web, archivo atómico por usuario en Windows y archivo privado AtomicFile en Android. Se admite un cuaderno activo por perfil/instalación, 100 objetos, 100 entradas y 2 MiB UTF-8; se avisa sin borrar elementos automáticamente. Los archivos de proyecto se exportan para conservar copias y mover el trabajo. Las entradas se guardan como texto; los resultados se recalculan al abrir y no se aceptan verificaciones matemáticas importadas.

Los selectores de archivo Windows/Android están implementados con las API de cada plataforma. Su interacción gráfica no se automatizó: la portabilidad nativa se verificó mediante el panel JSON y la persistencia real. La reapertura Android es un ciclo de Activity; no es prueba de reinstalación ni de conservación tras borrar los datos. La prueba web usa Chromium; la prueba Windows usa Server 2022/WebView2; Android usa API 35/x86_64 emulado con bibliotecas ARM64 incluidas. No se acredita aún un teléfono físico ni Windows 11. Las escenas axe y los recorridos de teclado no constituyen una certificación universal de accesibilidad.

Las ilustraciones animadas de Explorador son decorativas. Las gráficas matemáticas, teoría y aplicaciones corresponden a fase 07; instaladores, firmas permanentes y distribución a fase 08. Se conservan las ampliaciones matemáticas registradas en fases 04 y 05. La fase siguiente requiere una instrucción posterior.

La fase se incorpora mediante commits reales con la autoría del propietario y sin coautoría del asistente. Se conservan atribuciones y fechas reales. `fase-06-experiencia` contiene el desarrollo y `fase-06-base` conserva el cierre integrado en `main`.
