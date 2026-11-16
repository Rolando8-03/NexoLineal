# Arquitectura de los prototipos de fase 03

El frontend compartido vive en `apps/frontend`. React presenta el formulario y los resultados. Todas las operaciones matemáticas se ejecutan en `packages/core`, a través del contrato JSON 1.0 establecido en fase 02.

## Decisión de los tres destinos

| Destino | Presentación | Ejecución matemática | Transporte |
| --- | --- | --- | --- |
| Web | React en el navegador | CPython de Pyodide dentro de un Worker | Mensajes con identificador de solicitud |
| Windows x64 | La misma compilación React en WebView2 | Python incluido en el ejecutable | API de pywebview y JobPool |
| Android | La misma compilación React en Capacitor | Python incluido por Chaquopy | Plugin Kotlin NexoEngine y JobPool |

Se conserva la interfaz anterior en la raíz mientras se migra su cobertura. El prototipo compartido ofrece producto matricial, evaluación de expresiones, derivada e integral definida. Los otros algoritmos conservan sus adaptadores y pruebas anteriores. Su migración al catálogo compartido corresponde a las fases 04 y 05.

## Responsabilidades

| Ruta | Responsabilidad |
| --- | --- |
| apps/frontend/src/App.tsx | Menú, campos necesarios, resultados, procedimiento y presentaciones |
| apps/frontend/src/contracts.ts | Tipos de transporte compatibles con el esquema 1.0 |
| apps/frontend/src/adapters | Selección de ejecución y ciclo de vida por destino |
| apps/frontend/src/workers | Arranque aislado de Pyodide y llamada al paquete Python |
| apps/windows | Ventana, puente nativo, entrada del ejecutable y recorrido gráfico |
| apps/android | Proyecto Gradle, Activity, plugin nativo y prueba instrumentada |
| packages/core/src/nexolineal/platforms | Trabajos nativos, progreso y cancelación |
| tests/fixtures/platform_contracts.json | Solicitudes iguales para los tres entornos |
| .github/scripts/paridad_fase03.py | Comparación de respuestas completas y manifiestos del núcleo |

Los campos numéricos permanecen como texto desde la entrada hasta el resultado. TypeScript reconoce dimensiones para orientar al usuario, pero Python valida las matrices y calcula. El resultado `9007199254740993/2` se representa en KaTeX sin pasar por Number. El frontend usa índices enteros únicamente para navegación y selección de pasos.

## Entrada y presentaciones

El menú pregunta qué se desea calcular. Al pegar matrices se infieren filas y columnas. Derivar pide una función y permite un punto opcional. Integrar pide función y extremos. Cambiar Serio/Explorador conserva entrada, resultado y paso seleccionado. El modo Explorador de esta fase establece la presentación visual y el comportamiento común. Las animaciones educativas y el menú completo se desarrollan en fase 06.

## Trabajo fuera de la interfaz

Web ejecuta el cálculo dentro de un Worker. Cancelar termina el Worker, devuelve el estado común `cancelled` y permite reconstruir el motor para otra solicitud. Los recursos de Python, KaTeX y las fuentes se sirven desde la propia compilación.

Windows y Android preparan un trabajo identificado antes de ejecutarlo. JobPool conserva un evento de cancelación por trabajo. El producto matricial consulta dicho evento entre celdas y notifica el progreso por filas. Las operaciones de cálculo consultan cancelación antes y después de su ejecución. Esto permite descartar su resultado, aunque una operación de cálculo ya iniciada puede terminar antes de liberar el trabajo.

El plugin Android ejecuta Python en su executor, separado del hilo gráfico. El adaptador publica únicamente el progreso del trabajo activo. Cerrar la ventana o destruir el plugin solicita cancelar los trabajos pendientes.

## Paridad comprobable

Las pruebas transportan el caso racional con pasos, un racional mayor que el límite seguro de JavaScript, dimensiones incompatibles, un intervalo con singularidad, una expresión exacta, una integral polinómica y una derivada evaluada. La comparación incluye entrada, estado, resultado, pasos, comprobación, advertencias, metadatos y error. Los manifiestos SHA-256 comprueban que los mismos archivos Python llegaron a cada compilación.

## Documentación primaria

- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).
- [Pyodide 0.26.2](https://pyodide.org/en/0.26.2/).
- [API de pywebview](https://pywebview.flowrl.com/api/).
- [Plugin Android de Capacitor 7](https://capacitorjs.com/docs/v7/plugins/tutorial/android-implementation).
- [Chaquopy 17.2](https://chaquo.com/chaquopy/doc/17.2/android.html).
