# Casos de prueba obligatorios

Use el selector **Caso de prueba** de la aplicación y capture principalmente la
pestaña **Resultado**. Puede tomar una captura adicional de **Procedimiento por
filas** si el docente solicita evidencia de las operaciones.

## Caso 1 · Sistema con solución única

\[
\begin{aligned}
2x_1+x_2-x_3&=8\\
-3x_1-x_2+2x_3&=-11\\
-2x_1+x_2+2x_3&=-3
\end{aligned}
\]

Resultado esperado:

\[
(x_1,x_2,x_3)=(2,3,-1)
\]

Clasificación: **Sistema Consistente Determinado: Solución Única**.

## Caso 2 · Sistema con infinitas soluciones

\[
\begin{aligned}
x_1+x_2+x_3&=3\\
2x_1+2x_2+2x_3&=6\\
x_1-x_2+x_3&=1
\end{aligned}
\]

Resultado esperado, tomando \(x_3=t_1\):

\[
x_1=2-t_1,\qquad x_2=1,\qquad x_3=t_1,\qquad t_1\in\mathbb{R}
\]

Clasificación: **Sistema Consistente Indeterminado: Infinitas Soluciones**.

## Caso 3 · Sistema inconsistente

\[
\begin{aligned}
x_1+x_2+x_3&=3\\
2x_1+2x_2+2x_3&=7\\
x_1-x_2+x_3&=1
\end{aligned}
\]

La segunda ecuación tiene el mismo lado izquierdo que el doble de la primera,
pero exigiría simultáneamente \(6=7\). Durante la eliminación aparece una fila
del tipo:

\[
[\,0\quad0\quad0\mid1\,]
\]

Clasificación: **Sistema Inconsistente: Sin Solución**.

