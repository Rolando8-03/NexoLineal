// app.js
// Interfaz Tailwind + SweetAlert2 de NexoLineal.

const $ = (selector, base = document) => base.querySelector(selector);
const $$ = (selector, base = document) => Array.from(base.querySelectorAll(selector));

const HISTORIAL_KEY = "nexolineal_historial_sistemas_v3";

const SwalNexo = Swal.mixin({
  background: "#0b1728",
  color: "#e2e8f0",
  confirmButtonColor: "#2196f3",
  cancelButtonColor: "#334155",
});

const ToastNexo = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1900,
  timerProgressBar: true,
  background: "#0b1728",
  color: "#e2e8f0",
});

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatFrac(valor) {
  const texto = String(valor ?? "0");
  if (!texto.includes("/")) return texto;
  const [n, d] = texto.split("/");
  const signo = Number(n) < 0 ? "-" : "";
  return `${signo}\\frac{${Math.abs(Number(n))}}{${Math.abs(Number(d))}}`;
}

function matrixLatex(matriz, aumentada = false) {
  if (!matriz || !matriz.length) return "\\begin{pmatrix}\\end{pmatrix}";
  const filas = matriz
    .map(fila => fila.map(formatFrac).join(" & "))
    .join(" \\\\ ");

  if (!aumentada) {
    return `\\begin{pmatrix}${filas}\\end{pmatrix}`;
  }

  const n = matriz[0].length - 1;
  return `\\left[\\begin{array}{${"c".repeat(n)}|c}${filas}\\end{array}\\right]`;
}

function vectorLatex(vector) {
  return `\\begin{pmatrix}${(vector || []).map(formatFrac).join(" \\\\ ")}\\end{pmatrix}`;
}

function renderMath(base = document) {
  if (typeof renderMathInElement !== "function") return;
  renderMathInElement(base, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });
}

function cardTitulo(etiqueta, titulo, descripcion = "") {
  return `
    <div>
      <p class="text-xs font-bold uppercase tracking-[.18em] text-sky-400">${escapeHtml(etiqueta)}</p>
      <h2 class="mt-1 text-xl font-black text-white">${escapeHtml(titulo)}</h2>
      ${descripcion ? `<p class="mt-2 text-sm leading-6 text-slate-400">${escapeHtml(descripcion)}</p>` : ""}
    </div>`;
}

function setBusy(boton, activo, textoActivo = "Procesando…") {
  if (!boton) return;
  if (!boton.dataset.textoNormal) boton.dataset.textoNormal = boton.textContent.trim();
  boton.disabled = activo;
  boton.textContent = activo ? textoActivo : boton.dataset.textoNormal;
}

// Los iconos viven en assets/iconos. Cada botón conserva su texto accesible;
// cambiar la imagen no requiere modificar el código de los cálculos.
function prepararIconos(base = document) {
  $$('button', base).forEach(boton => {
    const descripcion = {
      sistemas: "Resolver sistemas y estudiar combinación e independencia lineal",
      vectores: "Operaciones y propiedades de vectores",
      matrices: "Operaciones, análisis y propiedades de matrices",
      calculo: "Derivadas e integrales",
      basica: "Calculadora aritmética y funciones",
    }[boton.dataset.nav];
    if (!boton.title) boton.title = descripcion || boton.getAttribute("aria-label") || boton.textContent.trim();
    if (boton.dataset.icon || boton.querySelector("img")) return;
    const texto = boton.textContent.trim().toLowerCase();
    const accion = boton.dataset.sistemaTab || boton.dataset.vectorTab || boton.dataset.matrizTab || "";
    let icono = "calcular";
    if (/limpiar|borrar/.test(texto)) icono = "limpiar";
    else if (/ejemplo/.test(texto)) icono = "ejemplo";
    else if (/historial/.test(texto)) icono = "historial";
    else if (/usar |pasar |volver|editar|otro|nuev/.test(texto)) icono = "transferir";
    else if (/propiedad/.test(texto) || accion === "propiedades-ax" || accion === "propiedades") icono = "propiedades";
    else if (/matri/.test(texto)) icono = "matrices";
    else if (/vector/.test(texto)) icono = "vectores";
    else if (/sistema/.test(texto) || accion === "resolver") icono = "sistemas";
    else if (/analiz|combinaci|independen/.test(texto) || accion === "analisis") icono = "analizar";
    boton.dataset.icon = icono;
  });
}

prepararIconos();
new MutationObserver(() => prepararIconos()).observe(document.body, { childList: true, subtree: true });

function mostrarError(error, titulo = "No se pudo completar la operación") {
  SwalNexo.fire({
    icon: "error",
    title: titulo,
    text: error?.message || String(error),
  });
}

// NAVEGACIÓN PRINCIPAL

let vistaActual = "sistemas";

