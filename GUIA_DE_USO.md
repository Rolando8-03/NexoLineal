# Casos para probar y explicar el programa

En **Matrices → Determinantes e inversas**, elige una operación, ingresa A (y B si corresponde) y pulsa **Realizar operación**. **Cargar ejemplo** coloca datos adecuados al método. Cambiar filas o columnas reconstruye la cuadrícula automáticamente y conserva las celdas compatibles.

## Casos de la guía del Programa 5

| Prueba | Entrada | Resultado esperado |
|---|---|---|
| Suma | A=[[1,2],[3,4]], B=[[0,1],[1,1]] | [[1,3],[4,5]] |
| Resta | Las mismas A y B | [[1,1],[2,3]] |
| Escalar | A=[[1,2],[3,4]], k=3 | [[3,6],[9,12]] |
| Producto | A=[[1,2,3],[4,5,6]], B=[[1,0],[2,1],[0,3]] | [[5,11],[14,23]] |
| Producto incompatible | A y B de 2×3 | Mensaje: columnas de A [3] ≠ filas de B [2] |
| Transpuesta | A=[[1,2,3],[4,5,6]] | [[1,4],[2,5],[3,6]] |
| Determinante | A=[[1,2,3],[0,1,4],[5,6,0]] | 1 por cofactores, reducción y Sarrus |
| Inversa, ambos métodos | La misma A de 3×3 | [[-24,18,5],[20,-15,-4],[-5,4,1]] |
| Adjunta | A=[[1,2],[3,4]] | [[4,-2],[-3,1]] |
| Inversa con fracciones | A=[[1,2],[3,4]] | [[-2,1],[3/2,-1/2]] |
| Singular | A=[[1,2,3],[4,5,6],[7,8,9]] | det=0, dos pivotes, sin inversa |
| Propiedades | A=[[1,2],[3,4]], B=[[0,1],[1,1]], i=1, j=2, k=3 | Se cumplen; intercambio det=2, reemplazo det=-2, escala det=-6 |

Para reproducir específicamente **F2 ← F2 − 3F1**, elige i=2, j=1 y k=-3. El intercambio y el escalamiento también usarán esas filas y ese mismo k, tal como se indica en cada resultado.

La propiedad 6 compara el producto diagonal corregido con cofactores. En esta implementación los reemplazos conservan el determinante, los intercambios cambian el signo y no hay escalamiento durante la reducción (factor 1).

## LU, Cramer y solución por inversa

Usa A=[[3,-7,-2],[-3,5,1],[6,-4,0]], b=[-7,5,2].

- LU obtiene L=[[1,0,0],[-1,1,0],[2,-5,1]] y U=[[3,-7,-2],[0,-2,-1],[0,0,-1]].
- Primero Ly=b da y=[-7,-2,6]. Después Ux=y da x=[3,4,-6].
- Cramer y x=A⁻¹b producen la misma solución. La comprobación devuelve Ax=[-7,5,2].
- En LU puedes dejar b vacío para factorizar una matriz rectangular, sin intentar resolver un sistema.

## Sistemas y vectores

- Solución única: A=[[1,1],[1,-1]], b=[3,1] → x=[2,1].
- Infinitas: A=[[1,1],[2,2]], b=[3,6] → x1=3−t, x2=t.
- Inconsistente: misma A y b=[3,7] → contradicción 0=1.
- L.I.: vectores (1,0) y (0,1). L.D.: (1,2) y (2,4).
- Combinación lineal: (3,5)=3(1,0)+5(0,1). En Sistemas ingresa los generadores como columnas de A y el objetivo como b.

## Aplicaciones del material

El modelo se plantea antes de introducir A y b. La calculadora resuelve las ecuaciones, pero no deduce un modelo a partir de un enunciado.

**Economía (ejemplo de agricultura, minería y manufactura de la presentación):** la tabla de intercambio por columnas es C=[[0.65,0.20,0.20],[0.05,0.10,0.30],[0.30,0.70,0.50]]. Los precios de equilibrio satisfacen Cp=p. Ingresa A=C−I y b=0. Una proporción de precios es p=(16,5,23), pues Cp=p. Los múltiplos positivos conservan el equilibrio.

**Balance químico:** para Al2O3 + C → Al + CO2, llama x1,x2,x3,x4 a los coeficientes. Aluminio: 2x1−x3=0; oxígeno: 3x1−2x4=0; carbono: x2−x4=0. Ingresa esas tres filas y b=0. Una solución entera positiva es (2,3,4,3). No se acepta el vector cero como balance químico útil aunque sea solución del sistema homogéneo.

**Flujo de redes:** cada fila expresa entradas−salidas=flujo externo. Las variables libres producen una familia de flujos; después se imponen las condiciones de no negatividad y los sentidos de las calles del enunciado.

**Dieta:** cada columna representa nutrientes por porción de un alimento y b el objetivo nutricional. Una solución con cantidades negativas no representa una dieta realizable; hay que interpretar el resultado después de resolverlo.

## Dónde defender cada algoritmo

- `python/metodos_eliminacion.py`: Gauss, Gauss-Jordan y sustitución regresiva.
- `python/analisis_sistema.py`: rangos, clasificación, solución y comprobación.
- `python/vectores.py` y `python/relaciones_vectoriales.py`: propiedades, combinación y L.I./L.D.
- `python/operaciones_matrices.py`: operaciones y propiedades de la interfaz previa.
- `modulos/modulo_matrices.py`: producto, cofactores, Sarrus, reducción triangular, Gauss-Jordan para inversa, adjunta y verificador.
- `modulos/factorizacion.py`: Cramer, LU y resolución de sistemas.
- `modulos/consola.py`: solicita datos y muestra resultados. Los cálculos no dependen de esta interfaz.
- `teoremas/resumen_teoremas.py`: propiedades teóricas que aparecen en pantalla.

Fuentes de requisitos: guías Programa 1, 2, 3, 4 y 5 y presentaciones S1–S8 de la carpeta de Álgebra Lineal facilitada por el estudiante. Los algoritmos nuevos son implementaciones propias en Python estándar de esos métodos.


### Ejemplos de clase de las Sesiones 11 y 12

Abre Matrices → Determinantes, inversa y LU. La opción 8 con Cargar ejemplo muestra A=[[1,3,-3],[2,0,1],[-1,4,-2]], det(A)=-19 y la inversa por adjunta de las diapositivas 40–42.

En la opción 11, selecciona el ejemplo de LU y pulsa Cargar ejemplo. El de 3×3 usa b=(-7,5,2) y da y=(-7,-2,6), x=(3,4,-6). El de 4×4 usa b=(-9,5,7,11) y da y=(-9,-4,5,1), x=(3,4,-6,-1). El de 4×5 no incluye b en la presentación, así que se cargan solo A, L y U. Puedes escribir un b propio de cuatro componentes para practicar la solución general.

Para los factores dados de la diapositiva 24, usa la opción 14: A representa L, B representa U. Escribe también el vector b. Para propiedades de determinantes con matrices singulares, usa la opción 13.
