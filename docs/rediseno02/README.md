# Revisión de la calculadora

El modo Serio abre el ejercicio activo. El Explorador abre la portada. Ambos comparten los datos, las operaciones y el motor Python.

## Ejercicios de referencia

| Ejercicio | Resultado comprobado |
| --- | --- |
| Ejemplo de cuatro incógnitas de la guía de Jacobi y Gauss-Seidel, con vector inicial cero | A la precisión mostrada, ambos llegan a (1, 2, −1, 1). Con tolerancias absoluta y relativa de 10⁻⁸ en norma infinito, Jacobi requiere 22 iteraciones y Gauss-Seidel 10. |
| Consulta simultánea de rango y transpuesta para [[1,2],[3,4]] | Rango 2 y transpuesta [[1,3],[2,4]]. |
| Determinante e inversa para [[1,2],[2,4]] | Determinante 0. La respuesta explica por qué no existe la inversa. |
| Relajación para el sistema 4x + y = 1, 2x + 3y = 2 | Con ω=1 el recorrido coincide con Gauss-Seidel. Con ω=1.2 y vector inicial cero, la primera iteración da (3/10,14/25). |

El ejemplo iterativo corresponde a *Ejemplos paso a paso Jacobi y Gauss-Seidel* del material G1. El cambio relativo máximo por componente corresponde al tema de las sesiones 20 y 21 de G4. Al elegir el criterio porcentual se exige además que el residual cumpla la tolerancia. La tabla muestra el error verdadero cuando la referencia satisface el sistema.

## Catálogo compartido

El banco existente especifica el estado esperado para cada ejercicio. Las entradas están en [los casos reproducibles](../../tests/fixtures/fase05_defaults.json). La última columna se obtuvo ejecutando el motor. La comprobación visual de esta revisión se concentró en Sistemas y Matrices.

| Identificador | Acceso desde la calculadora | Estado esperado | Estado obtenido |
| --- | --- | --- | --- |
| `matrices.producto` | Matrices → Producto de matrices | ok | ok |
| `sistemas.resolver` | Sistemas → Resolver y clasificar un sistema | ok | ok |
| `sistemas.cramer` | Sistemas → Resolver por Cramer | ok | ok |
| `sistemas.inversa` | Sistemas → Resolver usando la inversa | ok | ok |
| `factorizacion.lu` | Sistemas → LU sin permutaciones | ok | ok |
| `factorizacion.plu` | Sistemas → PLU con pivoteo | ok | ok |
| `matrices.suma` | Matrices → Sumar matrices | ok | ok |
| `matrices.resta` | Matrices → Restar matrices | ok | ok |
| `matrices.escalar` | Matrices → Multiplicar por un escalar | ok | ok |
| `matrices.transpuesta` | Matrices → Transponer | ok | ok |
| `matrices.analizar` | Matrices → Analizar una matriz | ok | ok |
| `matrices.ref` | Matrices → Forma escalonada REF | ok | ok |
| `matrices.rref` | Matrices → Forma escalonada reducida RREF | ok | ok |
| `matrices.traza` | Matrices → Calcular la traza | ok | ok |
| `matrices.potencia` | Matrices → Potencia entera de una matriz | ok | ok |
| `matrices.elemental` | Matrices → Operación por filas o columnas | ok | ok |
| `matrices.propiedades` | Matrices → Comprobar propiedades matriciales | ok | ok |
| `matrices.particionar` | Matrices → Particionar en bloques | ok | ok |
| `matrices.suma_bloques` | Matrices → Suma por bloques | ok | ok |
| `matrices.producto_bloques` | Matrices → Producto por bloques | ok | ok |
| `determinantes.calcular` | Determinantes e inversas → Calcular un determinante | ok | ok |
| `determinantes.cofactores` | Determinantes e inversas → Cofactores y adjugata | ok | ok |
| `matrices.inversa` | Determinantes e inversas → Calcular la inversa | ok | ok |
| `vectores.suma` | Vectores y espacios → Sumar vectores | ok | ok |
| `vectores.resta` | Vectores y espacios → Restar vectores | ok | ok |
| `vectores.producto_punto` | Vectores y espacios → Producto punto | ok | ok |
| `vectores.producto_cruz` | Vectores y espacios → Producto cruz en R³ | ok | ok |
| `vectores.escalar` | Vectores y espacios → Escalar un vector | ok | ok |
| `vectores.norma` | Vectores y espacios → Norma exacta de un vector | ok | ok |
| `vectores.analizar` | Vectores y espacios → Independencia y generado | ok | ok |
| `vectores.generado` | Vectores y espacios → Pertenencia a un generado | ok | ok |
| `espacios.fundamentales` | Vectores y espacios → Espacios columna, fila y núcleo | ok | ok |
| `espacios.base` | Vectores y espacios → Verificar una base | ok | ok |
| `espacios.suma` | Vectores y espacios → Suma de subespacios | ok | ok |
| `espacios.interseccion` | Vectores y espacios → Intersección de subespacios | ok | ok |
| `espacios.coordenadas` | Vectores y espacios → Coordenadas en una base | ok | ok |
| `espacios.cambio_base` | Vectores y espacios → Cambio de base | ok | ok |
| `transformaciones.analizar` | Transformaciones → Analizar una transformación lineal | ok | ok |
| `transformaciones.desde_imagenes` | Transformaciones → Matriz desde imágenes de una base | ok | ok |
| `transformaciones.componer` | Transformaciones → Componer transformaciones | ok | ok |
| `transformaciones.representar` | Transformaciones → Representación en bases | ok | ok |
| `calculadora.evaluar` | Calculadora → Evaluar una expresión | ok | ok |
| `calculo.definida` | Cálculo → Integral definida | ok | ok |
| `calculo.derivar` | Cálculo → Derivada | ok | ok |
| `funciones.evaluar` | Métodos numéricos → Evaluar una función y su dominio | ok | ok |
| `raices.biseccion` | Métodos numéricos → Bisección | ok | ok |
| `raices.falsa_posicion` | Métodos numéricos → Falsa posición | ok | ok |
| `raices.newton` | Métodos numéricos → Newton | ok | ok |
| `raices.secante` | Métodos numéricos → Secante | ok | ok |
| `iterativos.jacobi` | Sistemas → Jacobi | ok | ok |
| `iterativos.gauss_seidel` | Sistemas → Gauss-Seidel | ok | ok |
| `errores.calcular` | Herramientas → Errores absoluto, relativo y porcentual | ok | ok |
| `conversiones.bases` | Herramientas → Conversión de bases 2, 8, 10 y 16 | ok | ok |
| `conjuntos.operar` | Herramientas → Conjuntos finitos | ok | ok |
| `calculo.primitiva` | Cálculo → Primitiva de reglas admitidas | ok | ok |
| `calculo.numerica` | Cálculo → Integral numérica con precisión editable | ok | ok |
| `vectores.proyeccion` | Vectores y espacios → Proyección ortogonal | ok | ok |
