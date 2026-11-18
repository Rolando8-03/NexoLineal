# NexoLineal

Calculadora educativa con motor matemático en Python e interfaz compartida para web, Windows y Android. La versión 0.8.0 incorpora descarga web offline, instalador Windows y almacenamiento IndexedDB/SQLite, conservando gráficas, procedimientos, tablas, teoría y aplicaciones. Conserva menú principal, presentaciones Serio y Explorador, objetos reutilizables, historial y proyectos portables, con el mismo núcleo Python y contrato JSON 1.0.

## Usar NexoLineal

La interfaz compartida ofrece 57 operaciones: álgebra lineal, métodos de raíces, sistemas iterativos, errores, conversiones, conjuntos y cálculo. Incluye sistemas rectangulares, matrices y bloques, determinantes, inversas, LU/PLU, vectores, subespacios, bases, coordenadas y transformaciones. Incluye menú principal, entrada mínima y presentaciones Serio y Explorador. Los recursos del nuevo frontend se empaquetan localmente.

| Destino | Ejecución |
| --- | --- |
| Web | Python en Worker, instalación PWA y recarga offline tras descarga completa |
| Windows | Instalador por usuario, WebView2 y ejecutable gráfico con Python incluido |
| Android | Release no depurable con Python incluido; firma permanente del propietario pendiente |

[Compilación y artefactos](docs/fase03/compilacion.md) · [Arquitectura](docs/fase03/arquitectura.md) · [Compatibilidad](docs/fase03/compatibilidad.md) · [Cierre de fase 03](docs/fase03/cierre.md)

