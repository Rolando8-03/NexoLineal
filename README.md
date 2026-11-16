# NexoLineal

Calculadora educativa con motor matemático en Python e interfaz web. La fase 02 establece un núcleo instalable, números racionales exactos, contratos versionados y comprobaciones automáticas.

## Preparar el entorno de desarrollo

Requiere Python 3.10 o posterior. La verificación automática utiliza Python 3.12 y Node 22.

```sh
python -m pip install -e packages/core
python -m http.server 8000
```

Abrir http://localhost:8000 en el navegador. La versión actual carga Pyodide, Tailwind, SweetAlert2 y KaTeX desde sus CDN. El motor del navegador recibe los mismos archivos Python del paquete.

## Capacidades actuales

- Sistemas por Gauss y Gauss-Jordan, clasificación, solución general y comprobación.
- Operaciones matriciales, determinantes, inversas, propiedades, Cramer y LU sin permutaciones.
- Operaciones vectoriales e independencia lineal.
- Calculadora, derivadas e integrales del conjunto de reglas implementado.
- Producto matricial con pasos estructurados y exportación JSON exacta.
- Fracciones grandes preservadas en resultados, fórmulas, Ans y exportación.

Los valores racionales se transportan como texto. Una integral polinómica de x² entre −1 y 1 devuelve 2/3 con exactitud declarada. Las evaluaciones trascendentales y la integración numérica declaran aproximación. El método de integral definida requiere verificar un dominio real continuo sobre el intervalo cerrado.

## Organización

| Ruta | Responsabilidad |
| --- | --- |
| packages/core | Paquete nexolineal-core independiente de la interfaz |
| packages/contracts | Esquemas JSON 1.0 de problemas y resultados |
| python y modulos | Adaptadores y algoritmos existentes con imports normales |
| js, css e index.html | Interfaz web y conexión con Pyodide |
| tests | Regresiones de contratos, precisión, dominio y empaquetado |
| .github/scripts | Auditoría matemática independiente y recorridos gráficos |
| docs/fase02 | Contrato, migración y evidencias de la estabilización |

## Verificar

```sh
python -m pip install sympy==1.14.0 jsonschema==4.23.0
python -B pruebas.py -v
python -B -m unittest discover -s tests -v
python -m tests.auditoria_matematica
```

SymPy se usa como referencia independiente en pruebas. Los algoritmos de producción conservan sus implementaciones explícitas en Python.

El workflow de verificación ejecuta los casos originales, las regresiones nuevas, 288 sistemas independientes y recorridos gráficos en Chromium. Los informes y capturas se conservan como nexolineal-evidencias en Actions.

## Historial y autoría

La rama fase-01-base conserva el trabajo recibido. La fase 02 retira los lanzadores BAT y la entrada de terminal, incorpora el núcleo y documenta los cambios de API en docs/fase02.

Autores del material original — Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez, Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre. Las atribuciones originales permanecen en el historial y en los módulos reutilizados.