function abrirVista(nombre) {
  vistaActual = nombre;
  $$('[data-vista]').forEach(vista => vista.classList.add("hidden"));
  $(`#vista-${nombre}`)?.classList.remove("hidden");

  $$('[data-nav]').forEach(btn => {
    btn.classList.toggle("nav-activo", btn.dataset.nav === nombre);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$('[data-nav]').forEach(btn => {
  btn.addEventListener("click", () => abrirVista(btn.dataset.nav));
});

// SISTEMAS LINEALES

const sistemaState = {
  filas: 3,
  columnas: 3,
  A: crearMatrizVacia(3, 3),
  b: Array(3).fill(""),
  resultado: null,
  tabResultado: "resumen",
};

const propiedadesAxState = {
  filas: 3,
  columnas: 3,
  A: crearMatrizVacia(3, 3),
  u: Array(3).fill(""),
  v: Array(3).fill(""),
  c: "2",
  resultado: null,
};

function crearMatrizVacia(filas, columnas) {
  return Array.from({ length: filas }, () => Array(columnas).fill(""));
}

function ajustarMatriz(matriz, filas, columnas) {
  const nueva = crearMatrizVacia(filas, columnas);
  for (let i = 0; i < Math.min(filas, matriz.length); i++) {
    for (let j = 0; j < Math.min(columnas, matriz[i]?.length || 0); j++) {
      nueva[i][j] = matriz[i][j];
    }
  }
  return nueva;
}

function opcionesDimension(valor) {
  return Array.from({ length: 6 }, (_, i) => i + 1)
    .map(n => `<option value="${n}" ${n === valor ? "selected" : ""}>${n}</option>`)
    .join("");
}

function inicializarSistema() {
  const selFilas = $("#sel-ecuaciones");
  const selColumnas = $("#sel-variables");
  selFilas.innerHTML = opcionesDimension(sistemaState.filas);
  selColumnas.innerHTML = opcionesDimension(sistemaState.columnas);

  selFilas.addEventListener("change", () => {
    sistemaState.filas = Number(selFilas.value);
    sistemaState.A = ajustarMatriz(sistemaState.A, sistemaState.filas, sistemaState.columnas);
    sistemaState.b = Array.from({ length: sistemaState.filas }, (_, i) => sistemaState.b[i] ?? "");
    sistemaState.resultado = null;
    sistemaState.tabResultado = "resumen";
    renderSistemaGrid();
    $("#resultado-sistema").classList.add("hidden");
  });

  selColumnas.addEventListener("change", () => {
    sistemaState.columnas = Number(selColumnas.value);
    sistemaState.A = ajustarMatriz(sistemaState.A, sistemaState.filas, sistemaState.columnas);
    sistemaState.resultado = null;
    sistemaState.tabResultado = "resumen";
    renderSistemaGrid();
    $("#resultado-sistema").classList.add("hidden");
  });

  $("#btn-resolver-sistema").addEventListener("click", resolverSistemaUI);
  $("#btn-limpiar-sistema").addEventListener("click", () => reiniciarSistema(false));
  $("#btn-ejemplo-sistema").addEventListener("click", cargarEjemploSistema);
  $("#btn-ver-historial").addEventListener("click", mostrarHistorialCompleto);
  $("#btn-borrar-historial").addEventListener("click", borrarHistorialConfirmado);

  renderSistemaGrid();
  renderHistorial();
  mostrarModoEntradaSistema();
}

function mostrarModoResultadoSistema() {
  $("#sistema-configuracion")?.classList.add("hidden");
  $("#resultado-sistema")?.classList.remove("hidden");
}

function mostrarModoEntradaSistema() {
  $("#resultado-sistema")?.classList.add("hidden");
  $("#sistema-configuracion")?.classList.remove("hidden");
}

function renderSistemaGrid() {
  const contenedor = $("#sistema-grid");
  const cols = sistemaState.columnas;
  const template = `42px repeat(${cols}, 74px) 74px`;

  const header = `
    <div class="matrix-grid-header mb-2" style="grid-template-columns:${template}">
      <span></span>
      ${Array.from({ length: cols }, (_, j) => `<span class="text-center text-xs font-bold text-slate-500">x<sub>${j + 1}</sub></span>`).join("")}
      <span class="text-center text-xs font-bold text-amber-400">b</span>
    </div>`;

  const filas = Array.from({ length: sistemaState.filas }, (_, i) => `
    <div class="matrix-grid-row mb-2" style="grid-template-columns:${template}">
      <span class="text-center font-mono text-xs text-slate-600">F${i + 1}</span>
      ${Array.from({ length: cols }, (_, j) => `
        <input class="matrix-grid-input" data-sis-a="${i},${j}" value="${escapeHtml(sistemaState.A[i][j])}" placeholder="0" autocomplete="off" inputmode="decimal">
      `).join("")}
      <input class="matrix-grid-input matrix-b" data-sis-b="${i}" value="${escapeHtml(sistemaState.b[i])}" placeholder="0" autocomplete="off" inputmode="decimal">
    </div>`).join("");

  contenedor.innerHTML = `<div class="matrix-shell scroll-thin">${header}${filas}</div>`;

  $$('[data-sis-a]', contenedor).forEach(input => {
    input.addEventListener("input", () => {
      const [i, j] = input.dataset.sisA.split(",").map(Number);
      sistemaState.A[i][j] = input.value;
      sistemaState.resultado = null;
      $("#resultado-sistema").classList.add("hidden");
    });
  });

  $$('[data-sis-b]', contenedor).forEach(input => {
    input.addEventListener("input", () => {
      sistemaState.b[Number(input.dataset.sisB)] = input.value;
      sistemaState.resultado = null;
      $("#resultado-sistema").classList.add("hidden");
    });
  });
}

function sistemaCompleto() {
  return sistemaState.A.every(fila => fila.every(v => String(v).trim() !== ""))
    && sistemaState.b.every(v => String(v).trim() !== "");
}

async function resolverSistemaUI({ guardar = true, scroll = true } = {}) {
  if (!sistemaCompleto()) {
    return SwalNexo.fire({
      icon: "warning",
      title: "Completa la matriz",
      text: "Todas las celdas de A y b deben tener un valor antes de resolver.",
    });
  }

  const boton = $("#btn-resolver-sistema");
  setBusy(boton, true, "Resolviendo…");

  try {
    const resultado = await resolverSistema(
      sistemaState.A.map(f => f.map(v => String(v).trim())),
      sistemaState.b.map(v => String(v).trim())
    );

    sistemaState.resultado = resultado;
    sistemaState.tabResultado = "resumen";
    renderResultadoSistema(resultado);
    if (guardar) guardarEnHistorial(resultado);

    // Una vez resuelto, la zona de captura desaparece y el resultado
    // utiliza todo el ancho disponible de la aplicación.
    mostrarModoResultadoSistema();

    if (scroll) {
      $("#resultado-sistema").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    mostrarError(error, "No se pudo resolver el sistema");
  } finally {
    setBusy(boton, false);
  }
}

function cargarEjemploSistema() {
  sistemaState.filas = 3;
  sistemaState.columnas = 3;
  sistemaState.A = [
    ["1", "2", "-1"],
    ["2", "-1", "1"],
    ["3", "1", "2"],
  ];
  sistemaState.b = ["3", "3", "10"];
  sistemaState.resultado = null;
  sistemaState.tabResultado = "resumen";
  $("#sel-ecuaciones").value = "3";
  $("#sel-variables").value = "3";
  renderSistemaGrid();
  $("#resultado-sistema").classList.add("hidden");
}

function reiniciarSistema(scroll = true) {
  sistemaState.filas = 3;
  sistemaState.columnas = 3;
  sistemaState.A = crearMatrizVacia(3, 3);
  sistemaState.b = Array(3).fill("");
  sistemaState.resultado = null;
  sistemaState.tabResultado = "resumen";
  $("#sel-ecuaciones").value = "3";
  $("#sel-variables").value = "3";
  renderSistemaGrid();

  const resultado = $("#resultado-sistema");
  resultado.innerHTML = "";
  resultado.classList.add("hidden");
  mostrarModoEntradaSistema();

  if (scroll) {
    $("#vista-sistemas").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ------------------------------------------------------------
// Formato matemático de Sistemas
// ------------------------------------------------------------

function parseFracValor(valor) {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "0");
  const partes = texto.split("/");
  if (partes.length === 1) return Number(partes[0]);
  return Number(partes[0]) / Number(partes[1]);
}

function fracAbsValor(valor) {
  const texto = String(valor ?? "0");
  if (!texto.includes("/")) return String(Math.abs(Number(texto)));
  const [n, d] = texto.split("/");
  return `${Math.abs(Number(n))}/${Math.abs(Number(d))}`;
}

function sistemaLatex(A, b) {
  const ecuaciones = A.map((fila, i) => {
    let izquierda = "";

    fila.forEach((coef, j) => {
      const valor = parseFracValor(coef);
      if (valor === 0) return;

      const magnitud = formatFrac(fracAbsValor(coef));
      const variable = `x_{${j + 1}}`;
      const termino = Math.abs(valor) === 1 ? variable : `${magnitud}${variable}`;

      if (!izquierda) izquierda = `${valor < 0 ? "-" : ""}${termino}`;
      else izquierda += `${valor < 0 ? "-" : "+"}${termino}`;
    });

    return `${izquierda || "0"}=${formatFrac(b[i])}`;
  });

  return `\\begin{cases}${ecuaciones.join(" \\\\ ")}\\end{cases}`;
}

function vectorVariablesLatex(cantidad, simbolo = "x") {
  return `\\begin{pmatrix}${Array.from({ length: cantidad }, (_, i) => `${simbolo}_{${i + 1}}`).join(" \\\\ ")}\\end{pmatrix}`;
}

function ecuacionMatricialLatexSistema(r) {
  return `${matrixLatex(r.A)}${vectorVariablesLatex(r.numero_variables)}=${vectorLatex(r.b)}`;
}

function expresionLatex(indice, expresion, libres) {
  let derecha = "";
  const constante = String(expresion?.constante ?? "0");
  if (constante !== "0" || !expresion?.terminos || Object.keys(expresion.terminos).length === 0) {
    derecha = formatFrac(constante);
  }

  libres.forEach((libre, k) => {
    const coef = expresion?.terminos?.[String(libre)];
    if (coef === undefined) return;
    const num = parseFracValor(coef);
    const abs = formatFrac(fracAbsValor(coef));
    const termino = Math.abs(num) === 1 ? `t_{${k + 1}}` : `${abs}t_{${k + 1}}`;
    if (!derecha) derecha = num < 0 ? `-${termino}` : termino;
    else derecha += num < 0 ? `-${termino}` : `+${termino}`;
  });

  return `x_{${indice + 1}}=${derecha || "0"}`;
}

function solucionLatex(r) {
  if (r.tipo === "inconsistente") return "\\text{No existe solución}";
  return `\\begin{aligned}${r.expresiones_rref.map((e, i) => expresionLatex(i, e, r.variables_libres || [])).join(" \\\\ ")}\\end{aligned}`;
}

function solucionVectorialLatexSistema(r) {
  if (r.tipo === "inconsistente" || !r.solucion_particular) {
    return "\\text{No existe solución}";
  }

  let expresion = `x=${vectorLatex(r.solucion_particular)}`;
  (r.direcciones || []).forEach((direccion, i) => {
    expresion += `+t_{${i + 1}}${vectorLatex(direccion)}`;
  });
  return expresion;
}

const propiedadesFormaSistema = [
  "Las filas nulas están debajo de las no nulas.",
  "Cada entrada principal está a la derecha de la anterior.",
  "Hay ceros debajo de cada entrada principal.",
  "Todas las entradas principales son 1.",
  "Cada entrada principal es la única no nula en su columna.",
];

function tablaFormaSistema(forma) {
  if (!forma) return "";
  return `
    <p class="mt-4 font-bold text-slate-200">${escapeHtml(forma.clasificacion)}</p>
    <div class="mt-3 overflow-x-auto rounded-2xl border border-slate-800">
      <table class="w-full min-w-[650px] text-left text-sm">
        <thead class="bg-slate-800/70 text-slate-200">
          <tr><th class="px-4 py-3">Propiedad</th><th class="px-4 py-3 w-36">¿Se cumple?</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-800 text-slate-400">
          ${propiedadesFormaSistema.map((texto, i) => `
            <tr>
              <td class="px-4 py-3">${i + 1}. ${escapeHtml(texto)}</td>
              <td class="px-4 py-3 ${forma.propiedades?.[i] ? "text-emerald-300" : "text-amber-300"}">${forma.propiedades?.[i] ? "Sí" : "No"}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function operacionFilaLatex(op = {}) {
  const tipo = op.tipo;
  if (tipo === "inicial") return "[A\\mid b]";
  if (tipo === "inicial_matriz") return "A";
  if (tipo === "retomar") return "\\text{Se retoma la matriz escalonada obtenida con Gauss.}";

  if (tipo === "pivote") {
    const fila = Number(op.fila) + 1;
    const columna = Number(op.columna) + 1;
    const valor = formatFrac(op.valor);
    const nombre = op.aumentada ? "la columna aumentada" : `la columna ${columna}`;
    return `p=${valor},\\quad \\text{pivote seleccionado en ${nombre}, fila }F_{${fila}}`;
  }

  if (tipo === "intercambio") {
    return `F_{${Number(op.fila_a) + 1}}\\leftrightarrow F_{${Number(op.fila_b) + 1}}`;
  }

  if (tipo === "mcm") {
    const fila = Number(op.fila) + 1;
    return `\\operatorname{mcm}=${op.multiplo},\\qquad F_{${fila}}\\leftarrow ${op.multiplo}F_{${fila}}`;
  }

  if (tipo === "normalizacion") {
    const fila = Number(op.fila) + 1;
    return `F_{${fila}}\\leftarrow \\left(${formatFrac(op.constante)}\\right)F_{${fila}}`;
  }

  if (tipo === "combinacion") {
    const destino = Number(op.destino) + 1;
    const origen = Number(op.origen) + 1;
    const kValor = parseFracValor(op.k);
    const k = formatFrac(op.k);
    const fila = kValor < 0
      ? `F_{${destino}}\\leftarrow F_{${destino}}-\\left(${formatFrac(fracAbsValor(op.k))}\\right)F_{${origen}}`
      : `F_{${destino}}\\leftarrow F_{${destino}}+\\left(${k}\\right)F_{${origen}}`;

    if (op.p !== undefined && op.b !== undefined) {
      return `k=-\\dfrac{b}{p}=-\\dfrac{\\left(${formatFrac(op.b)}\\right)}{\\left(${formatFrac(op.p)}\\right)}=${k},\\qquad ${fila}`;
    }
    return fila;
  }

  return "\\text{Operación elemental por filas}";
}

function pasosAcordeonSistema(pasos, numeroVariables, prefijo, numeroInicial = 1) {
  if (!pasos?.length) {
    return `<p class="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-500">No fueron necesarias operaciones adicionales.</p>`;
  }

  return `<div class="space-y-2">${pasos.map((paso, idx) => `
    <details class="group rounded-2xl border border-slate-800 bg-slate-950/30 transition open:border-sky-500/30 open:bg-sky-500/[.035]">
      <summary class="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
        <span class="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-extrabold text-sky-400">Paso ${numeroInicial + idx}</span>
        <span class="min-w-0 flex-1 font-bold text-slate-100">${escapeHtml(paso.titulo || "Operación elemental")}</span>
        <span class="text-xs text-slate-600 transition group-open:rotate-180">▼</span>
      </summary>
      <div class="border-t border-slate-800 px-4 py-4">
        <div class="overflow-x-auto rounded-xl border border-slate-800 bg-nexo-950/70 px-3 py-2 text-center">$$${operacionFilaLatex(paso.operacion)}$$</div>
        ${paso.mostrar_matriz !== false ? `<div class="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-nexo-950/70 px-3 py-2 text-center">$$${matrixLatex(paso.matriz, true)}$$</div>` : ""}
      </div>
    </details>`).join("")}</div>`;
}


// Pasos visibles de forma continua.
// Se usa en Gauss y Gauss-Jordan para que el procedimiento
// completo se vea sin abrir cada paso manualmente.
function pasosContinuosSistema(pasos, numeroVariables, numeroInicial = 1) {
  if (!pasos?.length) {
    return `<p class="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-500">No fueron necesarias operaciones adicionales.</p>`;
  }

  return `<div class="space-y-4">${pasos.map((paso, idx) => `
    <article class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30">
      <div class="flex items-center gap-3 border-b border-slate-800 bg-slate-900/45 px-4 py-3.5">
        <span class="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-extrabold text-sky-400">Paso ${numeroInicial + idx}</span>
        <span class="min-w-0 flex-1 font-bold text-slate-100">${escapeHtml(paso.titulo || "Operación elemental")}</span>
      </div>
      <div class="px-4 py-4">
        <div class="overflow-x-auto rounded-xl border border-slate-800 bg-nexo-950/70 px-3 py-3 text-center">$$${operacionFilaLatex(paso.operacion)}$$</div>
        ${paso.mostrar_matriz !== false ? `<div class="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-nexo-950/70 px-3 py-3 text-center">$$${matrixLatex(paso.matriz, true)}$$</div>` : ""}
      </div>
    </article>`).join("")}</div>`;
}

function derechaExpresionLatex(expresion, libres) {
  let derecha = "";
  const constante = String(expresion?.constante ?? "0");
  const terminos = expresion?.terminos || {};

  if (constante !== "0" || Object.keys(terminos).length === 0) {
    derecha = formatFrac(constante);
  }

  (libres || []).forEach((libre, k) => {
    const coef = terminos[String(libre)];
    if (coef === undefined) return;

    const num = parseFracValor(coef);
    const magnitud = formatFrac(fracAbsValor(coef));
    const parametro = `t_{${k + 1}}`;
    const termino = Math.abs(num) === 1 ? parametro : `${magnitud}${parametro}`;

    if (!derecha) derecha = num < 0 ? `-${termino}` : termino;
    else derecha += num < 0 ? `-${termino}` : `+${termino}`;
  });

  return derecha || "0";
}

function terminoCoefVariableLatex(coeficiente, contenido, primero = false) {
  const valor = parseFracValor(coeficiente);
  if (valor === 0) return "";

  const magnitud = formatFrac(fracAbsValor(coeficiente));
  const cuerpo = Math.abs(valor) === 1 ? contenido : `${magnitud}${contenido}`;

  if (primero) return valor < 0 ? `-${cuerpo}` : cuerpo;
  return valor < 0 ? `-${cuerpo}` : `+${cuerpo}`;
}

function ecuacionFilaLatex(fila, numeroVariables) {
  let izquierda = "";

  for (let j = 0; j < numeroVariables; j++) {
    const coef = fila[j];
    if (parseFracValor(coef) === 0) continue;
    izquierda += terminoCoefVariableLatex(coef, `x_{${j + 1}}`, izquierda === "");
  }

  return `${izquierda || "0"}=${formatFrac(fila[numeroVariables])}`;
}

function ecuacionConSustitucionesLatex(fila, paso, r) {
  const numeroVariables = r.numero_variables;
  const pivot = paso.variable;
  let izquierda = "";

  for (let j = 0; j < numeroVariables; j++) {
    const coef = fila[j];
    if (parseFracValor(coef) === 0) continue;

    let contenido = `x_{${j + 1}}`;

    if (j > pivot && r.expresiones_gauss?.[j]) {
      contenido = `\\left(${derechaExpresionLatex(r.expresiones_gauss[j], r.variables_libres || [])}\\right)`;
    }

    izquierda += terminoCoefVariableLatex(coef, contenido, izquierda === "");
  }

  return `${izquierda || "0"}=${formatFrac(fila[numeroVariables])}`;
}

function despejeRegresivoLatex(fila, paso, r) {
  const numeroVariables = r.numero_variables;
  const pivot = paso.variable;
  const coefPivot = fila[pivot];
  const valorPivot = parseFracValor(coefPivot);

  let derecha = formatFrac(fila[numeroVariables]);

  for (let j = pivot + 1; j < numeroVariables; j++) {
    const coef = fila[j];
    const valor = parseFracValor(coef);
    if (valor === 0) continue;

    const expr = r.expresiones_gauss?.[j];
    const contenido = expr
      ? `\\left(${derechaExpresionLatex(expr, r.variables_libres || [])}\\right)`
      : `x_{${j + 1}}`;
    const magnitud = formatFrac(fracAbsValor(coef));
    const producto = Math.abs(valor) === 1 ? contenido : `${magnitud}${contenido}`;

    derecha += valor > 0 ? `-${producto}` : `+${producto}`;
  }

  const final = derechaExpresionLatex(paso.expresion, r.variables_libres || []);

  if (valorPivot === 1) {
    return `x_{${pivot + 1}}=${derecha}=${final}`;
  }

  if (valorPivot === -1) {
    return `x_{${pivot + 1}}=-\\left(${derecha}\\right)=${final}`;
  }

  return `x_{${pivot + 1}}=\\dfrac{${derecha}}{${formatFrac(coefPivot)}}=${final}`;
}

function sustitucionRegresivaDetalladaSistema(r) {
  const pasos = r.pasos_sustitucion || [];
  if (!pasos.length) {
    return `<p class="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-500">No fue necesaria sustitución regresiva.</p>`;
  }

  return `<div class="space-y-4">${pasos.map((paso, i) => {
    const fila = r.matriz_escalonada?.[paso.fila] || [];
    const tieneSustitucion = fila.slice(paso.variable + 1, r.numero_variables)
      .some(v => parseFracValor(v) !== 0);

    return `
      <article class="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <span class="grid h-8 w-8 place-items-center rounded-full bg-sky-500/10 text-xs font-extrabold text-sky-400">${i + 1}</span>
          <div>
            <p class="font-extrabold text-white">Despeje de $x_{${paso.variable + 1}}$</p>
            <p class="text-sm text-slate-500">Se trabaja con la fila ${paso.fila + 1} de la matriz escalonada.</p>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <div>
            <p class="mb-2 text-xs font-extrabold uppercase tracking-[.16em] text-slate-500">Ecuación de la fila</p>
            <div class="math-card">$$${ecuacionFilaLatex(fila, r.numero_variables)}$$</div>
          </div>

          <div>
            <p class="mb-2 text-xs font-extrabold uppercase tracking-[.16em] text-slate-500">${tieneSustitucion ? "Sustitución de valores conocidos" : "Despeje inicial"}</p>
            <div class="math-card">$$${ecuacionConSustitucionesLatex(fila, paso, r)}$$</div>
          </div>
        </div>

        <div class="mt-3">
          <p class="mb-2 text-xs font-extrabold uppercase tracking-[.16em] text-slate-500">Despeje y resultado</p>
          <div class="math-card">$$${despejeRegresivoLatex(fila, paso, r)}$$</div>
        </div>
      </article>`;
  }).join("")}</div>`;
}

function seccionSistema(titulo, contenido, extra = "") {
  return `
    <section class="result-section ${extra}">
      <h3 class="result-section-title">${escapeHtml(titulo)}</h3>
      ${contenido}
    </section>`;
}

function renderResumenSistema(r) {
  const columnasPivote = (r.columnas_pivote || []).map(c => `C${c + 1}`);
  const basicas = (r.variables_basicas || []).map(v => `x<sub>${v + 1}</sub>`);
  const libres = (r.variables_libres || []).map(v => `x<sub>${v + 1}</sub>`);
  const relacion = r.relacion_columnas || [];
  const columnas = r.columnas_vectores || [];
  const terminos = columnas.map((v, i) => `(${formatFrac(relacion[i] || "0")})${vectorLatex(v)}`).join("+");
  const analisisColumnas = seccionSistema("Combinación e independencia lineal", `
    <div class="grid gap-3 lg:grid-cols-2">
      <div class="info-card ${r.es_combinacion_lineal ? "border-emerald-500/30" : "border-amber-500/30"}">
        <strong>¿b es combinación de las columnas de A? ${r.es_combinacion_lineal ? "Sí" : "No"}</strong>
        <span>${r.es_combinacion_lineal ? "Ax=b tiene solución." : "Ax=b no tiene solución."}</span>
        ${r.es_combinacion_lineal ? `<div class="mt-2 overflow-x-auto">$$x=${vectorLatex(r.solucion_particular)}$$</div>` : ""}
        ${r.es_combinacion_lineal ? `<div class="mt-2 overflow-x-auto">$$${combinacionConCoeficientesSistema(columnas, r.solucion_particular)}=${vectorLatex(r.b)}$$</div>` : ""}
      </div>
      <div class="info-card ${r.columnas_linealmente_independientes ? "border-emerald-500/30" : "border-amber-500/30"}">
        <strong>Columnas de A: ${r.columnas_linealmente_independientes ? "independientes" : "dependientes"}</strong>
        <span>${r.columnas_linealmente_independientes ? "Ax=0 solo tiene la solución trivial." : "Ax=0 tiene una solución no trivial."}</span>
        ${relacion.length ? `<div class="mt-2 overflow-x-auto">$$${terminos}=\\mathbf{0}$$</div>` : ""}
      </div>
    </div>
    <p class="mt-3 text-sm text-slate-400">Dimensión del espacio generado por las columnas = rango(A) = ${r.rango_A}. Dimensión del núcleo = ${r.numero_variables - r.rango_A}.</p>`);

  let solucion = "";
  if (r.tipo === "inconsistente") {
    const fila = r.fila_contradiccion_datos;
    solucion = fila ? seccionSistema("Fila contradictoria", `
      <div class="math-card">$$${matrixLatex([fila], true)}$$</div>
      <div class="math-card mt-3">$$0=${formatFrac(fila[fila.length - 1])},\\qquad ${formatFrac(fila[fila.length - 1])}\\neq0$$</div>`) : "";
  } else if (r.tipo === "unica") {
    solucion = seccionSistema("Solución única", `<div class="math-card">$$${solucionLatex(r)}$$</div>`);
  } else {
    const nombres = (r.variables_libres || []).map(v => `x_{${v + 1}}`).join(",\\quad ");
    solucion = seccionSistema("Solución paramétrica general", `
      <p class="mb-3 text-sm text-slate-400">Variables libres: <span class="font-semibold text-slate-200">${libres.length ? libres.join(", ") : "Ninguna"}</span></p>
      ${nombres ? `<div class="math-card mb-3">$$${nombres}$$</div>` : ""}
      <div class="math-card">$$${solucionLatex(r)}$$</div>`);
  }

  return `
    ${seccionSistema("Sistema original", `<div class="math-card">$$${sistemaLatex(r.A, r.b)}$$</div>`)}

    ${analisisColumnas}

    ${seccionSistema("Naturaleza del sistema", `
      <div class="rounded-2xl border border-sky-500/30 bg-sky-500/[.07] p-4">
        <p class="font-extrabold text-sky-300">${escapeHtml(r.naturaleza_sistema)}</p>
        ${r.es_homogeneo ? `<p class="mt-1 text-sm text-slate-400">${r.tiene_solucion_no_trivial ? "Tiene soluciones no triviales porque existen variables libres." : "Tiene únicamente la solución trivial."}</p>` : ""}
      </div>`)}

    ${seccionSistema("Forma matricial", `<div class="math-card">$$${ecuacionMatricialLatexSistema(r)}$$</div>`)}

    ${seccionSistema("Matriz aumentada [A | b]", `<div class="math-card">$$${matrixLatex(r.matriz_inicial, true)}$$</div>`)}

    ${seccionSistema("Criterio de clasificación", `
      <div class="math-card">$$\\operatorname{rango}(A)=${r.rango_A},\\qquad \\operatorname{rango}([A\\mid b])=${r.rango_aumentada},\\qquad n=${r.numero_variables}$$</div>`)}

    ${seccionSistema("Pivotes y variables", `
      <div class="grid gap-3 md:grid-cols-3">
        <div class="info-card"><strong>Columnas pivote de A:</strong><span>${columnasPivote.length ? columnasPivote.join(", ") : "Ninguna"}</span></div>
        <div class="info-card"><strong>Variables básicas:</strong><span>${basicas.length ? basicas.join(", ") : "Ninguna"}</span></div>
        <div class="info-card"><strong>Variables libres:</strong><span>${libres.length ? libres.join(", ") : "Ninguna"}</span></div>
      </div>`)}

    ${seccionSistema("Forma escalonada por filas (REF)", `
      <div class="math-card">$$${matrixLatex(r.matriz_escalonada, true)}$$</div>
      ${tablaFormaSistema(r.forma_escalonada)}`)}

    ${seccionSistema("Forma escalonada reducida por filas (RREF)", `
      <div class="math-card">$$${matrixLatex(r.matriz_rref, true)}$$</div>
      ${tablaFormaSistema(r.forma_rref)}`)}

    ${solucion}`;
}

function renderGaussJordanSistema(r) {
  const gauss = r.pasos_gauss || [];
  const jordan = r.pasos_jordan || [];

  return `
    <div class="method-intro">Primero se aplica eliminación de Gauss para formar ceros debajo de cada pivote. Después, Gauss-Jordan convierte los pivotes en 1 y forma ceros encima de ellos. Todos los pasos se muestran de forma continua.</div>

    ${seccionSistema("Etapa 1 · Eliminación de Gauss", pasosContinuosSistema(gauss, r.numero_variables, 1))}

    ${seccionSistema("Etapa 2 · Reducción de Gauss-Jordan", pasosContinuosSistema(jordan, r.numero_variables, gauss.length + 1))}

    ${seccionSistema("Resultado final (RREF)", `<div class="math-card">$$${matrixLatex(r.matriz_rref, true)}$$</div>`)}
  `;
}

function renderGaussSistema(r) {
  let sustitucion = "";

  if (r.tipo !== "inconsistente") {
    sustitucion = seccionSistema(
      "Sustitución regresiva",
      `
        <div class="mb-4 rounded-2xl border border-sky-500/20 bg-sky-500/[.055] p-4 text-sm leading-6 text-slate-400">
          Se comienza desde la última ecuación con pivote y se sustituyen, hacia arriba, los valores que ya fueron encontrados. Aquí se muestra la ecuación usada, la sustitución y el despeje de cada variable.
        </div>

        ${sustitucionRegresivaDetalladaSistema(r)}

        <h4 class="mt-6 font-extrabold text-white">Resultado obtenido con Gauss</h4>
        <div class="math-card mt-3">$$${r.expresiones_gauss ? `\\begin{aligned}${r.expresiones_gauss.map((e, i) => expresionLatex(i, e, r.variables_libres || [])).join(" \\\\ ")}\\end{aligned}` : solucionLatex(r)}$$</div>
      `
    );
  }

  return `
    <div class="method-intro">Se aplican operaciones elementales por filas hasta obtener una matriz escalonada. Todos los pasos de Gauss aparecen abiertos y, cuando el sistema es consistente, se continúa mostrando el desarrollo completo de la sustitución regresiva.</div>

    ${seccionSistema("Eliminación de Gauss", pasosContinuosSistema(r.pasos_gauss || [], r.numero_variables, 1))}

    ${seccionSistema("Matriz escalonada", `<div class="math-card">$$${matrixLatex(r.matriz_escalonada, true)}$$</div>`)}

    ${sustitucion}
  `;
}

function comprobacionEcuacionLatex(comp) {
  const partes = [];
  (comp.terminos || []).forEach(t => {
    const coef = parseFracValor(t.coeficiente);
    if (coef === 0) return;
    const magnitud = formatFrac(fracAbsValor(t.coeficiente));
    const valor = formatFrac(t.valor);
    const prod = `${magnitud}\\left(${valor}\\right)`;
    if (!partes.length) partes.push(`${coef < 0 ? "-" : ""}${prod}`);
    else partes.push(`${coef < 0 ? "-" : "+"}${prod}`);
  });
  return `${partes.join("") || "0"}=${formatFrac(comp.resultado)}=${formatFrac(comp.esperado)}\\qquad ${comp.cumple ? "\\checkmark" : "\\times"}`;
}

function renderComprobacionSistema(r) {
  if (r.tipo === "inconsistente") {
    return `<div class="method-intro">El sistema es inconsistente, por lo tanto no existe una solución que pueda comprobarse en todas las ecuaciones originales.</div>`;
  }

  const comps = r.comprobaciones || [];
  return `
    ${r.tipo === "infinitas" ? `<div class="method-intro">Se comprueba la solución particular obtenida asignando cero a los parámetros libres.</div>` : ""}
    <div class="grid gap-4 xl:grid-cols-2">
      ${comps.map(comp => `
        <div class="rounded-2xl border ${comp.cumple ? "border-emerald-500/30" : "border-rose-500/30"} bg-slate-950/30 p-4">
          <p class="text-sm font-extrabold text-white">Ecuación ${comp.ecuacion}</p>
          <div class="math-card mt-3">$$${comprobacionEcuacionLatex(comp)}$$</div>
        </div>`).join("")}
    </div>
    ${comps.length && comps.every(c => c.cumple) ? `<div class="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[.08] p-4 text-center font-extrabold text-emerald-300">✓ La solución satisface todas las ecuaciones del sistema original.</div>` : ""}
  `;
}

function renderEcuacionMatricialSistema(r) {
  let solucion = "";
  if (r.tipo === "inconsistente") {
    solucion = `<p class="text-slate-300">La ecuación matricial <span class="font-semibold">$Ax=b$</span> no tiene solución porque el sistema es inconsistente.</p>`;
  } else if (r.tipo === "unica") {
    solucion = `<p class="text-slate-300">La ecuación matricial tiene una única solución.</p><div class="math-card mt-3">$$x=${vectorLatex(r.solucion_particular)}$$</div>`;
  } else {
    solucion = `<p class="text-slate-300">La ecuación matricial tiene infinitas soluciones porque existen variables libres.</p><div class="math-card mt-3">$$${solucionVectorialLatexSistema(r)}$$</div>`;
  }

  return `
    <div class="method-intro">Un sistema de ecuaciones lineales puede escribirse en la forma matricial $Ax=b$, donde A contiene los coeficientes, x contiene las incógnitas y b contiene los términos independientes.</div>
    ${seccionSistema("Matriz de coeficientes A", `<div class="math-card">$$A=${matrixLatex(r.A)}$$</div>`)}
    ${seccionSistema("Vector de incógnitas x", `<div class="math-card">$$x=${vectorVariablesLatex(r.numero_variables)}$$</div>`)}
    ${seccionSistema("Vector b", `<div class="math-card">$$b=${vectorLatex(r.b)}$$</div>`)}
    ${seccionSistema("Ecuación matricial", `<div class="math-card">$$${ecuacionMatricialLatexSistema(r)}$$</div><div class="mt-4">${solucion}</div>`)}
  `;
}

function combinacionConCoeficientesSistema(vectores, coeficientes) {
  const terminos = [];
  vectores.forEach((vector, i) => {
    const coef = coeficientes?.[i] ?? "0";
    const valor = parseFracValor(coef);
    if (valor === 0) return;

    const magnitud = formatFrac(fracAbsValor(coef));
    let termino = Math.abs(valor) === 1
      ? vectorLatex(vector)
      : `\\left(${magnitud}\\right)${vectorLatex(vector)}`;

    if (!terminos.length) termino = `${valor < 0 ? "-" : ""}${termino}`;
    else termino = `${valor < 0 ? "-" : "+"}${termino}`;
    terminos.push(termino);
  });
  return terminos.join("") || "\\mathbf{0}";
}

function renderResultadoSistema(r) {
  const contenedor = $("#resultado-sistema");
  const estilos = {
    unica: {
      borde: "border-emerald-500/30",
      fondo: "bg-emerald-500/[.07]",
      texto: "text-emerald-300",
      icono: "✓",
    },
    infinitas: {
      borde: "border-amber-500/30",
      fondo: "bg-amber-500/[.07]",
      texto: "text-amber-300",
      icono: "∞",
    },
    inconsistente: {
      borde: "border-rose-500/30",
      fondo: "bg-rose-500/[.07]",
      texto: "text-rose-300",
      icono: "✕",
    },
  };
  const estilo = estilos[r.tipo] || estilos.unica;

  const tabs = [
    ["resumen", "Resumen"],
    ["gauss-jordan", "Gauss-Jordan"],
    ["gauss", "Gauss"],
    ["comprobacion", "Comprobación"],
    ["ecuacion-matricial", "Ecuación matricial"],
  ];

  contenedor.innerHTML = `
    <div class="flex flex-col gap-4 rounded-3xl border ${estilo.borde} ${estilo.fondo} p-5 shadow-nexo sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div class="flex min-w-0 items-start gap-4">
        <div class="grid h-12 w-12 shrink-0 place-items-center rounded-full border ${estilo.borde} ${estilo.texto} text-2xl font-black">${estilo.icono}</div>
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[.18em] ${estilo.texto}">Resultado</p>
          <h2 class="mt-1 text-xl font-black text-white sm:text-2xl">${escapeHtml(r.clasificacion)}</h2>
          <p class="mt-2 max-w-5xl text-sm leading-6 text-slate-400">${escapeHtml(r.conclusion)}</p>
        </div>
      </div>
      <button id="btn-otro-sistema" type="button" class="btn-primario shrink-0">Resolver otro sistema</button>
    </div>

    <article class="system-result-shell overflow-hidden rounded-3xl border border-slate-800 bg-nexo-900 shadow-nexo">
      <nav class="system-result-tabs scroll-thin" aria-label="Resultados del sistema">
        ${tabs.map(([id, label]) => `<button type="button" data-system-result-tab="${id}" class="system-result-tab ${id === sistemaState.tabResultado ? "system-result-tab-active" : ""}">${label}</button>`).join("")}
      </nav>

      <div class="p-4 sm:p-6 lg:p-8">
        <div data-system-result-panel="resumen">${renderResumenSistema(r)}</div>
        <div data-system-result-panel="gauss-jordan" class="hidden">${renderGaussJordanSistema(r)}</div>
        <div data-system-result-panel="gauss" class="hidden">${renderGaussSistema(r)}</div>
        <div data-system-result-panel="comprobacion" class="hidden">${renderComprobacionSistema(r)}</div>
        <div data-system-result-panel="ecuacion-matricial" class="hidden">${renderEcuacionMatricialSistema(r)}</div>
      </div>
    </article>`;

  contenedor.classList.remove("hidden");

  $("#btn-otro-sistema").addEventListener("click", () => reiniciarSistema(true));

  $$('[data-system-result-tab]', contenedor).forEach(btn => {
    btn.addEventListener("click", () => activarTabResultadoSistema(btn.dataset.systemResultTab));
  });

  activarTabResultadoSistema(sistemaState.tabResultado || "resumen");
  renderMath(contenedor);
}

function activarTabResultadoSistema(id) {
  sistemaState.tabResultado = id;
  const contenedor = $("#resultado-sistema");
  if (!contenedor) return;

  $$('[data-system-result-tab]', contenedor).forEach(btn => {
    btn.classList.toggle("system-result-tab-active", btn.dataset.systemResultTab === id);
  });

  $$('[data-system-result-panel]', contenedor).forEach(panel => {
    panel.classList.toggle("hidden", panel.dataset.systemResultPanel !== id);
  });

  renderMath(contenedor);
}


// HISTORIAL DE SISTEMAS

function leerHistorial() {
  try {
    const datos = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarHistorial(datos) {
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(datos.slice(0, 20)));
}

function guardarEnHistorial(resultado) {
  const historial = leerHistorial();
  const firma = JSON.stringify({ A: sistemaState.A, b: sistemaState.b });
  const sinDuplicado = historial.filter(item => item.firma !== firma);
  sinDuplicado.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fecha: new Date().toISOString(),
    firma,
    filas: sistemaState.filas,
    columnas: sistemaState.columnas,
    A: sistemaState.A.map(f => [...f]),
    b: [...sistemaState.b],
    tipo: resultado.tipo,
    clasificacion: resultado.clasificacion,
  });
  guardarHistorial(sinDuplicado);
  renderHistorial();
}

function etiquetaFecha(iso) {
  try {
    return new Intl.DateTimeFormat("es-NI", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return "Guardado";
  }
}

function renderHistorial() {
  const historial = leerHistorial();
  const lista = $("#historial-lista");
  const borrar = $("#btn-borrar-historial");

  if (!historial.length) {
    lista.innerHTML = `<div class="rounded-2xl border border-dashed border-slate-800 p-5 text-center text-sm text-slate-500">Todavía no hay sistemas guardados.</div>`;
    borrar.classList.add("hidden");
    return;
  }

  borrar.classList.remove("hidden");
  lista.innerHTML = historial.slice(0, 5).map(item => `
    <button type="button" data-historial-id="${escapeHtml(item.id)}" class="history-row w-full rounded-2xl border border-slate-800 bg-slate-950/30 p-3 text-left transition">
      <div class="flex items-start justify-between gap-3">
        <span class="font-bold text-slate-200">${item.filas}×${item.columnas}</span>
        <span class="text-[11px] text-slate-600">${escapeHtml(etiquetaFecha(item.fecha))}</span>
      </div>
      <p class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">${escapeHtml(item.clasificacion)}</p>
    </button>`).join("");

  $$('[data-historial-id]', lista).forEach(btn => {
    btn.addEventListener("click", () => abrirDesdeHistorial(btn.dataset.historialId));
  });
}

async function abrirDesdeHistorial(id) {
  const item = leerHistorial().find(x => x.id === id);
  if (!item) return;
  sistemaState.filas = item.filas;
  sistemaState.columnas = item.columnas;
  sistemaState.A = item.A.map(f => [...f]);
  sistemaState.b = [...item.b];
  sistemaState.resultado = null;
  $("#sel-ecuaciones").value = String(item.filas);
  $("#sel-variables").value = String(item.columnas);
  renderSistemaGrid();
  abrirVista("sistemas");
  await resolverSistemaUI({ guardar: false, scroll: true });
}

function mostrarHistorialCompleto() {
  const historial = leerHistorial();
  if (!historial.length) {
    return SwalNexo.fire({ icon: "info", title: "Historial vacío", text: "Resuelve un sistema para guardarlo aquí." });
  }

  const html = `<div class="space-y-2 text-left">${historial.map(item => `
    <button type="button" data-modal-history="${escapeHtml(item.id)}" class="history-row w-full rounded-xl border border-slate-700 bg-slate-950/40 p-3 text-left">
      <div class="flex justify-between gap-3"><strong class="text-slate-100">Sistema ${item.filas}×${item.columnas}</strong><span class="text-xs text-slate-500">${escapeHtml(etiquetaFecha(item.fecha))}</span></div>
      <p class="mt-1 text-xs text-slate-400">${escapeHtml(item.clasificacion)}</p>
    </button>`).join("")}</div>`;

  SwalNexo.fire({
    title: "Historial de sistemas",
    html,
    width: 680,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: popup => {
      $$('[data-modal-history]', popup).forEach(btn => {
        btn.addEventListener("click", async () => {
          Swal.close();
          await abrirDesdeHistorial(btn.dataset.modalHistory);
        });
      });
    },
  });
}

async function borrarHistorialConfirmado() {
  const r = await SwalNexo.fire({
    icon: "question",
    title: "¿Borrar el historial?",
    text: "Se eliminarán los sistemas guardados en este navegador.",
    showCancelButton: true,
    confirmButtonText: "Sí, borrar",
    cancelButtonText: "Cancelar",
  });
  if (!r.isConfirmed) return;
  localStorage.removeItem(HISTORIAL_KEY);
  renderHistorial();
  ToastNexo.fire({ icon: "success", title: "Historial eliminado" });
}

// VECTORES

const vectorState = {
  tab: "operaciones",
  dimension: 3,
  u: Array(3).fill(""),
  v: Array(3).fill(""),
  // w se usa en la propiedad asociativa. Inicia en cero para que
  // las operaciones principales puedan calcularse sin pedir más datos.
  w: Array(3).fill("0"),
  c: "2",
  d: "-1",
  resultado: null,
  propiedadesAx: null,
};

function ajustarVector(v, n, relleno = "") {
  return Array.from({ length: n }, (_, i) => v[i] ?? relleno);
}

function etiquetaVectorHTML(simbolo, subindice = null) {
  if (subindice === null) return `<span class="font-mono italic">${simbolo}</span>`;
  return `<span class="font-mono italic">${simbolo}<sub>${subindice}</sub></span>`;
}

function vectorInputHTML(nombreHtml, valores, prefijo, descripcion = "") {
  return `
    <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
      <div class="mb-3 text-center">
        <p class="text-sm font-bold text-white">${nombreHtml}</p>
        ${descripcion ? `<p class="mt-1 text-[11px] text-slate-500">${escapeHtml(descripcion)}</p>` : ""}
      </div>
      <div class="vector-shell mx-auto">
        <div class="space-y-2">
          ${valores.map((valor, i) => `
            <input
              class="matrix-grid-input block"
              data-vector-input="${prefijo},${i}"
              value="${escapeHtml(valor)}"
              placeholder="0"
              autocomplete="off"
              aria-label="Componente ${i + 1} de ${prefijo}"
            >`).join("")}
        </div>
      </div>
    </div>`;
}

function inicializarVectores() {
  renderVectorContenido();
}

function renderVectorContenido() {
  const cont = $("#vector-contenido");
  if (!cont) return;

  renderVectorOperaciones(cont);
}

function sincronizarPropiedadesAxDesdeVectores() {
  const n = vectorState.dimension;
  propiedadesAxState.columnas = n;
  propiedadesAxState.u = ajustarVector(vectorState.u, n);
  propiedadesAxState.v = ajustarVector(vectorState.v, n);
  propiedadesAxState.c = String(vectorState.c || "1");
  propiedadesAxState.A = ajustarMatriz(
    propiedadesAxState.A,
    propiedadesAxState.filas,
    n
  );
  propiedadesAxState.resultado = null;
}

function conectarVectorInputs(base) {
  $$('[data-vector-input]', base).forEach(input => {
    input.addEventListener("input", () => {
      const [nombre, iTexto] = input.dataset.vectorInput.split(",");
      const i = Number(iTexto);
      if (["u", "v", "w"].includes(nombre)) {
        vectorState[nombre][i] = input.value;
        if (nombre === "u" || nombre === "v") sincronizarPropiedadesAxDesdeVectores();
      }

    });
  });
}

function vectorValido(v) {
  return v.every(x => String(x).trim() !== "");
}

function vectorTexto(v) {
  return v.map(x => String(x).trim()).join(" ");
}

function negarVectorTexto(vector) {
  return (vector || []).map(valor => {
    const texto = String(valor ?? "0");
    if (texto === "0" || texto === "0/1") return "0";
    return texto.startsWith("-") ? texto.slice(1) : `-${texto}`;
  });
}

function limpiarVectorOperaciones() {
  vectorState.u = Array(vectorState.dimension).fill("");
  vectorState.v = Array(vectorState.dimension).fill("");
  vectorState.w = Array(vectorState.dimension).fill("0");
  vectorState.c = "2";
  vectorState.d = "-1";
  vectorState.resultado = null;
  vectorState.propiedadesAx = null;
  sincronizarPropiedadesAxDesdeVectores();
  renderVectorContenido();
  window.scrollTo({ top: 0, behavior: "smooth" });
}


function renderVectorOperaciones(cont) {
  if (vectorState.resultado) {
    renderVectorOperacionesResueltas(cont, vectorState.resultado);
    return;
  }

  cont.innerHTML = `
    <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.18em] text-sky-400">Operaciones</p>
          <h2 class="mt-1 text-xl font-black text-white">Ingresa los vectores una sola vez</h2>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Ingresa u y v para calcular suma, resta, igualdad, norma y productos por escalar. Las propiedades y la combinación también se muestran en el resultado.</p>
        </div>
        <label class="shrink-0">
          <span class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Dimensión</span>
          <select id="vector-dim" class="select-nexo">${opcionesDimension(vectorState.dimension)}</select>
        </label>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        ${vectorInputHTML(`Vector ${etiquetaVectorHTML("u")}`, vectorState.u, "u")}
        ${vectorInputHTML(`Vector ${etiquetaVectorHTML("v")}`, vectorState.v, "v")}
      </div>

      <div class="mt-5 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
        <p class="text-sm font-bold text-white">Escalares</p>
        <p class="mt-1 text-xs text-slate-500">Se utilizan para calcular c·u, d·v, c·u + d·v y las propiedades con escalares.</p>
        <div class="mt-3 flex flex-wrap gap-4">
          <label>
            <span class="mb-1 block text-xs font-bold text-slate-500">c</span>
            <input id="vector-c" class="input-nexo w-28" value="${escapeHtml(vectorState.c)}" autocomplete="off">
          </label>
        </div>
      </div>

      <details class="mt-4 rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
        <summary class="cursor-pointer text-sm font-bold text-sky-200">Más datos para propiedades: vector w y escalar d</summary>
        <p class="mt-2 text-xs text-slate-400">Si no los cambias, w es el vector cero y d vale −1.</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          ${vectorInputHTML(`Vector ${etiquetaVectorHTML("w")}`, vectorState.w, "w")}
          <label><span class="mb-1 block text-xs font-bold text-slate-500">d</span><input id="vector-d" class="input-nexo w-full" value="${escapeHtml(vectorState.d)}" autocomplete="off"></label>
        </div>
      </details>

      <div class="mt-5 flex flex-wrap gap-2">
        <button id="btn-vector-calcular" type="button" class="btn-primario">Calcular operaciones</button>
        <button id="btn-vector-limpiar" type="button" class="btn-secundario">Limpiar</button>
      </div>
    </article>`;

  $("#vector-dim", cont).addEventListener("change", e => {
    const n = Number(e.target.value);
    vectorState.dimension = n;
    vectorState.u = ajustarVector(vectorState.u, n);
    vectorState.v = ajustarVector(vectorState.v, n);
    vectorState.w = ajustarVector(vectorState.w, n, "0");
    vectorState.resultado = null;
    vectorState.propiedadesAx = null;
    sincronizarPropiedadesAxDesdeVectores();
    renderVectorContenido();
  });

  $("#vector-c", cont).addEventListener("input", e => {
    vectorState.c = e.target.value;
    sincronizarPropiedadesAxDesdeVectores();
  });
  $("#vector-d", cont).addEventListener("input", e => vectorState.d = e.target.value);
  conectarVectorInputs(cont);
  $("#btn-vector-calcular", cont).addEventListener("click", ejecutarTodasOperacionesVector);
  $("#btn-vector-limpiar", cont).addEventListener("click", limpiarVectorOperaciones);
}

async function ejecutarTodasOperacionesVector() {
  if (!vectorValido(vectorState.u) || !vectorValido(vectorState.v) || !vectorValido(vectorState.w)) {
    return SwalNexo.fire({
      icon: "warning",
      title: "Completa los vectores",
      text: "u, v y w deben tener todas sus componentes. w ya puede quedarse en cero si no necesitas cambiarlo.",
    });
  }

  const boton = $("#btn-vector-calcular");
  setBusy(boton, true, "Calculando…");

  try {
    const r = await ejecutarTema({
      accion: "vectores",
      u: vectorTexto(vectorState.u),
      v: vectorTexto(vectorState.v),
      w: vectorTexto(vectorState.w),
      c: String(vectorState.c || "1"),
      d: String(vectorState.d || "1"),
    });

    vectorState.propiedadesAx = null;
    vectorState.resultado = r;
    sincronizarPropiedadesAxDesdeVectores();
    renderVectorContenido();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    mostrarError(error, "No se pudieron calcular las operaciones vectoriales");
  } finally {
    setBusy(boton, false);
  }
}

function resultadoVectorCard(titulo, formula, extra = "") {
  return `
    <article class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
      <h3 class="text-sm font-black text-white">${titulo}</h3>
      <div class="mt-3 overflow-x-auto text-center">$$${formula}$$</div>
      ${extra}
    </article>`;
}

function renderVectorOperacionesResueltas(cont, r) {
  const menosU = negarVectorTexto(r.u);
  const igualdad = r.iguales
    ? `<span class="text-emerald-300">Sí, $\\mathbf{u}=\\mathbf{v}$.</span>`
    : `<span class="text-amber-300">No, $\\mathbf{u}\\neq\\mathbf{v}$.</span>`;

  cont.innerHTML = `
    <section class="space-y-5">
      <article class="flex flex-col gap-4 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5 shadow-nexo sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.18em] text-sky-300">Resultado</p>
          <h2 class="mt-1 text-2xl font-black text-white">Operaciones con vectores</h2>
        </div>
        <button id="btn-vector-nuevo" type="button" class="btn-primario shrink-0">Calcular otros vectores</button>
      </article>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${resultadoVectorCard("Suma", `\\mathbf{u}+\\mathbf{v}=${vectorLatex(r.suma)}`)}
        ${resultadoVectorCard("Resta", `\\mathbf{u}-\\mathbf{v}=${vectorLatex(r.resta)}`)}
        ${resultadoVectorCard("Igualdad", `\\mathbf{u}=${vectorLatex(r.u)},\\qquad \\mathbf{v}=${vectorLatex(r.v)}`, `<p class="mt-3 text-center text-sm font-bold">${igualdad}</p>`)}
        ${resultadoVectorCard("Vector opuesto", `-\\mathbf{u}=${vectorLatex(menosU)}`)}
        ${resultadoVectorCard("Norma", `\\lVert\\mathbf{u}\\rVert=\\sqrt{${formatFrac(r.norma2)}}`)}
        ${resultadoVectorCard("Norma de v", `\\lVert\\mathbf{v}\\rVert=\\sqrt{${formatFrac(r.norma_v2)}}`)}
        ${resultadoVectorCard("Producto punto", `\\mathbf{u}\\cdot\\mathbf{v}=${formatFrac(r.producto_punto)}`)}
        ${resultadoVectorCard("Opuesto de v", `-\\mathbf{v}=${vectorLatex(r.menos_v)}`)}
        ${resultadoVectorCard("Menos dos veces v", `-2\\mathbf{v}=${vectorLatex(r.menos_2v)}`)}
        ${resultadoVectorCard("u menos dos veces v", `\\mathbf{u}-2\\mathbf{v}=${vectorLatex(r.u_menos_2v)}`)}
        ${resultadoVectorCard("Multiplicación por escalar", `(${formatFrac(r.c)})\\mathbf{u}=${vectorLatex(r.cu)}`)}
        ${resultadoVectorCard("Segundo producto por escalar", `(${formatFrac(r.d)})\\mathbf{v}=${vectorLatex(r.dv)}`)}
        ${resultadoVectorCard(
          "Combinación lineal",
          `(${formatFrac(r.c)})\\mathbf{u}+(${formatFrac(r.d)})\\mathbf{v}=${vectorLatex(r.combinacion)}`,
          `<p class="mt-3 text-center text-sm font-bold text-emerald-300">Sí. El vector obtenido es una combinación lineal de u y v, porque se construye como c·u + d·v.</p>`
        )}
      </div>

      ${matrizAxInlineHTML()}

      <details class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        <summary class="cursor-pointer text-lg font-black text-white">Ver las 8 propiedades algebraicas</summary>
        <p class="mt-2 text-sm text-slate-400">Se comprueban automáticamente con los vectores y escalares ingresados.</p>
        <div class="mt-5 grid gap-3 lg:grid-cols-2">
          ${(r.propiedades || []).map((p, i) => `
            <div class="rounded-2xl border ${p.cumple ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"} p-4">
              <div class="flex items-start gap-3">
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-500/10 text-xs font-black text-sky-300">${i + 1}</span>
                <div class="min-w-0">
                  <p class="font-bold ${p.cumple ? "text-emerald-300" : "text-rose-300"}">${p.cumple ? "✓" : "✗"} ${escapeHtml(p.nombre)}</p>
                  <div class="mt-2 overflow-x-auto text-center">$$${vectorLatex(p.izquierda)}=${vectorLatex(p.derecha)}$$</div>
                </div>
              </div>
            </div>`).join("")}
        </div>
      </details>
    </section>`;

  $("#btn-vector-nuevo", cont).addEventListener("click", limpiarVectorOperaciones);
  conectarAxInline(cont);
  renderMath(cont);
}

function matrizAxInlineHTML() {
  const p = propiedadesAxState;
  const n = vectorState.dimension;
  p.columnas = n;
  p.A = ajustarMatriz(p.A, p.filas, n);
  const columnas = `36px repeat(${n}, 72px)`;
  return `
    <article class="rounded-3xl border border-sky-500/20 bg-nexo-900 p-5 shadow-nexo sm:p-6">
      ${cardTitulo("Producto matriz-vector", "Propiedades de Ax", "Ingresa A aquí; u y v siguen siendo los vectores que acabas de utilizar.")}
      <div class="mt-4 flex items-center gap-4">
        <label><span class="mb-1 block text-xs font-bold text-slate-400">Filas de A</span>
          <select id="vector-ax-filas" class="select-nexo">${opcionesDimension(p.filas)}</select>
        </label>
        <p class="text-sm text-slate-400">A tiene ${n} columna${n === 1 ? "" : "s"} porque u y v tienen ${n} componente${n === 1 ? "" : "s"}.</p>
      </div>
      <div class="mt-4 overflow-x-auto">
        <div class="matrix-shell compact-matrix">
          ${Array.from({length: p.filas}, (_, i) => `
            <div class="matrix-grid-row mb-2" style="grid-template-columns:${columnas}">
              <span class="text-xs text-slate-500">F${i + 1}</span>
              ${Array.from({length:n}, (_, j) => `<input data-vector-ax="${i},${j}" class="matrix-grid-input" value="${escapeHtml(p.A[i][j])}" placeholder="0" autocomplete="off" aria-label="A fila ${i + 1}, columna ${j + 1}">`).join("")}
            </div>`).join("")}
        </div>
      </div>
      <div id="vector-ax-resultado" class="mt-4 rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-sm text-slate-400" aria-live="polite">Completa A para comprobar a) A(u+v)=Au+Av y b) A(cu)=c(Au).</div>
    </article>`;
}

let revisionAx = 0;
let esperaAx = null;

function conectarAxInline(cont) {
  const p = propiedadesAxState;
  $("#vector-ax-filas", cont)?.addEventListener("change", e => {
    p.filas = Number(e.target.value);
    p.A = ajustarMatriz(p.A, p.filas, p.columnas);
    renderVectorContenido();
  });
  $$('[data-vector-ax]', cont).forEach(input => input.addEventListener("input", () => {
    const [i, j] = input.dataset.vectorAx.split(",").map(Number);
    p.A[i][j] = input.value;
    actualizarAxInline(cont);
  }));
  actualizarAxInline(cont);
}

function actualizarAxInline(cont) {
  const p = propiedadesAxState;
  const panel = $("#vector-ax-resultado", cont);
  const revision = ++revisionAx;
  clearTimeout(esperaAx);
  if (!panel) return;
  if (!p.A.every(fila => fila.every(valor => String(valor).trim() !== ""))) {
    panel.textContent = "Completa A para comprobar las dos propiedades.";
    return;
  }
  panel.textContent = "Comprobando…";
  esperaAx = setTimeout(async () => {
    try {
      const r = await ejecutarTema({
        accion: "propiedades_matriz_vector",
        filas: p.filas, columnas: p.columnas, A: p.A,
        u: vectorState.u, v: vectorState.v, c: vectorState.c,
      });
      if (revision !== revisionAx || !panel.isConnected) return;
      p.resultado = r;
      matrixState.matrices.A = {
        filas: p.filas, columnas: p.columnas,
        valores: p.A.map(fila => fila.slice()),
      };
      matrixState.resultados = {};
      matrixState.modos = { operaciones: "entrada", analisis: "entrada", propiedades: "entrada" };
      guardarMemoriaMatrices();
      panel.innerHTML = `
        <p class="font-bold text-white">${r.A.length} × ${r.A[0].length}: ambas propiedades</p>
        <div class="mt-3 grid gap-3 lg:grid-cols-2">
          ${(r.propiedades || []).map((prop, i) => `
            <div class="rounded-xl border ${prop.cumple ? "border-emerald-500/25" : "border-rose-500/25"} p-3">
              <p class="font-bold ${prop.cumple ? "text-emerald-300" : "text-rose-300"}">${i === 0 ? "a) A(u+v)=Au+Av" : "b) A(cu)=c(Au)"} · ${prop.cumple ? "✓" : "✗"}</p>
              <div class="mt-2 overflow-x-auto text-center">$$${vectorLatex(prop.izquierda)}${prop.cumple ? "=" : "\\neq"}${vectorLatex(prop.derecha)}$$</div>
            </div>`).join("")}
        </div>`;
      renderMath(panel);
    } catch (error) {
      if (revision === revisionAx && panel.isConnected) panel.textContent = error.message || String(error);
    }
  }, 250);
}

// MATRICES

const MATRICES_MEMORIA_KEY = "nexolineal_matrices_v2";

const matrixState = {
  tab: "operaciones",
  matrices: {
    A: { filas: 3, columnas: 3, valores: crearMatrizVacia(3, 3) },
    B: { filas: 3, columnas: 3, valores: crearMatrizVacia(3, 3) },
    C: { filas: 3, columnas: 3, valores: crearMatrizVacia(3, 3) },
  },
  c: "2",
  d: "3",
  propiedad: "A + B = B + A",
  resultados: {},
  modos: {
    operaciones: "entrada",
    analisis: "entrada",
    propiedades: "entrada",
  },
};

const propiedadesConfig = {
  "A + B = B + A": { matrices: ["A", "B"], escalares: [] },
  "(A + B) + C = A + (B + C)": { matrices: ["A", "B", "C"], escalares: [] },
  "A + 0 = A": { matrices: ["A"], escalares: [] },
  "c(A + B) = cA + cB": { matrices: ["A", "B"], escalares: ["c"] },
  "(c + d)A = cA + dA": { matrices: ["A"], escalares: ["c", "d"] },
  "c(dA) = (cd)A": { matrices: ["A"], escalares: ["c", "d"] },
  "A(BC) = (AB)C": { matrices: ["A", "B", "C"], escalares: [] },
  "A(B + C) = AB + AC": { matrices: ["A", "B", "C"], escalares: [] },
  "(B + C)A = BA + CA": { matrices: ["A", "B", "C"], escalares: [] },
  "c(AB) = (cA)B": { matrices: ["A", "B"], escalares: ["c"] },
  "c(AB) = A(cB)": { matrices: ["A", "B"], escalares: ["c"] },
  "I_m A = A": { matrices: ["A"], escalares: [] },
  "A I_n = A": { matrices: ["A"], escalares: [] },
  "(A^T)^T = A": { matrices: ["A"], escalares: [] },
  "(A + B)^T = A^T + B^T": { matrices: ["A", "B"], escalares: [] },
  "(cA)^T = cA^T": { matrices: ["A"], escalares: ["c"] },
  "(AB)^T = B^T A^T": { matrices: ["A", "B"], escalares: [] },
};

const propiedadesGrupos = [
  {
    titulo: "Suma y escalares",
    propiedades: [
      "A + B = B + A",
      "(A + B) + C = A + (B + C)",
      "A + 0 = A",
      "c(A + B) = cA + cB",
      "(c + d)A = cA + dA",
      "c(dA) = (cd)A",
    ],
  },
  {
    titulo: "Producto matricial",
    propiedades: [
      "A(BC) = (AB)C",
      "A(B + C) = AB + AC",
      "(B + C)A = BA + CA",
      "c(AB) = (cA)B",
      "c(AB) = A(cB)",
      "I_m A = A",
      "A I_n = A",
    ],
  },
  {
    titulo: "Transpuesta",
    propiedades: [
      "(A^T)^T = A",
      "(A + B)^T = A^T + B^T",
      "(cA)^T = cA^T",
      "(AB)^T = B^T A^T",
    ],
  },
];

const propiedadesNombres = {
  "A + B = B + A": "Ley conmutativa de la suma",
  "(A + B) + C = A + (B + C)": "Ley asociativa de la suma",
  "A + 0 = A": "Identidad aditiva (matriz cero)",
  "c(A + B) = cA + cB": "Distributiva del escalar sobre la suma de matrices",
  "(c + d)A = cA + dA": "Distributiva de la suma de escalares",
  "c(dA) = (cd)A": "Asociativa del producto de escalares",
  "A(BC) = (AB)C": "Ley asociativa de la multiplicación",
  "A(B + C) = AB + AC": "Ley distributiva izquierda",
  "(B + C)A = BA + CA": "Ley distributiva derecha",
  "c(AB) = (cA)B": "Multiplicación por escalar: r(AB) = (rA)B",
  "c(AB) = A(cB)": "Multiplicación por escalar: r(AB) = A(rB)",
  "I_m A = A": "Identidad para la multiplicación de matrices (izquierda)",
  "A I_n = A": "Identidad para la multiplicación de matrices (derecha)",
  "(A^T)^T = A": "Transpuesta de la transpuesta",
  "(A + B)^T = A^T + B^T": "Transpuesta de una suma",
  "(cA)^T = cA^T": "Transpuesta de un múltiplo escalar",
  "(AB)^T = B^T A^T": "Transpuesta de un producto (se invierte el orden)",
};

function nombrePropiedad(formula) {
  return propiedadesNombres[formula] || "";
}

function guardarMemoriaMatrices() {
  try {
    localStorage.setItem(
      MATRICES_MEMORIA_KEY,
      JSON.stringify({
        matrices: matrixState.matrices,
        c: matrixState.c,
        d: matrixState.d,
        propiedad: matrixState.propiedad,
        tab: matrixState.tab,
      })
    );
  } catch (error) {
    console.warn("No se pudo guardar la memoria de matrices:", error);
  }
}

function restaurarMemoriaMatrices() {
  try {
    const guardado = JSON.parse(localStorage.getItem(MATRICES_MEMORIA_KEY) || "null");
    if (!guardado || !guardado.matrices) return;

    ["A", "B", "C"].forEach(nombre => {
      const origen = guardado.matrices[nombre];
      if (!origen) return;

      const filas = Math.min(6, Math.max(1, Number(origen.filas) || 3));
      const columnas = Math.min(6, Math.max(1, Number(origen.columnas) || 3));
      const valores = crearMatrizVacia(filas, columnas);

      for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
          valores[i][j] = String(origen.valores?.[i]?.[j] ?? "");
        }
      }

      matrixState.matrices[nombre] = { filas, columnas, valores };
    });

    matrixState.c = String(guardado.c ?? "2");
    matrixState.d = String(guardado.d ?? "3");
    if (propiedadesConfig[guardado.propiedad]) matrixState.propiedad = guardado.propiedad;
    if (["operaciones", "analisis", "propiedades", "programa5"].includes(guardado.tab)) matrixState.tab = guardado.tab;
  } catch (error) {
    console.warn("No se pudo restaurar la memoria de matrices:", error);
  }
}

function limpiarMatricesRegistradas(nombres = ["A", "B", "C"]) {
  nombres.forEach(nombre => {
    const m = matrixState.matrices[nombre];
    m.valores = crearMatrizVacia(m.filas, m.columnas);
  });
  matrixState.resultados = {};
  matrixState.modos = { operaciones: "entrada", analisis: "entrada", propiedades: "entrada" };
  guardarMemoriaMatrices();
}

async function confirmarLimpiarMatrices(nombres = ["A", "B", "C"]) {
  const respuesta = await SwalNexo.fire({
    icon: "question",
    title: "¿Limpiar matrices?",
    text: "Se borrarán los valores guardados de las matrices seleccionadas.",
    showCancelButton: true,
    confirmButtonText: "Sí, limpiar",
    cancelButtonText: "Cancelar",
  });

  if (!respuesta.isConfirmed) return false;
  limpiarMatricesRegistradas(nombres);
  renderMatrizContenido();
  return true;
}

function inicializarMatrices() {
  restaurarMemoriaMatrices();

  $$('[data-matriz-tab]').forEach(btn => {
    btn.addEventListener("click", () => {
      matrixState.tab = btn.dataset.matrizTab;
      $$('[data-matriz-tab]').forEach(b => b.classList.toggle("subnav-activo", b === btn));
      guardarMemoriaMatrices();
      renderMatrizContenido();
    });
  });

  $$('[data-matriz-tab]').forEach(btn => {
    btn.classList.toggle("subnav-activo", btn.dataset.matrizTab === matrixState.tab);
  });

  renderMatrizContenido();
}

function matrizCardHTML(nombre, { titulo = `Matriz ${nombre}`, contexto = "mat" } = {}) {
  const m = matrixState.matrices[nombre];
  const template = `38px repeat(${m.columnas}, 72px)`;

  return `
    <article class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4" data-matrix-card="${nombre}">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="font-black text-white">${escapeHtml(titulo)}</p>
          <p class="mt-1 font-mono text-xs text-slate-500">${m.filas} × ${m.columnas}</p>
        </div>
        <div class="flex gap-2">
          <label>
            <span class="mb-1 block text-[10px] font-bold text-slate-600">FILAS</span>
            <select class="select-nexo h-9 min-h-0 py-1" data-m-dim="${nombre},f">${opcionesDimension(m.filas)}</select>
          </label>
          <label>
            <span class="mb-1 block text-[10px] font-bold text-slate-600">COLUMNAS</span>
            <select class="select-nexo h-9 min-h-0 py-1" data-m-dim="${nombre},c">${opcionesDimension(m.columnas)}</select>
          </label>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto pb-2">
        <div class="matrix-shell compact-matrix mx-auto" data-matrix-context="${escapeHtml(contexto)}">
          <div class="matrix-grid-header mb-2" style="grid-template-columns:${template}">
            <span></span>
            ${Array.from({ length: m.columnas }, (_, j) => `<span class="text-center text-xs font-bold text-slate-600">C<sub>${j + 1}</sub></span>`).join("")}
          </div>
          ${Array.from({ length: m.filas }, (_, i) => `
            <div class="matrix-grid-row mb-2" style="grid-template-columns:${template}">
              <span class="text-center font-mono text-xs text-slate-600">F<sub>${i + 1}</sub></span>
              ${Array.from({ length: m.columnas }, (_, j) => `<input class="matrix-grid-input" data-m-cell="${nombre},${i},${j}" value="${escapeHtml(m.valores[i][j])}" placeholder="0" autocomplete="off" aria-label="${nombre}, fila ${i + 1}, columna ${j + 1}">`).join("")}
            </div>`).join("")}
        </div>
      </div>
    </article>`;
}

function conectarMatrices(base) {
  $$('[data-m-cell]', base).forEach(input => {
    input.addEventListener("input", () => {
      const [nombre, i, j] = input.dataset.mCell.split(",");
      matrixState.matrices[nombre].valores[Number(i)][Number(j)] = input.value;
      matrixState.resultados = {};
      matrixState.modos = { operaciones: "entrada", analisis: "entrada", propiedades: "entrada" };
      guardarMemoriaMatrices();
    });
  });

  $$('[data-m-dim]', base).forEach(select => {
    select.addEventListener("change", () => {
      const [nombre, tipo] = select.dataset.mDim.split(",");
      const m = matrixState.matrices[nombre];
      const filas = tipo === "f" ? Number(select.value) : m.filas;
      const columnas = tipo === "c" ? Number(select.value) : m.columnas;
      m.valores = ajustarMatriz(m.valores, filas, columnas);
      m.filas = filas;
      m.columnas = columnas;
      matrixState.resultados = {};
      matrixState.modos = { operaciones: "entrada", analisis: "entrada", propiedades: "entrada" };
      guardarMemoriaMatrices();
      renderMatrizContenido();
    });
  });
}

function matrizTexto(nombre) {
  return matrixState.matrices[nombre].valores
    .map(f => f.map(v => String(v).trim()).join(" "))
    .join("\n");
}

function matrizCompleta(nombre) {
  return matrixState.matrices[nombre].valores.every(f => f.every(v => String(v).trim() !== ""));
}

function renderMatrizContenido() {
  const cont = $("#matriz-contenido");
  if (!cont) return;

  if (matrixState.tab === "operaciones") renderMatrizOperaciones(cont);
  else if (matrixState.tab === "programa5") renderPrograma5(cont);
  else if (matrixState.tab === "analisis") renderMatrizAnalisis(cont);
  else renderMatrizPropiedades(cont);
}

async function ejecutarMatricesUI(clave, nombres, extra = {}) {
  if (!nombres.every(matrizCompleta)) {
    throw new Error("Completa todas las celdas de las matrices necesarias.");
  }

  const datos = { accion: "matrices", A: matrizTexto("A"), ...extra };
  if (nombres.includes("B")) datos.B = matrizTexto("B");
  if (nombres.includes("C")) datos.C = matrizTexto("C");

  const r = await ejecutarTema(datos);
  matrixState.resultados[clave] = r;
  return r;
}

function compatibilidadMatricesHTML() {
  const A = matrixState.matrices.A;
  const B = matrixState.matrices.B;
  const misma = A.filas === B.filas && A.columnas === B.columnas;
  const AB = A.columnas === B.filas;
  const BA = B.columnas === A.filas;

  return `
    <div class="grid gap-2 sm:grid-cols-3">
      <div class="rounded-xl border ${misma ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-300" : "border-amber-500/25 bg-amber-500/5 text-amber-300"} p-3 text-sm">
        <strong class="block">Suma y resta</strong>
        ${misma ? `Definidas · ${A.filas}×${A.columnas}` : `No definidas · A ${A.filas}×${A.columnas}, B ${B.filas}×${B.columnas}`}
      </div>
      <div class="rounded-xl border ${AB ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-300" : "border-amber-500/25 bg-amber-500/5 text-amber-300"} p-3 text-sm">
        <strong class="block">Producto AB</strong>
        ${AB ? `Definido · resultado ${A.filas}×${B.columnas}` : `No definido · ${A.columnas} ≠ ${B.filas}`}
      </div>
      <div class="rounded-xl border ${BA ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-300" : "border-slate-800 bg-slate-950/30 text-slate-500"} p-3 text-sm">
        <strong class="block">Producto BA</strong>
        ${BA ? `Definido · resultado ${B.filas}×${A.columnas}` : `No definido · ${B.columnas} ≠ ${A.filas}`}
      </div>
    </div>`;
}

function renderMatrizOperaciones(cont) {
  const resultado = matrixState.resultados.operaciones;

  if (matrixState.modos.operaciones === "resultado" && resultado) {
    renderResultadoOperacionesMatrices(cont, resultado);
    return;
  }

  cont.innerHTML = `
    <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        ${cardTitulo("Operaciones", "Calcula todo con A y B", "Ingresa las matrices una sola vez. NexoLineal conserva A y B al cambiar de apartado y también al volver a abrir la aplicación.")}
        <label class="w-full sm:w-36">
          <span class="mb-1 block text-xs font-bold text-slate-500">ESCALAR c</span>
          <input id="mat-c" class="input-nexo w-full" value="${escapeHtml(matrixState.c)}" placeholder="2" autocomplete="off">
        </label>
      </div>

      <div class="mt-5">${compatibilidadMatricesHTML()}</div>

      <div class="mt-5 grid gap-4 2xl:grid-cols-2">
        ${matrizCardHTML("A", { contexto: "operaciones" })}
        ${matrizCardHTML("B", { contexto: "operaciones" })}
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <button id="btn-mat-todo" class="btn-primario" type="button">Calcular operaciones</button>
        <button id="btn-mat-limpiar" class="btn-secundario" type="button">Limpiar A y B</button>
      </div>
    </article>`;

  $("#mat-c", cont)?.addEventListener("input", e => {
    matrixState.c = e.target.value;
    matrixState.resultados.operaciones = null;
    guardarMemoriaMatrices();
  });

  conectarMatrices(cont);
  $("#btn-mat-todo", cont)?.addEventListener("click", ejecutarTodasOperacionesMatrices);
  $("#btn-mat-limpiar", cont)?.addEventListener("click", () => confirmarLimpiarMatrices(["A", "B"]));
}

async function ejecutarTodasOperacionesMatrices() {
  const boton = $("#btn-mat-todo");
  setBusy(boton, true, "Calculando…");

  try {
    const r = await ejecutarMatricesUI("operaciones", ["A", "B"], { c: matrixState.c || "1" });
    matrixState.modos.operaciones = "resultado";
    guardarMemoriaMatrices();
    renderMatrizContenido();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    mostrarError(error, "No se pudieron calcular las operaciones");
  } finally {
    setBusy(boton, false);
  }
}

function pasosProductoHTML(pasos = []) {
  if (!pasos.length) return "";
  return `
    <div class="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      ${pasos.map(p => {
        const suma = (p.terminos || []).map(t => `(${formatFrac(t.a)})(${formatFrac(t.b)})`).join("+");
        return `<div class="rounded-xl border border-slate-800 bg-slate-950/35 p-3 text-center">$$c_{${p.fila + 1}${p.columna + 1}}=${suma}=${formatFrac(p.resultado)}$$</div>`;
      }).join("")}
    </div>`;
}

const teoremasPresentacion = [
  { clave: "(A^T)^T = A", latex: "(A^T)^T = A" },
  { clave: "(A + B)^T = A^T + B^T", latex: "(A+B)^T = A^T + B^T" },
  { clave: "(cA)^T = cA^T", latex: "(cA)^T = cA^T" },
  { clave: "(AB)^T = B^T A^T", latex: "(AB)^T = B^T A^T" },
  { clave: "c(AB) = (cA)B", latex: "c(AB) = (cA)B" },
  { clave: "c(AB) = A(cB)", latex: "c(AB) = A(cB)" },
  { clave: "I_m A = A", latex: "I_m A = A" },
  { clave: "A I_n = A", latex: "A I_n = A" },
];

const teoremasConC = [
  ["A(BC) = (AB)C", "A(BC) = (AB)C"],
  ["A(B + C) = AB + AC", "A(B+C) = AB + AC"],
  ["(B + C)A = BA + CA", "(B+C)A = BA + CA"],
];

function teoremasMatricesHTML(r) {
  const tarjetas = teoremasPresentacion.map(t => {
    const p = (r.propiedades || []).find(x => x.nombre === t.clave);
    const nombre = escapeHtml(nombrePropiedad(t.clave));

    // SI LAS DIMENSIONES NO PERMITEN LA PROPIEDAD, SE AVISA EN AMARILLO.
    if (!p) {
      return `
        <div class="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
          <p class="font-bold text-white">${nombre}</p>
          <div class="mt-2 overflow-x-auto text-center">$$${t.latex}$$</div>
          <p class="mt-2 text-sm text-amber-200">No se puede comprobar con las dimensiones de A y B.</p>
        </div>`;
    }

    // VERDE SI SE CUMPLE Y ROJO SI NO, IGUAL QUE EN LA PESTAÑA PROPIEDADES.
    return `
      <div class="rounded-2xl border ${p.cumple ? "border-emerald-500/25 bg-emerald-500/5" : "border-rose-500/25 bg-rose-500/5"} p-4">
        <p class="font-bold text-white">${nombre}</p>
        <div class="mt-2 overflow-x-auto text-center">$$${t.latex}$$</div>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/35 p-3 text-center">
            <p class="text-xs font-bold text-slate-500">LADO IZQUIERDO</p>
            $$${matrixLatex(p.izquierda)}$$
          </div>
          <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/35 p-3 text-center">
            <p class="text-xs font-bold text-slate-500">LADO DERECHO</p>
            $$${matrixLatex(p.derecha)}$$
          </div>
        </div>
        <p class="mt-3 text-sm font-bold ${p.cumple ? "text-emerald-300" : "text-rose-300"}">${p.cumple ? "✓ La propiedad se cumple." : "✗ Los dos lados no coinciden."}</p>
      </div>`;
  }).join("");

  const conC = teoremasConC.map(([clave, latex]) => `
    <div class="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center">
      <p class="text-sm font-bold text-slate-200">${escapeHtml(nombrePropiedad(clave))}</p>
      <div class="overflow-x-auto">$$${latex}$$</div>
    </div>`).join("");

  return `
      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Teoremas", "Propiedades de la transpuesta y del producto", "Se comprueban con tus matrices A y B y el escalar c. Las que usan C se prueban en el apartado Propiedades.")}
        <div class="mt-5 grid gap-4 xl:grid-cols-2">${tarjetas}</div>
        <p class="mt-5 text-xs font-bold uppercase tracking-[.15em] text-sky-400">Requieren una matriz C</p>
        <div class="mt-3 grid gap-3 md:grid-cols-3">${conC}</div>
      </article>`;
}

function renderResultadoOperacionesMatrices(cont, r) {
  const sumaResta = r.suma_definida
    ? `
      <div class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
          <p class="font-bold text-white">Suma</p>
          <div class="mt-3 overflow-x-auto text-center">$$A+B=${matrixLatex(r.suma)}$$</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
          <p class="font-bold text-white">Resta</p>
          <div class="mt-3 overflow-x-auto text-center">$$A-B=${matrixLatex(r.resta)}$$</div>
        </div>
      </div>`
    : `<div class="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-amber-200">${escapeHtml(r.mensaje_suma_resta)}</div>`;

  const productoAB = r.producto_AB_definido
    ? `
      <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
        <p class="font-bold text-white">Producto AB</p>
        <div class="mt-3 overflow-x-auto text-center">$$AB=${matrixLatex(r.producto_AB)}$$</div>
        <details class="mt-4"><summary class="cursor-pointer text-sm font-bold text-sky-200">Ver regla fila-columna</summary>
          ${pasosProductoHTML(r.pasos_AB)}
        </details>
      </div>`
    : `<div class="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4"><p class="font-bold text-amber-300">AB no está definido</p><p class="mt-2 text-sm text-slate-400">${escapeHtml(r.mensaje_AB)}</p></div>`;

  const productoBA = r.producto_BA_definido
    ? `
      <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
        <p class="font-bold text-white">Producto BA</p>
        <div class="mt-3 overflow-x-auto text-center">$$BA=${matrixLatex(r.producto_BA)}$$</div>
        ${r.producto_AB_definido ? `<p class="mt-3 text-sm ${r.AB_igual_BA ? "text-emerald-300" : "text-slate-400"}">${r.AB_igual_BA ? "En este caso particular AB = BA." : "AB ≠ BA. La multiplicación matricial no es conmutativa en general."}</p>` : ""}
      </div>`
    : `<div class="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-slate-500"><p class="font-bold text-slate-300">BA no está definido</p><p class="mt-2 text-sm">Columnas(B) = ${r.dimension_B?.[1]} y filas(A) = ${r.dimension_A?.[0]}.</p></div>`;

  cont.innerHTML = `
    <section class="space-y-5">
      <article class="rounded-3xl border border-emerald-500/25 bg-emerald-500/[.045] p-5 shadow-nexo sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">Operaciones completadas</p>
            <h2 class="mt-1 text-2xl font-black text-white">Resultados de A y B</h2>
            <p class="mt-2 text-sm text-slate-400">Tus matrices siguen registradas. Puedes volver a editarlas sin escribirlas nuevamente.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button id="btn-mat-editar" class="btn-primario" type="button">Editar matrices</button>
            <button id="btn-mat-nuevas" class="btn-secundario" type="button">Limpiar A y B</button>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Matrices", "Datos utilizados")}
        <div class="mt-5 grid gap-4 xl:grid-cols-2">
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-center">$$A=${matrixLatex(r.A)}$$</div>
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-center">$$B=${matrixLatex(r.B)}$$</div>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Operaciones", "Suma, resta, igualdad y escalar")}
        <div class="mt-5 space-y-4">
          ${sumaResta}
          <div class="grid gap-4 xl:grid-cols-2">
            <div class="rounded-2xl border ${r.iguales ? "border-emerald-500/25 bg-emerald-500/5" : "border-slate-800 bg-slate-950/35"} p-4">
              <p class="font-bold text-white">Igualdad</p>
              <p class="mt-3 text-center text-lg font-black ${r.iguales ? "text-emerald-300" : "text-amber-300"}">${r.iguales ? "A = B" : "A ≠ B"}</p>
            </div>
            <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
              <p class="font-bold text-white">Multiplicación por escalar</p>
              <div class="mt-3 overflow-x-auto text-center">$$(${formatFrac(r.escalar_c)})A=${matrixLatex(r.escalar_A)}$$</div>
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Transpuestas", "Aᵀ y Bᵀ")}
        <div class="mt-5 grid gap-4 xl:grid-cols-2">
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-center">$$A^T=${matrixLatex(r.transpuesta_A)}$$</div>
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-center">$$B^T=${matrixLatex(r.transpuesta_B)}$$</div>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Producto matricial", "Productos disponibles", "Se conserva la validación de dimensiones y la regla fila-columna de AB.")}
        <div class="mt-5 space-y-4">${productoAB}${productoBA}</div>
      </article>

      ${teoremasMatricesHTML(r)}
    </section>`;

  $("#btn-mat-editar", cont)?.addEventListener("click", () => {
    matrixState.modos.operaciones = "entrada";
    renderMatrizContenido();
  });
  $("#btn-mat-nuevas", cont)?.addEventListener("click", () => confirmarLimpiarMatrices(["A", "B"]));
  renderMath(cont);
}

function rangoDesdeRref(matriz = []) {
  return matriz.filter(fila => fila.some(valor => parseFracValor(valor) !== 0)).length;
}

function pivotesDesdeRref(matriz = []) {
  const pivotes = [];
  matriz.forEach((fila, i) => {
    const j = fila.findIndex(valor => parseFracValor(valor) !== 0);
    if (j >= 0) pivotes.push([i, j]);
  });
  return pivotes;
}

function tiposMatrizHTML(r) {
  const c = r.clasificacion_A || {};
  const filas = Number(r.dimension_A?.[0] || 0);
  const columnas = Number(r.dimension_A?.[1] || 0);
  const tipos = [
    ["Matriz fila", filas === 1],
    ["Matriz columna", columnas === 1],
    ["Rectangular", filas !== columnas],
    ["Cuadrada", !!c.cuadrada],
    ["Matriz cero", !!c.cero],
    ["Identidad", !!c.identidad],
    ["Diagonal", !!c.diagonal],
    ["Simétrica (A = Aᵀ)", !!c.simetrica],
    ["Triangular superior", !!c.triangular_superior],
    ["Triangular inferior", !!c.triangular_inferior],
  ];

  return `<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">${tipos.map(([nombre, cumple]) => `
    <div class="rounded-xl border ${cumple ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-300" : "border-slate-800 bg-slate-950/30 text-slate-500"} p-3 text-sm font-bold">
      ${cumple ? "✓" : "—"} ${escapeHtml(nombre)}
    </div>`).join("")}</div>`;
}

function pasosReduccionMatrizHTML(pasos = []) {
  if (!pasos.length) {
    return `<p class="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-500">La matriz no necesitó operaciones adicionales.</p>`;
  }

  return `<div class="space-y-4">${pasos.map((paso, i) => `
    <article class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30">
      <div class="flex items-center gap-3 border-b border-slate-800 bg-slate-900/45 px-4 py-3">
        <span class="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-extrabold text-sky-400">Paso ${i + 1}</span>
        <span class="font-bold text-slate-100">${escapeHtml(nombreOperacionMatriz(paso.tipo))}</span>
      </div>
      <div class="p-4">
        <div class="overflow-x-auto rounded-xl border border-slate-800 bg-nexo-950/70 px-3 py-3 text-center">${paso.descripcion ? escapeHtml(paso.descripcion) : "$$"+operacionFilaLatex(paso)+"$$"}</div>
        <div class="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-nexo-950/70 px-3 py-3 text-center">$$${matrixLatex(paso.matriz)}$$</div>
      </div>
    </article>`).join("")}</div>`;
}

function nombreOperacionMatriz(tipo) {
  const nombres = {
    pivote: "Elección del pivote",
    intercambio: "Intercambio de filas",
    combinacion: "Operación elemental por filas",
    mcm: "Eliminación de denominadores",
    normalizacion: "Pivote convertido en uno",
  };
  return nombres[tipo] || "Operación elemental";
}

function renderMatrizAnalisis(cont) {
  const resultado = matrixState.resultados.analisis;
  if (matrixState.modos.analisis === "resultado" && resultado) {
    renderResultadoAnalisisMatriz(cont, resultado);
    return;
  }

  const registrada = matrizCompleta("A");
  cont.innerHTML = `
    <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        ${cardTitulo("Análisis de A", "Estudia una matriz completa", "La misma matriz A de Operaciones se reutiliza aquí: clasificación, transpuesta, rango, REF, RREF, pivotes y reducción paso a paso.")}
        ${registrada ? `<span class="rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-xs font-bold text-emerald-300">A registrada</span>` : ""}
      </div>

      <div class="mt-5 max-w-4xl">${matrizCardHTML("A", { contexto: "analisis" })}</div>

      <div class="mt-5 flex flex-wrap gap-2">
        <button id="btn-analizar-matriz" class="btn-primario" type="button">Analizar matriz A</button>
        <button id="btn-limpiar-a" class="btn-secundario" type="button">Limpiar A</button>
      </div>
    </article>`;

  conectarMatrices(cont);
  $("#btn-analizar-matriz", cont)?.addEventListener("click", ejecutarAnalisisMatriz);
  $("#btn-limpiar-a", cont)?.addEventListener("click", () => confirmarLimpiarMatrices(["A"]));
}

async function ejecutarAnalisisMatriz() {
  const boton = $("#btn-analizar-matriz");
  setBusy(boton, true, "Analizando…");

  try {
    const r = await ejecutarMatricesUI("analisis", ["A"]);
    matrixState.modos.analisis = "resultado";
    guardarMemoriaMatrices();
    renderMatrizContenido();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    mostrarError(error, "No se pudo analizar la matriz");
  } finally {
    setBusy(boton, false);
  }
}

function renderResultadoAnalisisMatriz(cont, r) {
  const rango = rangoDesdeRref(r.matriz_rref_A || []);
  const pivotes = pivotesDesdeRref(r.matriz_rref_A || []);
  const columnasPivote = pivotes.map(([, j]) => `C<sub>${j + 1}</sub>`).join(", ") || "Ninguna";
  const posiciones = pivotes.map(([i, j]) => `F<sub>${i + 1}</sub>, C<sub>${j + 1}</sub>`).join(" · ") || "Ninguna";

  cont.innerHTML = `
    <section class="space-y-5">
      <article class="rounded-3xl border border-emerald-500/25 bg-emerald-500/[.045] p-5 shadow-nexo sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">Análisis completado</p>
            <h2 class="mt-1 text-2xl font-black text-white">Matriz A</h2>
            <p class="mt-2 text-sm text-slate-400">A permanece guardada para Operaciones y Propiedades.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button id="btn-analisis-editar" class="btn-primario" type="button">Editar A</button>
            <button id="btn-analisis-limpiar" class="btn-secundario" type="button">Limpiar A</button>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Matriz original", "A y sus dimensiones")}
        <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-center">$$A=${matrixLatex(r.A)}$$</div>
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm text-slate-400">Dimensión</p>
            <p class="mt-2 text-2xl font-black text-white">${r.dimension_A[0]} × ${r.dimension_A[1]}</p>
            <p class="mt-4 text-sm text-slate-400">Rango</p>
            <p class="mt-1 text-2xl font-black text-sky-300">${rango}</p>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Clasificación", "Tipo de matriz")}
        <div class="mt-5">${tiposMatrizHTML(r)}</div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Transpuesta", "Aᵀ")}
        <div class="mt-5 rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-center">$$A^T=${matrixLatex(r.transpuesta_A)}$$</div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Reducción", "REF, RREF y pivotes")}
        <div class="mt-5 grid gap-4 xl:grid-cols-2">
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="font-bold text-white">Forma escalonada (REF)</p>
            <div class="mt-3 overflow-x-auto text-center">$$${matrixLatex(r.matriz_escalonada_A)}$$</div>
            <p class="mt-3 text-sm text-slate-400">${escapeHtml(r.forma_escalonada_A?.clasificacion || "")}</p>
          </div>
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="font-bold text-white">Forma escalonada reducida (RREF)</p>
            <div class="mt-3 overflow-x-auto text-center">$$${matrixLatex(r.matriz_rref_A)}$$</div>
            <p class="mt-3 text-sm text-slate-400">${escapeHtml(r.forma_rref_A?.clasificacion || "")}</p>
          </div>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><p class="text-xs font-bold text-slate-500">RANGO</p><p class="mt-1 text-lg font-black text-white">${rango}</p></div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><p class="text-xs font-bold text-slate-500">COLUMNAS PIVOTE</p><p class="mt-1 font-bold text-sky-300">${columnasPivote}</p></div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><p class="text-xs font-bold text-slate-500">POSICIONES</p><p class="mt-1 font-bold text-slate-300">${posiciones}</p></div>
        </div>
      </article>

                  ${renderInversaMatrizHTML(r)}

      ${renderDeterminanteMatrizHTML(r)}

      <details class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        <summary class="cursor-pointer text-lg font-black text-white">
          Ver reducción por filas paso a paso
        </summary>
        <div class="mt-5">
          ${pasosReduccionMatrizHTML(r.pasos_reduccion_A || [])}
        </div>
      </details>
    </section>`;

  $("#btn-analisis-editar", cont)?.addEventListener("click", () => {
    matrixState.modos.analisis = "entrada";
    renderMatrizContenido();
  });
  $("#btn-analisis-limpiar", cont)?.addEventListener("click", () => confirmarLimpiarMatrices(["A"]));
  renderMath(cont);
}

function renderMatrizPropiedades(cont) {
  const resultado = matrixState.resultados.propiedades;
  if (matrixState.modos.propiedades === "resultado" && resultado) {
    renderResultadoPropiedadMatriz(cont, resultado);
    return;
  }

  const conf = propiedadesConfig[matrixState.propiedad];

  cont.innerHTML = `
    <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
      ${cardTitulo("Propiedades", "Comprueba una propiedad", "Elige la identidad. Solo aparecerán las matrices y los escalares que necesita.")}

      <div class="mt-5 max-w-xl">
        <label for="seleccionar-propiedad" class="mb-2 block text-sm font-bold text-slate-200">Propiedad</label>
        <select id="seleccionar-propiedad" class="select-nexo w-full" title="Elige la propiedad matricial que quieres comprobar">
          ${propiedadesGrupos.map(grupo => `
            <optgroup label="${escapeHtml(grupo.titulo)}">
              ${grupo.propiedades.map(nombre => `<option value="${escapeHtml(nombre)}" ${matrixState.propiedad === nombre ? "selected" : ""}>${escapeHtml(nombre)}  —  ${escapeHtml(nombrePropiedad(nombre))}</option>`).join("")}
            </optgroup>`).join("")}
        </select>
      </div>

      <div class="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/[.045] p-4">
        <p class="text-xs font-bold uppercase tracking-[.15em] text-sky-400">Propiedad seleccionada</p>
        <p class="mt-1 text-lg font-black text-white">${escapeHtml(matrixState.propiedad)}</p>
        <p class="mt-1 text-sm font-bold text-sky-200">${escapeHtml(nombrePropiedad(matrixState.propiedad))}</p>
      </div>

      <div class="mt-5 flex flex-wrap gap-4">
        ${conf.escalares.includes("c") ? `<label class="w-32"><span class="mb-1 block text-xs font-bold text-slate-500">ESCALAR c</span><input id="prop-c" class="input-nexo w-full" value="${escapeHtml(matrixState.c)}"></label>` : ""}
        ${conf.escalares.includes("d") ? `<label class="w-32"><span class="mb-1 block text-xs font-bold text-slate-500">ESCALAR d</span><input id="prop-d" class="input-nexo w-full" value="${escapeHtml(matrixState.d)}"></label>` : ""}
      </div>

      <div class="mt-5 grid gap-4 2xl:grid-cols-2">
        ${conf.matrices.map(nombre => matrizCardHTML(nombre, { contexto: "propiedades" })).join("")}
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <button id="btn-prop" class="btn-primario" type="button">Comprobar propiedad</button>
        <button id="btn-prop-limpiar" class="btn-secundario" type="button">Limpiar matrices usadas</button>
      </div>
    </article>`;

  $("#seleccionar-propiedad", cont).addEventListener("change", evento => {
    matrixState.propiedad = evento.target.value;
    matrixState.resultados.propiedades = null;
    matrixState.modos.propiedades = "entrada";
    guardarMemoriaMatrices();
    renderMatrizPropiedades(cont);
  });

  $("#prop-c", cont)?.addEventListener("input", e => {
    matrixState.c = e.target.value;
    guardarMemoriaMatrices();
  });
  $("#prop-d", cont)?.addEventListener("input", e => {
    matrixState.d = e.target.value;
    guardarMemoriaMatrices();
  });

  conectarMatrices(cont);
  $("#btn-prop", cont)?.addEventListener("click", ejecutarPropiedadMatriz);
  $("#btn-prop-limpiar", cont)?.addEventListener("click", () => confirmarLimpiarMatrices(conf.matrices));
}

async function ejecutarPropiedadMatriz() {
  const conf = propiedadesConfig[matrixState.propiedad];
  const boton = $("#btn-prop");
  setBusy(boton, true, "Comprobando…");

  try {
    const r = await ejecutarMatricesUI("propiedades", conf.matrices, {
      c: matrixState.c || "1",
      d: matrixState.d || "1",
    });
    matrixState.modos.propiedades = "resultado";
    guardarMemoriaMatrices();
    renderMatrizContenido();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    mostrarError(error, "No se pudo comprobar la propiedad");
  } finally {
    setBusy(boton, false);
  }
}

function renderResultadoPropiedadMatriz(cont, r) {
  const propiedad = (r.propiedades || []).find(x => x.nombre === matrixState.propiedad);
  const conf = propiedadesConfig[matrixState.propiedad];

  if (!propiedad) {
    cont.innerHTML = `
      <article class="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-5 shadow-nexo sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[.18em] text-amber-300">Dimensiones incompatibles</p>
            <h2 class="mt-1 text-xl font-black text-white">${escapeHtml(matrixState.propiedad)}</h2>
            <p class="mt-2 text-sm text-slate-400">La propiedad no puede comprobarse con estas dimensiones. Las matrices permanecen guardadas para que puedas editarlas.</p>
          </div>
          <button id="btn-prop-volver" class="btn-primario" type="button">Editar matrices</button>
        </div>
      </article>`;

    $("#btn-prop-volver", cont)?.addEventListener("click", () => {
      matrixState.modos.propiedades = "entrada";
      renderMatrizContenido();
    });
    return;
  }

  cont.innerHTML = `
    <section class="space-y-5">
      <article class="rounded-3xl border ${propiedad.cumple ? "border-emerald-500/25 bg-emerald-500/[.045]" : "border-rose-500/25 bg-rose-500/[.045]"} p-5 shadow-nexo sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[.18em] ${propiedad.cumple ? "text-emerald-300" : "text-rose-300"}">Comprobación</p>
            <h2 class="mt-1 text-xl font-black text-white">${escapeHtml(propiedad.nombre)}</h2>
            <p class="mt-1 text-sm font-bold text-sky-200">${escapeHtml(nombrePropiedad(propiedad.nombre))}</p>
            <p class="mt-2 font-bold ${propiedad.cumple ? "text-emerald-300" : "text-rose-300"}">${propiedad.cumple ? "✓ La propiedad se cumple." : "✗ Los dos lados no coinciden."}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button id="btn-prop-editar" class="btn-primario" type="button">Editar / probar otra propiedad</button>
            <button id="btn-prop-limpiar-r" class="btn-secundario" type="button">Limpiar matrices usadas</button>
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Resultado", "Comparación de ambos lados")}
        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">Lado izquierdo</p>
            <div class="mt-3 overflow-x-auto text-center">$$${matrixLatex(propiedad.izquierda)}$$</div>
          </div>
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">Lado derecho</p>
            <div class="mt-3 overflow-x-auto text-center">$$${matrixLatex(propiedad.derecha)}$$</div>
          </div>
        </div>
      </article>
    </section>`;

  $("#btn-prop-editar", cont)?.addEventListener("click", () => {
    matrixState.modos.propiedades = "entrada";
    renderMatrizContenido();
  });
  $("#btn-prop-limpiar-r", cont)?.addEventListener("click", () => confirmarLimpiarMatrices(conf.matrices));
  renderMath(cont);
}


// CÁLCULO Y CALCULADORA

function inicializarCalculo() {
  const operacion = $("#calculo-operacion");
  const actualizarCampos = () => {
    $("#calculo-valor").classList.toggle("hidden", operacion.value !== "derivar");
    $("#calculo-limites").classList.toggle("hidden", operacion.value !== "definida");
    $("#calculo-limites").classList.toggle("flex", operacion.value === "definida");
    $("#calculo-resultado").classList.add("hidden");
  };
  operacion.addEventListener("change", actualizarCampos);
  actualizarCampos();
  $("#calculo-resolver").addEventListener("click", async () => {
    const boton = $("#calculo-resolver");
    const panel = $("#calculo-resultado");
    setBusy(boton, true, "Calculando…");
    try {
      const r = await ejecutarTema({
        accion: "calculo", operacion: operacion.value,
        expresion: $("#calculo-expresion").value,
        punto: $("#calculo-punto").value,
        inferior: $("#calculo-inferior").value,
        superior: $("#calculo-superior").value,
      });
      const titulo = {
        derivada: "Derivada", primitiva: "Integral indefinida",
        exacta: "Integral definida", aproximada: "Integral definida aproximada",
      }[r.tipo];
      panel.replaceChildren();
      const encabezado = document.createElement("h2");
      encabezado.className = "text-xl font-black text-white";
      encabezado.textContent = titulo;
      panel.append(encabezado);
      if (r.expresion) {
        const formula = document.createElement("p");
        formula.className = "mt-3 break-words font-mono text-sky-200";
        formula.textContent = r.expresion;
        panel.append(formula);
      }
      if (r.valor !== undefined) {
        const valor = document.createElement("p");
        valor.className = "mt-3 text-lg font-bold text-emerald-300";
        valor.textContent = `${r.punto ? `En x = ${r.punto}: ` : "Resultado: "}${r.valor}`;
        panel.append(valor);
      }
      panel.classList.remove("hidden");
    } catch (error) {
      panel.classList.add("hidden");
      mostrarError(error, "Revisa la función o los límites");
    } finally { setBusy(boton, false); }
  });
}

function inicializarBasica() {
  const entrada = $("#basica-expresion");
  const teclas = $("#basica-teclas");
  const botones = [
    ["C", "borrar"], ["⌫", "retroceso"], ["(", "("], [")", ")"],
    ["7", "7"], ["8", "8"], ["9", "9"], ["÷", "/"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["×", "*"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["−", "-"],
    ["0", "0"], [".", "."], ["=", "calcular"], ["+", "+"],
    ["xʸ", "^"], ["√", "sqrt("], ["%", "/100"], ["!", "factorial("],
    ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["π", "pi"],
    ["ln", "ln("], ["log", "log("], ["e", "e"], ["Ans", "Ans"],
  ];
  let ans = 0;
  const calcular = async () => {
    try {
      const r = await ejecutarTema({ accion: "basica", expresion: entrada.value, ans, grados: $("#basica-grados").checked });
      ans = Number(r.valor);
      $("#basica-resultado").textContent = r.valor;
    } catch (error) {
      $("#basica-resultado").textContent = error.message || String(error);
    }
  };
  botones.forEach(([etiqueta, valor]) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = valor === "calcular" ? "btn-primario" : "btn-secundario";
    boton.textContent = etiqueta;
    boton.title = valor === "borrar" ? "Borrar todo" : valor === "retroceso" ? "Borrar un carácter" : valor === "calcular" ? "Calcular resultado" : `Insertar ${etiqueta}`;
    boton.addEventListener("click", () => {
      if (valor === "calcular") return calcular();
      if (valor === "borrar") { entrada.value = ""; entrada.focus(); return; }
      if (valor === "retroceso") {
        const pos = entrada.selectionStart;
        if (pos > 0) entrada.setRangeText("", pos-1, pos, "end");
      } else entrada.setRangeText(valor, entrada.selectionStart, entrada.selectionEnd, "end");
      entrada.focus();
    });
    teclas.append(boton);
  });
  entrada.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); calcular(); } });
  $("#basica-calcular").addEventListener("click", calcular);
}

