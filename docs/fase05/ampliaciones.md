# Ampliaciones pendientes

No se declaran implementadas al cerrar B27–B34. Requieren especificación y bloques adicionales; la estimación es orientativa.

| Ampliación | Especificación y pruebas requeridas | Bloques adicionales |
| --- | --- | --- |
| Punto fijo | g(x), intervalo invariante, contracción y criterio explícitos; ejemplos convergentes y divergentes | 1 |
| SOR | Incorporado en la revisión del Explorador. En Sistemas → Gauss-Seidel → Opciones de iteración se admite 0 < ω < 2. Con ω = 1 se recupera Gauss-Seidel. La cota utiliza la norma de la matriz de iteración efectiva. | Implementado |
| Falsa posición modificada | Elegir Illinois/Pegasus, registrar reescalados y contrastar estancamiento con la versión clásica | 1 |
| Raíces múltiples | Multiplicidad proporcionada o inferida con límites; Newton modificado, casos cercanos y condicionamiento | 1 |
| Bairstow | Coeficientes, factores cuadráticos, raíces complejas, deflación y residuales reconstruidos | 2 |
| Integración adicional | Trapecios, Gauss u otras reglas con hipótesis y cotas propias; singularidades y oscilaciones | 2 |
| Interpolación | Nodos distintos, polinomio/forma elegida, errores y estabilidad; reconstrucción de datos | 2 |
| Ajuste | Modelo, criterio de mínimos cuadrados, rango y residuales; evitar equiparar ajuste con interpolación | 2 |

También permanecen las ampliaciones de álgebra lineal de docs/fase04/ampliaciones.md. No se borran ni se cuentan como completadas. La fase 06 del plan aborda menú, experiencia e historial, después del cierre de esta fase.
