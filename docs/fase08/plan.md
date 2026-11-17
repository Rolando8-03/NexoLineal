# NexoLineal — Fase 8: Distribución e instalación

**Tipo:** plan de trabajo. **Estado:** pendiente de ejecución. **Sesiones previstas:** 8 bloques de cinco horas; 40 horas orientativas.

## Contexto del producto

NexoLineal tendrá motor matemático en Python, interfaz compartida y versiones web, Windows y Android. La interfaz ofrece modos Serio y Explorador equivalentes, menú principal, entrada mínima, procedimientos, comprobaciones e historial. El usuario final no necesita una consola.

Arquitectura prevista: TypeScript/React/Vite y KaTeX para la interfaz; Pyodide en Worker para web; pywebview y Python nativo para Windows, con PyInstaller e Inno Setup; Capacitor y Chaquopy para Android. Las versiones y compatibilidad se fijan según comprobaciones reales. Los algoritmos y datos matemáticos permanecen en un núcleo común.

## Objetivo

Preparar versiones distribuibles de web, Windows y Android desde la misma versión del código.

## Entradas y dependencias

- Aplicación integrada, contratos estables y pruebas de las fases anteriores.
- Entornos de compilación, alojamiento y firma disponibles; las claves de firma se mantienen fuera del repositorio.

## Trabajo de esta fase

1. Compilación web con rutas de alojamiento y recursos versionados.
2. Descarga inicial y caché offline/PWA con actualización coherente.
3. Ejecutable Windows con Python y recursos incluidos, sin consola de usuario.
4. Instalador con accesos, desinstalación, tratamiento de WebView2 y conservación de datos.
5. APK de release firmado con núcleo Python y recursos incluidos.
6. Pruebas de primer arranque Android en modo avión, teclado, Atrás, interrupción y reapertura.
7. Paridad y persistencia entre IndexedDB web y SQLite en los destinos nativos.
8. Medidas de arranque, cálculo, memoria y tamaño; checksums y estado real de firmas.

## Bloques de cinco horas

| Bloque | Trabajo | Resultado revisable |
|---|---|---|
| B49 | Compilación y publicación web | Artefacto web probado con rutas de alojamiento y versión identificada; publicación solo con acceso operativo. |
| B50 | Web sin conexión | Tras descarga inicial, recarga y cálculo funcionan sin red; caché y actualización de versión coherentes. |
| B51 | Ejecutable Windows | Compilación windowed con recursos incluidos abre en un equipo sin Python; se registran dependencias faltantes si las hay. |
| B52 | Instalador Windows | Instalar, abrir y desinstalar funcionan; WebView2 y conservación de datos tienen un tratamiento probado. |
| B53 | APK de release | APK firmado con clave del propietario y recursos incluidos; versión y requisitos del dispositivo documentados. |
| B54 | Validación Android real | Primer arranque en modo avión, teclado, Atrás, interrupción y reapertura probados en teléfono identificado. |
| B55 | Persistencia y paridad de plataformas | Historial y resultados coinciden con sus contratos; un proyecto exportado se abre en otro destino. |
| B56 | Medidas y estabilidad | Arranque, cálculo, memoria y tamaños medidos en equipos objetivo; se establecen límites públicos a partir de resultados reales. |

Cada bloque es una ventana de trabajo y revisión. Si el criterio de cierre no se alcanza, el pendiente se conserva como continuación del mismo bloque. El presupuesto no garantiza duración exacta ni implica actividad automática en segundo plano.

## Verificación y criterio de cierre

- Windows instala y abre sin Python ni herramientas de desarrollo en el equipo objetivo.
- Android instala un APK real y calcula sin red desde el primer arranque.
- La web recarga offline después de completar su descarga inicial.
- Los artefactos identifican la misma versión y no exponen credenciales ni claves.

## Entregables

- Artefacto web desplegable y opción offline.
- Instalador Windows y APK firmado, si el entorno permite construirlos y verificarlos.
- Matriz de instalación, compatibilidad y medidas reales; bloqueos explícitos cuando corresponda.

## Historial y continuidad

La incorporación inicial del trabajo recibido contempla al menos 50 commits reales antes de la reestructuración. La meta del proyecto completo es 300 o más commits reales, incluidos los iniciales; no es una cuota por sesión. Se conservan las atribuciones existentes, las fechas son reales y el asistente no figura como coautor.

Al cerrar cada bloque, el registro incluye estado terminado/parcial/bloqueado, archivos afectados, pruebas ejecutadas y sus límites, commits reales, pendientes y punto de continuación. Solo se declara disponible lo que haya sido implementado y verificado.

## Relación con las otras fases

La fase 7 proporciona los entregables de entrada. El cierre de esta fase queda registrado antes de avanzar a la fase 9.
