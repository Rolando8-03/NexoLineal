# Núcleo Python de la fase 02

La entrada pública es nexolineal.application.service.execute. El paquete nexolineal-core se instala desde packages/core y funciona fuera de la carpeta del proyecto. Sus dependencias de producción pertenecen a la biblioteca estándar de Python.

## Responsabilidades

- domain contiene Problem, CalculationResult, Step y errores de entrada, dominio y presupuesto.
- parsing convierte texto decimal o racional en Fraction y valida matrices rectangulares.
- algorithms contiene las operaciones matriciales compartidas y el cálculo existente corregido.
- application valida solicitudes, selecciona una operación permitida y construye el contrato de salida.
- packages/contracts publica los esquemas JSON 1.0.
- python y modulos conservan los algoritmos restantes y adaptan las firmas que usa la interfaz.

Las operaciones elementales de matrices y sus pasos comparten una implementación. Los adaptadores de sistemas, determinantes, inversas y vectores usan imports normales de paquetes. modulos/__init__.py dejó de modificar sys.path.

## Recorrido completo migrado

El formulario de Matrices recoge A y B. python.operaciones_matrices ejecuta matrices.producto a través del servicio del núcleo, recupera su resultado y adapta los datos de los pasos al formato actual. El resultado guarda contrato_producto y ofrece Exportar producto JSON. La descarga contiene el mismo sobre versionado producido por Python.

Pyodide recibe los mismos archivos de packages/core/src/nexolineal y los coloca en su directorio estándar de paquetes. El motor permanece separado del DOM y de los controles de la pantalla. El producto se compara con una referencia obtenida mediante Python nativo.

## Compatibilidad

Se conservan las firmas matemáticas existentes y los resultados válidos. Las dos pruebas antiguas que dependían de la entrada de terminal se trasladaron a la validación del adaptador y a la consulta de teoremas de la interfaz. Los 29 casos del conjunto recibido siguen cubiertos con esa adaptación explícita.

Los lanzadores Abrir_consola.bat y Abrir_ventana.bat, el menú de terminal y sus puntos de entrada fueron retirados por solicitud del propietario. main.py inicia directamente la ventana gráfica de desarrollo.

La referencia fase-01-base permite recuperar el estado anterior. La fase 04 realizará la migración ampliada de los otros recorridos matemáticos. El núcleo de esta fase ya puede instalarse y probarse de forma independiente.
