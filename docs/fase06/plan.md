> Plan recibido, conservado como referencia. Su estado original no es el estado de ejecución: consultar [cierre.md](cierre.md) y los registros B35–B42. Las horas son estimaciones.

# NexoLineal — Fase 6: Menú y experiencia de usuario

**Tipo:** plan de trabajo. **Estado:** pendiente de ejecución. **Sesiones previstas:** 8 bloques de cinco horas; 40 horas orientativas.

## Contexto del producto

NexoLineal tendrá motor matemático en Python, interfaz compartida y versiones web, Windows y Android. La interfaz ofrece modos Serio y Explorador equivalentes, menú principal, entrada mínima, procedimientos, comprobaciones e historial. El usuario final no necesita una consola.

Arquitectura prevista: TypeScript/React/Vite y KaTeX para la interfaz; Pyodide en Worker para web; pywebview y Python nativo para Windows, con PyInstaller e Inno Setup; Capacitor y Chaquopy para Android. Las versiones y compatibilidad se fijan según comprobaciones reales. Los algoritmos y datos matemáticos permanecen en un núcleo común.

## Objetivo

Construir la experiencia común con menú principal, pocos datos de entrada y modos Serio y Explorador equivalentes.

## Entradas y dependencias

- Catálogo de operaciones y contratos; capacidades efectivamente disponibles.
- Referencia visual de NexoLineal y comportamiento útil de la interfaz existente.

## Trabajo de esta fase

1. Menú: Inicio, Sistemas, Matrices, Determinantes e inversas, Vectores y espacios, Transformaciones, Métodos numéricos, Herramientas, Historial y proyectos, Biblioteca y ayuda.
2. Pregunta inicial sobre qué se quiere calcular y formularios que solicitan solo los operandos necesarios.
3. Pegado de matrices con inferencia de dimensiones, distinción de vacío y cero y validación localizada.
4. Registro de matrices, vectores, bases y funciones reutilizables.
5. Presentación Serio con nombres matemáticos y Explorador con metáforas y subtítulos matemáticos.
6. Selector de presentación separado del tema Claro/Oscuro; cambio sin perder el problema ni el paso activo.
7. Historial persistente, favoritos, repetir, editar y proyectos JSON versionados.
8. Navegación por teclado y táctil, foco, etiquetas, contraste y movimiento reducido.

## Bloques de cinco horas

| Bloque | Trabajo | Resultado revisable |
|---|---|---|
| B35 | Menú completo y buscador | Todas las áreas tienen destino real y estado de disponibilidad; búsqueda por términos matemáticos. |
| B36 | Objetivo y entrada mínima | Formularios piden solo lo necesario; pegar matriz infiere tamaño; cero y vacío conservan significados distintos. |
| B37 | Objetos reutilizables | Una matriz, vector o función calculados se usan en otra operación sin transcribirlos. |
| B38 | Presentación seria | Recorrido completo de un ejercicio con nombres académicos, resultado breve y pasos desplegables. |
| B39 | Presentación Explorador | Las mismas operaciones del recorrido serio funcionan con diseño animado y subtítulos matemáticos. |
| B40 | Paridad y accesibilidad de modos | Cambiar modo conserva ejercicio y paso; teclado, etiquetas, foco y movimiento reducido revisados. |
| B41 | Historial persistente | Guardar, buscar, editar y repetir funcionan en el adaptador disponible; se registra la matriz de soporte de los otros destinos. |
| B42 | Proyectos y continuidad | Proyecto JSON versionado se exporta e importa; cerrar y abrir conserva el trabajo donde la persistencia ya esté integrada. |

Cada bloque es una ventana de trabajo y revisión. Si el criterio de cierre no se alcanza, el pendiente se conserva como continuación del mismo bloque. El presupuesto no garantiza duración exacta ni implica actividad automática en segundo plano.

## Verificación y criterio de cierre

- Una transpuesta no pide B y una norma no pide tres vectores.
- Cambiar de presentación conserva datos, resultado y selección de paso.
- Los dos modos dan acceso a las mismas operaciones disponibles, errores, tablas y procedimientos.
- Volver a editar e importar un proyecto recupera el trabajo sin pérdida.

## Entregables

- Menú y formularios comunes funcionando.
- Dos presentaciones equivalentes y accesibles.
- Historial y continuidad de proyectos con matriz de soporte por destino.

## Historial y continuidad

La incorporación inicial del trabajo recibido contempla al menos 50 commits reales antes de la reestructuración. La meta del proyecto completo es 300 o más commits reales, incluidos los iniciales; no es una cuota por sesión. Se conservan las atribuciones existentes, las fechas son reales y el asistente no figura como coautor.

Al cerrar cada bloque, el registro incluye estado terminado/parcial/bloqueado, archivos afectados, pruebas ejecutadas y sus límites, commits reales, pendientes y punto de continuación. Solo se declara disponible lo que haya sido implementado y verificado.

## Relación con las otras fases

La fase 5 proporciona los entregables de entrada. El cierre de esta fase queda registrado antes de avanzar a la fase 7.
