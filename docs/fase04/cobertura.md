# Catálogo de cobertura

Estado: 44 operaciones disponibles (41 de álgebra lineal y tres herramientas heredadas), más la consulta administrativa del catálogo. Los 40 casos nuevos se suman a las cuatro operaciones de fase 03.

Las dimensiones se infieren de los datos. Solo se solicitan opciones propias del método elegido; los campos marcados como opcionales pueden omitirse.

| ID | Operación | Entradas | Condiciones y límites |
| --- | --- | --- | --- |
| `matrices.producto` | Producto de matrices | A, B | Columnas de A = filas de B; presupuesto preexistente. |
| `sistemas.resolver` | Resolver y clasificar un sistema | A, b, metodo (opcional) | Rectangular; Gauss o Gauss-Jordan; b tiene m componentes. |
| `sistemas.cramer` | Resolver por Cramer | A, b | A cuadrada y det(A)≠0; si no, usar Gauss para clasificar. |
| `sistemas.inversa` | Resolver usando la inversa | A, b | A cuadrada e invertible. |
| `factorizacion.lu` | LU sin permutaciones | A, b (opcional) | Sin permutación; not_applicable si hace falta intercambiar filas. |
| `factorizacion.plu` | PLU con pivoteo | A, b (opcional) | Rectangular, PA=LU; b opcional para resolver. |
| `matrices.suma` | Sumar matrices | A, B | A y B de igual tamaño. |
| `matrices.resta` | Restar matrices | A, B | A y B de igual tamaño. |
| `matrices.escalar` | Multiplicar por un escalar | A, k | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `matrices.transpuesta` | Transponer | A | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `matrices.analizar` | Analizar una matriz | A | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `matrices.ref` | Forma escalonada REF | A | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `matrices.rref` | Forma escalonada reducida RREF | A | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `matrices.traza` | Calcular la traza | A | Solo cuadradas. |
| `matrices.potencia` | Potencia entera de una matriz | A, exponente | Cuadrada, exponente entero −100…100; negativos requieren inversa. |
| `matrices.elemental` | Operación por filas o columnas | A, eje (opcional), accion (opcional), indice (opcional), otro (opcional), k (opcional) | Filas o columnas; índices API desde 0; escalar por cero no es reversible. |
| `matrices.propiedades` | Comprobar propiedades matriciales | A, B (opcional), C (opcional), k (opcional), d (opcional) | Cada identidad declara sus hipótesis; las comparaciones no generales no se llaman leyes. |
| `matrices.particionar` | Particionar en bloques | A, cortes_filas (opcional), cortes_columnas (opcional) | Cortes interiores crecientes y únicos; reconstrucción de A. |
| `matrices.suma_bloques` | Suma por bloques | A, B, cortes_filas (opcional), cortes_columnas (opcional) | Mismo tamaño y cortes compatibles. |
| `matrices.producto_bloques` | Producto por bloques | A, B, cortes_filas (opcional), cortes_internos (opcional), cortes_columnas (opcional) | Dimensiones compatibles y cortes internos comunes. |
| `determinantes.calcular` | Calcular un determinante | A, metodo (opcional), eje (opcional), indice (opcional) | Cuadrada; reducción, cofactores (n≤6) o Sarrus (n=3). |
| `determinantes.cofactores` | Cofactores y adjugata | A | Cuadrada de orden ≤6; menor 0×0 tiene determinante 1. |
| `matrices.inversa` | Calcular la inversa | A, metodo (opcional) | Cuadrada e invertible; Gauss-Jordan o adjugata (n≤6); comprobación bilateral. |
| `vectores.suma` | Sumar vectores | u, v | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `vectores.resta` | Restar vectores | u, v | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `vectores.producto_punto` | Producto punto | u, v | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `vectores.producto_cruz` | Producto cruz en R³ | u, v | Solo R³. |
| `vectores.escalar` | Escalar un vector | u, k | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `vectores.norma` | Norma exacta de un vector | u | Norma euclídea exacta; radical simbólico si procede. |
| `vectores.analizar` | Independencia y generado | vectores, dimension_ambiente (opcional) | Familias racionales finitas, incluida la vacía con dimensión inferida o explícita. |
| `vectores.generado` | Pertenencia a un generado | vectores, v, dimension_ambiente (opcional) | Devuelve pertenencia y coeficientes o certificado de incompatibilidad. |
| `espacios.fundamentales` | Espacios columna, fila y núcleo | A | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `espacios.base` | Verificar una base | vectores, objetivo (opcional), dimension_ambiente (opcional) | Independencia y generado igual al espacio objetivo declarado por generadores. |
| `espacios.suma` | Suma de subespacios | U, V, dimension_ambiente (opcional) | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `espacios.interseccion` | Intersección de subespacios | U, V, dimension_ambiente (opcional) | Dimensiones compatibles; racionales exactos; límites de la capa lineal. |
| `espacios.coordenadas` | Coordenadas en una base | base, v | Base independiente y vector en su generado; admite subespacios propios. |
| `espacios.cambio_base` | Cambio de base | base_origen, base_destino, v (opcional), dimension_ambiente (opcional) | Bases del mismo subespacio; TP=S fija orientación. |
| `transformaciones.analizar` | Analizar una transformación lineal | A, v (opcional) | T(x)=Ax; dominio R^n y codominio R^m; vector opcional. |
| `transformaciones.desde_imagenes` | Matriz desde imágenes de una base | base_dominio, imagenes | Base completa del dominio y una imagen por vector; AB=Y. |
| `transformaciones.componer` | Componer transformaciones | A, B | AB: primero B, después A. |
| `transformaciones.representar` | Representación en bases | A, base_dominio, base_codominio | Bases completas válidas del dominio y codominio; CM=AB. |
| `calculadora.evaluar` | Evaluar una expresión | expresion, ans (opcional), grados (opcional) | Conjunto de expresiones heredado; declara aproximación donde corresponda. |
| `calculo.definida` | Integral definida | expresion, inferior, superior | Reglas heredadas, dominio continuo cerrado verificado; exactitud o aproximación declarada. |
| `calculo.derivar` | Derivada | expresion, punto (opcional) | Reglas de derivación heredadas; no es un sistema simbólico general. |

## Ejemplos ejecutables

Los 44 ejemplos de tests/fixtures/fase04_defaults.json están validados contra los esquemas de entrada y salida. Los 73 contratos de tests/fixtures/platform_contracts.json añaden degeneraciones, errores de método, familias vacías, fracciones grandes y bases no estándar.

El catálogo y los esquemas se regeneran con `python .github/scripts/generar_catalogo.py`; `--check` detecta divergencias entre las definiciones, ejemplos y manifiesto.

## Ampliaciones registradas

Consultar [ampliaciones.md](ampliaciones.md). Estas ampliaciones conservan su alcance y requieren especificación y bloques adicionales; no forman parte del cierre del núcleo básico.
