# Calculadora de sistemas lineales

Aplicación en Python para resolver sistemas de ecuaciones lineales mediante los
métodos de Gauss y Gauss-Jordan. El procedimiento matricial está programado
manualmente y cada operación elemental se muestra paso a paso.

La interfaz utiliza Flet y las ecuaciones, matrices, fracciones y comprobaciones
se presentan con LaTeX.

## Requisitos

- Python 3.12 o posterior.
- Flet 0.86.5.

Flet puede instalarse con:

```bash
pip install flet==0.86.5
```

## Ejecutar la aplicación

Desde la carpeta del proyecto:

```bash
python main.py
```

Para abrirla como aplicación web durante el desarrollo:

```bash
flet run --web main.py
```

## Archivos del proyecto

- `main.py`: inicia la aplicación Flet.
- `interfaz.py`: contiene la pantalla, los campos de entrada y la navegación de resultados.
- `entrada_datos.py`: convierte y valida enteros, decimales y fracciones.
- `operaciones_fila.py`: implementa las operaciones elementales, el MCD, el MCM y la selección del pivote.
- `metodos_eliminacion.py`: ejecuta Gauss, Gauss-Jordan y la sustitución regresiva.
- `analisis_sistema.py`: calcula rangos, clasifica el sistema, obtiene las soluciones y las comprueba.
- `formato_latex.py`: prepara ecuaciones, matrices y procedimientos para mostrarlos con LaTeX.

## Algoritmo utilizado

En cada columna activa se busca el menor valor absoluto distinto de cero. Si se
encuentra en otra fila, se realiza un intercambio. Para crear cada cero se
calcula:

```text
k = -b / p
```

Después se aplica la operación elemental:

```text
F_destino = F_destino + k * F_pivote
```

Cuando una fila contiene fracciones, se calcula manualmente el mínimo común
múltiplo de sus denominadores y se multiplica toda la fila por ese valor. La
matriz escalonada se conserva para explicar el método de Gauss. A partir de ese
mismo punto se continúa hasta la forma escalonada reducida de Gauss-Jordan.

## Clasificación de resultados

El programa distingue los siguientes casos:

- Sistema consistente determinado: tiene solución única.
- Sistema consistente indeterminado: tiene infinitas soluciones y variables libres.
- Sistema inconsistente: aparece una fila contradictoria y no tiene solución.

Cuando existen infinitas soluciones se muestra la solución paramétrica general.
Para realizar la comprobación se asigna cero a cada variable libre y se obtiene
una solución particular.

## Restricciones respetadas

El cálculo matricial no utiliza NumPy, SciPy, SymPy, `math` ni funciones que
resuelvan matrices automáticamente. Gauss, Gauss-Jordan, los rangos, los
pivotes y las variables libres se trabajan con listas, ciclos, condicionales y
funciones propias.

`Fraction`, perteneciente a la biblioteca estándar de Python, se utiliza
únicamente para conservar fracciones exactas. No ejecuta ningún procedimiento
de álgebra lineal. Flet se utiliza solamente para la interfaz.

## Publicación web

Flet puede generar un sitio estático que se ejecuta en el navegador mediante
Pyodide:

```bash
flet publish main.py --distpath dist --base-url /NOMBRE_DEL_REPOSITORIO/ --route-url-strategy hash
```

La carpeta `dist` generada contiene los archivos web que deben publicarse en
GitHub Pages. El valor de `NOMBRE_DEL_REPOSITORIO` debe sustituirse por el nombre
real del repositorio.

