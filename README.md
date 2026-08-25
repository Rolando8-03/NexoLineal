# Programa 1 · Calculadora de Álgebra Lineal

Aplicación gráfica para resolver sistemas de ecuaciones lineales mediante
eliminación por filas. Está construida únicamente con Python estándar y
Tkinter; no utiliza NumPy, SciPy ni funciones externas de álgebra lineal.

## Cómo ejecutar

1. Instale Python 3.10 o una versión posterior.
2. Mantenga juntos todos los archivos de esta carpeta.
3. Ejecute el archivo principal:

```bash
python "Programa 1_GrupoX.py"
```

En Windows también puede abrir el archivo principal con doble clic si Python
está correctamente asociado con los archivos `.py`.

## Archivos

- `Programa 1_GrupoX.py`: punto de entrada requerido por la guía.
- `interfaz.py`: ventana, controles, resultados y procedimiento visual.
- `algebra_lineal.py`: eliminación de Gauss, rangos, clasificación y verificación.
- `formato_matematico.py`: matrices, ecuaciones, fracciones y subíndices.
- `pruebas_algoritmo.py`: pruebas automáticas de los tres casos obligatorios.
- `CASOS_DE_PRUEBA.md`: datos y resultados esperados para las capturas.
- `INFORME_BASE.md`: texto listo para completar con portada y capturas.
- `GUIA_DE_DEFENSA.md`: preguntas y respuestas para la exposición individual.

## Funciones cubiertas

- Entrada de `m` ecuaciones y `n` variables, de 1 a 6.
- Coeficientes enteros, decimales o fracciones como `-3/4`.
- Matriz aumentada inicial `[A|b]`.
- Pivoteo parcial e intercambio de filas.
- Generación manual de ceros debajo de cada pivote.
- Matriz después de cada operación elemental representativa.
- Cálculo manual de `rango(A)` y `rango([A|b])`.
- Clasificación como solución única, infinitas soluciones o sin solución.
- Identificación de variables libres y solución paramétrica.
- Sustitución automática en el sistema original.
- Botón para copiar el resultado.

## Ejecutar las pruebas

```bash
python pruebas_algoritmo.py
```

El resultado esperado es `OK` después de cuatro pruebas.

## Nota para la entrega

Antes de comprimir, cambie la `X` del nombre del archivo principal y de la
carpeta por el número real del grupo. No cambie los nombres de los módulos,
porque el archivo principal los importa directamente.
