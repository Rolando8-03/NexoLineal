# UNIVERSIDAD AMERICANA

**Facultad de Ingeniería y Arquitectura**  
**Asignatura:** Álgebra Lineal (MTM0120)  
**Trabajo:** Programa 1 — Solución de sistemas por eliminación por filas

**Docente:** [Nombre completo del docente]  
**Integrantes:** [Nombres completos]  
**Carrera:** [Nombre de la carrera]  
**Grupo:** [Número o código del grupo]  
**Fecha:** [Fecha de entrega]

---

## Explicación del algoritmo

El programa resuelve un sistema lineal escrito como \(Ax=b\). Primero recibe el
número de ecuaciones \(m\), el número de variables \(n\), los coeficientes de la
matriz \(A\) y los términos independientes del vector \(b\). Con estos datos
construye manualmente la matriz aumentada:

\[
[A\mid b]
\]

La matriz se representa mediante listas anidadas de Python. Cada lista interna
corresponde a una fila y la última posición contiene el término independiente.
No se utilizan NumPy, SciPy ni funciones externas de álgebra lineal.

La eliminación comienza en la primera columna. Para cada pivote, el programa
busca en la misma columna la fila disponible cuyo valor absoluto sea mayor. Si
esa fila no es la actual, aplica el intercambio elemental
\(F_i\leftrightarrow F_j\). Este pivoteo parcial evita dividir entre cero y
reduce el efecto de errores de redondeo.

Después crea ceros debajo del pivote. Para una fila \(F_i\), calcula:

\[
k=\frac{a_{ic}}{a_{pc}}
\]

donde \(a_{pc}\) es el pivote de la columna \(c\). Luego aplica la operación:

\[
F_i\leftarrow F_i-kF_p
\]

La actualización se ejecuta coeficiente por coeficiente con un bucle. Después
de cada intercambio o eliminación, el programa guarda una copia de la matriz
para mostrar el procedimiento completo en la interfaz.

Cuando la matriz está en forma escalonada, se calculan manualmente
\(\operatorname{rango}(A)\) y \(\operatorname{rango}([A\mid b])\), contando las
filas no nulas correspondientes. La clasificación se basa en el criterio de
Rouché-Frobenius:

- Si \(\operatorname{rango}(A)=\operatorname{rango}([A\mid b])=n\), el sistema
  es consistente determinado y tiene solución única.
- Si \(\operatorname{rango}(A)=\operatorname{rango}([A\mid b])<n\), el sistema
  es consistente indeterminado y tiene infinitas soluciones.
- Si \(\operatorname{rango}(A)<\operatorname{rango}([A\mid b])\), aparece una
  contradicción \([0\;0\;\cdots\;0\mid k]\), con \(k\neq0\), y el sistema no
  tiene solución.

En el caso de solución única se aplica sustitución regresiva desde la última
fila con pivote. Si existen infinitas soluciones, el programa continúa hasta la
forma escalonada reducida, identifica las columnas sin pivote como variables
libres y construye la solución paramétrica. Finalmente, cuando existe una
solución, sustituye sus valores en cada ecuación original y compara el lado
izquierdo con el término independiente.

## Reflexión sobre el uso de inteligencia artificial

Se utilizó una herramienta de inteligencia artificial como apoyo para organizar
la estructura inicial del proyecto, revisar casos límite y mejorar la claridad
de la interfaz y los comentarios. Su respuesta no se tomó como válida de forma
automática. El algoritmo se contrastó con el procedimiento de eliminación por
filas estudiado en clase y se verificó que todas las operaciones matriciales
fueran ejecutadas manualmente con listas, bucles, condicionales y funciones.

Para comprobar la validez se prepararon pruebas automáticas con sistemas de
solución única, infinitas soluciones, sistemas inconsistentes y un sistema
rectangular. También se confirmó por sustitución que los resultados obtenidos
cumplen las ecuaciones originales. La propuesta se modificó para eliminar
dependencias externas, incorporar pivoteo parcial, mostrar cada operación
elemental y explicar explícitamente el criterio de clasificación. La revisión,
comprensión y defensa final del código permanecen bajo responsabilidad de los
integrantes del grupo.

## Casos de prueba y capturas

### Caso 1 — Solución única

Inserte aquí una captura de la pestaña **Resultado** después de cargar el ejemplo
**Solución única**. Deben observarse la clasificación, los valores
\((x_1,x_2,x_3)=(2,3,-1)\) y la comprobación de las tres ecuaciones.

### Caso 2 — Infinitas soluciones

Inserte aquí una captura del ejemplo **Infinitas soluciones**. Debe observarse
la variable libre \(x_3\), la solución paramétrica y una solución particular
verificada.

### Caso 3 — Sistema inconsistente

Inserte aquí una captura del ejemplo **Sistema sin solución**. Deben observarse
la clasificación y la fila contradictoria del tipo
\([0\;0\;0\mid k]\), con \(k\neq0\).

