# Verificación reproducible de fase 07

```sh
python -m pip install -e packages/core sympy==1.14.0 jsonschema==4.23.0 pypdf==7.1.0
python -B pruebas.py -v
python -B -m unittest discover -s tests -v
python .github/scripts/generar_catalogo.py --check
python -m tests.auditoria_matematica
python -m tests.auditoria_fase04
python -m tests.auditoria_fase05
python -m tests.auditoria_fase07
npm ci --prefix apps/frontend
npm audit --prefix apps/frontend --audit-level=low
npm run build --prefix apps/frontend
python .github/scripts/casos_plataformas.py
npm install --prefix /tmp/nexo-browser playwright@1.56.1 axe-core@4.10.3
/tmp/nexo-browser/node_modules/.bin/playwright install --with-deps chromium
node .github/scripts/probar_estado_fase06.cjs
node .github/scripts/probar_datos_fase07.cjs
NODE_PATH=/tmp/nexo-browser/node_modules node .github/scripts/probar_web_fase03.cjs
NODE_PATH=/tmp/nexo-browser/node_modules node .github/scripts/probar_experiencia_fase06.cjs
NODE_PATH=/tmp/nexo-browser/node_modules node .github/scripts/probar_visualizacion_fase07.cjs
```

Los nombres históricos de scripts/artefactos se conservan; el SHA identifica el código probado. Los scripts de navegador arrancan su servidor local y bloquean dependencias externas. Los recursos del runtime y del PDF están incluidos en la compilación.

## Baterías

- 29 pruebas originales y 131 descubiertas: **160 unittest**, incluidas 29 nuevas de geometría, modelos y documentos.
- Auditoría nueva: **553 solicitudes y 8083 comprobaciones** con SymPy 1.14.0, semilla 2026111707. Incluye 240 sistemas, 160 proyecciones, 40 combinaciones, 100 transformaciones, ocho ejemplos de raíces y cinco aplicaciones.
- Auditorías conservadas: 1572, 12633 y 6473 comprobaciones independientes.
- 57 ejemplos predeterminados coherentes con los esquemas y el catálogo; **136 contratos completos** entre Worker, Windows desde Python/EXE y Android offline; **48 fuentes Python comunes**.
- **23 comprobaciones** de conversión de coordenadas y exportadores TypeScript reales; **54 comprobaciones** de proyecto/validación y puentes de almacenamiento.
- **11 recorridos nuevos de experiencia**, además de los 19 conservados y los 11 de la interfaz anterior. Cinco escenas axe nuevas más siete conservadas, sin violaciones en las escenas aprobadas.
- Generación y lectura de PDF/CSV, sincronización fila/paso/gráfica, escala espacial, racionales finitos, polos entre muestras, ampliación y retorno de foco.
- Banco de 19 proyectos: ejecución con Python y aceptación por el codec de proyectos de producción; [banco-verificacion.json](banco-verificacion.json).

La auditoría contrasta cada vértice de recta/plano con la ecuación original y los puntos de solución con Ax=b; SymPy decide además compatibilidad por rangos. Reconstruye la proyección y comprueba ortogonalidad, transforma cada segmento con una multiplicación independiente y verifica curva, tabla y marcos de los cuatro métodos. Las pruebas no establecen convergencia o continuidad universal por muestreo.

## Plataformas y límites

plataformas.yml compila web, ejecuta una ventana y un EXE gráfico en Windows Server 2022/WebView2, y prueba un APK sin conexión en Android API 35/x86_64 con bibliotecas ARM64 incluidas. Exige reapertura de proyecto, sincronización gráfica, exportaciones nativas y comparación íntegra de las respuestas JSON y de las fuentes Python. La prueba web contrasta asimismo los 57 formularios en ambos modos.

Los informes y artefactos definitivos se registran en [cierre.md](cierre.md) y [evidencias.json](evidencias.json). El soporte no equivale a pruebas en un teléfono físico, Windows 11 o todos los navegadores. Las escenas axe no certifican accesibilidad universal. Los selectores de archivos nativos están implementados; se documenta el destino de evidencia utilizado en [exportaciones.md](exportaciones.md).
