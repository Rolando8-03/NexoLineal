# Verificación reproducible

```sh
python -m pip install -e packages/core sympy==1.14.0 jsonschema==4.23.0
python .github/scripts/generar_catalogo.py --check
python -B pruebas.py -v
python -B -m unittest discover -s tests -v
python -m tests.auditoria_matematica
python -m tests.auditoria_fase04
python -m tests.auditoria_fase05
```

Se verifican 29 pruebas originales y 93 del núcleo/plataformas: **122 unittest**, de las cuales 22 se incorporan en esta fase. La auditoría nueva ejecuta **339 solicitudes a las 12 operaciones nuevas y 6473 comprobaciones** con SymPy 1.14.0, semilla 2026111705. Las auditorías conservadas comprueban además 288 sistemas/1572 invariantes y 2376 solicitudes/12633 invariantes de álgebra lineal.

La referencia independiente contrasta fórmulas de las iteraciones, intervalos y cotas frente a raíces conocidas; reconstruye Jacobi/Gauss-Seidel mediante matrices de iteración simbólicas; deriva primitivas admitidas; integra polinomios y comprueba las cotas de Simpson. Las conversiones se reconstruyen con otra suma posicional que admite períodos. Se distinguen los errores relativos con denominador cero. Las regresiones incluyen parser inseguro, discontinuidades, Newton con ciclo 0→1→0, derivada nula, secante con denominador cero, precisión agotada, falta de dominancia sin falsa divergencia y cancelación.

Una batería finita no prueba convergencia para cualquier función o matriz. La ventana de detección de ciclos se limita a ocho puntos. Las cotas garantizadas tienen las hipótesis indicadas en contrato.md; las estimaciones generales no se convierten en garantías.

## Web y plataformas nativas

Se reutiliza el workflow plataformas.yml y los scripts de fase 03. Los nombres históricos fase03-* y evidencia-fase03 no identifican una versión antigua: los artefactos se asocian al SHA y a versión 0.5.0.

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

Web: 113 respuestas completas de Worker real contra Python nativo; 56 formularios en Serio y Explorador (112 recorridos); tablas paginadas, página/expresión conservadas al cambiar modo, captura móvil sin desbordamiento, fracción grande, exportación, navegación, cancelación y recuperación. El informe contiene 119 casos, uno de los cuales agrupa los formularios.

Windows: fuente Python y EXE congelado, con 113 contratos y recorridos reales de producto, sistema rectangular y bisección desde formularios, más cancelación/recuperación: 117 casos por recorrido. Android: mismo conjunto de 117 casos en APK instalado sin red. El agregador compara respuestas JSON completas y hashes de los 46 archivos Python comunes. La interfaz anterior conserva 11 recorridos gráficos en otro workflow.

El cierre conserva los vínculos reales de ejecución y los informes resumidos con huellas de cada respuesta. Los comandos anteriores regeneran los datos completos. Los artefactos de Actions caducan a los 30 días.

## Referencias matemáticas primarias

- NIST, DLMF §3.8: https://dlmf.nist.gov/3.8 — definiciones y métodos de raíces.
- Barrett y colaboradores, Templates for the Solution of Linear Systems: https://netlib.org/templates/templates.html — iteraciones estacionarias y criterios de parada.

Las condiciones y garantías implementadas se documentan y prueban explícitamente. Estas referencias no sustituyen el contraste del código real ni acreditan una concordancia página por página con todos los libros del curso.
