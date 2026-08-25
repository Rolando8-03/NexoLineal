# Guía breve para la defensa individual

## 1. ¿Qué representa la matriz aumentada?

Une la matriz de coeficientes \(A\) y el vector independiente \(b\) en una sola
estructura \([A\mid b]\). Cada fila representa una ecuación completa.

## 2. ¿Qué es un pivote?

Es el primer coeficiente no nulo utilizado como referencia para eliminar los
valores que están debajo de él en la misma columna.

## 3. ¿Por qué se intercambian filas?

Si el pivote disponible es cero, no se puede dividir entre él. El programa busca
la fila con el mayor valor absoluto en esa columna y aplica
\(F_i\leftrightarrow F_j\). Esto también mejora la estabilidad numérica.

## 4. ¿Cómo se crea un cero debajo del pivote?

Se calcula \(k=a_{ic}/a_{pc}\) y se ejecuta
\(F_i\leftarrow F_i-kF_p\). En el código, un bucle actualiza cada elemento de la
fila.

## 5. ¿Cómo se reconoce una solución única?

El sistema es compatible y cada variable tiene columna pivote:

\[
\operatorname{rango}(A)=\operatorname{rango}([A\mid b])=n
\]

## 6. ¿Cómo se reconocen infinitas soluciones?

No hay contradicción, pero faltan pivotes para algunas variables:

\[
\operatorname{rango}(A)=\operatorname{rango}([A\mid b])<n
\]

Las columnas sin pivote corresponden a variables libres, que se expresan con
parámetros \(t_1,t_2,\ldots\).

## 7. ¿Cómo se reconoce un sistema inconsistente?

Aparece una fila \([0\;0\;\cdots\;0\mid k]\), con \(k\neq0\), equivalente a la
igualdad imposible \(0=k\). Por eso
\(\operatorname{rango}(A)<\operatorname{rango}([A\mid b])\).

## 8. ¿Cómo se verifica la solución?

El programa conserva una copia del sistema original. Multiplica cada
coeficiente \(a_{ij}\) por su valor \(x_j\), suma los productos y compara el
resultado con \(b_i\).

## 9. ¿Dónde se cumplen las restricciones?

El archivo `algebra_lineal.py` contiene los cálculos. La matriz es una lista de
listas y las operaciones se realizan con `for`, `if`, asignaciones y funciones.
No se importan NumPy, SciPy ni módulos de álgebra lineal.

## 10. ¿Por qué el programa está dividido en archivos?

Para separar responsabilidades: `algebra_lineal.py` calcula,
`formato_matematico.py` presenta ecuaciones y matrices, `interfaz.py` controla
la ventana, y `Programa 1_GrupoX.py` inicia la aplicación. Esta división facilita
la lectura y las pruebas sin cambiar el algoritmo.