// INICIO

document.addEventListener("DOMContentLoaded", () => {
  inicializarSistema();
  inicializarVectores();
  inicializarMatrices();
  inicializarCalculo();
  inicializarBasica();
  abrirVista("sistemas");
});


// PROGRAMA 4: INDEPENDENCIA LINEAL
// La interfaz recoge los datos y Python realiza los cálculos.

function iniciarPrograma4() {
  const panel = document.getElementById("programa4-panel");

  // Evitar errores si no existe el apartado o ya fue iniciado.
  if (!panel || panel.dataset.iniciado === "si") return;
  panel.dataset.iniciado = "si";

  // Referencias a los elementos agregados en index.html.
  const entradaK = document.getElementById("p4-k");
  const entradaN = document.getElementById("p4-n");
  const entradaVectores = document.getElementById("p4-vectores");
  const resultado = document.getElementById("p4-resultado");
  const botonAnalizar = document.getElementById("p4-analizar");

  // Borrar el resultado cuando cambien los datos.
  function limpiarResultado() {
    resultado.replaceChildren();
  }

  // Cargar ejemplos; el usuario pulsa Analizar para resolverlos.
  function cargarEjemplo(tipo) {
    entradaK.value = "2";
    entradaN.value = "2";

    entradaVectores.value = tipo === "LI"
      ? "1 0\n0 1"
      : "1 2\n2 4";

    limpiarResultado();
  }

  document.getElementById("p4-ejemplo-li")
    .addEventListener("click", () => cargarEjemplo("LI"));

  document.getElementById("p4-ejemplo-ld")
    .addEventListener("click", () => cargarEjemplo("LD"));

  [entradaK, entradaN, entradaVectores].forEach(entrada => {
    entrada.addEventListener("input", limpiarResultado);
  });

  // Ejecutar el análisis al pulsar el botón principal.
  botonAnalizar.addEventListener("click", async () => {
    limpiarResultado();

    const k = Number(entradaK.value);
    const n = Number(entradaN.value);

    // Validación inicial de las dimensiones.
    if (
      !Number.isInteger(k) ||
      !Number.isInteger(n) ||
      k < 1 || k > 6 ||
      n < 1 || n > 6
    ) {
      mostrarError(new Error("k y n deben ser enteros entre 1 y 6."));
      return;
    }

    if (!entradaVectores.value.trim()) {
      mostrarError(new Error("Primero ingresa los vectores."));
      return;
    }

    // El motor Pyodide debe terminar de cargar.
    if (!pythonEstaListo()) {
      mostrarError(new Error("Espera a que termine de cargar Python."));
      return;
    }

    setBusy(botonAnalizar, true, "Analizando…");

    try {
      // ejecutarTema ya existe en ejecutar_python.js.
      // Esta acción llama a analizar_independencia en Python.
      const r = await ejecutarTema({
        accion: "independencia_lineal",
        k,
        n,
        vectores: entradaVectores.value,
      });

      const s = r.sistema;

      // Usar verde para L.I. y amarillo para L.D.
      const color = r.independiente
        ? "text-emerald-400"
        : "text-amber-400";

      // Los índices de Python empiezan en cero.
      // Sumar uno permite mostrar C1, C2, c1, c2, etc.
      const columnasPivote = s.columnas_pivote
        .map(indice => `C${indice + 1}`)
        .join(", ") || "Ninguna";

      const variablesLibres = s.variables_libres
        .map(indice => `c${indice + 1}`)
        .join(", ") || "Ninguna";

      // Mostrar una relación no trivial cuando existe dependencia.
      const relacion = !r.independiente && r.relacion.length
        ? `
          <div class="info-card">
            <strong>Coeficientes de una relación de dependencia</strong>
            <p class="mt-2">
              En el orden de los vectores ingresados, estos coeficientes
              cumplen c₁v₁ + … + cₖvₖ = 0 y no son todos cero.
            </p>
            $$c=${vectorLatex(r.relacion)}$$
          </div>
        `
        : "";

      // Mostrar el resultado con las clases visuales ya existentes.
      resultado.innerHTML = `
        <div class="info-card">
          <h3 class="text-lg font-black ${color}">
            ${escapeHtml(r.veredicto)}
          </h3>
          <p class="mt-2">${escapeHtml(r.explicacion)}</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="info-card">
            <strong>Número de pivotes: ${r.numero_pivotes}</strong>
            <p>Columnas pivote: ${escapeHtml(columnasPivote)}</p>
          </div>

          <div class="info-card">
            <strong>Variables libres: ${r.numero_libres}</strong>
            <p>${escapeHtml(variablesLibres)}</p>
          </div>
        </div>

        <div class="info-card overflow-x-auto">
          <h3 class="font-bold">Vectores como columnas de A</h3>
          $$A=${matrixLatex(r.A)}$$
        </div>

        <div class="info-card overflow-x-auto">
          <h3 class="font-bold">Sistema homogéneo Ax = 0</h3>
          $$${matrixLatex(s.matriz_inicial, true)}$$
        </div>

        <div class="info-card overflow-x-auto">
          <h3 class="font-bold">Forma escalonada — Gauss</h3>
          $$${matrixLatex(s.matriz_escalonada, true)}$$
        </div>

        <div class="info-card overflow-x-auto">
          <h3 class="font-bold">Forma escalonada reducida — Gauss-Jordan</h3>
          $$${matrixLatex(s.matriz_rref, true)}$$
        </div>

        ${relacion}
      `;

      // Convertir las expresiones LaTeX en matrices visuales.
      renderMath(resultado);

    } catch (error) {
      mostrarError(error, "Revisa los vectores");

    } finally {
      // Habilitar nuevamente el botón, incluso si hubo un error.
      setBusy(botonAnalizar, false);
    }
  });
}

