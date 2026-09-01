# MTM0120 — Calculadora de Sistemas de Ecuaciones Lineales

**Universidad Americana (UAM) · Álgebra Lineal**

Herramienta educativa para resolver sistemas de ecuaciones lineales usando los métodos de **Gauss** y **Gauss-Jordan**, con cada operación elemental mostrada paso a paso en notación matemática LaTeX.

---

## 🚀 Cómo usar

Abre `index.html` directamente en el navegador o publícalo en **GitHub Pages** (rama `main`, carpeta raíz `/`).

> **Nota:** La primera carga toma entre 5 y 10 segundos porque Pyodide descarga el entorno Python (~10 MB). Luego todo funciona offline.

---

## ✨ Características

| Característica | Detalles |
|---|---|
| **Sin backend** | Python se ejecuta en el navegador con Pyodide |
| **Fracciones exactas** | Ningún coeficiente se redondea |
| **Validación en tiempo real** | Celdas vacías o inválidas se marcan inmediatamente |
| **Gauss-Jordan** | Todos los pasos con operaciones elementales en LaTeX |
| **Gauss** | Forma escalonada + sustitución regresiva |
| **Clasificación** | Único / Infinitas soluciones / Inconsistente |
| **Comprobación** | Sustitución de la solución en las ecuaciones originales |
| **Responsivo** | Funciona en computadora, tableta y celular |

---

## 📁 Estructura

```
MTM0120_Algebra_Lineal/
├── index.html              ← Página principal
├── css/
│   └── estilos.css         ← Sistema de diseño UAM (tema oscuro)
├── js/
│   ├── interfaz.js         ← Lógica de UI, KaTeX, tabs, acordeón
│   └── ejecutar_python.js  ← Puente Pyodide ↔ JavaScript
├── python/
│   ├── entrada_datos.py    ← Validación y lectura de entradas
│   ├── operaciones_fila.py ← Operaciones elementales (intercambio, MCM…)
│   ├── metodos_eliminacion.py ← Gauss y Gauss-Jordan
│   ├── analisis_sistema.py ← Clasificación y solución del sistema
│   └── formato_latex.py    ← Generación de expresiones LaTeX
└── README.md
```

---

## 🔢 Entradas aceptadas

| Tipo | Ejemplo |
|---|---|
| Entero | `3`, `-7`, `0` |
| Decimal | `1.5`, `-0.25` |
| Fracción | `1/2`, `-3/4` |

---

## 🛠️ Tecnologías

- **HTML5** — estructura semántica
- **CSS3** — diseño responsivo, tema oscuro UAM
- **JavaScript (ES2020)** — lógica de interfaz
- **[Pyodide v0.26](https://pyodide.org)** — Python 3.12 en el navegador
- **[KaTeX v0.16](https://katex.org)** — renderizado matemático
- **Google Fonts** — Inter + JetBrains Mono

---

## 📐 Método numérico

El algoritmo selecciona siempre el **pivote de menor valor absoluto** disponible, registra cada operación elemental en el formato:

$$k = -\frac{b}{p}, \qquad F_i \leftarrow F_i + k \cdot F_j$$

y elimina denominadores multiplicando la fila por el MCM cuando aparecen fracciones intermedias.

---

## 📜 Licencia

Uso académico interno — MTM0120 Álgebra Lineal, UAM Nicaragua.
