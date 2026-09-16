// ============================================================
// interfaz.js
// Lógica de UI: matriz aumentada, validación, tabs, acordeón,
// renderizado de resultados con KaTeX.
// ============================================================

// ──────────────────────────────────────────────
// Estado global de la UI
// ──────────────────────────────────────────────
let numEcuaciones = 3;
let numVariables = 3;

// ──────────────────────────────────────────────
// Inicialización al cargar DOM
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const selEcuaciones = document.getElementById("sel-ecuaciones");
  const selVariables = document.getElementById("sel-variables");
  const btnResolver = document.getElementById("btn-resolver");
  const btnLimpiar = document.getElementById("btn-limpiar");

  // Poblar selectores 1–6
  [selEcuaciones, selVariables].forEach((sel) => {
    for (let i = 1; i <= 6; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i;
      if (i === 3) opt.selected = true;
      sel.appendChild(opt);
    }
  });

  selEcuaciones.addEventListener("change", () => {
    numEcuaciones = parseInt(selEcuaciones.value);
    generarMatriz();
  });

  selVariables.addEventListener("change", () => {
    numVariables = parseInt(selVariables.value);
    generarMatriz();
  });

  btnResolver.addEventListener("click", manejarResolver);
  btnLimpiar.addEventListener("click", limpiarTodo);

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activarTab(btn.dataset.tab);
    });
  });

  generarMatriz();
});

// ──────────────────────────────────────────────
// Generar la cuadrícula de la matriz aumentada
// ──────────────────────────────────────────────
function generarMatriz() {
  const contenedor = document.getElementById("contenedor-matriz");
  contenedor.innerHTML = "";

  // Encabezado de columnas
  const encabezado = document.createElement("div");
  encabezado.className = "mat-header";
  encabezado.style.gridTemplateColumns = _templateColumnas();

  // Columna vacía para las etiquetas de fila
  const vacioLabel = document.createElement("span");
  encabezado.appendChild(vacioLabel);

  for (let j = 0; j < numVariables; j++) {
    const lbl = document.createElement("span");
    lbl.className = "mat-col-label";
    lbl.innerHTML = `x<sub>${j + 1}</sub>`;
    encabezado.appendChild(lbl);
  }

  // Separador visual b
  const sepLbl = document.createElement("span");
  sepLbl.className = "mat-col-label mat-col-b";
  sepLbl.textContent = "b";
  encabezado.appendChild(sepLbl);

  contenedor.appendChild(encabezado);

  // Filas de la matriz
  for (let i = 0; i < numEcuaciones; i++) {
    const fila = document.createElement("div");
    fila.className = "mat-fila";
    fila.style.gridTemplateColumns = _templateColumnas();

    // Etiqueta de fila
    const lblFila = document.createElement("span");
    lblFila.className = "mat-fila-label";
    lblFila.innerHTML = `F<sub>${i + 1}</sub>`;
    fila.appendChild(lblFila);

    // Inputs coeficientes
    for (let j = 0; j < numVariables; j++) {
      const input = _crearInput(`a${i}_${j}`, `x${j + 1}`);
      fila.appendChild(input);
    }

    // Input término independiente (con clase especial)
    const inputB = _crearInput(`b${i}`, `b`);
    inputB.classList.add("celda-b");
    fila.appendChild(inputB);

    contenedor.appendChild(fila);
  }

  // Corchetes decorativos (CSS los posiciona)
  const wrapperMat = document.getElementById("wrapper-matriz");
  wrapperMat.classList.remove("mat-loaded");
  requestAnimationFrame(() => wrapperMat.classList.add("mat-loaded"));
}

function _templateColumnas() {
  return `40px repeat(${numVariables}, 1fr) 1fr`;
}