// Iniciar cuando los elementos HTML estén disponibles.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarPrograma4);
} else {
  iniciarPrograma4();
}





// INVERSA DE A
// Presenta los resultados calculados por Python.

function renderInversaMatrizHTML(r) {
  // Los resultados guardados antes de esta actualización
  // todavía no contienen el análisis de la inversa.
  if (typeof r.tiene_inversa !== "boolean") {
    return `
      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5">
        <h3 class="font-bold text-sky-400">Inversa de A</h3>
        <p class="mt-2 text-slate-300">
          Pulsa Editar A y después Analizar matriz A
          para calcular la inversa con esta actualización.
        </p>
      </article>
    `;
  }

  // Representar una matriz aumentada con una separación central.
  // La función matrixLatex existente separa solo la última columna;
  // aquí necesitamos separar dos bloques del mismo tamaño.
  function matrizBloquesLatex(matriz) {
    const n = matriz[0].length / 2;

    const filas = matriz
      .map(fila => fila.map(formatFrac).join(" & "))
      .join(" \\\\ ");

    return (
      `\\left[\\begin{array}{${"c".repeat(n)}|${"c".repeat(n)}}` +
      filas +
      "\\end{array}\\right]"
    );
  }

  // Mostrar las matrices aumentadas cuando A sea cuadrada.
  const procedimiento = r.aumentada_inversa
    ? `
      <div class="mt-5 grid gap-4 lg:grid-cols-2">
        <div class="info-card overflow-x-auto">
          <h4 class="font-bold">Matriz inicial [A | I]</h4>
          $$${matrizBloquesLatex(r.aumentada_inversa)}$$
        </div>

        <div class="info-card overflow-x-auto">
          <h4 class="font-bold">Matriz aumentada reducida</h4>
          $$${matrizBloquesLatex(r.reducida_inversa)}$$
        </div>
      </div>

      <details class="mt-5 rounded-xl border border-slate-700 p-4">
        <summary class="cursor-pointer font-bold text-sky-400">
          Ver cálculo de la inversa paso a paso
        </summary>

        <p class="mt-3 text-sm text-slate-400">
          En cada matriz, las primeras columnas forman el bloque
          izquierdo y las restantes forman el bloque derecho.
        </p>

        <div class="mt-4">
          ${pasosReduccionMatrizHTML(r.pasos_inversa || [])}
        </div>
      </details>
    `
    : "";

  // Presentar la inversa y comprobar A por A^-1.
  const solucion = r.tiene_inversa
    ? `
      <div class="mt-5 grid gap-4 lg:grid-cols-2">
        <div class="info-card overflow-x-auto">
          <h4 class="font-bold text-emerald-400">Inversa de A</h4>
          $$A^{-1}=${matrixLatex(r.inversa_A)}$$
        </div>

        <div class="info-card overflow-x-auto">
          <h4 class="font-bold">Comprobación</h4>
          $$AA^{-1}=${matrixLatex(r.producto_inversa)}$$

          <p class="mt-2 ${
            r.inversa_verificada ? "text-emerald-400" : "text-amber-400"
          }">
            ${
              r.inversa_verificada
                ? "Correcto: el producto es la matriz identidad."
                : "La comprobación no coincide con la identidad."
            }
          </p>
        </div>
      </div>
    `
    : "";

  return `
    <article
      class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6"
    >
      <p class="text-xs font-bold uppercase tracking-wider text-sky-400">
        Matriz inversa
      </p>

      <h3 class="mt-2 text-xl font-black text-white">
        Inversa por Gauss-Jordan
      </h3>

      <p class="mt-3 text-slate-300">
        ${escapeHtml(r.mensaje_inversa)}
      </p>

      ${solucion}
      ${procedimiento}
    </article>
  `;
}



