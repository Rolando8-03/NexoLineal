# MTM0120 — Calculadora de Álgebra Lineal

Proyecto integrador para Álgebra Lineal (MTM0120), Universidad Americana.

La aplicación permite trabajar con sistemas de ecuaciones lineales mediante **Gauss** y **Gauss-Jordan**. La opción **Matrices** concentra la resolución del sistema y el análisis de forma escalonada, forma escalonada reducida, columnas pivote, variables básicas y variables libres. La opción **Vectores** contiene las operaciones vectoriales.

## Cómo ejecutar

La forma más sencilla es abrir el proyecto con **Live Server** en VS Code y entrar a `index.html`. Esto permite que el navegador cargue correctamente los módulos Python que utiliza Pyodide.

También existe `main.py` para ejecutar la interfaz mediante pywebview.

## Funciones principales

- Ingreso del número de ecuaciones y variables (1 a 6).
- Construcción de la matriz aumentada `[A | b]`.
- Eliminación por filas (Gauss).
- Forma escalonada reducida por filas (Gauss-Jordan).
- Identificación de columnas pivote.
- Identificación de variables básicas y libres.
- Clasificación: solución única, infinitas soluciones o sistema inconsistente.
- Solución general cuando existen variables libres.
- Comprobación de la solución en las ecuaciones originales.
- Análisis de las cinco propiedades de la forma escalonada/reducida.
- Operaciones básicas con vectores.

## Restricciones académicas

El cálculo matricial se realiza con Python estándar y listas anidadas. No se utiliza NumPy ni SciPy para resolver los sistemas.

Las operaciones exactas utilizan `fractions.Fraction` de la biblioteca estándar de Python.

## Estructura

```text
NexoLineal-master/
├── index.html
├── main.py
├── requirements.txt
├── css/
├── js/
├── python/
└── assets/
```

## Entrega académica

Para la entrega del Programa 2 deben agregarse el informe PDF, la portada, los tres casos de prueba solicitados y la reflexión sobre el uso de IA, además de respetar el nombre de archivo indicado por la docente. El documento del Programa 2 especifica estos elementos como parte de la entrega.
