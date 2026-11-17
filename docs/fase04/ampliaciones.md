# Ampliaciones pendientes con alcance propio

Todas están **pendientes**. No se consideran disponibles al cerrar B17–B26. Las ventanas son orientativas y se amplían si no se alcanza el criterio de cierre.

| Ampliación | Especificación previa necesaria | Verificación requerida | Continuación estimada |
| --- | --- | --- | --- |
| Geometría adicional | Rectas, planos, distancias, proyecciones y dimensión admitida; decidir geometría exacta y gráfica | Pertenencia, perpendicularidad, degeneraciones y reconstrucción | Dos bloques adicionales |
| Gram-Schmidt | Producto interior admitido, familia dependiente, normalización racional o radical | Ortogonalidad, generado conservado, rechazo o descarte documentado de dependencias | Un bloque adicional |
| QR | QR reducida/completa, signos de diagonal, matrices rectangulares y rango deficiente | QR=A, QᵀQ=I según variante | Un bloque adicional después de Gram-Schmidt |
| Cholesky | Matrices reales simétricas definidas positivas; aproximación y tolerancia si aparecen raíces | LLᵀ=A y rechazo explícito de hipótesis incumplidas | Un bloque adicional |
| Mínimos cuadrados | Solución única o de norma mínima; método QR frente a ecuaciones normales; rango deficiente | Aᵀ(Ax−b)=0, residuos y contraste independiente | Dos bloques después de QR |
| Autovalores y autovectores | Exactos o numéricos, complejos, multiplicidades y diagonalización | Av=λv, residuales, multiplicidades y casos no diagonalizables | Dos bloques adicionales |
| SVD | Convención reducida/completa, orden de valores, tolerancia para rango numérico | UΣVᵀ=A, ortogonalidad y residuales | Dos bloques adicionales |
| Pseudoinversa | Método SVD, tolerancia y matrices de rango deficiente | Las cuatro identidades de Moore-Penrose | Un bloque después de SVD |

Antes de incorporar cada ampliación se actualizan catálogo, contrato, procedimientos, pruebas independientes y paridad en los tres destinos. Un cambio de dominio numérico requiere declarar precisión y tolerancias, sin convertir una aproximación en un resultado exacto.