function _crearInput(id, placeholder) {
  const input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.placeholder = placeholder;
  input.className = "celda-mat";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.spellcheck = false;

  input.addEventListener("input", () => {
    limpiarErrorCelda(input);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      _navegarInput(id, e.shiftKey ? -1 : 1);
    }
    if (e.key === "Tab") {
      // Tab natural ya funciona; solo limpiamos error
    }
  });

  return input;
}

function _navegarInput(idActual, direccion) {
  const todos = Array.from(document.querySelectorAll(".celda-mat"));
  const idx = todos.findIndex((el) => el.id === idActual);
  const siguiente = todos[idx + direccion];
  if (siguiente) siguiente.focus();
}

function limpiarErrorCelda(input) {
  input.classList.remove("celda-error");
  const msg = input.parentElement?.querySelector(".error-msg");
  if (msg) msg.remove();
}

// ──────────────────────────────────────────────
// Leer valores de la cuadrícula
// ──────────────────────────────────────────────
function leerEntradas() {
  const textos_A = [];
  const textos_b = [];
  let valido = true;

  for (let i = 0; i < numEcuaciones; i++) {
    const fila = [];
    for (let j = 0; j < numVariables; j++) {
      const input = document.getElementById(`a${i}_${j}`);
      const val = input.value.trim();
      if (!_esValorValido(val)) {
        _marcarError(input, "Valor inválido");
        valido = false;
      }
      fila.push(val);
    }
    textos_A.push(fila);

    const inputB = document.getElementById(`b${i}`);
    const valB = inputB.value.trim();
    if (!_esValorValido(valB)) {
      _marcarError(inputB, "Valor inválido");
      valido = false;
    }
    textos_b.push(valB);
  }

  return { valido, textos_A, textos_b };
}

function _esValorValido(v) {
  if (v === "") return false;
  // Permite enteros, decimales y fracciones
  return /^-?\d+([.,]\d+)?(\/\d+)?$/.test(v.replace(/\s/g, ""));
}

function _marcarError(input, mensaje) {
  input.classList.add("celda-error");
  // Solo un mensaje por celda
  if (!input.parentElement.querySelector(".error-msg")) {
    const msg = document.createElement("span");
    msg.className = "error-msg";
    msg.textContent = mensaje;
    input.parentElement.appendChild(msg);
  }
}

// ──────────────────────────────────────────────
// Manejar clic en Resolver
// ──────────────────────────────────────────────
async function manejarResolver() {
  ocultarResultados();
  const { valido, textos_A, textos_b } = leerEntradas();

  if (!valido) {
    mostrarBannerError("Corrige los campos marcados antes de continuar.");
    return;
  }

  const btnResolver = document.getElementById("btn-resolver");
  btnResolver.classList.add("cargando");
  btnResolver.disabled = true;

  const bannerError = document.getElementById("banner-error");
  if (bannerError) bannerError.style.display = "none";

  try {
    // Convertir a arrays JS planos para Pyodide
    const resultado = await resolverSistema(textos_A, textos_b);
    renderizarResultado(resultado);

    document.getElementById("seccion-resultado").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (err) {
    mostrarBannerError(err.message);
  } finally {
    btnResolver.classList.remove("cargando");
    btnResolver.disabled = false;
  }
}

function mostrarBannerError(mensaje) {
  let banner = document.getElementById("banner-error");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "banner-error";
    banner.className = "banner-error";
    document.getElementById("seccion-entrada").appendChild(banner);
  }
  banner.textContent = "⚠ " + mensaje;
  banner.style.display = "block";
}

function limpiarTodo() {
  document.querySelectorAll(".celda-mat").forEach((input) => {
    input.value = "";
    limpiarErrorCelda(input);
  });
  ocultarResultados();
  const banner = document.getElementById("banner-error");
  if (banner) banner.style.display = "none";
}

function ocultarResultados() {
  const sec = document.getElementById("seccion-resultado");
  sec.style.display = "none";
  sec.innerHTML = "";
}

