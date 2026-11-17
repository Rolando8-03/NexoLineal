# Instalar y conservar el trabajo

## Web

Abrir la versión publicada, esperar a que el motor esté listo y pulsar **Descargar para usar sin conexión**. Esperar la confirmación **Disponible sin conexión en este navegador** antes de cortar la red. El navegador puede ofrecer instalar NexoLineal como aplicación mediante su menú de instalación. Se requiere un navegador con Service Workers, IndexedDB y WebAssembly, en HTTPS o localhost.

La primera descarga incluye la interfaz, fuentes, avisos y Python. Cada recurso se verifica con SHA-256 antes de activar la caché. Una descarga incompleta conserva la versión anterior. Una actualización descargada espera a que se cierren todas las pestañas de NexoLineal. No se fuerza una recarga mientras se trabaja.

Los proyectos permanecen en IndexedDB del origen y perfil del navegador. Cambiar de dominio, borrar los datos del sitio, usar navegación privada o desinstalar el navegador puede hacerlos inaccesibles. Exportar el proyecto JSON como copia de seguridad. El sistema no sincroniza proyectos con una cuenta.

## Windows

Ejecutar `NexoLineal-0.8.0-Windows-x64-Setup.exe`. Instala para el usuario actual sin solicitar Python ni una consola. Crea acceso en el menú Inicio; el acceso de escritorio es opcional. Requiere Windows x64 compatible con WebView2. El instalador incluye el runtime Evergreen x64 completo de Microsoft para instalarlo si falta; su firma Microsoft se comprueba durante la construcción.

El programa queda en `%LOCALAPPDATA%\Programs\NexoLineal`. Los proyectos quedan en `%LOCALAPPDATA%\NexoLineal\workspace-v1.sqlite3`; el JSON de versiones anteriores se conserva después de migrarlo. La desinstalación elimina el programa y los accesos, conserva esa carpeta de datos y no elimina WebView2 compartido. Para borrar definitivamente los datos, primero exportar el proyecto y después eliminar esa carpeta manualmente.

El EXE y el instalador todavía carecen de firma Authenticode del propietario. No se afirma reputación SmartScreen ni ausencia de avisos del sistema. La firma de Microsoft del prerrequisito no firma NexoLineal.

## Android

Usar únicamente el APK marcado **Propietario** para distribución permanente. Requiere Android 7/API 24 o posterior, ARM64 o x86_64. Incluye Python 3.12 y todos los recursos; el primer cálculo no necesita descargar un motor. La verificación automatizada actual usa Android 15/API 35 x86_64 emulado. Incluir ARM64 no acredita una prueba en teléfono ARM64 físico.

Instalar el APK con el selector de archivos del teléfono, autorizar la instalación para esa fuente según la configuración de Android y abrir NexoLineal. El usuario debe revisar los avisos de su dispositivo. Para una actualización, conservar la misma firma. Antes de desinstalar, exportar el proyecto: Android borra SQLite y los datos privados de la aplicación.

## Proyecto portable

Web: IndexedDB. Windows y Android: SQLite. El documento sigue siendo `NexoLineal.Project` versión 1, con límite de 2 MiB y magnitudes matemáticas como texto. Exportar JSON en un destino e importarlo en otro; el receptor valida y recalcula con Python. No se mezclan bases SQLite ni se suben problemas a un servicio externo. La migración no elimina el JSON previo y un formato incompatible produce un aviso en lugar de sobrescribirlo.

Fuentes: [WebView2](https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution), [Inno Setup](https://jrsoftware.org/ishelp/topic_setup_privilegesrequired.htm), [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API), [transacciones SQLite](https://sqlite.org/atomiccommit.html).
