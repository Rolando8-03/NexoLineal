> Plan original recibido. El estado de ejecución y las evidencias se registran en [cierre.md](cierre.md).

# NexoLineal — Fase 5: Métodos numéricos y herramientas

**Tipo:** plan de trabajo. **Estado:** pendiente de ejecución. **Sesiones previstas:** 8 bloques de cinco horas; 40 horas orientativas.

## Contexto del producto

NexoLineal tendrá motor matemático en Python, interfaz compartida y versiones web, Windows y Android. La interfaz ofrece modos Serio y Explorador equivalentes, menú principal, entrada mínima, procedimientos, comprobaciones e historial. El usuario final no necesita una consola.

Arquitectura prevista: TypeScript/React/Vite y KaTeX para la interfaz; Pyodide en Worker para web; pywebview y Python nativo para Windows, con PyInstaller e Inno Setup; Capacitor y Chaquopy para Android. Las versiones y compatibilidad se fijan según comprobaciones reales. Los algoritmos y datos matemáticos permanecen en un núcleo común.

## Objetivo

Implementar métodos numéricos y herramientas auxiliares con criterios de parada, dominio y precisión explícitos.

## Entradas y dependencias

- Parser, contratos numéricos y componentes básicos del núcleo.
- Referencias de raíces, iterativos, errores, conversiones, conjuntos y cálculo.

## Trabajo de esta fase

1. Parser seguro de funciones, dominio y evaluaciones protegidas.
2. Bisección, falsa posición, Newton y secante con datos mínimos adecuados a cada método.
3. Jacobi y Gauss-Seidel con diagonal, vector inicial, normas y criterio de parada explícitos.
4. Diferenciación entre residual, error verdadero, error aproximado y cota garantizada.
5. Errores absoluto, relativo y porcentual solo cuando hay datos suficientes.
6. Conversión entre bases 2, 8, 10 y 16, con precisión y desarrollo posicional.
7. Operaciones de conjuntos finitos con universo explícito cuando haga falta.
8. Calculadora elemental y cálculo existente corregido: derivadas, primitivas admitidas e integración numérica.
9. Ampliaciones pendientes identificadas: punto fijo, SOR, falsa posición modificada, raíces múltiples, Bairstow y métodos adicionales de integración, ajuste e interpolación.

## Bloques de cinco horas

| Bloque | Trabajo | Resultado revisable |
|---|---|---|
| B27 | Funciones y dominio | Parser seguro común, expresión activa y errores de evaluación verificables; se define la información mínima de cada método. |
| B28 | Bisección | Raíces en extremos, intervalo válido, tabla, criterio de parada y cota coherentes con el resultado. |
| B29 | Falsa posición | Iteraciones y denominadores controlados; límite de iteraciones y posible estancamiento registrados. |
| B30 | Newton | Derivada o alternativa declarada, pasos verificables y detección de dominio, derivada nula y ciclo de ejemplo. |
| B31 | Secante | Dos semillas, división protegida y estados de terminación diferenciados; tabla consistente. |
| B32 | Jacobi y Gauss-Seidel | Primeros casos de ambos métodos coinciden con referencias corregidas; ausencia de dominancia no se declara divergencia automática. |
| B33 | Errores y sistemas de numeración | Medidas de error con referencia apropiada y conversiones verificadas mediante conversión inversa. |
| B34 | Conjuntos y cálculo existente | Recorridos esenciales de conjuntos y cálculo migrados; cualquier herramienta faltante queda identificada y se estima por separado. |

Cada bloque es una ventana de trabajo y revisión. Si el criterio de cierre no se alcanza, el pendiente se conserva como continuación del mismo bloque. El presupuesto no garantiza duración exacta ni implica actividad automática en segundo plano.

## Verificación y criterio de cierre

- Las tablas y el resultado provienen de la misma ejecución.
- Convergencia, límite, estancamiento, cancelación y error de dominio son estados diferentes.
- La falta de dominancia diagonal no se convierte automáticamente en una afirmación de divergencia.
- Se comprueban raíces en extremos, divisiones problemáticas, discontinuidades y ejemplos corregidos.

## Entregables

- Métodos y herramientas integrados con pasos y pruebas.
- Configuraciones predeterminadas visibles y editables.
- Inventario de métodos terminados y ampliaciones pendientes.

## Historial y continuidad

La incorporación inicial del trabajo recibido contempla al menos 50 commits reales antes de la reestructuración. La meta del proyecto completo es 300 o más commits reales, incluidos los iniciales; no es una cuota por sesión. Se conservan las atribuciones existentes, las fechas son reales y el asistente no figura como coautor.

Al cerrar cada bloque, el registro incluye estado terminado/parcial/bloqueado, archivos afectados, pruebas ejecutadas y sus límites, commits reales, pendientes y punto de continuación. Solo se declara disponible lo que haya sido implementado y verificado.

## Relación con las otras fases

La fase 4 proporciona los entregables de entrada. El cierre de esta fase queda registrado antes de avanzar a la fase 6.
