# Contrato y límites de visualización

La versión 0.7.0 conserva las 56 operaciones anteriores y añade **vectores.proyeccion**, con aritmética racional y comprobación de la descomposición ortogonal. La geometría pertenece al núcleo Python; React dibuja escenas recibidas y controla la cámara, la ampliación y la selección. No se incorporan NumPy, SciPy, Plotly ni Three.js.

## Contrato compatible

La solicitud 1.0 admite la opción booleana **include_visualization**, desactivada por defecto. La interfaz común la activa al calcular, importar o reabrir. Con la opción se añade metadata.visualization, versión 1. El resultado, sus pasos y su comprobación siguen siendo los de la ejecución original. No se persisten imágenes ni resultados importados como pruebas matemáticas.

| Campo de escena | Contenido |
| --- | --- |
| kind | system, vectors, transformation, roots, residual o unavailable |
| dimension | 2 o 3; no se finge una proyección de espacios de dimensión mayor |
| axes, units | Nombres y unidades; los modelos reconocidos conservan las variables y unidades del contexto |
| series | Etiqueta, tipo line/points/polygon/vector, puntos y fuente de los datos |
| frames | Índice del paso, fila, datos originales y geometría de esa iteración |
| range | Ventana de recorte cuando corresponde |
| notes, alternative | Condiciones y alternativa textual |
| approximate_display | El dibujo de pantalla es aproximado aunque sus coordenadas racionales sean exactas |

Las coordenadas viajan como texto racional o decimal. La conversión a píxeles admite `p/q`, incluidos enteros demasiado grandes para convertirlos primero a float. Se usan las cifras iniciales para la aproximación de pantalla; los valores originales permanecen en el inspector, el resultado y las exportaciones. Una prueba exige puntos SVG finitos y otra verifica perpendicularidad en el dibujo de una proyección con coeficientes fraccionarios.

Un fallo de representación produce unavailable con motivo explícito y conserva la solución matemática. La cancelación sí interrumpe el trabajo. Los presupuestos del núcleo, el límite de magnitud de coordenadas de **10^6**, el muestreo finito y los dominios admitidos limitan lo representable.

## Cobertura

| Operación | Representación y condición |
| --- | --- |
| sistemas.resolver | Rectas para dos incógnitas y planos para tres, con ecuaciones originales, particular y familia cuando existen |
| vectores.suma/resta/escalar/productos/norma | Vectores de entrada y resultados vectoriales en R² o R³; suma con vector trasladado |
| vectores.analizar/generado | Familia de generadores; en pertenencia compatible se dibujan términos ponderados y reconstrucción con los coeficientes calculados |
| vectores.proyeccion | Proyección de u sobre span(v), v no nulo, y componente ortogonal; se verifican suma y producto interior cero |
| transformaciones.analizar/desde_imagenes/componer | Cuadrícula de R²→R² mediante la matriz canónica resultante; segmentos rectos, incluidos colapsos singulares |
| raices.biseccion/falsa_posicion/newton/secante | Función y geometría de cada fila: intervalo, extremos, secante o recta de Newton y punto actual |
| iterativos.jacobi/gauss_seidel | Norma residual de cada fila en escala lineal, incluido cero |

Los espacios de dimensión superior, las cuadrículas R³→R³ y la representación en bases no canónicas no reciben una geometría canónica inventada. Sus datos y procedimientos continúan disponibles. Una proyección sobre un subespacio general, Gram-Schmidt y las ampliaciones de fases anteriores mantienen su especificación aparte.

## Sistemas y geometría lineal

El recorte de rectas y planos interseca las aristas de una caja con aritmética racional. Los polígonos son porciones de planos infinitos. Se distinguen ecuación nula, contradicción y ecuación que no corta la ventana. Un sistema incompatible no muestra un punto de solución ficticio. Las familias de soluciones se construyen con la particular y las direcciones ya verificadas contra A y b originales.

En geometría espacial, una unidad tiene la misma escala de pantalla en los ejes proyectados. La vista 3D usa proyección ortográfica con giro y elevación; una proyección de cámara 3D no conserva en general todos los ángulos del espacio. El inspector muestra coordenadas mundiales. La cuadrícula transformada usa T(x)=Ax sin curvar segmentos ni añadir traslaciones. La representación en otras bases conserva su resultado textual para evitar confundir coordenadas con posiciones canónicas.

## Funciones, discontinuidades y pasos

El muestreo usa el analizador seguro de funciones del núcleo, con precisión de trabajo decimal existente. Se toman **201 abscisas** en la ventana derivada de semillas, extremos e iterados, con margen. Antes de conectar muestras consecutivas, el analizador debe justificar la continuidad del intervalo entre ellas. Una evaluación inválida o una continuidad no justificada separa los trazos; las muestras aisladas no se unen. Esto evita cruzar polos conocidos, incluso cuando el polo queda entre dos muestras. No demuestra que se hayan encontrado todas las discontinuidades o raíces de cualquier expresión imaginable.

La tabla, el paso y la escena comparten un índice. Elegir una fila abre el paso correspondiente; elegir un paso cambia la página de la tabla; los botones de la gráfica cambian esa misma selección. Cambiar de modo o tema la conserva. Sin pasos solicitados, los datos no reciben índices de paso fabricados. Una raíz satisfecha antes de iterar puede tener curva sin marcos de iteración.

Newton usa la pendiente y las abscisas de la fila ejecutada. Una derivada aportada por el usuario sigue siendo un dato no certificado como f prima. Si un estancamiento deja la misma abscisa a la precisión de trabajo, se omite la recta del método en vez de dibujar una tangente vertical ficticia. El residual no se interpreta como error verdadero ni como prueba de convergencia.

## Interacción y accesibilidad

Ampliación integrada con diálogo, cierre, Escape y devolución del foco; control de zoom y restablecer; giro/elevación para 3D; inspector de coordenadas por teclado/tacto; leyenda textual, función visible, ejes y alternativa de coordenadas. Los datos anchos tienen desplazamiento local. Las fórmulas desplazables se pueden enfocar sin crear regiones de navegación con nombres repetidos.

Ambas presentaciones usan estos mismos componentes. Las escenas no requieren animación para entenderse y respetan la preferencia de movimiento reducido de la interfaz. Los recorridos automáticos no sustituyen una evaluación completa con lectores de pantalla y usuarios reales.
