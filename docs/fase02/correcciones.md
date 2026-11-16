# Exactitud y dominio

## Fracciones y representación

La conversión de números usa Fraction a partir del texto. Los literales decimales de expresiones conservan el segmento original del AST. El cálculo racional 0.1+0.2 produce 3/10. Los resultados de funciones trascendentales declaran su aproximación.

El formateador usa BigInt para consultar signo, cero y unidad. Conserva numerador y denominador en la fórmula. Ans conserva el texto del resultado. La exportación JSON utiliza directamente el contrato Python.

## Integrales

La integral polinómica con extremos racionales se evalúa con Fraction. x² en [-1,1] produce 2/3. La evaluación de una primitiva trascendental y Simpson adaptativo declaran aproximación de 53 bits. Simpson registra tolerancia absoluta 1e-8 y comunica falta de convergencia.

Antes de integrar se examina toda la expresión, incluidos denominadores dentro de sumas, productos y potencias. Se calculan cotas por intervalos y se subdivide cuando la dependencia algebraica impide decidir. Los polos desplazados y los de potencias y tangentes se incluyen en las regresiones.

El método exige verificar un dominio real continuo sobre el intervalo cerrado. Si las cotas no permiten establecerlo tras el presupuesto de subdivisión, devuelve un error explícito de dominio no verificado. Una integral impropia convergente requiere otro método. El diagnóstico conserva esa distinción y evita presentar muestras finitas como una demostración de continuidad.

## Verificación

El workflow instala el paquete, ejecuta las regresiones y contrasta 288 sistemas con SymPy usado exclusivamente como referencia de pruebas. También compara sobres de producto correcto, dimensiones incompatibles y error de dominio entre Python nativo y Pyodide.

El recorrido gráfico conserva las pruebas de sistemas y aritmética, y agrega Ans racional, integral exacta, singularidades compuestas, fracción grande visible y exportación JSON. Los resultados efectivos y sus enlaces se registran en el cierre de la fase.
