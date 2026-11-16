# Cierre de fase 03

Fecha de verificación: 16 de noviembre de 2026.

Los bloques B11–B16 quedan completados en su alcance de viabilidad. Web, Windows y Android ejecutan el mismo núcleo Python mediante la interfaz compartida. El prototipo ofrece cuatro operaciones sobre el contrato 1.0 y conserva la calculadora anterior durante la migración.

## Cumplimiento por bloque

| Bloque | Resultado implementado | Evidencia |
| --- | --- | --- |
| B11 | Menú, formularios con entrada mínima, dimensiones inferidas y presentaciones Serio/Explorador | Recorridos web y gráficos nativos |
| B12 | Python en Worker, recursos locales, errores explícitos y navegación durante cálculo | Prueba real de Chromium con servidores externos bloqueados |
| B13 | Ventana WebView2, Python nativo y EXE con subsistema gráfico | Apertura y cierre desde fuente y desde el ejecutable |
| B14 | APK debug con Python 3.12 incluido y ABIs arm64-v8a/x86_64 | Instalación y prueba instrumentada en Android 15/API 35 sin red |
| B15 | Siete contratos completos iguales en los tres destinos | Paridad de resultados, pasos, metadatos y errores; cancelación y recuperación |
| B16 | Versiones fijadas, compatibilidad identificada y presupuesto revisado | Lock npm, constraints Windows, Wrapper con checksum y documentación |

## Verificaciones aprobadas

- 29 pruebas originales y 44 pruebas del núcleo y las plataformas.
- 288 sistemas contrastados con SymPy, 1572 comprobaciones y 256 casos aplicables de LU, con cero fallos.
- 11 recorridos de la interfaz anterior.
- 12 comprobaciones web del prototipo, incluidos siete formularios, fracción grande en pantalla, exportación, conservación del paso al cambiar de presentación, cancelación y recuperación.
- Nueve comprobaciones en la ventana Windows desde fuente y otras nueve en el EXE, con siete contratos en cada recorrido y cierre limpio.
- Nueve comprobaciones del APK instalado en el emulador, con siete contratos y conexión desactivada antes de abrir la aplicación.
- Manifiestos idénticos de los 13 archivos fuente del núcleo empleados en las tres compilaciones.
- Auditoría npm aprobada para el árbol fijado.

La cancelación nativa durante el producto se comprueba con checkpoints entre celdas y antes de publicar el resultado. Las pruebas de JobPool cubren aislamiento, trabajos simultáneos, cancelación previa, cancelación al finalizar, recuperación y conservación del identificador de un trabajo que todavía se ejecuta. Los puentes nativos verifican además cancelación de un trabajo preparado y un cálculo posterior correcto.

[Verificación multiplataforma aprobada](https://github.com/Rolando8-03/NexoLineal/actions/runs/43981418946) · [Regresiones aprobadas](https://github.com/Rolando8-03/NexoLineal/actions/runs/43981418942)

La revisión de código compilada y probada es `75d946093a1f6ad5bcdcebee4c21777939a46a36`. El cierre incorpora los informes, las instrucciones de acceso y las reglas de tratamiento de archivos binarios. La integración en main vuelve a ejecutar ambos workflows.

Los resultados completos, versiones reales, hashes y referencias de los artefactos se conservan en [evidencias.json](evidencias.json).

## Artefactos revisables

| Artefacto | Contenido | Descarga |
| --- | --- | --- |
| fase03-web | Compilación web, Python local, informes y capturas Serio/Explorador/móvil | [ZIP web](https://github.com/Rolando8-03/NexoLineal/actions/runs/43981418946/artifacts/14282964718) |
| fase03-windows | NexoLineal-Prototipo.exe, Python incluido e informes | [ZIP Windows](https://github.com/Rolando8-03/NexoLineal/actions/runs/43981418946/artifacts/14281434904) |
| fase03-android | app-debug.apk, informe offline y captura del emulador | [ZIP Android](https://github.com/Rolando8-03/NexoLineal/actions/runs/43981418946/artifacts/14283317425) |
| fase03-paridad | Comparación conjunta aprobada | [Informe de paridad](https://github.com/Rolando8-03/NexoLineal/actions/runs/43981418946/artifacts/14281679515) |

El APK universal de esta revisión ocupa 44697918 bytes, aproximadamente 42.63 MiB. Los ZIP de Actions conservan su SHA-256 y caducan a los 30 días. Las instrucciones de [compilación](compilacion.md) permiten regenerarlos.

## Compatibilidad y alcance posterior

La comprobación real corresponde a Chromium en Ubuntu 24.04, Windows Server 2022 x64 con WebView2 y un emulador Android 15 x86_64. El APK contiene también Python ARM64. La validación en teléfonos físicos ARM64 y en Windows 11 se incorpora a la preparación de distribución.

Los modos comparten operaciones y datos. El desarrollo visual animado completo continúa en fase 06. La migración del resto de álgebra lineal y de métodos numéricos continúa en las fases 04 y 05. La interfaz anterior mantiene esas capacidades durante la transición.

La firma permanente del APK, el instalador Windows, los accesos directos, la desinstalación, las actualizaciones y la recarga web offline corresponden a fase 08. Las operaciones nativas de cálculo todavía consultan cancelación antes y después del método. Esta restricción y el presupuesto revisado están en [compatibilidad.md](compatibilidad.md).

## Referencias recuperables

La fase 02 permanece en `fase-02-base`. El trabajo de esta fase se incorpora desde `fase-03-plataformas` y se identifica al cierre mediante `fase-03-base`. Los commits conservan la autoría del propietario, sin añadir coautoría del asistente.
