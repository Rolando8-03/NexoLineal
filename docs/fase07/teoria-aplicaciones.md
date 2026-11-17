# Teoría y aplicaciones verificables

Biblioteca y ayuda incorpora búsqueda, **12 fichas** y **cinco aplicaciones** originales. Cada ficha tiene enunciado, hipótesis, fuente primaria y relación con una operación disponible; el resultado ofrece las fichas relacionadas. La biblioteca puede leerse sin red; abrir el enlace de una referencia externa requiere conexión.

## Fichas

Equivalencia por filas; compatibilidad por rangos; particular más núcleo; rango-nulidad; transformación matricial; matriz invertible; determinante y escala geométrica; proyección ortogonal; cambio de signo y continuidad; Newton; residual y contracción; transición de poblaciones por columnas.

Fuentes primarias consultadas, con redacción propia:

- Margalit y Rabinoff, [Interactive Linear Algebra](https://textbooks.math.gatech.edu/ila/): §§1.1–1.2, 2.3–2.4, 2.9, 3.1, 3.6, 4.3, 5.6 y 6.3. Cada ficha enlaza su sección concreta.
- OpenStax, Calculus Volume 1: [continuidad y valor intermedio](https://openstax.org/books/calculus-volume-1/pages/2-4-continuity) y [método de Newton](https://openstax.org/books/calculus-volume-1/pages/4-9-newtons-method).
- Barrett y colaboradores, [Templates for the Solution of Linear Systems](https://netlib.org/templates/templates.html): métodos estacionarios y criterios de parada.

Se conservan el resumen docente previo y sus atribuciones en algorithms/legacy/resumen_teoremas.py. Las fichas nuevas no son páginas copiadas de los libros ni una conciliación página por página de todos los ejercicios del curso. Las continuaciones identificadas están en [continuaciones.md](continuaciones.md).

## Aplicaciones

Los datos son ejemplos didácticos creados para NexoLineal. «Resolver este modelo» carga sus operandos en la operación pública existente y la ejecuta. Python reconoce las entradas equivalentes y devuelve interpretación, unidades y comprobaciones; la interfaz no resuelve de nuevo el modelo. Modificar los datos impide atribuirles automáticamente la verificación del ejemplo original.

| Modelo | Ecuaciones o cálculo | Resultado y restricciones |
| --- | --- | --- |
| Redes | f1+f2=30; f1−f2=10 | 20 y 10 L/min; estacionario, sin acumulación y caudales no negativos |
| Química | Fe+O2→Fe2O3, con coeficiente de Fe2O3 fijado en 2 | 4 Fe + 3 O2 → 2 Fe2O3; coeficientes enteros positivos y átomos conservados |
| Economía | (I−C)x=d, con C y demanda final declaradas | 2600/27 y 1900/27 unidades monetarias/período; producciones no negativas y coeficientes técnicos fijos |
| Recursos | 2x1+x2=40 kg; x1+2x2=50 h | 10 y 20 unidades; no negativas, enteras y uso completo de los recursos |
| Poblaciones | P·(200,100), con columnas no negativas de suma uno | (170,130) individuos esperados; total 300, sistema cerrado y tasas fijas durante un período |

El balance químico no modela energía ni cinética. Recursos plantea igualdades de uso completo: no optimiza ganancias ni resuelve desigualdades. Economía no predice un mercado real. Poblaciones representa valores esperados de una transición, no una simulación aleatoria ni una garantía de estabilidad de largo plazo.

Cada resultado contextual presenta las unidades, las hipótesis y el estado de sus comprobaciones. El banco ofrece proyectos editables de los cinco modelos junto con ejemplos geométricos y numéricos.
