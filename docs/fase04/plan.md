# Fase 04 — Cobertura de álgebra lineal

Objetivo: completar y unificar el núcleo básico respaldado por el plan proporcionado, con pasos, comprobaciones y ejemplos en las tres plataformas. Motor Python común e interfaz compartida Serio/Explorador; el usuario final no necesita consola.

Dependencias: contrato y núcleo estables de fase 03, algoritmos recibidos y catálogo de operaciones. Arquitectura conservada: React/TypeScript/Vite/KaTeX, Pyodide en Worker, pywebview/PyInstaller y Capacitor/Chaquopy.

| Bloque | Criterio de cierre |
| --- | --- |
| B17 | Gauss/Gauss-Jordan rectangular, rangos y clasificación |
| B18 | Particular y direcciones; Axp=b y Av=0 con la entrada original |
| B19 | Operaciones, tipos, propiedades, rango y REF/RREF con dimensiones explícitas |
| B20 | Bloques, traza y potencias comprobados |
| B21 | Determinantes y dos inversas; Sarrus solo 3×3; comprobación bilateral |
| B22 | LU docente, PLU con PA=LU, Cramer y resolución por inversa |
| B23 | Vectores, generado, independencia y dependencia, incluidos casos degenerados |
| B24 | Bases, espacios fundamentales, suma e intersección, rango-nulidad |
| B25 | Coordenadas y orientación del cambio de base verificadas |
| B26 | Transformaciones, composición y representación en bases completas |

La planificación contiene diez ventanas orientativas de cinco horas. Un criterio incumplido prolonga su bloque; no se presupone una duración exacta. Cada registro B17–B26 incluye estado, archivos, pruebas y límites, commits reales, pendientes y continuación.

Las ampliaciones de geometría, Gram-Schmidt, QR, Cholesky, mínimos cuadrados, autovalores, SVD y pseudoinversa se conservan como pendientes de especificación y bloques adicionales. No son condiciones para declarar completo el núcleo básico.

Entregables: operaciones comunes, pasos, comprobaciones y ejemplos; catálogo actualizado con condiciones y límites; ampliaciones identificadas; cierre registrado antes de avanzar a fase 05. No se acepta muestrear valores como demostración general de linealidad o de subespacio.

El proyecto conserva los 62 commits iniciales y la meta global de al menos 300 commits reales; no se convierte en una cuota por sesión ni se crean cambios artificiales para incrementar el contador.
