> Plan recibido conservado. El estado de ejecución se registra en [cierre.md](cierre.md) y B43–B48; las horas son orientativas.

# NexoLineal — Fase 7: Visualización, teoría y aplicaciones

**Tipo:** plan de trabajo. **Estado:** pendiente de ejecución. **Sesiones previstas:** 6 bloques de cinco horas; 30 horas orientativas.

## Contexto del producto

NexoLineal tendrá motor matemático en Python, interfaz compartida y versiones web, Windows y Android. La interfaz ofrece modos Serio y Explorador equivalentes, menú principal, entrada mínima, procedimientos, comprobaciones e historial. El usuario final no necesita una consola.

Arquitectura prevista: TypeScript/React/Vite y KaTeX para la interfaz; Pyodide en Worker para web; pywebview y Python nativo para Windows, con PyInstaller e Inno Setup; Capacitor y Chaquopy para Android. Las versiones y compatibilidad se fijan según comprobaciones reales. Los algoritmos y datos matemáticos permanecen en un núcleo común.

## Objetivo

Vincular resultados, procedimientos, tablas, teoría y geometría sin introducir cálculos contradictorios.

## Entradas y dependencias

- Resultados estructurados y datos de gráfica del núcleo.
- Pantallas y estado común de la fase 6.

## Trabajo de esta fase

1. Sistemas de rectas y planos en 2D/3D cuando la dimensión lo permita.
2. Vectores, combinaciones, proyecciones y transformaciones de cuadrículas.
3. Función y pasos geométricos de bisección, falsa posición, Newton y secante.
4. Sincronización de fila de tabla, paso seleccionado y elemento gráfico.
5. Gráficas de residual de métodos iterativos y controles de ampliación.
6. Fichas de teoremas con enunciado, hipótesis, referencia y operación relacionada.
7. Aplicaciones a redes, balance químico, economía, recursos y poblaciones, con unidades y restricciones del modelo.
8. Exportación de procedimiento PDF y tablas CSV, derivadas de los mismos datos del resultado.

## Bloques de cinco horas

| Bloque | Trabajo | Resultado revisable |
|---|---|---|
| B43 | Sistemas en 2D y 3D | Primeros ejemplos de rectas y planos representan el mismo sistema calculado, con ejes y alternativa textual. |
| B44 | Vectores y transformaciones | La gráfica usa los datos del motor y conserva propiedades lineales; no presenta una deformación curvada como transformación lineal. |
| B45 | Gráficas de raíces | Un método de raíces sincroniza función, punto, intervalo y fila de tabla; los demás se incorporan siguiendo ese contrato. |
| B46 | Convergencia y exploración del resultado | Residual y pasos seleccionados se sincronizan; ampliación de gráfica conserva foco y retorno. |
| B47 | Teoremas y aplicaciones del curso | Fichas con hipótesis y fuentes; una aplicación contextual completa verifica ecuaciones y restricciones. |
| B48 | Exportaciones y banco de demostración | Un procedimiento y una tabla se exportan sin discrepancias; se revisa qué ejemplos del curso faltan y se asignan continuaciones. |

Cada bloque es una ventana de trabajo y revisión. Si el criterio de cierre no se alcanza, el pendiente se conserva como continuación del mismo bloque. El presupuesto no garantiza duración exacta ni implica actividad automática en segundo plano.

## Verificación y criterio de cierre

- Las gráficas no cruzan discontinuidades conocidas como si la función fuera continua.
- Una transformación lineal conserva la interpretación lineal de la geometría mostrada.
- Tabla, fórmula, procedimiento y gráfica coinciden numéricamente.
- La gráfica ampliada tiene cierre y retorno de foco; existe alternativa tabular o textual.

## Entregables

- Visualizaciones verificadas y ampliables.
- Teoría y aplicaciones relacionadas con resultados reales.
- Exportaciones consistentes y ejemplos reproducibles.

## Historial y continuidad

La incorporación inicial del trabajo recibido contempla al menos 50 commits reales antes de la reestructuración. La meta del proyecto completo es 300 o más commits reales, incluidos los iniciales; no es una cuota por sesión. Se conservan las atribuciones existentes, las fechas son reales y el asistente no figura como coautor.

Al cerrar cada bloque, el registro incluye estado terminado/parcial/bloqueado, archivos afectados, pruebas ejecutadas y sus límites, commits reales, pendientes y punto de continuación. Solo se declara disponible lo que haya sido implementado y verificado.

## Relación con las otras fases

La fase 6 proporciona los entregables de entrada. El cierre de esta fase queda registrado antes de avanzar a la fase 8.
