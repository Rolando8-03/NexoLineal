# PDF y CSV de la ejecución actual

El resultado ofrece «Exportar procedimiento PDF» y, si hay filas, «Exportar tabla CSV». Se reutiliza el objeto de resultado recibido de Python; exportar no ejecuta otra vez los algoritmos. El JSON exacto de resultado y los proyectos versión 1 permanecen disponibles.

## PDF

El documento contiene operación, estado, entradas, resultado, todos los pasos, fórmulas, comprobaciones, advertencias, error cuando exista y metadatos de exactitud/método. Incluye paginación. Las fórmulas se identifican como **notación LaTeX textual**, no como una reproducción tipográfica de la pantalla. Las escenas de gráfica no se agregan al documento ni se exportan miles de muestras como procedimiento.

Se usa **jsPDF 4.2.1, licencia MIT**, cargado bajo demanda, con la fuente KaTeX_Main ya distribuida por KaTeX en el frontend. Los recursos se incluyen localmente para web, EXE y APK. No se usa captura HTML ni se evalúan fórmulas de texto. La compilación incluye los avisos íntegros de jsPDF, KaTeX y las dependencias distribuidas en licenses/, con índice de nombres, versiones y licencias; no se asigna una licencia nueva al material original del proyecto. Un carácter ausente de la fuente se escribe con su escape Unicode visible para conservarlo en vez de descartarlo silenciosamente.

El texto está limitado a **2 MiB** y el documento a **300 páginas**. Si se supera un límite se avisa y se conserva la posibilidad de exportar JSON; no se trunca el procedimiento. El archivo final, como el CSV, admite hasta **16 MiB**.

## CSV

Se exportan todas las filas y la unión de todas sus columnas, incluidas las que no aparecen en la vista resumida de la tabla. UTF-8 con BOM, separador coma, líneas CRLF, comillas duplicadas dentro de celdas y valores compuestos codificados como JSON. Los racionales y decimales se escriben como texto recibido, sin convertirlos a números JavaScript.

Los textos que podrían iniciar fórmulas de una hoja de cálculo se protegen con apóstrofo. Los números negativos racionales/decimales válidos conservan su texto. Al abrir en una hoja, importar las columnas como texto evita que su autodetección convierta fracciones o decimales a fechas o números redondeados. El archivo conserva sus celdas textuales exactas.

## Destinos y evidencia

| Destino | Guardado | Verificación |
| --- | --- | --- |
| Web | Descarga Blob mediante el navegador | Archivo CSV leído celda por celda con csv; PDF multipágina abierto y contrastado con pypdf 7.1.0 |
| Windows | Selector Guardar de pywebview y escritura binaria atómica | Python y EXE generan los documentos en la interfaz y los pasan por el puente; CSV contrastado con todas las filas calculadas y PDF validado estructuralmente |
| Android | ACTION_CREATE_DOCUMENT y escritura mediante ContentResolver | APK offline genera ambos documentos, valida su presencia/formato y los conserva como evidencia |

Las pruebas nativas usan un **destino de evidencia explícito**, evitando automatizar el diálogo del sistema. En Windows exige --self-test y la ruta de pruebas; en Android exige APK debug e intento de instrumentación marcado. La ejecución ordinaria abre el selector nativo. Por tanto, se verifican generación y transporte/guardado de los documentos, pero no se presenta la interacción con esos diálogos como una prueba gráfica automatizada.

Windows valida base64, tipo, cabecera PDF, UTF-8 de CSV y tamaño; escribe un temporal en el destino y lo reemplaza atómicamente. Android valida tipo, tamaño y cabecera PDF antes de solicitar y escribir el destino. La prueba de datos protege fracciones grandes, comillas, saltos de línea, columnas variables y celdas que parecen fórmulas.
