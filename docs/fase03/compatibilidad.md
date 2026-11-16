# Compatibilidad y límites de la fase 03

## Objetivos del prototipo

| Destino | Configuración del producto | Entorno de comprobación |
| --- | --- | --- |
| Web | Navegador moderno con Worker, WebAssembly, módulos ES y Web Crypto; HTTPS o localhost | Chromium de Playwright 1.56.1 en Ubuntu 24.04, 1440 × 1000 y 390 × 844 |
| Windows | x64, WebView2 instalado, interfaz gráfica y Python incluido en el EXE | Runner windows-2022 con apertura real de ventana y del ejecutable |
| Android | API mínima 24, compilación y destino 35, arm64-v8a y x86_64 | Emulador Android 15/API 35 x86_64, recursos y motor incluidos, red desactivada desde la instrumentación |

La declaración de API mínima permite instalar el APK en esa versión; la evidencia de ejecución corresponde al emulador indicado. Los equipos físicos Android ARM64 y Windows 11, otras resoluciones, Firefox y Safari requieren su propia matriz de pruebas antes de declarar soporte de distribución.

## Datos y recursos

El producto matricial rechaza más de 250000 términos. Cada número admite hasta 1000 caracteres y exponentes decimales hasta 1000 en valor absoluto. La serialización limita el tamaño binario de los racionales. Estos límites vienen del núcleo y evitan transformar un dato inválido o excesivo en un resultado engañoso.

La inferencia visual de tamaño es orientativa. Las filas irregulares, matrices vacías, dimensiones incompatibles, dominios inválidos y expresiones fuera del parser son rechazados por Python. Un decimal se interpreta como racional exacto cuando el recorrido lo permite. Las funciones trascendentales mantienen la distinción entre exactitud y aproximación.

Los formularios compartidos de esta fase cubren cuatro operaciones. La interfaz anterior mantiene las demás capacidades hasta su migración. La selección de modo y el formulario se conservan durante la navegación de la sesión. La persistencia después de cerrar y el historial común se construyen en fase 06.

## Cancelación

| Destino | Mecanismo | Recuperación |
| --- | --- | --- |
| Web | Se termina el Worker y se devuelve cancelled | La siguiente solicitud vuelve a cargar el motor |
| Windows | Evento del trabajo en JobPool | Se libera el identificador al completar su finally |
| Android | Evento del trabajo, consultado desde Python | El plugin conserva el executor y acepta el siguiente trabajo |

El producto matricial consulta el evento entre celdas. Derivadas, expresiones e integrales lo consultan antes y después de ejecutar. Cancelar dichas operaciones nativas no interrumpe una función de cálculo por dentro. Esta limitación queda registrada para ampliar checkpoints cuando se migren métodos numéricos.

## Distribución posterior

El EXE de prototipo prueba el empaquetado gráfico. El APK debug prueba instalación, Python incluido y ejecución offline. El instalador Windows, la firma de distribución, los accesos directos, la desinstalación, las actualizaciones y las pruebas en equipos físicos pertenecen a fase 08. El alojamiento y la recarga web offline pertenecen a B49 y B50.

## Revisión del presupuesto por bloques

La fase 03 conserva sus seis bloques B11–B16, equivalentes a 30 horas de planificación. Esa cifra representa una reserva de trabajo; no es una medición del tiempo invertido en esta sesión.

Conservar el frontend y los adaptadores evita repetir cada migración para tres interfaces. La fase 04 mantiene su reserva inicial de diez bloques de cinco horas y se acepta por recorridos matemáticos comprobados. Cada ampliación del catálogo debe añadir casos al fixture de paridad, probar sus formularios y mantener el cierre en los tres destinos.

Antes de B49–B50 se reserva el trabajo de alojamiento y caché. Antes del cierre de Windows y Android se reserva al menos un bloque adicional por plataforma para validación en equipo físico, firma y comportamiento de instalación/actualización. Si esas tareas exceden sus bloques originales, se amplía fase 08 en lugar de omitirlas. Las mediciones de tamaño de los artefactos y los tiempos de CI sirven para revisar esa reserva al preparar la distribución.

Los fixtures de paridad usan respuestas exactas o errores deterministas. Al migrar métodos aproximados se compararán residuos y tolerancias declaradas, contemplando diferencias de los últimos bits entre runtimes.
