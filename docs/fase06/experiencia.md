# Menú y experiencia común

La versión 0.6.0 conserva las 56 operaciones del catálogo Python. La interfaz pregunta «¿Qué querés calcular?» y muestra áreas, búsqueda y acceso al último ejercicio. No requiere terminal para el usuario final. La presentación y el tema son preferencias independientes.

## Destinos del menú

| Destino | Contenido real |
| --- | --- |
| Inicio | Pregunta inicial, buscador, áreas y retomar ejercicio |
| Sistemas | Gauss/Gauss-Jordan, Cramer, inversa, LU y PLU |
| Matrices | Operaciones, análisis, escalonadas, bloques, traza y potencias |
| Determinantes e inversas | Métodos del catálogo con sus condiciones |
| Vectores y espacios | Operaciones, generado, independencia, bases, subespacios y coordenadas |
| Transformaciones | Análisis, evaluación, composición y representación en bases |
| Métodos numéricos | Raíces y sistemas iterativos con tablas y criterios |
| Herramientas | Calculadora, cálculo admitido, errores, conversiones y conjuntos |
| Historial y proyectos | Buscar, favorito, editar, repetir, eliminar, guardar y archivos JSON |
| Biblioteca y ayuda | Objetos reutilizables, ejemplos, convenciones de entrada y atajos |

Los siete grupos matemáticos proceden de `category` del catálogo; no hay listas distintas de capacidades por presentación. Las tarjetas muestran cantidades disponibles. La búsqueda ignora mayúsculas y acentos, combina palabras y admite alias como Gauss, núcleo y bisección. Los errores y las restricciones reales del motor siguen visibles.

## Pedir solo lo necesario

Los formularios se generan desde la especificación de cada operación. La transpuesta pide A; la norma pide un vector. No se solicitan dimensiones cuando pueden inferirse de los operandos. `required_when` expresa campos condicionales del catálogo, como el universo para complemento de conjuntos. Los valores predeterminados están a la vista y se guardan al ejecutar.

Las matrices admiten filas separadas por salto de línea o punto y coma; los espacios separan columnas. Pegar desde una hoja convierte tabulaciones en columnas e infiere el tamaño. Una celda vacía pegada se marca `□` y produce error localizado: no se convierte en cero. Se distinguen campo vacío, matriz nula, filas irregulares y denominador cero. La interfaz verifica estructura y sintaxis; el núcleo Python decide compatibilidad de dimensiones, dominio y aplicabilidad matemática.

## Objetos reutilizables

Se pueden nombrar y guardar matrices, vectores, bases o familias y funciones desde entradas o resultados que tengan esos tipos. Biblioteca permite buscar, quitar y reutilizar; el selector ofrece los campos compatibles de otra operación. Los objetos son texto exacto. Una base o familia usa un vector por fila, conforme al contrato del núcleo; el motor comprueba después que sea una base cuando la operación lo requiera. Guardar un objeto no demuestra sus propiedades matemáticas.

Un producto calculado se puede reutilizar como A de una transpuesta; una base calculada se usa en coordenadas sin transcribir ni invertir su orientación; una función guardada puede pasar a otro método de raíces. Los enteros que exceden el límite seguro de JavaScript y las fracciones permanecen como texto.

## Dos presentaciones, dos temas

Serio usa nombres académicos, superficie sobria y resultado resumido. Explorador usa ilustraciones SVG propias, animación decorativa y metáforas, acompañadas siempre por el nombre matemático. Las 56 operaciones, valores, errores, procedimientos, tablas y comprobaciones pertenecen al mismo estado y componentes.

Cambiar Serio/Explorador o Claro/Oscuro conserva entradas, resultado, paso, apertura del procedimiento y página de la tabla. La presentación no inicia otro cálculo. Los detalles adicionales del resultado se despliegan; no se suprimen del contrato ni del archivo de resultado exportable. Las ilustraciones de portada no son gráficas del ejercicio: las visualizaciones matemáticas corresponden a fase 07.

## Teclado, tacto y movimiento

- Menú móvil desplegable, recorrido cíclico del foco y Escape con retorno al botón de menú.
- Tras navegar, foco en el título del destino después de actualizar el DOM; al fallar la validación, foco en el primer campo inválido.
- Diálogos con título accesible, Escape y devolución del foco al control de origen.
- Ctrl/Cmd+K enfoca búsqueda; Ctrl/Cmd+S guarda el proyecto.
- Etiquetas, estados de botones, avisos de guardado y resultado anunciables, foco visible y áreas táctiles.
- `prefers-reduced-motion: reduce` desactiva las animaciones decorativas.

Se revisaron cuatro combinaciones de modo/tema, biblioteca, historial y su versión móvil mediante axe y recorridos de teclado. Las pruebas a 390 px verifican que no haya desbordamiento de página; los datos anchos tienen desplazamiento local. Estas pruebas no sustituyen una evaluación completa con lectores de pantalla y usuarios reales.

La lógica está en `apps/frontend/src/workspace`, coordinada por `App.tsx`; el contrato de operaciones continúa en Python. Los adaptadores nativos solo transportan datos, trabajo y archivos.