[Abrir la web](https://rolando8-03.github.io/NexoLineal/) · [Instalación y datos](docs/fase08/instalacion.md) · [Distribuciones y verificaciones](docs/fase08/registro.md)

Las compilaciones e informes se generan en [Distribución fase 08](https://github.com/Rolando8-03/NexoLineal/actions/workflows/distribucion.yml). El instalador Windows se comprueba automáticamente. El APK marcado SOLO-VERIFICACION-CI usa una clave efímera y no es la distribución permanente. La firma del propietario y los ensayos físicos pendientes se detallan en [el registro de fase 08](docs/fase08/registro.md).

## Preparar la interfaz anterior durante la migración

Requiere Python 3.10 o posterior. La verificación automática utiliza Python 3.12 y Node 22.

```sh
python -m pip install -e packages/core
python -m http.server 8000
```

Abrir http://localhost:8000 en el navegador. La versión actual carga Pyodide, Tailwind, SweetAlert2 y KaTeX desde sus CDN. El motor del navegador recibe los mismos archivos Python del paquete.

## Visualización y aprendizaje de fase 07

Rectas y planos en 2D/3D, vectores y combinaciones, proyección ortogonal exacta, cuadrícula lineal y geometría de bisección, falsa posición, Newton y secante. La selección de fila, paso y gráfica se sincroniza; el residual conserva los valores de la tabla. Las curvas se separan donde el analizador no puede justificar continuidad. Los datos de las escenas provienen de Python; la interfaz controla cámara, ampliación y alternativa textual.

Biblioteca incorpora 12 fichas con hipótesis y fuentes primarias, cinco aplicaciones verificadas con unidades/restricciones y un banco de 19 proyectos importables. El procedimiento se exporta a PDF paginado y las tablas a CSV de todas sus columnas. Las dos presentaciones tienen las mismas capacidades.

[Contrato visual y límites](docs/fase07/visualizacion.md) · [Teoría y aplicaciones](docs/fase07/teoria-aplicaciones.md) · [Banco importable](docs/fase07/banco.md) · [PDF/CSV](docs/fase07/exportaciones.md) · [Pruebas](docs/fase07/verificacion.md) · [Cierre y descargas 0.7.0](docs/fase07/cierre.md)

## Experiencia de fase 06

Diez destinos del menú, búsqueda matemática y formularios que piden los operandos necesarios. Pegar una matriz infiere sus dimensiones y conserva la diferencia entre una celda vacía y cero. Las matrices, vectores, bases y funciones se guardan para usarlos en otra operación sin transcribirlos.

Serio y Explorador ofrecen las mismas 57 operaciones, procedimientos, comprobaciones y tablas. Claro/Oscuro es una preferencia independiente; cambiar de presentación conserva el ejercicio, el resultado y el paso activo. El modo Explorador incluye ilustraciones y animación decorativa que respeta la preferencia de movimiento reducido.

Historial con búsqueda, favoritos, editar y repetir; guardado local y proyectos JSON versión 1 con entradas exactas. Se verificó cerrar/reabrir en Chromium, Windows desde Python y EXE, y Android offline. Los archivos importados se validan y los resultados se recalculan con Python.

[Menú y recorridos](docs/fase06/experiencia.md) · [Proyectos y soporte por plataforma](docs/fase06/proyectos.md) · [Pruebas](docs/fase06/verificacion.md) · [Cierre y descargas 0.6.0](docs/fase06/cierre.md)

## Cobertura de fase 05

[Catálogo de métodos y herramientas](docs/fase05/cobertura.md) · [Precisión, criterios y límites](docs/fase05/contrato.md) · [Pruebas](docs/fase05/verificacion.md) · [Cierre de fase 05](docs/fase05/cierre.md)

## Cobertura de fase 04

[Catálogo de las 44 operaciones](docs/fase04/cobertura.md) · [Entradas y convenciones](docs/fase04/contrato.md) · [Arquitectura](docs/fase04/arquitectura.md) · [Verificación](docs/fase04/verificacion.md) · [Cierre de fase 04](docs/fase04/cierre.md)

## Capacidades actuales

- Sistemas por Gauss y Gauss-Jordan, clasificación, solución general y comprobación.
- Bisección, falsa posición, Newton y secante con tablas, criterios y motivos de parada.
- Jacobi y Gauss-Seidel con residuales, normas y advertencias de convergencia.
- Errores, conversión entre bases y conjuntos finitos; primitivas e integración con precisión editable.
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
| docs/fase08 | Instalación, offline, firma, compatibilidad y evidencias de distribución |
| docs/fase07 | Escenas, teoría, aplicaciones, documentos y banco importable |
| docs/fase06 | Menú, modos, accesibilidad, proyectos y evidencias de continuidad |
| docs/fase05 | Métodos numéricos, precisión, cobertura y evidencias |
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
python -m tests.auditoria_fase05
python -m tests.auditoria_fase07
python .github/scripts/generar_catalogo.py --check
```

SymPy se usa como referencia independiente en pruebas. Los algoritmos de producción conservan sus implementaciones explícitas en Python.

El workflow de plataformas compara 136 contratos completos y la integridad de los 48 archivos Python entre destinos. Ejecuta pruebas de cancelación y recuperación, los 56 formularios en ambos modos, formularios nativos y el APK offline. Además exige 54 comprobaciones del formato/validación y puentes nativos, 19 recorridos de experiencia, siete análisis axe sin violaciones en las escenas probadas y reapertura de proyectos en los tres destinos. La fase 07 añade 23 comprobaciones de conversión/exportación, 11 recorridos nuevos, cinco escenas axe y 8083 comprobaciones geométricas independientes. La fase 08 añade diez pruebas SQLite y nueve recorridos de distribución web. La batería Python suma 170 pruebas unittest; la interfaz anterior conserva 11 recorridos.

El workflow de verificación ejecuta los casos originales, las regresiones nuevas, 288 sistemas independientes, una auditoría adicional de 2376 solicitudes con 12633 comprobaciones, 339 solicitudes nuevas con 6473 comprobaciones numéricas y recorridos gráficos en Chromium. Los informes y capturas se conservan como nexolineal-evidencias en Actions.

## Historial y autoría

La rama fase-01-base conserva el trabajo recibido. La fase 02 retira los lanzadores BAT y la entrada de terminal, incorpora el núcleo y documenta los cambios de API en docs/fase02.

Autores del material original — Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez, Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre. Las atribuciones originales permanecen en el historial y en los módulos reutilizados.

### Rediseño 01 · Menú y Sistemas

La tarjeta **Resolver** abre una matriz aumentada con análisis completo. Podés pegar filas de una hoja de cálculo, elegir las salidas y consultar las lecturas del curso en **Cómo interpretar un sistema lineal**.

La guía de diseño [Scroll Craft](https://github.com/nateherkai/scroll-craft) de Nate Herk se incluye como submódulo fijado a una revisión, con su licencia MIT. Para usar la skill del proyecto, ejecutá `git submodule update --init tools/scroll-craft`. El vínculo en `.agents/skills/scroll-craft` apunta a la guía original. La aplicación funciona independientemente del submódulo.
