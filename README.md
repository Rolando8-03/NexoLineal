# NexoLineal · Tarea 5

Calculadora de Álgebra Lineal de MTM0120. Conserva la interfaz, los iconos, el historial, los sistemas, los vectores y las herramientas de cálculo del proyecto recibido. Integra las cinco guías de programación y los temas de las presentaciones hasta la semana 8.

Autores del proyecto: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez, Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre. Grupo 4. Docente: MSc. José Andrés Munguía Cortez.

## Abrir la calculadora

**Interfaz en el navegador:** extrae todo el ZIP, abre la carpeta en VS Code y ejecuta `index.html` con Live Server. También puedes ejecutar:

```bash
python -m http.server 8000
```

Luego abre http://localhost:8000. La interfaz carga Pyodide, Tailwind, KaTeX y SweetAlert desde internet. No abras el HTML directamente con `file://`.

**Ventana de escritorio**, como en el proyecto original:

```bash
python -m pip install pywebview
python main.py --gui
```

En Windows puedes usar `Abrir_ventana.bat`. Instala primero `pywebview` con el comando anterior.

**Consola solicitada por el profesor**, sin instalar librerías y sin conexión:

```bash
python main.py
```

También puedes usar `Abrir_consola.bat`. Cada módulo tiene logotipo ASCII y opción **0. Ver Teoremas Clave del Módulo**. Usa **V** para regresar y **0** para salir del menú principal.

## Qué contiene

| Guía o material | Funcionalidad | Dónde se usa |
|---|---|---|
| Programa 1 | Gauss, clasificación, solución y sustitución de comprobación | Sistemas |
| Programa 2 | Gauss-Jordan, REF/RREF, pivotes, variables básicas/libres, solución general | Sistemas |
| Programa 3 | Operaciones vectoriales, combinación lineal, matrices y Ax=b | Vectores, Sistemas y Matrices |
| Programa 4 | L.I./L.D., sistema homogéneo, relación no trivial y teoremas | Vectores y Sistemas |
| Programa 5 | Suma, resta, escalar, producto, transpuesta, determinantes, dos inversas y verificador | Matrices → Determinantes, inversa y LU |
| Sesión de operaciones | Propiedades de suma, escalares, producto y transpuesta, con ambos miembros | Matrices → Propiedades |
| Ecuación matricial | A(u+v)=Au+Av y A(cu)=c(Au), incluso con A rectangular | Vectores → matriz A |
| Determinantes | Cofactores, Sarrus, reglas de filas, Cramer y adjunta | Matrices → Determinantes, inversa y LU |
| Factorización | A=LU sin intercambios, Ly=b y Ux=y, comprobaciones | Matrices → Determinantes, inversa y LU → 11 |
| Aplicaciones de sistemas | Solución de modelos de economía, química, dietas y flujo una vez planteados como A y b | Sistemas; ejemplo explicado en `GUIA_DE_USO.md` |

## Lo agregado en esta versión

- `modulos/modulo_matrices.py`: funciones reutilizables de álgebra matricial. Ninguna función de cálculo solicita ni imprime datos.
- Determinante por cofactores para cualquier orden, con menores y expansión de la primera fila; reducción triangular con corrección de intercambios y factor de escalamiento; Sarrus cuando el orden es 3.
- Inversa por Gauss-Jordan con pivotes restringidos al bloque A de [A|I]. Una matriz singular no obtiene una inversa a partir de pivotes del bloque identidad.
- Inversa por adjunta, matriz de cofactores, comparación entre ambos métodos y comprobación exacta A·A⁻¹ = A⁻¹·A = I.
- Verificador de las seis propiedades de la guía. Para operaciones de fila se eligen filas y k. También verifica det(Aᵀ), det(AB) y det(kA).
- Regla de Cramer, solución mediante x=A⁻¹b y factorización LU rectangular. Para resolver con LU se requiere A cuadrada y diagonal de U no nula.
- Menú de consola integrado desde `main.py` y lanzadores de Windows.
- Docstring de módulo con autores en cada archivo `.py`, docstrings breves por función y eliminación de comentarios que repetían instrucciones.
- Teorema de la inversa (a, b, c), caracterizaciones de la matriz invertible (*c, *e, *h), determinante y adjunta.

## Consideraciones de uso

