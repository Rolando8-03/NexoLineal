// ============================================================
// app.js
// Interfaz Tailwind + SweetAlert2 de NexoLineal.
// ============================================================

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

function mostrarError(error, titulo = "No se pudo completar la operación") {
  SwalNexo.fire({
    icon: "error",
    title: titulo,
    text: error?.message || String(error),
  });
}

// ============================================================
// NAVEGACIÓN PRINCIPAL
// ============================================================

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

// ============================================================
// SISTEMAS LINEALES
// ============================================================

const sistemaState = {
  filas: 3,
  columnas: 3,
  A: crearMatrizVacia(3, 3),
  b: Array(3).fill(""),
  resultado: null,
  tabResultado: "resumen",
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
  const columnasTexto = r.columnas_linealmente_independientes
    ? "Las columnas de A son linealmente independientes."
    : "Las columnas de A son linealmente dependientes.";

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

    ${seccionSistema("Naturaleza del sistema", `
      <div class="rounded-2xl border border-sky-500/30 bg-sky-500/[.07] p-4">
        <p class="font-extrabold text-sky-300">${escapeHtml(r.naturaleza_sistema)}</p>
        ${r.es_homogeneo ? `<p class="mt-1 text-sm text-slate-400">${r.tiene_solucion_no_trivial ? "Tiene soluciones no triviales porque existen variables libres." : "Tiene únicamente la solución trivial."}</p>` : ""}
      </div>`)}

    ${seccionSistema("Columnas de A", `
      <div class="rounded-2xl border ${r.columnas_linealmente_independientes ? "border-emerald-500/30 bg-emerald-500/[.07]" : "border-amber-500/30 bg-amber-500/[.07]"} p-4">
        <p class="font-extrabold ${r.columnas_linealmente_independientes ? "text-emerald-300" : "text-amber-300"}">${r.columnas_linealmente_independientes ? "Linealmente independientes" : "Linealmente dependientes"}</p>
        <p class="mt-1 text-sm text-slate-400">${escapeHtml(columnasTexto)}</p>
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
  return terminos.join("") || "0";
}

function renderEcuacionVectorialSistema(r) {
  const columnas = r.columnas_vectores || [];
  const ecuacion = columnas.map((v, i) => `x_{${i + 1}}${vectorLatex(v)}`).join("+");

  let detalle = "";
  if (!r.es_combinacion_lineal) {
    detalle = `<div class="rounded-2xl border border-amber-500/30 bg-amber-500/[.08] p-4"><p class="font-extrabold text-amber-300">No.</p><p class="mt-1 text-sm text-slate-400">El sistema es inconsistente, por lo tanto ningún conjunto de coeficientes produce b.</p></div>`;
  } else {
    const coef = r.solucion_particular || [];
    detalle = `
      <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/[.08] p-4"><p class="font-extrabold text-emerald-300">Sí.</p><p class="mt-1 text-sm text-slate-400">El sistema es consistente.</p></div>
      ${seccionSistema("Una elección de coeficientes", `
        <div class="math-card">$$x=${vectorLatex(coef)}$$</div>
        <div class="math-card mt-3">$$${combinacionConCoeficientesSistema(columnas, coef)}=${vectorLatex(r.b)}$$</div>
        <p class="mt-3 text-sm text-slate-400">${r.tipo === "unica" ? "Los coeficientes son únicos." : "Esta es una solución particular; existen otras elecciones porque hay variables libres."}</p>`)}
      ${seccionSistema("Forma vectorial de la solución", `<div class="math-card">$$${solucionVectorialLatexSistema(r)}$$</div>`)}
    `;
  }

  return `
    <div class="method-intro">Cada columna de A puede interpretarse como un vector. El sistema $Ax=b$ es equivalente a preguntar si una combinación lineal de esas columnas produce el vector b.</div>
    ${seccionSistema("Columnas de A", `<div class="math-card">$$${ecuacion}=${vectorLatex(r.b)}$$</div>`)}
    ${seccionSistema("¿b es combinación lineal de las columnas de A?", detalle)}
  `;
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
    ["ecuacion-vectorial", "Ecuación vectorial"],
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
        <div data-system-result-panel="ecuacion-vectorial" class="hidden">${renderEcuacionVectorialSistema(r)}</div>
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


// ============================================================
// HISTORIAL DE SISTEMAS
// ============================================================

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

// ============================================================
// VECTORES
// ============================================================

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
  generadores: {
    dimension: 3,
    cantidad: 3,
    vectores: Array.from({ length: 3 }, () => Array(3).fill("")),
    b: Array(3).fill(""),
    combinacion: null,
    independencia: null,
  },
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
  $$('[data-vector-tab]').forEach(btn => {
    btn.addEventListener("click", () => {
      vectorState.tab = btn.dataset.vectorTab;
      $$('[data-vector-tab]').forEach(b => b.classList.toggle("subnav-activo", b === btn));
      renderVectorContenido();
    });
  });
  renderVectorContenido();
}

function renderVectorContenido() {
  const cont = $("#vector-contenido");
  if (vectorState.tab === "operaciones") renderVectorOperaciones(cont);
  else renderVectorAnalisisConjunto(cont);
}

function conectarVectorInputs(base) {
  $$('[data-vector-input]', base).forEach(input => {
    input.addEventListener("input", () => {
      const [nombre, iTexto] = input.dataset.vectorInput.split(",");
      const i = Number(iTexto);
      if (["u", "v", "w"].includes(nombre)) vectorState[nombre][i] = input.value;
      else if (nombre === "b") vectorState.generadores.b[i] = input.value;
      else if (nombre.startsWith("g")) {
        const g = Number(nombre.slice(1));
        vectorState.generadores.vectores[g][i] = input.value;
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
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">NexoLineal calculará en un solo paso la suma, resta, igualdad, opuesto, norma, productos por escalar, combinación <span class="font-mono text-slate-200">c·u + d·v</span> y las propiedades algebraicas.</p>
        </div>
        <label class="shrink-0">
          <span class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Dimensión</span>
          <select id="vector-dim" class="select-nexo">${opcionesDimension(vectorState.dimension)}</select>
        </label>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${vectorInputHTML(`Vector ${etiquetaVectorHTML("u")}`, vectorState.u, "u")}
        ${vectorInputHTML(`Vector ${etiquetaVectorHTML("v")}`, vectorState.v, "v")}
        ${vectorInputHTML(`Vector ${etiquetaVectorHTML("w")}`, vectorState.w, "w", "Se usa en las propiedades algebraicas; inicia como vector cero.")}
      </div>

      <div class="mt-5 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
        <p class="text-sm font-bold text-white">Escalares</p>
        <p class="mt-1 text-xs text-slate-500">Se utilizan para calcular c·u, d·v, c·u + d·v y las propiedades con escalares.</p>
        <div class="mt-3 flex flex-wrap gap-4">
          <label>
            <span class="mb-1 block text-xs font-bold text-slate-500">c</span>
            <input id="vector-c" class="input-nexo w-28" value="${escapeHtml(vectorState.c)}" autocomplete="off">
          </label>
          <label>
            <span class="mb-1 block text-xs font-bold text-slate-500">d</span>
            <input id="vector-d" class="input-nexo w-28" value="${escapeHtml(vectorState.d)}" autocomplete="off">
          </label>
        </div>
      </div>

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
    renderVectorContenido();
  });

  $("#vector-c", cont).addEventListener("input", e => vectorState.c = e.target.value);
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
    vectorState.resultado = r;
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
          <p class="mt-2 text-sm text-slate-400">Los datos de entrada se ocultaron para dejar todo el espacio a los resultados.</p>
        </div>
        <button id="btn-vector-nuevo" type="button" class="btn-primario shrink-0">Calcular otros vectores</button>
      </article>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${resultadoVectorCard("Suma", `\\mathbf{u}+\\mathbf{v}=${vectorLatex(r.suma)}`)}
        ${resultadoVectorCard("Resta", `\\mathbf{u}-\\mathbf{v}=${vectorLatex(r.resta)}`)}
        ${resultadoVectorCard("Igualdad", `\\mathbf{u}=${vectorLatex(r.u)},\\qquad \\mathbf{v}=${vectorLatex(r.v)}`, `<p class="mt-3 text-center text-sm font-bold">${igualdad}</p>`)}
        ${resultadoVectorCard("Vector opuesto", `-\\mathbf{u}=${vectorLatex(menosU)}`)}
        ${resultadoVectorCard("Norma", `\\lVert\\mathbf{u}\\rVert=\\sqrt{${formatFrac(r.norma2)}}`)}
        ${resultadoVectorCard("Multiplicación por escalar", `(${formatFrac(r.c)})\\mathbf{u}=${vectorLatex(r.cu)}`)}
        ${resultadoVectorCard("Segundo producto por escalar", `(${formatFrac(r.d)})\\mathbf{v}=${vectorLatex(r.dv)}`)}
        ${resultadoVectorCard("Combinación lineal", `(${formatFrac(r.c)})\\mathbf{u}+(${formatFrac(r.d)})\\mathbf{v}=${vectorLatex(r.combinacion)}`)}
      </div>

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Propiedades", "Propiedades algebraicas", "Se comprueban automáticamente con los vectores y escalares ingresados.")}
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
      </article>
    </section>`;

  $("#btn-vector-nuevo", cont).addEventListener("click", limpiarVectorOperaciones);
  renderMath(cont);
}

function ajustarGeneradores(dimension, cantidad) {
  const g = vectorState.generadores;
  g.dimension = dimension;
  g.cantidad = cantidad;
  g.vectores = Array.from({ length: cantidad }, (_, j) => ajustarVector(g.vectores[j] || [], dimension));
  g.b = ajustarVector(g.b, dimension);
  g.combinacion = null;
  g.independencia = null;
}

function generadoresHTML() {
  const g = vectorState.generadores;
  return `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      ${g.vectores.map((v, j) => vectorInputHTML(`Vector ${etiquetaVectorHTML("v", j + 1)}`, v, `g${j}`)).join("")}
      ${vectorInputHTML(`Vector ${etiquetaVectorHTML("b")}`, g.b, "b", "Se usa para estudiar si b es combinación lineal del conjunto.")}
    </div>`;
}

function controlesGeneradoresHTML() {
  const g = vectorState.generadores;
  return `
    <div class="flex flex-wrap gap-4">
      <label>
        <span class="mb-1 block text-xs font-bold text-slate-500">DIMENSIÓN</span>
        <select id="analisis-dim" class="select-nexo">${opcionesDimension(g.dimension)}</select>
      </label>
      <label>
        <span class="mb-1 block text-xs font-bold text-slate-500">CANTIDAD DE VECTORES</span>
        <select id="analisis-cant" class="select-nexo">${opcionesDimension(g.cantidad)}</select>
      </label>
    </div>`;
}

function generadoresCompletos() {
  const g = vectorState.generadores;
  return g.vectores.every(vectorValido) && vectorValido(g.b);
}

function generadoresTexto() {
  return vectorState.generadores.vectores.map(vectorTexto).join("\n");
}

function limpiarAnalisisConjunto() {
  const g = vectorState.generadores;
  g.vectores = Array.from({ length: g.cantidad }, () => Array(g.dimension).fill(""));
  g.b = Array(g.dimension).fill("");
  g.combinacion = null;
  g.independencia = null;
  renderVectorContenido();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderVectorAnalisisConjunto(cont) {
  const g = vectorState.generadores;

  if (g.combinacion && g.independencia) {
    renderAnalisisConjuntoResultado(cont, g.combinacion, g.independencia);
    return;
  }

  cont.innerHTML = `
    <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.18em] text-sky-400">Análisis del conjunto</p>
          <h2 class="mt-1 text-xl font-black text-white">Combinación e independencia al mismo tiempo</h2>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Ingresa una sola vez los vectores generadores y <span class="font-mono text-slate-200">b</span>. NexoLineal resolverá tanto <span class="font-mono text-slate-200">Ac=b</span> como <span class="font-mono text-slate-200">Ac=0</span>.</p>
        </div>
        ${controlesGeneradoresHTML()}
      </div>

      <div class="mt-6">${generadoresHTML()}</div>

      <div class="mt-5 flex flex-wrap gap-2">
        <button id="btn-analizar-conjunto" type="button" class="btn-primario">Analizar conjunto</button>
        <button id="btn-limpiar-conjunto" type="button" class="btn-secundario">Limpiar</button>
      </div>
    </article>`;

  $("#analisis-dim", cont).addEventListener("change", e => {
    ajustarGeneradores(Number(e.target.value), g.cantidad);
    renderVectorContenido();
  });

  $("#analisis-cant", cont).addEventListener("change", e => {
    ajustarGeneradores(g.dimension, Number(e.target.value));
    renderVectorContenido();
  });

  conectarVectorInputs(cont);
  $("#btn-analizar-conjunto", cont).addEventListener("click", ejecutarAnalisisConjunto);
  $("#btn-limpiar-conjunto", cont).addEventListener("click", limpiarAnalisisConjunto);
}

async function ejecutarAnalisisConjunto() {
  if (!generadoresCompletos()) {
    return SwalNexo.fire({
      icon: "warning",
      title: "Completa los datos",
      text: "Todos los vectores generadores y el vector b deben estar completos.",
    });
  }

  const boton = $("#btn-analizar-conjunto");
  setBusy(boton, true, "Analizando…");

  try {
    const vectores = generadoresTexto();
    const combinacion = await ejecutarTema({
      accion: "combinacion_lineal",
      vectores,
      b: vectorTexto(vectorState.generadores.b),
    });
    const independencia = await ejecutarTema({
      accion: "independencia_lineal",
      vectores,
    });

    vectorState.generadores.combinacion = combinacion;
    vectorState.generadores.independencia = independencia;
    renderVectorContenido();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    mostrarError(error, "No se pudo analizar el conjunto de vectores");
  } finally {
    setBusy(boton, false);
  }
}

function coeficientesConSubindicesLatex(vector) {
  return (vector || []).map((valor, i) => `c_{${i + 1}}=${formatFrac(valor)}`).join(",\\qquad ");
}

function relacionConSubindicesLatex(vectores, coeficientes) {
  const terminos = [];
  (coeficientes || []).forEach((coef, i) => {
    const texto = String(coef ?? "0");
    if (texto === "0") return;
    terminos.push(`\\left(${formatFrac(texto)}\\right)\\mathbf{v}_{${i + 1}}`);
  });
  return terminos.length ? terminos.join("+") : "0";
}

function renderAnalisisConjuntoResultado(cont, combinacion, independencia) {
  const sistemaComb = combinacion.sistema;
  const sistemaInd = independencia.sistema;
  const setLatex = `\\{${(combinacion.vectores || []).map((_, i) => `\\mathbf{v}_{${i + 1}}`).join(",\\ ")}\\}`;

  cont.innerHTML = `
    <section class="space-y-5">
      <article class="flex flex-col gap-4 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5 shadow-nexo sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.18em] text-sky-300">Resultado</p>
          <h2 class="mt-1 text-2xl font-black text-white">Análisis del conjunto de vectores</h2>
          <div class="mt-2 text-sm text-slate-400">$$${setLatex}$$</div>
        </div>
        <button id="btn-analisis-nuevo" type="button" class="btn-primario shrink-0">Analizar otro conjunto</button>
      </article>

      <article class="rounded-3xl border ${combinacion.es_combinacion ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5"} p-5 shadow-nexo sm:p-6">
        <p class="text-xs font-bold uppercase tracking-[.18em] ${combinacion.es_combinacion ? "text-emerald-300" : "text-amber-300"}">Combinación lineal</p>
        <h3 class="mt-1 text-xl font-black text-white">${combinacion.es_combinacion ? "b sí pertenece al generado" : "b no pertenece al generado"}</h3>
        <p class="mt-2 text-sm text-slate-400">Se estudia si existe una solución de $$c_{1}\\mathbf{v}_{1}+\\cdots+c_{k}\\mathbf{v}_{k}=\\mathbf{b}.$$</p>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">Matriz de columnas A</p>
            <div class="mt-3 overflow-x-auto text-center">$$A=${matrixLatex(combinacion.A)}$$</div>
          </div>
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">RREF de [A | b]</p>
            <div class="mt-3 overflow-x-auto text-center">$$${matrixLatex(sistemaComb.matriz_rref, true)}$$</div>
          </div>
        </div>

        ${combinacion.es_combinacion ? `
          <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">Coeficientes encontrados</p>
            <div class="mt-3 overflow-x-auto text-center">$$${coeficientesConSubindicesLatex(combinacion.coeficientes)}$$</div>
            <div class="mt-3 overflow-x-auto text-center">$$${relacionConSubindicesLatex(combinacion.vectores, combinacion.coeficientes)}=\\mathbf{b}=${vectorLatex(combinacion.b)}$$</div>
            <p class="mt-2 text-sm text-slate-400">${combinacion.coeficientes_unicos ? "Los coeficientes son únicos." : "Existe al menos una elección de coeficientes; el sistema tiene variables libres."}</p>
          </div>` : ""}
      </article>

      <article class="rounded-3xl border ${independencia.independiente ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5"} p-5 shadow-nexo sm:p-6">
        <p class="text-xs font-bold uppercase tracking-[.18em] ${independencia.independiente ? "text-emerald-300" : "text-amber-300"}">Independencia lineal</p>
        <h3 class="mt-1 text-xl font-black text-white">${independencia.independiente ? "El conjunto es linealmente independiente" : "El conjunto es linealmente dependiente"}</h3>
        <p class="mt-2 text-sm text-slate-400">Se resuelve $$c_{1}\\mathbf{v}_{1}+\\cdots+c_{k}\\mathbf{v}_{k}=\\mathbf{0}.$$</p>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">Matriz A</p>
            <div class="mt-3 overflow-x-auto text-center">$$A=${matrixLatex(independencia.A)}$$</div>
          </div>
          <div class="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">Sistema homogéneo reducido</p>
            <div class="mt-3 overflow-x-auto text-center">$$${matrixLatex(sistemaInd.matriz_rref, true)}$$</div>
          </div>
        </div>

        ${!independencia.independiente && independencia.relacion?.length ? `
          <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <p class="text-sm font-bold text-white">Una relación no trivial</p>
            <div class="mt-3 overflow-x-auto text-center">$$${coeficientesConSubindicesLatex(independencia.relacion)}$$</div>
            <div class="mt-3 overflow-x-auto text-center">$$${relacionConSubindicesLatex(independencia.vectores, independencia.relacion)}=\\mathbf{0}$$</div>
          </div>` : `
          <div class="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">La única solución es la trivial: $$c_{1}=c_{2}=\\cdots=c_{k}=0.$$</div>`}
      </article>
    </section>`;

  $("#btn-analisis-nuevo", cont).addEventListener("click", limpiarAnalisisConjunto);
  renderMath(cont);
}

// ============================================================
// MATRICES
// ============================================================

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
    if (["operaciones", "analisis", "propiedades"].includes(guardado.tab)) matrixState.tab = guardado.tab;
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
        <p class="mt-4 text-sm font-bold text-slate-300">Regla fila-columna</p>
        ${pasosProductoHTML(r.pasos_AB)}
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
        <div class="overflow-x-auto rounded-xl border border-slate-800 bg-nexo-950/70 px-3 py-3 text-center">$$${operacionFilaLatex(paso)}$$</div>
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

      <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
        ${cardTitulo("Procedimiento", "Reducción por filas", "Todos los pasos se muestran directamente, sin desplegables.")}
        <div class="mt-5">${pasosReduccionMatrizHTML(r.pasos_reduccion_A || [])}</div>
      </article>
    </section>`;

  $("#btn-analisis-editar", cont)?.addEventListener("click", () => {
    matrixState.modos.analisis = "entrada";
    renderMatrizContenido();
  });
  $("#btn-analisis-limpiar", cont)?.addEventListener("click", () => confirmarLimpiarMatrices(["A"]));
  renderMath(cont);
}

function propiedadCardHTML(nombre) {
  const activa = matrixState.propiedad === nombre;
  return `
    <button type="button" data-prop-card="${escapeHtml(nombre)}" class="rounded-xl border p-3 text-left text-sm font-bold transition ${activa ? "border-sky-400/45 bg-sky-500/10 text-sky-200" : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700 hover:text-white"}">
      ${escapeHtml(nombre)}
    </button>`;
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
      ${cardTitulo("Propiedades", "Selecciona una identidad", "A, B y C comparten la misma memoria de todo el módulo. Si ya escribiste una matriz en otro apartado, aparecerá aquí automáticamente.")}

      <div class="mt-5 grid gap-5 xl:grid-cols-3">
        ${propiedadesGrupos.map(grupo => `
          <section class="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
            <h3 class="font-black text-white">${escapeHtml(grupo.titulo)}</h3>
            <div class="mt-3 grid gap-2">${grupo.propiedades.map(propiedadCardHTML).join("")}</div>
          </section>`).join("")}
      </div>

      <div class="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/[.045] p-4">
        <p class="text-xs font-bold uppercase tracking-[.15em] text-sky-400">Propiedad seleccionada</p>
        <p class="mt-1 text-lg font-black text-white">${escapeHtml(matrixState.propiedad)}</p>
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

  $$('[data-prop-card]', cont).forEach(btn => {
    btn.addEventListener("click", () => {
      matrixState.propiedad = btn.dataset.propCard;
      matrixState.resultados.propiedades = null;
      matrixState.modos.propiedades = "entrada";
      guardarMemoriaMatrices();
      renderMatrizPropiedades(cont);
    });
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


// ============================================================
// INICIO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  inicializarSistema();
  inicializarVectores();
  inicializarMatrices();
  abrirVista("sistemas");
});
