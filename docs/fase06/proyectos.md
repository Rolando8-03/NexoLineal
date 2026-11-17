# Proyectos portables y guardado

El formato es **`NexoLineal.Project`, versión 1**, independiente del contrato matemático 1.0. La versión de la aplicación es 0.6.0. El codec TypeScript valida antes de reemplazar el proyecto actual. Una versión desconocida se rechaza con un mensaje; no se migra ni descarta silenciosamente.

## Contenido

| Campo | Significado |
| --- | --- |
| format, version | Identificador y versión del proyecto |
| name, updatedAt | Nombre y fecha ISO de modificación |
| preferences | `mode`: serio/explorador; `theme`: claro/oscuro |
| active.operation | Identificador de operación del catálogo actual |
| active.inputs | Entradas de las operaciones visitadas, indexadas por ID y nombre de campo; todos los valores son texto |
| active.step | Índice del paso activo, desde cero |
| active.stepsOpen, verificationOpen | Apertura de procedimiento y comprobaciones |
| active.resumeResult | Indica que se debe volver a ejecutar el ejercicio al abrir |
| objects | Objetos con ID, nombre, tipo, texto y dimensión ambiente opcional |
| history | Solicitudes ejecutadas con ID, fecha, operación, valores, etiqueta, estado y favorito |

No se almacenan resultados matemáticos ni certificados importados. Al reabrir o importar un ejercicio ejecutado, Python lo vuelve a calcular y la interfaz limita el índice al procedimiento disponible. La reapertura no añade otra entrada de historial. El archivo JSON de **resultado**, disponible en el ejercicio, es un entregable diferente del **proyecto** editable.

El codec comprueba campos admitidos, operaciones y nombres de operandos conocidos, tipos, fechas, IDs únicos, preferencias y límites. Rechaza campos inesperados y claves peligrosas. Los operandos no se convierten a números de JavaScript. Esto conserva `9007199254740993/2` sin redondeo. El codec comprueba el formato; Python mantiene toda la validación matemática.

## Historial y continuidad

Cada ejecución agrega entradas y estado, incluidos errores matemáticos devueltos por el motor. Editar recupera los operandos sin ejecutar; Repetir vuelve a calcular y crea una entrada nueva. Buscar considera nombre de operación y valores; el filtro de favoritos es independiente. Se pueden eliminar entradas y crear otro cuaderno. Importar o crear un cuaderno ofrece deshacer mientras no se realice otra edición que lo invalide.

Se guarda automáticamente tras 180 ms sin cambios y también mediante «Guardar ahora». Las escrituras se serializan. El aviso «Guardado» corresponde a la instantánea confirmada; un error de cuota o de disco se muestra sin borrar las entradas en pantalla. Si el guardado anterior es incompatible o está corrupto, no se sobrescribe automáticamente: el usuario puede exportar su trabajo y elegir un reemplazo explícito.

Límites: **2 MiB UTF-8 por proyecto, 100 objetos y 100 entradas de historial**. Al alcanzar una capacidad se avisa y se pide exportar/eliminar elementos; no se borran automáticamente los más antiguos. Existe un cuaderno activo por perfil o instalación; se pueden conservar muchos proyectos exportados. No hay sincronización en nube ni conciliación simultánea de varias ventanas.

## Matriz de soporte

| Función | Web | Windows | Android |
| --- | --- | --- | --- |
| Guardado automático | localStorage `nexolineal.project.v1` | Archivo por usuario con reemplazo atómico | Archivo privado con AtomicFile |
| Independencia del servidor | Mismo origen y perfil del navegador | `%LOCALAPPDATA%/NexoLineal/workspace-v1.json`, independiente del puerto local de pywebview | `filesDir/workspace-v1.json`, independiente del WebView |
| Exportación de archivo | Descarga JSON mediante Blob | Diálogo Guardar de pywebview | Selector ACTION_CREATE_DOCUMENT |
| Importación de archivo | Selector de archivo del navegador | Diálogo Abrir de pywebview | Selector ACTION_OPEN_DOCUMENT |
| JSON visible y pegable | Sí | Sí | Sí |
| Reapertura comprobada | Proceso Chromium cerrado y perfil reabierto | Procesos nuevos, desde Python y desde EXE | Activity cerrada y relanzada en APK offline |

Los recorridos automatizados exportan e importan un archivo real en web. En Windows y Android verifican el formato portable a través del panel JSON y el guardado/reapertura nativos; **los selectores de archivos del sistema están implementados, pero su interacción gráfica no está automatizada en esta fase**. Sigue disponible «Ver o pegar JSON» si no se puede usar el selector. Si el portapapeles está bloqueado, se selecciona el texto para copia manual y se informa de ello.

En Windows el almacenamiento usa un temporal en el mismo directorio, `fsync`, exclusión mutua y `os.replace`; la variable de pruebas `NEXO_STATE_FILE` permite aislar recorridos. En Android se usan `startWrite/finishWrite/failWrite` y lectura que recupera la copia de AtomicFile. Los puentes nativos comprueban tamaño y envoltorio; el codec común valida el contenido completo antes de aceptarlo.

El guardado local no es una copia externa de seguridad. Borrar datos del sitio/perfil o desinstalar Android puede eliminarlo. Exportar el proyecto conserva una copia portable entre plataformas. El proyecto incluye las entradas matemáticas y sus nombres tal como los escribió el usuario; la aplicación no los envía a un servicio de almacenamiento externo.
