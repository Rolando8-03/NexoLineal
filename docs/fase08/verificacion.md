# Verificación de distribución

## Evidencia automática

El workflow `Distribución fase 08` compila todos los destinos desde `github.sha`, incorpora `version.json` y genera manifiestos y `SHA256SUMS` por destino. Los ZIP de Actions tienen además su propio digest; ese digest corresponde al ZIP, no al EXE o APK interior. Los artefactos de Actions caducan según la retención del repositorio y no sustituyen una publicación estable de fase 09.

| Prueba | Qué acredita | Límite |
|---|---|---|
| Chromium persistente bajo `/NexoLineal/` | Worker Python, manifiesto instalable, descarga íntegra, cierre/reapertura, recarga y cálculo sin red | Navegador Chromium probado; no certifica todos los navegadores ni evita que el sistema borre cachés por falta de espacio |
| Actualización web fallida/completa | Conserva caché previa si falta un recurso, espera al cierre de pestañas y conserva IndexedDB | No sincroniza cuadernos entre usuarios o navegadores |
| Migración web | Lee el JSON local anterior, confirma IndexedDB y conserva el original | El usuario debe exportar una copia antes de borrar los datos del sitio |
| Diez pruebas SQLite | Transacción, rollback, concurrencia, reapertura, migración, corrupción y versión desconocida | Pruebas del adaptador Windows; Android se comprueba en instrumentación |
| Instalador Windows | Instala, abre EXE congelado con PATH sin Python, desinstala, conserva SQLite, reinstala y recupera el trabajo | Runner Windows Server 2022 con herramientas instaladas; pendiente PC físico sin Python y caso de WebView2 inicialmente ausente |
| APK release no depurable | Python incluido, primer inicio en modo avión, cálculo, reapertura y recreación de Activity, ejercicio de teclado/Atrás | Emulador Android API 35 x86_64; visibilidad del teclado y comportamiento físico pendientes |
| Proyecto cruzado | JSON exportado desde Chromium, conservado como fixture, cargado y recalculado mediante los adaptadores SQLite nativos | No acredita el selector de archivos de todos los dispositivos |
| Regresión de plataformas | 136 respuestas completas iguales y 48 fuentes Python íntegras; experiencia previa y documentos | No reemplaza los ensayos de instalación física |

El documento `tests/fixtures/fase08-project.json` procede de la exportación de una sesión Chromium real. Los informes nativos registran su SHA-256, destino y recálculo. Se conservan los formatos públicos y la aritmética como texto.

## Reproducir en desarrollo

```bash
python -m pip install -e packages/core sympy==1.14.0 jsonschema==4.23.0 pypdf==7.1.0
python -B pruebas.py -v
python -B -m unittest discover -s tests -v
npm ci --prefix apps/frontend
npm run build --prefix apps/frontend
# Instalar Playwright 1.56.1 y Chromium, accesibles mediante NODE_PATH.
node .github/scripts/probar_distribucion_fase08.cjs
python .github/scripts/sellar_distribucion_fase08.py web
```

El usuario final no ejecuta estos comandos. Los flujos Windows/Android del repositorio contienen las dependencias y órdenes exactas de construcción. La clave Android se incorpora únicamente desde secretos; no forma parte del checkout, caché de Gradle ni artefactos publicados.

## Ensayos físicos pendientes

Identificar modelo, sistema, arquitectura, RAM disponible, versión de WebView, versión de NexoLineal, hash del instalador/APK y huella de firma antes de ensayar. Anotar aprobado/fallido y el comportamiento observado, sin inferir resultados a partir del emulador.

1. En un Windows x64 sin Python ni herramientas de desarrollo y sin WebView2, desconectar la red, instalar, abrir desde Inicio y calcular `1/2·2 + 2·3 = 7`. Confirmar instalación offline de WebView2, acceso de escritorio opcional y ausencia de consola. Guardar un proyecto, desinstalar, reinstalar y recuperarlo. Comprobar que otra aplicación que usa WebView2 sigue abriendo.
2. En un teléfono ARM64 identificado con Android API 24 o posterior, instalar el APK **Propietario**, activar modo avión antes de abrirlo por primera vez y calcular el mismo producto. Probar teclado real, Atrás con teclado abierto, Atrás en diálogo, Atrás en Historial y regreso desde segundo plano.
3. Guardar, cambiar de aplicación, bloquear/desbloquear y reabrir. Ensayar interrupción del proceso desde Ajustes, abrir otra vez y comprobar el último guardado confirmado. Una transacción interrumpida debe conservar el guardado confirmado anterior; una edición aún no confirmada puede perderse.
4. Exportar un JSON del teléfono, abrirlo en web y Windows y recalcular; devolver otro JSON al teléfono mediante el selector nativo. Registrar los nombres y hashes de los archivos, sin publicar problemas privados.
5. Registrar al menos cinco arranques fríos y cinco calientes, un cálculo pequeño y uno representativo, memoria y tamaño instalado. Separar tiempo de instalación, extracción y preparación del motor. No extrapolar un único ensayo a todos los dispositivos.

## Medidas

Los tiempos CI son observaciones de una máquina compartida, no garantías ni límites públicos. Windows mide desde el punto de entrada Python después de extraer el EXE; el tiempo de extracción queda fuera. Android mide inicio de Activity y cálculo, con memoria PSS del proceso; el renderizador WebView puede tener memoria adicional. Web registra tiempo hasta la interfaz calculable y cálculo tras recarga offline, además de métricas CDP: el heap JS de página no equivale al total de Python/WASM, Worker y navegador. Los resultados finales y sus entornos se consignan en el registro de esta fase.