// DETERMINANTE DE A
// Presenta el valor, el procedimiento y las propiedades.
// Los cálculos se realizan en Python.

function renderDeterminanteMatrizHTML(r) {
  // Los análisis guardados antes de esta actualización
  // necesitan calcularse nuevamente.
  if (typeof r.determinante_definido !== "boolean") {
    return `
      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5">
        <h3 class="font-bold text-sky-400">Determinante de A</h3>
        <p class="mt-2 text-slate-300">
          Pulsa Editar A y después Analizar matriz A
          para obtener el determinante.
        </p>
      </article>
    `;
  }

  // Una matriz rectangular conserva los demás resultados,
  // pero no tiene determinante.
  if (!r.determinante_definido) {
    return `
      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5">
        <h3 class="font-bold text-sky-400">Determinante de A</h3>
        <p class="mt-2 text-slate-300">
          ${escapeHtml(r.mensaje_determinante)}
        </p>
      </article>
    `;
  }

  // Mostrar cada operación y la matriz obtenida.
  const pasos = (r.pasos_determinante || []).map((paso, indice) => `
    <div class="info-card overflow-x-auto">
      <h4 class="font-bold text-sky-400">Paso ${indice + 1}</h4>
      <p class="mt-2">${escapeHtml(paso.descripcion)}</p>
      $$${matrixLatex(paso.matriz)}$$
    </div>
  `).join("");

  // Escribir el producto de la diagonal con paréntesis
  // para que los signos negativos se entiendan correctamente.
  const productoDiagonal = r.diagonal_determinante
    .map(valor => `\\left(${formatFrac(valor)}\\right)`)
    .join("\\cdot ");

  return `
    <article
      class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6"
    >
      <p class="text-xs font-bold uppercase tracking-wider text-sky-400">
        Determinantes y propiedades
      </p>

      <h3 class="mt-2 text-xl font-black text-white">
        Determinante de A
      </h3>

      <div class="mt-4 info-card overflow-x-auto">
        $$\\det(A)=${formatFrac(r.determinante_A)}$$
        <p>${escapeHtml(r.mensaje_determinante)}</p>
      </div>

      <div class="mt-4 info-card overflow-x-auto">
        <h4 class="font-bold">Matriz triangular obtenida</h4>
        $$${matrixLatex(r.triangular_determinante)}$$

        <p>
          Intercambios de filas: ${r.intercambios_determinante}
        </p>

        <p class="mt-2">
          Multiplicamos la diagonal y corregimos el signo
          según la cantidad de intercambios:
        </p>

        $$\\det(A)=(-1)^{${r.intercambios_determinante}}
        \\cdot ${productoDiagonal}
        =${formatFrac(r.determinante_A)}$$
      </div>

      <details class="mt-5 rounded-xl border border-slate-700 p-4">
        <summary class="cursor-pointer font-bold text-sky-400">
          Ver cálculo del determinante paso a paso
        </summary>

        <div class="mt-4 space-y-3">
          ${
            pasos ||
            "<p>La matriz ya era triangular; no necesitó operaciones.</p>"
          }
        </div>
      </details>

      <details class="mt-5 rounded-xl border border-slate-700 p-4">
        <summary class="cursor-pointer font-bold text-sky-400">
          Ver teoremas clave de Determinantes
        </summary>

        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>El determinante se define para matrices cuadradas.</li>
          <li>La matriz identidad tiene determinante 1.</li>
          <li>Intercambiar dos filas cambia el signo del determinante.</li>
          <li>
            Multiplicar una fila por un número multiplica
            el determinante por ese número.
          </li>
          <li>
            Sumar a una fila un múltiplo de otra
            no cambia el determinante.
          </li>
          <li>
            En una matriz triangular, el determinante es
            el producto de los elementos de su diagonal.
          </li>
          <li>det(Aᵀ) = det(A).</li>
          <li>
            Para matrices cuadradas del mismo orden:
            det(AB) = det(A)det(B).
          </li>
          <li>
            Una matriz cuadrada tiene inversa si y solo si
            su determinante es distinto de cero.
          </li>
        </ul>
      </details>
    </article>
  `;
}
