# NexoLineal — MTM0120 Álgebra Lineal

NexoLineal es una calculadora educativa desarrollada para MTM0120 Álgebra Lineal de la Universidad Americana (UAM). Los cálculos se ejecutan con **Python estándar** dentro del navegador mediante Pyodide. No se utiliza NumPy ni SciPy para resolver los procedimientos algebraicos.

## Interfaz

La interfaz fue reescrita con:

- **Tailwind CSS** para la estructura visual y componentes.
- **SweetAlert2** para validaciones, confirmaciones y mensajes.
- **KaTeX** para mostrar expresiones matemáticas.
- Diseño oscuro, simple y responsivo.
- Navegación principal en la barra superior.
- Historial de sistemas lineales mediante almacenamiento local del navegador.

## Módulos

### Sistemas lineales
- Entrada mediante matriz aumentada visual `[A | b]`.
- Gauss y Gauss-Jordan.
- REF y RREF.
- Rango de `A` y `[A | b]`.
- Variables básicas y libres.
- Solución única, infinitas soluciones o inconsistencia.
- Sistemas homogéneos y no homogéneos.
- Independencia de las columnas de `A`.
- Comprobación de soluciones.
- Historial de sistemas resueltos.

### Vectores
- Suma y resta.
- Igualdad.
- Multiplicación por escalar.
- Combinación `cu + dv`.
- Norma.
- Propiedades algebraicas.
- Combinación lineal de varios vectores.
- Independencia y dependencia lineal.

### Matrices
- Suma y resta.
- Multiplicación por escalar.
- Igualdad y clasificación.
- Producto matricial con regla fila-columna.
- Validación de dimensiones incompatibles.
- Transpuesta.
- Reducción a REF y RREF.
- Propiedades de suma, producto, escalares e identidad.
- Propiedades de la transpuesta.

## Ejecutar con Live Server

Abre el proyecto en VS Code y ejecuta `index.html` con Live Server. No se recomienda abrir `index.html` directamente con `file://`, porque Pyodide necesita cargar los módulos Python mediante HTTP.

## Aplicación de escritorio

```bash
pip install pywebview
python main.py
```

## Crear el ejecutable

```bash
pip install pyinstaller
```

En Windows:

```text
py -m PyInstaller --noconfirm --clean --onefile --windowed --name "NexoLineal" --icon "assets\icono.ico" --add-data "index.html;." --add-data "css;css" --add-data "js;js" --add-data "python;python" --add-data "assets;assets" main.py
```

## Estructura

```text
NexoLineal/
├── assets/
│   └── icono.ico
├── css/
│   └── estilos.css
├── js/
│   ├── app.js
│   └── ejecutar_python.js
├── python/
│   ├── analisis_sistema.py
│   ├── entrada_datos.py
│   ├── formas_matriciales.py
│   ├── formato_latex.py
│   ├── metodos_eliminacion.py
│   ├── operaciones_fila.py
│   ├── operaciones_matrices.py
│   ├── relaciones_vectoriales.py
│   └── vectores.py
├── index.html
├── main.py
└── README.md
```