// ──────────────────────────────────────────────
// Renderizar resultado completo
// ──────────────────────────────────────────────
function renderizarResultado(r) {
  const sec = document.getElementById("seccion-resultado");
  sec.style.display = "block";
  sec.innerHTML = "";

  // Banner de clasificación
  const tipo = r.tipo; // "unica" | "infinitas" | "inconsistente"
  const banner = document.createElement("div");
  banner.className = `clasificacion-banner tipo-${tipo}`;
  const icono =
    tipo === "unica"
      ? "✓"
      : tipo === "infinitas"
      ? "∞"
      : "✗";
  banner.innerHTML = `
    <span class="cls-icono">${icono}</span>
    <div>
      <div class="cls-titulo">${r.clasificacion}</div>
      <div class="cls-conclusion">${r.conclusion}</div>
    </div>`;
  sec.appendChild(banner);

  // Tabs
  const tabsWrapper = document.createElement("div");
  tabsWrapper.className = "tabs-wrapper";

  const tabsNav = document.createElement("div");
  tabsNav.className = "tabs-nav";
  tabsNav.id = "tabs-nav";

  const tabsContent = document.createElement("div");
  tabsContent.className = "tabs-content";
  tabsContent.id = "tabs-content";

  tabsWrapper.appendChild(tabsNav);
  tabsWrapper.appendChild(tabsContent);
  sec.appendChild(tabsWrapper);

    const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "gauss-jordan", label: "Gauss-Jordan" },
    { id: "gauss", label: "Gauss" },
    { id: "comprobacion", label: "Comprobación" },
    { id: "vectores", label: "Ecuación vectorial" },
  ];

  tabs.forEach(({ id, label }, idx) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (idx === 0 ? " activo" : "");
    btn.dataset.tab = id;
    btn.textContent = label;
    btn.addEventListener("click", () => activarTab(id));
    tabsNav.appendChild(btn);

    const panel = document.createElement("div");
    panel.className = "tab-panel" + (idx === 0 ? " activo" : "");
    panel.id = `tab-${id}`;
    tabsContent.appendChild(panel);
  });

  // Poblar cada tab
  poblarResumen(document.getElementById("tab-resumen"), r);
  poblarGaussJordan(document.getElementById("tab-gauss-jordan"), r);
  poblarGauss(document.getElementById("tab-gauss"), r);
  poblarComprobacion(document.getElementById("tab-comprobacion"), r);
    poblarEcuacionVectorial(
    document.getElementById("tab-vectores"),
    r
  );

  // Renderizar KaTeX en todo el resultado
  renderizarKatex(sec);
}


// ──────────────────────────────────────────────
// Tab: Resumen
// ──────────────────────────────────────────────
const propiedadesForma = [
  "Las filas nulas están debajo de las no nulas.",
  "Cada entrada principal está a la derecha de la anterior.",
  "Hay ceros debajo de cada entrada principal.",
  "Todas las entradas principales son 1.",
  "Cada entrada principal es la única no nula en su columna.",
];

