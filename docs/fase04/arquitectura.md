# Núcleo común de álgebra lineal, versión 0.4.0

## Separación de responsabilidades

| Ruta | Responsabilidad |
| --- | --- |
| packages/core/src/nexolineal/algorithms/legacy | Los 14 módulos matemáticos recibidos, con atribuciones conservadas e imports relativos |
| packages/core/src/nexolineal/algorithms/linear/context.py | Fraction, dimensiones, presupuestos, cancelación y copias de pasos |
| algorithms/linear/reduction.py | Reducción con certificado EA=R, solución general e inversa |
| algorithms/linear/matrix.py | Operaciones, determinantes, inversas, potencias, propiedades y bloques |
| algorithms/linear/factorization.py | LU sin permutaciones y PLU con PA=LU |
| algorithms/linear/spaces.py | Familias, generado, bases, coordenadas y subespacios |
| algorithms/linear/transformations.py | Matriz asociada, imágenes, composición y representación en bases |
| application/catalog_data.py y catalog.py | Única definición de las 44 operaciones y sus campos |
| application/linear.py y service.py | Validación del contrato, selección del caso de uso y publicación del resultado |
| apps/frontend/src/FormFields.tsx | Formularios derivados del catálogo; dimensiones inferidas al pegar datos |
| apps/frontend/src/ResultView.tsx | Presentación KaTeX de datos exactos y pasos calculados por Python |

Las rutas abreviadas de la tabla pertenecen a packages/core/src/nexolineal. Los adaptadores web, Windows y Android no implementan algoritmos matemáticos. Serio y Explorador comparten operación, entradas, resultado y paso seleccionado.

## Migración y compatibilidad

Los módulos de python/, modulos/ y teoremas/ que fueron trasladados reexportan sus símbolos desde algorithms.legacy. Las importaciones antiguas siguen funcionando sin copias divergentes de esos algoritmos. Los adaptadores gráficos existentes permanecen disponibles.

La nueva capa conserva los métodos docentes y añade implementaciones explícitas para obtener certificados y respuestas uniformes. Las pruebas de referencia utilizan SymPy; el paquete de producción no depende de SymPy, NumPy ni SciPy.

El manifiesto packages/core/python-files.json permite a la interfaz anterior cargar también los módulos nuevos. La interfaz compartida empaqueta el mismo árbol mediante prepare-runtime.mjs; Windows lo recoge con PyInstaller y Android con Chaquopy.

## Fuente y atribuciones

El alcance verificable es el plan de fase 04 proporcionado por el propietario y los algoritmos originales incorporados al repositorio. Se conservan los encabezados originales de Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez, Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre. Esta entrega no afirma una concordancia página por página con libros que no están dentro del árbol de código ni reproduce sus contenidos.

## Continuidad

La fase 03 permanece recuperable en fase-03-base. El catálogo crece de cuatro a 44 operaciones, con el contrato JSON 1.0 y los estados ya admitidos. La fase 05 trata métodos numéricos; la fase 06 completa la experiencia visual y el historial; la fase 08 prepara instaladores y firmas de distribución. El usuario final usa la interfaz gráfica.
