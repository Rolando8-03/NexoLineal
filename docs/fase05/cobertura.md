# Cobertura y ejemplos de fase 05

12 operaciones nuevas; 56 en total. Los 56 ejemplos de tests/fixtures/fase05_defaults.json se validan contra ambos esquemas. Los 113 contratos de plataforma añaden estados y degeneraciones.

| ID | Operación | Campos (asterisco: requerido) |
| --- | --- | --- |
| `funciones.evaluar` | Evaluar una función y su dominio | expresion*, punto*, inferior, superior |
| `raices.biseccion` | Bisección | expresion*, inferior*, superior*, tolerancia_x, tolerancia_f, max_iteraciones, criterio |
| `raices.falsa_posicion` | Falsa posición | expresion*, inferior*, superior*, tolerancia_x, tolerancia_f, max_iteraciones, criterio |
| `raices.newton` | Newton | expresion*, inicial*, derivada, tolerancia_x, tolerancia_f, max_iteraciones, criterio |
| `raices.secante` | Secante | expresion*, anterior*, inicial*, tolerancia_x, tolerancia_f, max_iteraciones, criterio |
| `iterativos.jacobi` | Jacobi | A*, b*, inicial, norma, tolerancia_absoluta, tolerancia_relativa, max_iteraciones, referencia |
| `iterativos.gauss_seidel` | Gauss-Seidel | A*, b*, inicial, norma, tolerancia_absoluta, tolerancia_relativa, max_iteraciones, referencia |
| `errores.calcular` | Errores absoluto, relativo y porcentual | aproximado*, referencia, anterior |
| `conversiones.bases` | Conversión de bases 2, 8, 10 y 16 | numero*, base_origen, base_destino, precision |
| `conjuntos.operar` | Conjuntos finitos | operacion, A*, B, universo |
| `calculo.primitiva` | Primitiva de reglas admitidas | expresion* |
| `calculo.numerica` | Integral numérica con precisión editable | expresion*, inferior*, superior*, tolerancia, max_subintervalos |

Las condiciones, fórmulas, valores predeterminados y límites están en [contrato.md](contrato.md). La cobertura previa permanece en [fase 04](../fase04/cobertura.md). Las ampliaciones se registran en [ampliaciones.md](ampliaciones.md).

## Arquitectura

- algorithms/numerical/functions.py comparte el lenguaje seguro, dominio y evaluaciones.
- roots.py, iterative.py, integration.py y tools.py contienen los métodos explícitos.
- application/numerical.py adapta la ejecución al contrato y numerical_catalog.py define formularios.
- La interfaz usa el catálogo del backend, muestra tablas paginadas y conserva datos/página al cambiar modo.
- SymPy pertenece únicamente a las auditorías; producción no usa NumPy, SciPy ni SymPy.

Las rutas de algoritmos y aplicación corresponden a packages/core/src/nexolineal. Los métodos comparten Context para presupuestos, cancelación y pasos. Los algoritmos y atribuciones heredados permanecen recuperables.