- Los algoritmos de álgebra lineal usan Python estándar y `fractions.Fraction`; no usan NumPy, SciPy ni funciones de álgebra de `math`.
- El archivo de cálculo elemental conserva `math` para trigonometría y logaritmos. Es una extensión previa, separada de los módulos académicos.
- La cuadrícula gráfica conserva el límite original de 1 a 6 filas y columnas. El núcleo nuevo y el menú de matrices de consola admiten órdenes mayores. Cofactores y adjunta crecen rápidamente en costo; para matrices grandes conviene la reducción triangular.
- LU sigue exactamente el supuesto de clase: **sin intercambios**. Si un pivote requiere permutar filas, lo informa y recomienda Gauss. No afirma que esa matriz sea singular.
- Sarrus solo existe para 3×3. Cramer e inversa requieren determinante distinto de cero.
- En orden 1 no hay dos filas diferentes: el verificador explica por qué no aplica intercambio/reemplazo de filas.
- Los datos se escriben como `3`, `-2`, `0.5` o `1/2`. No se redondean las fracciones de los cálculos matriciales.

## Comprobar el código

```bash
python pruebas.py
```

Incluye los casos de la Tarea 5 y regresiones de sistemas y vectores: producto rectangular, dimensiones incompatibles, inversas 2×2 y 3×3, singularidad, propiedades, orden 1, pivote cero, LU, Cramer y las trece opciones del nuevo apartado.

El ZIP incluye la carpeta Calculadora_Algebra_Lineal y el informe PDF del Grupo 4. El informe tiene portada, dos páginas de explicación y registros reales de las opciones 0 a 9 y de errores. Las imágenes se generaron desde las ejecuciones de consola: no son capturas del escritorio. Para cumplir literalmente el requisito de capturas, agrega las capturas tomadas al ejecutar el programa en tu equipo. La ventana de Windows y la descarga desde CDN no se comprobaron en esta revisión.

Correcciones de esta revisión: validación de matrices malformadas; nueva solicitud de filas distintas y escalar no nulo; propiedad de escalamiento para orden 1; teoremas completos desde opción 0; título correcto para una matriz singular en la interfaz. Se aprobaron 29 pruebas automatizadas.


## Sesiones 11 y 12: procedimientos del docente

En **Matrices → Determinantes, inversa y LU**:

- **6. Determinante**: desarrolla por la fila o columna elegida, o selecciona la que tenga más ceros. Muestra el menor, el signo, el cofactor y cada término. La opción de extraer factores normaliza los pivotes de la reducción y recupera esos factores en det(A). Sarrus repite los dos primeros renglones.
- **8. Inversa por adjunta**: muestra det(A), los nueve menores y cofactores en el ejemplo 3×3, C, adj(A), el recíproco del determinante y la inversa. Comprueba ambos métodos y A·A⁻¹=I.
- **9. Propiedades de la inversa**: conserva las seis propiedades obligatorias de la Tarea 5. Requiere A y B invertibles.
- **11. Factorización LU**: solo reemplazos, sin intercambios ni normalización. Muestra A→U, los cocientes con que se construyen las columnas de L, las columnas pivote y L→I usando las mismas operaciones. Con b, muestra [L|b]→[I|y] y la reducción por Gauss-Jordan de [U|y]. Los ejemplos seleccionables reproducen los de 3×3, 4×4 y 4×5 de la Sesión 12. En el rectangular b queda vacío porque la presentación no lo proporciona.
- **13. Propiedades de determinantes**: admite matrices singulares. Verifica operaciones de filas o columnas, transpuesta, producto y producto diagonal. Permite k=0 en la propiedad matemática de escalamiento. Comprueba det(A⁻¹) solamente cuando la inversa existe.
- **14. Factores dados**: ingresa L en la cuadrícula A y U en la cuadrícula B, y escribe b. Valida los factores y resuelve las dos etapas de Gauss-Jordan como en los ejercicios de la Sesión 12.

Para U rectangular, muestra la clasificación y x=p+t1·v1+..., las variables libres y las direcciones. Comprueba Ap=b y Avj=0. El resultado que aparece como solución x es la solución particular p cuando hay infinitas soluciones.

En consola, usa el menú principal **3. Matrices e inversa** y los mismos números de opción. Para la opción 6 también se pregunta la fila o columna de desarrollo y si deseas extraer factores.

El código matemático usa Python estándar y fractions. No se añadieron librerías de álgebra. Todas las funciones nuevas tienen docstrings y mantienen separado el cálculo de la entrada/salida.

La opción 13 también muestra AB, det(A), det(B) y la comparación det(A+B) frente a det(A)+det(B), con una advertencia explícita de que la aditividad no es una propiedad. Para el ejemplo de las fotos, los valores son 24 y 14.
