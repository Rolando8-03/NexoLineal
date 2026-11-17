# Contrato numérico 1.0 — Versión 0.5.0

Se conservan las 44 operaciones anteriores y se incorporan 12: el catálogo compartido ofrece **56 operaciones**. Web, Windows y Android usan el mismo núcleo; Serio y Explorador comparten solicitudes, resultados y procedimientos. Las dimensiones se infieren de los datos y los parámetros numéricos predeterminados se muestran y pueden editarse.

## Funciones seguras

El parser admite hasta 350 caracteres y profundidad 45: números, x, pi, e, +, −, *, /, potencias y las funciones sin, cos, tan, asin, acos, atan, sqrt, ln, log, exp, abs y factorial con un argumento. La trigonometría usa radianes. Las funciones numéricas no admiten Ans: se escribe su valor. Se rechazan imports, atributos, llamadas externas, comprensiones, cadenas, booleanos y funciones no permitidas. No se usa eval ni exec.

Las expresiones se analizan una vez y se evalúa su AST validado. Los fallos de dominio, división, rango o subdesbordamiento se comunican explícitamente. Para intervalos cerrados se usa la validación conservadora del dominio ya existente. Si no puede verificarlo, el método rechaza la operación; esto no demuestra que la función sea discontinua. Los polinomios admitidos tienen continuidad conocida sin muestreo. La aritmética de intervalos para otras funciones usa flotantes y **no es una certificación mediante intervalos con redondeo dirigido**.

## Raíces

```json
{"schema_version":"1.0","operation_id":"raices.biseccion","input":{"expresion":"x^2-2","inferior":"1","superior":"2","tolerancia_x":"1e-8","tolerancia_f":"1e-8","max_iteraciones":"100","criterio":"cota"}}
```

| Método | Datos mínimos | Predeterminados y parada |
| --- | --- | --- |
| Bisección | Función y extremos a<b con cambio de signo, o raíz en extremo | tol_x=tol_f=1e-8, 100 iteraciones; criterio cota, residual o ambos |
| Falsa posición clásica | Función y extremos válidos | Mismas tolerancias y máximo; residual_y_paso o residual |
| Newton | Función y semilla | Derivada simbólica admitida por defecto; se puede proporcionar f′ explícitamente. Residual_y_paso o residual |
| Secante | Función y dos semillas distintas | Mismas tolerancias y máximo; residual_y_paso o residual |

Los máximos de iteraciones son enteros entre 1 y 200. Las tolerancias van de 1e-24 a 1. Con trigonometría o pi/e, se requiere tolerancia de al menos 1e-12. El criterio residual_y_paso exige simultáneamente |f(x)|≤tol_f y |x−x_anterior|≤tol_x. Un residual pequeño no se llama error verdadero.

Bisección conserva extremos y puntos medios racionales. Falsa posición utiliza un punto redondeado a 40 cifras de trabajo y vuelve a verificar su posición interior. Las evaluaciones de polinomios racionales son exactas para estos dos métodos: el cambio de signo conserva una raíz. La cota es (b−a)/2 en bisección, o max(x−a,b−x) en falsa posición, calculada para el punto efectivamente devuelto. En otras funciones se muestra la cota teórica de intervalo con advertencia y cota_garantizada=null.

Newton y secante usan Decimal con 40 cifras de trabajo. Una derivada proporcionada por el usuario se utiliza como dato y lleva advertencia: no se afirma haber demostrado su equivalencia con f′. No se estiman derivadas por diferencias finitas de forma oculta.

Cada resultado conserva la aproximación utilizada, su residual, la tabla y el motivo de parada. El decimal principal se redondea a 14 cifras significativas; cuando existe cota certificada, cota_decimal añade el error exacto de ese redondeo. El valor utilizado por el algoritmo también se conserva. Un residual cero calculado con aritmética aproximada no se describe como demostración de raíz exacta.

## Jacobi y Gauss-Seidel

Requieren A cuadrada racional con diagonal no nula y b compatible. El vector inicial se infiere como cero si no se proporciona. No se permutan filas automáticamente. Son editables las normas infinito, uno y dos; atol=rtol=1e-8 y máximo 100 por defecto.

Se exige simultáneamente:

- norma(x_n−x_anterior) ≤ atol + rtol·norma(x_n).
- norma(Ax_n−b) ≤ atol + rtol·norma(b), con A y b originales.

La norma dos se aproxima con Decimal. Los iterados racionales, los residuos y las otras dos normas conservan exactitud. La ausencia de dominancia estricta es una advertencia y **no se convierte en un diagnóstico automático de divergencia**. Si la norma infinito q de la matriz de iteración exacta es <1, se informa la cota q/(1−q)·norma_infinito(x_n−x_anterior), válida en norma infinito aunque el criterio elegido use otra norma. Si q≥1, esa cota queda ausente; el método puede converger.

