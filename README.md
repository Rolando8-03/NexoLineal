# NexoLineal

Calculadora educativa con motor matemático en Python e interfaz web. La fase 04 completa la cobertura básica de álgebra lineal sobre una interfaz compartida para web, Windows y Android, conectada al mismo núcleo Python y al contrato JSON 1.0.

## Prototipos de los tres destinos

La interfaz compartida ofrece 44 operaciones: 41 de álgebra lineal y tres herramientas de cálculo heredadas. Incluye sistemas rectangulares, matrices y bloques, determinantes, inversas, LU/PLU, vectores, subespacios, bases, coordenadas y transformaciones. Incluye menú principal, entrada mínima y presentaciones Serio y Explorador. Los recursos del nuevo frontend se empaquetan localmente.

| Destino | Ejecución |
| --- | --- |
| Web | Python dentro de un Worker de Pyodide |
| Windows | Ventana WebView2 y ejecutable gráfico con Python incluido |
| Android | APK de prueba con Python de Chaquopy y puente Capacitor |

[Compilación y artefactos](docs/fase03/compilacion.md) · [Arquitectura](docs/fase03/arquitectura.md) · [Compatibilidad](docs/fase03/compatibilidad.md) · [Cierre de fase 03](docs/fase03/cierre.md)

Las compilaciones y los informes se generan en [Actions](https://github.com/Rolando8-03/NexoLineal/actions/workflows/plataformas.yml). El EXE y el APK debug son prototipos de viabilidad. El instalador Windows y las firmas de distribución se desarrollan en fase 08.

## Preparar la interfaz anterior durante la migración

Requiere Python 3.10 o posterior. La verificación automática utiliza Python 3.12 y Node 22.

```sh
python -m pip install -e packages/core
python -m http.server 8000
```

Abrir http://localhost:8000 en el navegador. La versión actual carga Pyodide, Tailwind, SweetAlert2 y KaTeX desde sus CDN. El motor del navegador recibe los mismos archivos Python del paquete.

## Cobertura de fase 04

[Catálogo de las 44 operaciones](docs/fase04/cobertura.md) · [Entradas y convenciones](docs/fase04/contrato.md) · [Arquitectura](docs/fase04/arquitectura.md) · [Verificación](docs/fase04/verificacion.md) · [Cierre de fase 04](docs/fase04/cierre.md)

## Capacidades actuales

- Sistemas por Gauss y Gauss-Jordan, clasificación, solución general y comprobación.
- Operaciones matriciales, determinantes, inversas, propiedades, Cramer, LU sin permutaciones y PLU con PA=LU.
- Operaciones vectoriales, generado, dependencia, bases, coordenadas y cambios de base.
- Espacios columna, fila y núcleo; suma e intersección de subespacios.
- Transformaciones desde matrices o imágenes de bases, composición y representación en bases.
- Calculadora, derivadas e integrales del conjunto de reglas implementado.
- Producto matricial con pasos estructurados y exportación JSON exacta.
- Fracciones grandes preservadas en resultados, fórmulas, Ans y exportación.

Los valores racionales se transportan como texto. Una integral polinómica de x² entre −1 y 1 devuelve 2/3 con exactitud declarada. Las evaluaciones trascendentales y la integración numérica declaran aproximación. El método de integral definida requiere verificar un dominio real continuo sobre el intervalo cerrado.

## Organización

| Ruta | Responsabilidad |
| --- | --- |
| apps/frontend | Interfaz compartida React y adaptadores de ejecución |
| apps/windows | Ventana nativa y empaquetado gráfico |
| apps/android | APK con Python incluido y prueba instrumentada |
| docs/fase04 | Cobertura, convenciones, límites y evidencia de álgebra lineal |
| docs/fase03 | Arquitectura, compilación, compatibilidad y evidencias |
| packages/core | Paquete nexolineal-core independiente de la interfaz |
| packages/contracts | Esquemas JSON 1.0 de problemas y resultados |
| python, modulos y teoremas | Adaptadores compatibles de los métodos docentes migrados al paquete |
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
python -m tests.auditoria_fase04
python .github/scripts/generar_catalogo.py --check
```

SymPy se usa como referencia independiente en pruebas. Los algoritmos de producción conservan sus implementaciones explícitas en Python.

El workflow de plataformas compara 73 contratos completos y la integridad del paquete Python entre destinos. Ejecuta pruebas de cancelación y recuperación, los 44 formularios en ambos modos, formularios nativos y el APK offline.

El workflow de verificación ejecuta los casos originales, las regresiones nuevas, 288 sistemas independientes, una auditoría adicional de 2376 solicitudes con 12633 comprobaciones y recorridos gráficos en Chromium. Los informes y capturas se conservan como nexolineal-evidencias en Actions.

## Historial y autoría

La rama fase-01-base conserva el trabajo recibido. La fase 02 retira los lanzadores BAT y la entrada de terminal, incorpora el núcleo y documenta los cambios de API en docs/fase02.

Autores del material original — Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez, Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre. Las atribuciones originales permanecen en el historial y en los módulos reutilizados.