function tablaForma(forma) {
  const filas = propiedadesForma.map((texto, i) => `
    <tr><td>${i + 1}. ${texto}</td><td>${forma.propiedades[i] ? "Sí" : "No"}</td></tr>
  `).join("");
  return `
    <p><strong>${forma.clasificacion}</strong></p>
    <table class="tabla-tema">
      <thead><tr><th>Propiedad</th><th>¿Se cumple?</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function poblarResumen(panel, r) {
  let html = "";

  // Sistema original
  html += `<div class="seccion-resultado">
    <h3 class="sec-titulo">Sistema original</h3>
    <div class="katex-display">$$${sistemaLatex(r.A, r.b)}$$</div>
  </div>`;

  // Matriz aumentada inicial
  html += `<div class="seccion-resultado">
    <h3 class="sec-titulo">Matriz aumentada inicial</h3>
    <div class="katex-display">$$${matrizLatex(r.matriz_inicial, r.numero_variables, r.posiciones_pivote)}$$</div>
  </div>`;

  // Criterio de clasificación
  html += `<div class="seccion-resultado">
    <h3 class="sec-titulo">Criterio de clasificación (Rouché–Frobenius)</h3>
    <div class="katex-display">$$\\operatorname{rango}(A)=${r.rango_A},\\qquad \\operatorname{rango}([A\\mid b])=${r.rango_aumentada},\\qquad n=${r.numero_variables}$$</div>
  </div>`;

  // Forma escalonada reducida (RREF)
  html += `<div class="seccion-resultado">
    <h3 class="sec-titulo">Forma escalonada reducida (RREF)</h3>
    <div class="katex-display">$$${matrizLatex(r.matriz_rref, r.numero_variables, r.posiciones_pivote)}$$</div>
  </div>`;

  // Contenido de formas de matrices integrado en la resolución del sistema.
  html += `<div class="seccion-resultado">
    <h3 class="sec-titulo">Análisis de la forma de la matriz</h3>
    ${tablaForma(r.forma_rref)}
  </div>`;

  // Columnas pivote
   const columnasPivote = r.columnas_pivote.map(
    columna => columna + 1
  );

  const columnasAumentada = r.columnas_pivote_aumentada.map(
    columna => columna + 1
  );

  html += `
    <div class="seccion-resultado">
      <h3 class="sec-titulo">Columnas pivote</h3>

      <p>
        <strong>En A:</strong>
        ${columnasPivote.join(", ") || "Ninguna"}.
      </p>

      <p>
        <strong>En [A | b]:</strong>
        ${columnasAumentada.join(", ") || "Ninguna"}.
      </p>
    </div>
  `;

  // Resultado
  if (r.tipo === "inconsistente") {

    if (r.fila_contradiccion_datos) {
      html += `<div class="seccion-resultado">
        <h3 class="sec-titulo">Fila contradictoria</h3>
        <div class="katex-display">$$${matrizLatex([r.fila_contradiccion_datos], r.numero_variables)}$$</div>
        <div class="katex-display">$$0=${formatFrac(r.fila_contradiccion_datos.at(-1))},\\qquad ${formatFrac(r.fila_contradiccion_datos.at(-1))}\\neq 0$$</div>
      </div>`;
    }
  } else {
    const vlibres = r.variables_libres || [];
    if (r.tipo === "unica") {
      html += `<div class="seccion-resultado">
        <h3 class="sec-titulo">Solución</h3>
        <div class="katex-display">$$${listaSolucionesLatex(r.expresiones_rref, vlibres)}$$</div>
      </div>`;
    } else {
      const nombresLibres = vlibres.map((v) => `x_{${v + 1}}`).join(",\\quad ");
      html += `<div class="seccion-resultado">
        <h3 class="sec-titulo">Variables libres</h3>
        <div class="katex-display">$$${nombresLibres}$$</div>
        <h3 class="sec-titulo">Solución paramétrica general</h3>
        <div class="katex-display">$$${listaSolucionesLatex(r.expresiones_rref, vlibres)}$$</div>
      </div>`;
    }
  }

  panel.innerHTML = html;
}

// ──────────────────────────────────────────────
// Tab: Gauss-Jordan
// ──────────────────────────────────────────────
function poblarGaussJordan(panel, r) {
  let html = `<p class="intro-metodo">Se aplica Gauss para escalonar la matriz y, a continuación, se convierte cada pivote en 1 y se forman ceros encima de cada uno.</p>`;
  const todosPasos = [...r.pasos_gauss, ...r.pasos_jordan];
  html += construirAcordeon(todosPasos, r.numero_variables, 1);
  html += `<div class="seccion-resultado">
    <h3 class="sec-titulo">Resultado final (RREF)</h3>
    <div class="katex-display">$$${matrizLatex(r.matriz_rref, r.numero_variables)}$$</div>
  </div>`;
  panel.innerHTML = html;
}

// ──────────────────────────────────────────────
// Tab: Gauss
// ──────────────────────────────────────────────
function poblarGauss(panel, r) {
  let html = `<p class="intro-metodo">Se aplican operaciones elementales por filas hasta obtener la forma escalonada. Luego se resuelve por sustitución regresiva desde la última ecuación.</p>`;

  html += `<div class="seccion-resultado">
    <h3 class="sec-titulo">Matriz escalonada (resultado de Gauss)</h3>
    <div class="katex-display">$$${matrizLatex(r.matriz_escalonada, r.numero_variables)}$$</div>
  </div>`;

  if (r.tipo !== "inconsistente") {
    html += `<div class="seccion-resultado"><h3 class="sec-titulo">Sustitución regresiva</h3>`;
    const sust = r.pasos_sustitucion || [];
    sust.forEach((paso, idx) => {
      const expr = expresionLatex(paso.variable, paso.expresion, r.variables_libres);
      html += `<div class="sust-paso">
        <span class="sust-num">${idx + 1}.</span>
        Se despeja $x_{${paso.variable + 1}}$ usando la fila ${paso.fila + 1}:
        <div class="katex-display">$$${expr}$$</div>
      </div>`;
    });

    html += `<h3 class="sec-titulo">Resultado obtenido con Gauss</h3>
      <div class="katex-display">$$${listaSolucionesLatex(r.expresiones_gauss, r.variables_libres)}$$</div>
    </div>`;
  }

  panel.innerHTML = html;
}

// ──────────────────────────────────────────────
// Tab: Comprobación
// ──────────────────────────────────────────────
function poblarComprobacion(panel, r) {
  if (r.tipo === "inconsistente") {
    panel.innerHTML = `<p class="intro-metodo">El sistema es inconsistente, por lo tanto no existe solución que pueda sustituirse en todas las ecuaciones.</p>`;
    return;
  }

  let html = "";
  if (r.tipo === "infinitas") {
    html += `<p class="intro-metodo">Se comprueba la solución particular obtenida al asignar <strong>cero</strong> a las variables libres.</p>`;
  }

  const comps = r.comprobaciones || [];
  comps.forEach((comp) => {
    const terminos = comp.terminos
      .filter((t) => t.coeficiente !== "0")
      .map((t, i) => {
        const mag = formatFrac(fracAbs(t.coeficiente));
        const val = formatFrac(t.valor);
        const prod = `${mag}\\left(${val}\\right)`;
        return i === 0
          ? (parseFloat(t.coeficiente) < 0 ? "-" : "") + prod
          : parseFloat(t.coeficiente) < 0
          ? "-" + prod
          : "+" + prod;
      });
    const izq = terminos.length ? terminos.join("") : "0";
    const total = formatFrac(comp.resultado);
    const esp = formatFrac(comp.esperado);
    const sim = comp.cumple ? "\\checkmark" : "\\times";
    const clsCard = comp.cumple ? "comp-card ok" : "comp-card error";

    html += `<div class="${clsCard}">
      <div class="comp-titulo">Ecuación ${comp.ecuacion}</div>
      <div class="katex-display">$$${izq}=${total}=${esp}\\qquad ${sim}$$</div>
    </div>`;
  });

  if (comps.every((c) => c.cumple)) {
    html += `<div class="comp-exito">✓ La solución satisface todas las ecuaciones del sistema original.</div>`;
  }

  panel.innerHTML = html;
}

// ──────────────────────────────────────────────
// Acordeón de pasos
// ──────────────────────────────────────────────
function construirAcordeon(pasos, numVariables, numeroInicial) {
  let html = '<div class="acordeon">';
  pasos.forEach((paso, idx) => {
    const num = idx + numeroInicial;
    const id = `paso-${num}`;
    const opLatex = operacionLatex(paso.operacion);
    const matLatex = paso.mostrar_matriz
      ? `<div class="katex-display">$$${matrizLatex(paso.matriz, numVariables)}$$</div>`
      : "";

    html += `
      <div class="acord-item">
        <button class="acord-header" onclick="toggleAcordeon('${id}')">
          <span class="acord-num">Paso ${num}</span>
          <span class="acord-titulo">${paso.titulo}</span>
          <span class="acord-chevron">▾</span>
        </button>
        <div class="acord-body" id="${id}">
          <div class="katex-display">$$${opLatex}$$</div>
          ${matLatex}
        </div>
      </div>`;
  });
  html += "</div>";
  return html;
}

function toggleAcordeon(id) {
  const body = document.getElementById(id);
  const item = body.closest(".acord-item");
  const abierto = body.classList.contains("abierto");
  body.classList.toggle("abierto", !abierto);
  item.classList.toggle("activo", !abierto);
}

// ──────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────
function activarTab(id) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("activo", btn.dataset.tab === id);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("activo", panel.id === `tab-${id}`);
  });
}

// ──────────────────────────────────────────────
// Renderizado KaTeX
// ──────────────────────────────────────────────
function renderizarKatex(contenedor) {
  if (typeof renderMathInElement === "undefined") return;
  renderMathInElement(contenedor, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
    errorColor: "#E74C3C",
  });
}

// ──────────────────────────────────────────────
// Generadores LaTeX (espejo de formato_latex.py)
// ──────────────────────────────────────────────

/** Fracción "a/b" → LaTeX */
function formatFrac(valor) {
  if (typeof valor !== "string") return String(valor);
  const partes = valor.split("/");
  if (partes.length === 1) return partes[0];
  const num = parseInt(partes[0]);
  const den = parseInt(partes[1]);
  if (den === 1) return String(num);
  const signo = num < 0 ? "-" : "";
  return `${signo}\\frac{${Math.abs(num)}}{${den}}`;
}

function fracAbs(valor) {
  if (typeof valor !== "string") return String(Math.abs(valor));
  const partes = valor.split("/");
  if (partes.length === 1) return String(Math.abs(parseInt(partes[0])));
  return `${Math.abs(parseInt(partes[0]))}/${partes[1]}`;
}

function matrizLatex(matriz, numVariables, posiciones = []) {
  const columnas = numVariables === null
    ? "c".repeat(matriz[0].length)
    : "c".repeat(numVariables) + "|c";

  const filas = matriz.map((fila, i) => {
    return fila.map((valor, j) => {
      const esPivote = posiciones.some(
        ([f, c]) => Number(f) === i && Number(c) === j
      );

      return esPivote
        ? `\\boxed{${formatFrac(valor)}}`
        : formatFrac(valor);
    }).join(" & ");
  }).join(" \\\\ ");

  return (
    `\\left[\\begin{array}{${columnas}}` +
    filas +
    "\\end{array}\\right]"
  );
}

function sistemaLatex(A, b) {
  const ecuaciones = A.map((fila, i) => {
    let izq = "";
    fila.forEach((coef, j) => {
      const c = formatFrac(coef);
      const fracVal = parseFrac(coef);
      if (fracVal === 0) return;
      const mag = formatFrac(fracAbs(coef));
      const variable = `x_{${j + 1}}`;
      const termino = Math.abs(fracVal) === 1 ? variable : `${mag}${variable}`;
      if (izq === "") {
        izq = (fracVal < 0 ? "-" : "") + termino;
      } else {
        izq += fracVal < 0 ? `-${termino}` : `+${termino}`;
      }
    });
    if (izq === "") izq = "0";
    return `${izq}=${formatFrac(b[i])}`;
  });
  return `\\begin{cases}${ecuaciones.join("\\\\")}\\end{cases}`;
}

function expresionLatex(variable, expr, variablesLibres) {
  const constante = expr.constante;
  const terminos = expr.terminos;
  let derecha = "";

  const constVal = parseFrac(constante);
  if (constVal !== 0 || Object.keys(terminos).length === 0) {
    derecha = formatFrac(constante);
  }

  (variablesLibres || []).forEach((libre, tIdx) => {
    const key = String(libre);
    if (!(key in terminos)) return;
    const coef = terminos[key];
    const coefVal = parseFrac(coef);
    const parametro = `t_{${tIdx + 1}}`;
    const mag = formatFrac(fracAbs(coef));
    const termino = Math.abs(coefVal) === 1 ? parametro : `${mag}${parametro}`;
    if (derecha === "") {
      derecha = (coefVal < 0 ? "-" : "") + termino;
    } else {
      derecha += coefVal < 0 ? `-${termino}` : `+${termino}`;
    }
  });

  if (derecha === "") derecha = "0";
  return `x_{${variable + 1}}=${derecha}`;
}

function listaSolucionesLatex(expresiones, variablesLibres) {
  const lineas = expresiones.map((expr, i) =>
    expresionLatex(i, expr, variablesLibres)
  );
  return `\\begin{aligned}${lineas.join("\\\\")}\\end{aligned}`;
}

function operacionLatex(op) {
  const tipo = op.tipo;

  if (tipo === "inicial") return `[A\\mid b]`;

  if (tipo === "retomar")
    return `\\text{Se retoma la matriz escalonada obtenida con Gauss.}`;

  if (tipo === "pivote") {
    const fila = parseInt(op.fila) + 1;
    const columna = parseInt(op.columna) + 1;
    const valor = formatFrac(op.valor);
    const nombreCol = op.aumentada
      ? "la columna aumentada"
      : `la columna ${columna}`;
    return `p=${valor},\\quad \\text{menor valor absoluto no nulo en ${nombreCol}, en }F_{${fila}}`;
  }

  if (tipo === "intercambio") {
    const fa = parseInt(op.fila_a) + 1;
    const fb = parseInt(op.fila_b) + 1;
    return `F_{${fa}}\\leftrightarrow F_{${fb}}`;
  }

  if (tipo === "mcm") {
    const fila = parseInt(op.fila) + 1;
    const m = op.multiplo;
    return `\\operatorname{mcm}=${m},\\qquad F_{${fila}}\\leftarrow ${m}F_{${fila}}`;
  }

  if (tipo === "normalizacion") {
    const fila = parseInt(op.fila) + 1;
    const c = formatFrac(op.constante);
    return `F_{${fila}}\\leftarrow \\left(${c}\\right)F_{${fila}}`;
  }

  if (tipo === "combinacion") {
    const dest = parseInt(op.destino) + 1;
    const orig = parseInt(op.origen) + 1;
    const p = formatFrac(op.p);
    const b = formatFrac(op.b);
    const k = formatFrac(op.k);
    const kVal = parseFrac(op.k);
    let fila;
    if (kVal < 0) {
      fila = `F_{${dest}}\\leftarrow F_{${dest}}-\\left(${formatFrac(fracAbs(op.k))}\\right)F_{${orig}}`;
    } else {
      fila = `F_{${dest}}\\leftarrow F_{${dest}}+\\left(${k}\\right)F_{${orig}}`;
    }
    return `k=-\\dfrac{b}{p}=-\\dfrac{\\left(${b}\\right)}{\\left(${p}\\right)}=${k},\\qquad ${fila}`;
  }

  return `\\text{Operación elemental por filas}`;
}

/** Parsea "a/b" o "a" a número flotante */
function parseFrac(s) {
  if (typeof s === "number") return s;
  if (!s) return 0;
  const parts = String(s).split("/");
  if (parts.length === 1) return parseFloat(parts[0]);
  return parseFloat(parts[0]) / parseFloat(parts[1]);
}