Una solución de referencia es opcional. Antes de llamarla referencia de error verdadero se comprueba Ax_ref=b exactamente. Sin ella el error verdadero queda null.

## Estados de terminación

| Estado | Significado |
| --- | --- |
| ok | Se satisfizo el criterio declarado o se identificó una raíz/solución inicial admitida |
| iteration_limit | Se agotaron iteraciones o subintervalos configurados; conserva tabla y último resultado |
| stagnated | El redondeo no permite un nuevo punto o se repite el iterado sin residual suficiente |
| cycle_detected | Se detectó repetición en la ventana de ocho iterados; no es prueba general de divergencia |
| breakdown | Derivada o denominador requerido nulo; no se realiza la división |
| domain_error | Evaluación fuera del dominio/rango, subdesbordamiento o intervalo no verificable |
| invalid_input | Datos, sintaxis, dimensiones o parámetros inválidos |
| limit_reached | Se alcanzó el presupuesto de recursos del núcleo |
| cancelled | Cancelación comprobada; no se publica un resultado parcial como concluido |

Los estados nuevos se añaden al esquema 1.0. Los clientes que enumeren estados deben incorporar iteration_limit, stagnated, cycle_detected y breakdown. Los adaptadores de la aplicación ya los conservan. verification.passed comprueba consistencia del sobre, la tabla y el resultado; no significa necesariamente convergencia.

## Errores, conversiones y conjuntos

Errores: absoluto respecto de referencia |a−r|, relativo |a−r|/|r| y porcentual 100 veces el relativo. Cambio aproximado: |a−anterior| y, para el relativo, denominador |a|. Si falta referencia/anterior no se inventa una medida. Con denominador cero, relativo y porcentual quedan null y se explica el motivo. Un valor de referencia proporcionado no se presenta como una constante matemática certificada.

Bases: origen/destino 2,8,10 o 16; numeral de hasta 256 caracteres; precisión fraccionaria entre 1 y 64, predeterminada 16. Se admiten signo, parte fraccionaria finita y período entre paréntesis: 0.(3). La conversión usa Fraction, divisiones y multiplicaciones posicionales. Si termina o detecta un período dentro del límite, es exacta; de otro modo trunca hacia cero, declara aproximación y comprueba error<base_destino^(-precision). Se conserva el valor racional, desarrollo posicional, aporte periódico, signo y reconstrucción inversa.

Conjuntos: hasta 100 etiquetas de texto de 100 caracteres por conjunto. Una etiqueta por línea; [] indica vacío y se eliminan duplicados. No se interpreta una etiqueta numérica como número. Unión, intersección, diferencia A−B, diferencia simétrica, complemento y producto cartesiano (máximo 2500 pares). El complemento requiere universo explícito que contenga los conjuntos proporcionados. También se informan inclusión, igualdad y disjunción.

## Cálculo

Se conserva la calculadora elemental, derivación y definida existentes. La corrección de derivación de potencias constantes incluye exponentes negativos. Las primitivas conservan pi y otros factores simbólicos; no sustituyen una constante simbólica por una aproximación decimal oculta.

Primitivas: polinomios racionales hasta grado 30, sumas/restas y múltiplos constantes, sin/cos/exp con argumento afín y 1/x. Se añade C y se indica validez en cada intervalo conectado del dominio original. No es un integrador simbólico general.

La nueva integral numérica usa Simpson compuesto con refinamiento, tolerancia absoluta predeterminada 1e-8 y máximo 1024 subintervalos. El máximo es una potencia de dos entre 4 y 4096; tolerancia entre 1e-20 y 1. Para polinomios racionales se obtiene una cota de la cuarta derivada por coeficientes y extremos, y la cota |b−a|^5 M4/(180n^4) se comprueba con aritmética exacta. Para otras funciones |S_2n−S_n|/15 es una estimación **no garantizada**, declarada así, que puede ser poco fiable en funciones oscilatorias. El integrador adaptativo anterior continúa disponible en calculo.definida.

## Precisión y recursos

40 cifras es precisión decimal de trabajo, no una promesa de 40 cifras correctas. Las evaluaciones Decimal rechazan magnitudes mayores de 1e100; las potencias conservan los límites de exponente absoluto 100 y base absoluta 1e7 del evaluador. Los polinomios racionales exactos mantienen sus presupuestos de tamaño y representación. Trigonometría y pi/e utilizan unas 15 cifras binarias convertidas a decimal. Los resultados numéricos se etiquetan como aproximados; las magnitudes se transportan como texto. Se conservan límites de 20 componentes por matriz/vector en la capa nueva, 12000 bits por racional, 1200 pasos y 250000 unidades registradas por contexto. Un tamaño admitido puede alcanzar otro presupuesto. include_steps=false elimina Step, pero mantiene la tabla matemática requerida por estos métodos.
