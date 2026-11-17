# Verificación reproducible de fase 04

## Motor y referencia independiente

```sh
python -m pip install -e packages/core sympy==1.14.0 jsonschema==4.23.0
python .github/scripts/generar_catalogo.py --check
python -B pruebas.py -v
python -B -m unittest discover -s tests -v
python -m tests.auditoria_matematica
python -m tests.auditoria_fase04
```

Se ejecutaron 29 pruebas originales y 71 pruebas del núcleo/plataformas: **100 pruebas unittest**. Las 27 nuevas funciones de prueba contienen subcasos de contratos, dimensiones, singularidad, presupuesto, bases inválidas y degeneraciones. No se cuentan como pruebas distintas las repeticiones en cada plataforma.

La auditoría anterior comprueba 288 sistemas y 1572 invariantes. La nueva auditoría ejecuta **2376 solicitudes públicas, 41 operaciones lineales y 12633 comprobaciones**, con SymPy 1.14.0 y semilla reproducible 20261117. Incluye matrices rectangulares de tamaños 1…5, ceros, fracciones, sistemas compatibles e incompatibles, cambios de base, PLU con permutaciones posteriores y operaciones elementales. Reproduce las operaciones de fila registradas y contrasta los objetos finales con una referencia independiente.

Esta batería finita no demuestra corrección para cualquier tamaño o entrada imaginable. Las demostraciones estructurales utilizadas por el programa se limitan a los lenguajes representados: matrices, familias finitas y aplicaciones dadas por matrices.

## Interfaz compartida

```sh
cd apps/frontend
npm ci
npm audit --audit-level=low
npm run build
cd ../..
python .github/scripts/casos_plataformas.py
npm install --prefix /tmp/nexo-playwright playwright@1.56.1
/tmp/nexo-playwright/node_modules/.bin/playwright install --with-deps chromium
NODE_PATH=/tmp/nexo-playwright/node_modules node .github/scripts/probar_web_fase03.cjs
```

La prueba web ejecuta los 73 contratos completos en un Worker real y los 44 formularios en Serio y Explorador (88 recorridos). Compara JSON exportado con la ejecución nativa de la solicitud realmente introducida. También comprueba fracción grande, recuperación tras fallo de carga, conservación del paso y de las entradas al cambiar modo, navegación durante cálculo, cancelación/recuperación y ausencia de desbordamiento a 390 px. Se bloquean peticiones externas: la nueva interfaz usa Python y recursos empaquetados.

El nombre de los scripts y del directorio evidencia-fase03 se conserva para reutilizar la infraestructura de tres plataformas. Los datos de esta ejecución corresponden a versión 0.4.0 y sus 73 contratos, identificados por el SHA de Actions; no son los siete contratos históricos de fase 03.

## Windows, Android y paridad

El workflow plataformas.yml compila la misma revisión en web, Windows y Android. En Windows abre la interfaz desde Python y desde el EXE congelado, comprueba el subsistema gráfico PE=2 y el cierre del proceso. En Android instala el APK e instrumenta la aplicación sin conexión en API 35/x86_64; verifica además que el paquete incluya Python para ARM64 y x86_64.

Cada recorrido nativo verifica el producto inicial, un sistema rectangular introducido mediante el formulario en los dos modos, los 73 contratos y cancelación/recuperación: 76 casos por recorrido. El agregador exige igualdad de las **respuestas completas** (datos, pasos, estados, verificaciones y metadatos) y de los hashes de todos los fuentes Python. Son cuatro recorridos: web, Windows fuente, Windows EXE y Android.

Los resultados y vínculos reales de CI quedan en cierre.md y evidencias.json. La interfaz anterior se comprueba con verificar_interfaz.cjs y 11 casos gráficos. En el entorno local las CDN históricas devolvieron ERR_EMPTY_RESPONSE, por lo que ese recorrido se valida en Actions; no se confunde ese límite de red con un resultado aprobado localmente.

## Alcance de plataforma

La evidencia corresponde a Chromium, Windows Server 2022 x64/WebView2 y Android 15 x86_64 emulado. No acredita pruebas físicas ARM64, Windows 11 ni un instalador final. La firma estable del APK, el instalador y la desinstalación siguen en fase 08. La experiencia animada completa y el historial siguen en fase 06.
