# Verificación de fase 06

Las pruebas ejercitan los componentes y adaptadores de producción. Los 56 algoritmos siguen en el núcleo Python; la interfaz solo añade captura, presentación, reutilización y persistencia.

## Ejecución local

```sh
python -m pip install -e packages/core sympy==1.14.0 jsonschema==4.23.0
python -B pruebas.py -v
python -B -m unittest discover -s tests -v
python .github/scripts/generar_catalogo.py --check
python -m tests.auditoria_matematica
python -m tests.auditoria_fase04
python -m tests.auditoria_fase05
npm ci --prefix apps/frontend
npm run build --prefix apps/frontend
npm install --prefix /tmp/nexo-playwright playwright@1.56.1 axe-core@4.10.3
/tmp/nexo-playwright/node_modules/.bin/playwright install --with-deps chromium
node .github/scripts/probar_estado_fase06.cjs
NODE_PATH=/tmp/nexo-playwright/node_modules node .github/scripts/probar_web_fase03.cjs
NODE_PATH=/tmp/nexo-playwright/node_modules node .github/scripts/probar_experiencia_fase06.cjs
```

Los scripts arrancan su propio servidor local. Los recorridos web bloquean dependencias externas: Pyodide, Python, fuentes y demás recursos están incluidos en la compilación.

## Baterías

| Batería | Alcance |
| --- | --- |
| unittest | 29 originales y 102 descubiertas: 131; nueve nuevas para el almacenamiento Windows |
| Codec/validación | 50 comprobaciones del TypeScript real: formato, exactitud, límites, cero/vacío, pegado, búsquedas y adaptadores nativos |
| Experiencia | 19 recorridos Chromium con perfil persistente, cierre/reapertura, importación/exportación, objetos, foco, teclado y errores de almacenamiento |
| Accesibilidad automática | Siete escenas axe: cuatro modo/tema, biblioteca, historial y móvil; cero violaciones en las escenas probadas |
| Regresión web | 119 casos: 113 contratos completos, 56 formularios por modo, tablas, exactitud, cancelación y recuperación |
| Windows | 118 casos desde Python y 118 desde EXE; además un proceso de reapertura independiente por modalidad |
| Android | 118 casos y reapertura dentro del recorrido instrumentado, APK offline, emulador API 35/x86_64 |
| Paridad | 113 respuestas JSON completas y hashes de los 46 archivos del núcleo entre destinos |
| Matemáticas conservadas | 288 sistemas/1572 comprobaciones; 2376 solicitudes/12633 comprobaciones de álgebra; 339 solicitudes/6473 comprobaciones numéricas |
| Interfaz anterior | 11 recorridos gráficos de compatibilidad |

Las nueve pruebas nuevas de Python incluyen lectura vacía, persistencia entre instancias, caracteres UTF-8, envoltorio inválido, límite de tamaño, recuperación ante fallo de reemplazo atómico, archivo corrupto conservado, escrituras concurrentes completas y ruta aislada de pruebas.

El test del codec transpila los módulos de producción. Un proxy que fabrica cualquier propiedad, como el de Capacitor, comprueba que el adaptador no sea asimilado como una promesa por una propiedad `then`; una fecha límite falla si queda pendiente. La validación usa el catálogo Python real. Se prueban búsquedas por alias, universo condicional y rechazo de datos que pretendan importar una verificación fabricada.

Los recorridos UI reutilizan una matriz con racional mayor que el entero seguro, una base no simétrica en coordenadas y una función. Contrastan las 56 operaciones y el resultado completo al alternar modo/tema. Comprueban que las celdas vacías no sean ceros, que una importación inválida conserve el proyecto y que un fallo de guardado no destruya la entrada. La prueba de reapertura recupera paso, problema, objetos y favoritos sin duplicar historial.

## CI y límites

`plataformas.yml` ejecuta las pruebas reales en Chromium, Windows Server 2022/WebView2 y Android 15 emulado. El agregador exige las reaperturas, el codec y la accesibilidad, además de la paridad anterior. Los nombres históricos de artefactos `fase03-*` identifican la infraestructura reutilizada; el SHA identifica el código realmente probado.

Los informes, versiones, huellas y enlaces definitivos se registran en [cierre.md](cierre.md) y [evidencias.json](evidencias.json). No se considera aprobada una compilación solo porque existan pruebas locales. Un fallo inicial de Android por la asimilación del proxy como promesa y una carrera de foco móvil tienen regresiones específicas; las ejecuciones fallidas permanecen en Actions.

Las comprobaciones automatizadas no certifican accesibilidad universal, todos los navegadores, Windows 11 ni un teléfono físico. La reapertura Android acredita un ciclo de Activity sobre almacenamiento privado; no acredita recuperación después de desinstalación. Los diálogos de archivo nativos están implementados y su prueba gráfica manual queda delimitada en [proyectos.md](proyectos.md). Instaladores y distribución firmada pertenecen a fase 08.
