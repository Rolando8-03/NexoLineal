// Herramientas adicionales de la calculadora.
// La opción Matrices concentra la resolución de sistemas; aquí queda Vectores.

function vectorLatex(vector) {
  return (
    "\\begin{pmatrix}" +
    vector.map(formatFrac).join("\\\\") +
    "\\end{pmatrix}"
  );
}

function formulaTema(latex) {
  return `<div class="katex-display">$$${latex}$$</div>`;
}

const panelesTemas = `
<section class="tema vista-secundaria" id="vista-vectores" hidden>
  <h2>Vectores</h2>
  <p>Realiza operaciones básicas con vectores y comprueba propiedades algebraicas.</p>

  <form id="form-vectores">
    <label>
      Vector u
      <input name="u" placeholder="Ej.: 1 -2" autocomplete="off" required>
    </label>

    <label>
      Vector v
      <input name="v" placeholder="Ej.: 2 -5" autocomplete="off" required>
    </label>

    <label>
      Vector w
      <input name="w" placeholder="Ej.: 0 0" autocomplete="off" required>
    </label>

    <label>
      Escalar c
      <input name="c" placeholder="Ej.: 4" autocomplete="off" required>
    </label>

    <label>
      Escalar d
      <input name="d" placeholder="Ej.: -3" autocomplete="off" required>
    </label>

    <div class="botones form-acciones ancho">
      <button type="submit" class="btn-resolver" aria-label="Calcular las operaciones con vectores">
        <span class="btn-texto">Calcular</span>
      </button>
      <button type="reset" class="btn-limpiar" aria-label="Restablecer los valores de los vectores">✕</button>
    </div>
  </form>

  <output id="salida-vectores" aria-live="polite"></output>
</section>
`;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("herramientas").innerHTML = panelesTemas;

  const main = document.getElementById("main");
  const vistaVectores = document.getElementById("vista-vectores");

  document.querySelectorAll("[data-vista]").forEach(boton => {
    boton.addEventListener("click", () => {
      const esMatrices = boton.dataset.vista === "matrices";

      document.querySelectorAll("[data-vista]").forEach(b => {
        const activo = b === boton;
        b.classList.toggle("activo", activo);
        b.setAttribute("aria-pressed", String(activo));
      });

      main.hidden = !esMatrices;
      vistaVectores.hidden = esMatrices;
    });
  });

  const formulario = document.getElementById("form-vectores");
  const salida = document.getElementById("salida-vectores");

  formulario.addEventListener("reset", () => {
    salida.innerHTML = "";
  });

  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    salida.textContent = "Calculando...";

    try {
      const datos = Object.fromEntries(new FormData(formulario));
      const resultado = await ejecutarTema({ accion: "vectores", ...datos });
      mostrarVectoresTema(salida, resultado);
      renderizarKatex(salida);
    } catch (error) {
      salida.textContent = error.message;
    } finally {
      boton.disabled = false;
    }
  });
});

function pasoVector(nombre, formula1, formula2, resultado) {
  return `
    <details class="paso-vector">
      <summary>${nombre}</summary>
      <div class="paso-vector-contenido">
        <div class="paso-vector-item">
          <span class="paso-numero">1</span>
          <div><strong>Planteamiento</strong>${formulaTema(formula1)}</div>
        </div>
        <div class="paso-vector-item">
          <span class="paso-numero">2</span>
          <div><strong>Operación componente a componente</strong>${formulaTema(formula2)}</div>
        </div>
        <div class="paso-vector-item paso-vector-final">
          <span class="paso-numero">3</span>
          <div><strong>Resultado</strong>${formulaTema(resultado)}</div>
        </div>
      </div>
    </details>`;
}

function construirPasosVectores(r) {
  const vectorU = Array.isArray(r.u) ? r.u : [];
  const vectorV = Array.isArray(r.v) ? r.v : [];
  const c = formatFrac(r.c), d = formatFrac(r.d);
    const suma = r.suma, resta = r.resta, menosV = r.menos_v;
  const menos2v = r.menos_2v, uMenos2v = r.u_menos_2v;
  const cu = r.cu, dv = r.dv, combinacion = r.combinacion;

  return `
    <div class="desarrollo-vector">
      <h3>Desarrollo paso a paso</h3>
      <p class="intro-metodo">Cada operación se muestra componente por componente para que el procedimiento se pueda seguir igual que en el desarrollo de una matriz.</p>

      ${pasoVector(
        "1. Suma de vectores: u + v",
        `u+v=${vectorLatex(vectorU)}+${vectorLatex(vectorV)}`,
        `u+v=${vectorLatex(vectorU.map((x,i)=>`(${formatFrac(x)})+(${formatFrac(vectorV[i])})`))}`,
        `u+v=${vectorLatex(suma)}`
      )}

      ${pasoVector(
        "2. Resta de vectores: u − v",
        `u-v=${vectorLatex(vectorU)}-${vectorLatex(vectorV)}`,
        `u-v=${vectorLatex(vectorU.map((x,i)=>`(${formatFrac(x)})-(${formatFrac(vectorV[i])})`))}`,
        `u-v=${vectorLatex(resta)}`
      )}

      ${pasoVector(
        "3. Vector opuesto: −v",
        `-v=-1${vectorLatex(vectorV)}`,
        `-v=${vectorLatex(vectorV.map(x=>`-1(${formatFrac(x)})`))}`,
        `-v=${vectorLatex(menosV)}`
      )}

      ${pasoVector(
        "4. Multiplicación escalar: −2v",
        `-2v=-2${vectorLatex(vectorV)}`,
        `-2v=${vectorLatex(vectorV.map(x=>`-2(${formatFrac(x)})`))}`,
        `-2v=${vectorLatex(menos2v)}`
      )}

      ${pasoVector(
        "5. Combinación: u − 2v",
        `u-2v=${vectorLatex(vectorU)}-2${vectorLatex(vectorV)}`,
        `u-2v=${vectorLatex(vectorU.map((x,i)=>`(${formatFrac(x)})-2(${formatFrac(vectorV[i])})`))}`,
        `u-2v=${vectorLatex(uMenos2v)}`
      )}

      ${pasoVector(
        `6. Multiplicación escalar: cu (c = ${c})`,
        `cu=${c}${vectorLatex(vectorU)}`,
        `cu=${vectorLatex(vectorU.map(x=>`(${c})(${formatFrac(x)})`))}`,
        `cu=${vectorLatex(cu)}`
      )}

      ${pasoVector(
        `7. Multiplicación escalar: dv (d = ${d})`,
        `dv=${d}${vectorLatex(vectorV)}`,
        `dv=${vectorLatex(vectorV.map(x=>`(${d})(${formatFrac(x)})`))}`,
        `dv=${vectorLatex(dv)}`
      )}

      ${pasoVector(
        `8. Combinación lineal: cu + dv`,
        `cu+dv=${vectorLatex(cu)}+${vectorLatex(dv)}`,
        `cu+dv=${vectorLatex(cu.map((x,i)=>`(${formatFrac(x)})+(${formatFrac(dv[i])})`))}`,
        `cu+dv=${vectorLatex(combinacion)}`
      )}
    </div>`;
}

function mostrarVectoresTema(salida, r) {
  const vectorU = Array.isArray(r.u) ? r.u : [];
  const operaciones = [
    ["u + v", r.suma],
    ["u - v", r.resta],
    ["-v", r.menos_v],
    ["-2v", r.menos_2v],
    ["u - 2v", r.u_menos_2v],
    ["cu", r.cu],
    ["dv", r.dv],
    ["cu + dv", r.combinacion],
  ];

  const filasOperaciones = operaciones.map(([nombre, vector]) => `
    <tr><td>${nombre}</td><td>${formulaTema(vectorLatex(vector))}</td></tr>
  `).join("");

  const filasPropiedades = r.propiedades.map((propiedad, i) => `
    <details class="propiedad-vector">
      <summary><span>${i + 1}. ${propiedad.nombre}</span><strong>${propiedad.cumple ? "Se cumple" : "No se cumple"}</strong></summary>
      <div class="propiedad-vector-contenido">
        <p>Se calculan ambos lados de la igualdad:</p>
        ${formulaTema(vectorLatex(propiedad.izquierda) + "=" + vectorLatex(propiedad.derecha))}
        <p class="resultado-propiedad">${propiedad.cumple ? "✓ Ambos lados producen el mismo vector." : "✗ Los dos lados producen vectores diferentes."}</p>
      </div>
    </details>
  `).join("");

  salida.innerHTML = `
    <h3>Operaciones</h3>
    <p><strong>¿u = v?</strong> ${r.iguales ? "Sí" : "No"}.</p>
    <table>
      <thead><tr><th>Operación</th><th>Resultado</th></tr></thead>
      <tbody>${filasOperaciones}</tbody>
    </table>

    ${construirPasosVectores(r)}

    <h3>Longitud de u</h3>
    <div class="desarrollo-vector desarrollo-norma">
      <details class="paso-vector" open>
        <summary>Cálculo de la longitud de u</summary>
        <div class="paso-vector-contenido">
          <div class="paso-vector-item"><span class="paso-numero">1</span><div><strong>Fórmula</strong>${formulaTema(`\\|u\\|=\\sqrt{u_1^2+u_2^2+\\cdots+u_n^2}`)}</div></div>
          <div class="paso-vector-item"><span class="paso-numero">2</span><div><strong>Sustitución</strong>${formulaTema(`\\|u\\|=\\sqrt{${vectorU.map(x=>formatFrac(x)).map(x=>`(${x})^2`).join("+")}}`)}</div></div>
          <div class="paso-vector-item paso-vector-final"><span class="paso-numero">3</span><div><strong>Resultado</strong>${formulaTema(`\\|u\\|=\\sqrt{${formatFrac(r.norma2)}}`)}</div></div>
        </div>
      </details>
    </div>

    <h3>Propiedades algebraicas</h3>
    <p class="intro-metodo">Abrí cada propiedad para ver la comprobación realizada por la calculadora.</p>
    <div class="propiedades-vectores">${filasPropiedades}</div>

    <div id="zona-grafica"></div>
  `;

  const zona = salida.querySelector("#zona-grafica");
  if (vectorU.length !== 2) {
    zona.textContent = "La gráfica se muestra únicamente para vectores de R².";
    return;
  }

  zona.innerHTML = `
    <h3>Vectores en el plano</h3>
    <label>Gráfica
      <select id="tipo-grafica">
        <option value="suma">u, v y u + v</option>
        <option value="escala">u y cu</option>
        <option value="resta">u, -v y u - v</option>
        <option value="doble">u, -2v y u - 2v</option>
        <option value="combinacion">cu, dv y cu + dv</option>
      </select>
    </label>
    <div id="dibujo-vector"></div>
  `;

  const selector = zona.querySelector("select");
  function dibujar() {
    let series;
    if (selector.value === "escala") {
      series = [["u", r.u], ["cu", r.cu]];
    } else if (selector.value === "resta") {
      series = [["u", r.u], ["-v", r.menos_v], ["u-v", r.resta]];
    } else if (selector.value === "doble") {
      series = [["u", r.u], ["-2v", r.menos_2v], ["u-2v", r.u_menos_2v]];
    } else if (selector.value === "combinacion") {
      series = [["cu", r.cu], ["dv", r.dv], ["cu+dv", r.combinacion]];
    } else {
      series = [["u", r.u], ["v", r.v], ["u+v", r.suma]];
    }
    dibujarVectores(zona.querySelector("#dibujo-vector"), series, selector.value !== "escala");
  }
  selector.addEventListener("change", dibujar);
  dibujar();
}

function dibujarVectores(contenedor, series, paralelogramo) {
  const datos = series.map(([nombre, vector]) => [nombre, vector.map(parseFrac)]);
  const puntos = [[0, 0], ...datos.map(d => d[1])];
  const xs = puntos.map(p => p[0]);
  const ys = puntos.map(p => p[1]);

  const rangoX = Math.max(Math.max(...xs) - Math.min(...xs), 1);
  const rangoY = Math.max(Math.max(...ys) - Math.min(...ys), 1);
  const centroX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centroY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const escala = 400 / Math.max(rangoX, rangoY, 1);
  const x = valor => 300 + (valor - centroX) * escala;
  const y = valor => 260 - (valor - centroY) * escala;

  const minGX = Math.floor(Math.min(...xs) - 1);
  const maxGX = Math.ceil(Math.max(...xs) + 1);
  const minGY = Math.floor(Math.min(...ys) - 1);
  const maxGY = Math.ceil(Math.max(...ys) + 1);

  const colores = ["#42a5f5", "#ffc107", "#67e8aa"];
  const ox = x(0), oy = y(0);

  let svg = `<svg class="grafica-vector" viewBox="0 0 600 530" role="img" aria-label="Vectores en el plano cartesiano">
    <rect x="18" y="18" width="564" height="484" rx="14" fill="#0a1628" stroke="#294468"/>
  `;

  for (let gx = minGX; gx <= maxGX; gx++) {
    const px = x(gx);
    if (px >= 25 && px <= 575) {
      svg += `<line x1="${px}" y1="28" x2="${px}" y2="492" class="rejilla"/>`;
      if (gx !== 0) svg += `<text x="${px}" y="${Math.min(492, Math.max(485, oy + 18))}" class="marca-x" text-anchor="middle">${gx}</text>`;
    }
  }
  for (let gy = minGY; gy <= maxGY; gy++) {
    const py = y(gy);
    if (py >= 28 && py <= 492) {
      svg += `<line x1="25" y1="${py}" x2="575" y2="${py}" class="rejilla"/>`;
      if (gy !== 0) svg += `<text x="${Math.min(570, Math.max(30, ox - 10))}" y="${py + 4}" class="marca-y" text-anchor="end">${gy}</text>`;
    }
  }

  svg += `
    <line x1="25" y1="${oy}" x2="575" y2="${oy}" class="eje"/>
    <line x1="${ox}" y1="492" x2="${ox}" y2="28" class="eje"/>
    <text x="565" y="${Math.max(24, oy - 10)}" class="nombre-eje">x</text>
    <text x="${Math.min(575, ox + 10)}" y="40" class="nombre-eje">y</text>
    <circle cx="${ox}" cy="${oy}" r="4" class="origen"/>
    <text x="${Math.min(575, ox + 9)}" y="${Math.min(492, oy + 17)}" class="marca-origen">0</text>
  `;

  if (paralelogramo && datos.length >= 3) {
    const a = datos[0][1], b = datos[1][1], suma = datos[2][1];
    svg += `<path d="M ${x(a[0])} ${y(a[1])} L ${x(suma[0])} ${y(suma[1])} L ${x(b[0])} ${y(b[1])}" class="paralelogramo"/>`;
  }

  datos.forEach(([nombre, vector], i) => {
    const inicioX = ox, inicioY = oy;
    const finalX = x(vector[0]), finalY = y(vector[1]);
    const color = colores[i % colores.length];
    const dx = finalX - inicioX, dy = finalY - inicioY;
    const longitud = Math.hypot(dx, dy);

    if (longitud > 0) {
      // La punta se dibuja manualmente para que conserve el color del vector
      // y tenga un tamaño pequeño, sin el pico blanco del marcador SVG.
      const ux = dx / longitud, uy = dy / longitud;
      const punta = 10;
      const ancho = 4.5;
      const baseX = finalX - ux * punta;
      const baseY = finalY - uy * punta;
      const ladoX = -uy * ancho;
      const ladoY = ux * ancho;
      const p1 = `${finalX},${finalY}`;
      const p2 = `${baseX + ladoX},${baseY + ladoY}`;
      const p3 = `${baseX - ladoX},${baseY - ladoY}`;
      svg += `<line x1="${inicioX}" y1="${inicioY}" x2="${finalX - ux * 3}" y2="${finalY - uy * 3}" stroke="${color}" class="vector-line"/>`;
      svg += `<polygon points="${p1} ${p2} ${p3}" fill="${color}" class="punta-vector"/>`;
      const etiquetaX = finalX + ux * 14;
      const etiquetaY = finalY + uy * 14;
      svg += `<text x="${etiquetaX}" y="${etiquetaY}" fill="${color}" class="etiqueta-vector">${nombre}</text>`;
      svg += `<circle cx="${finalX}" cy="${finalY}" r="3" fill="${color}" class="extremo-vector"/>`;
    } else {
      svg += `<circle cx="${finalX}" cy="${finalY}" r="7" fill="none" stroke="${color}" stroke-width="3"/>`;
    }
  });

  svg += "</svg>";
  const leyenda = series.map(([nombre, vector], i) => `<span class="leyenda-vector" style="--vector-color:${colores[i % colores.length]}"><span class="punto-leyenda"></span>${nombre} = (${vector.join(", ")})</span>`).join("");
  contenedor.innerHTML = svg + `<div class="leyenda-vectores">${leyenda}</div>`;
}


// Mostrar el sistema como una ecuación entre vectores.
// Esta sección pertenece a la vista de Matrices y usa los datos
// calculados por el solucionador; no modifica la sección Vectores.
function poblarEcuacionVectorial(panel, r) {
  const columnas = r.columnas_vectores || [];

  const ecuacion = columnas.map((vector, i) => {
    return `x_{${i + 1}}${vectorLatex(vector)}`;
  }).join("+");

  let html = `
    <p>
      Cada columna de A es un vector de
      ${r.numero_ecuaciones} componente(s).
      Los pesos son las incógnitas del sistema.
    </p>

    <h3 class="sec-titulo">
      Ecuación vectorial equivalente
    </h3>

    ${formulaTema(
      `${ecuacion}=${vectorLatex(r.b)}`
    )}

    <h3 class="sec-titulo">
      ¿b es combinación lineal de las columnas de A?
    </h3>
  `;

  if (!r.es_combinacion_lineal) {
    panel.innerHTML = html + `
      <p>
        <strong>No.</strong>
        El sistema es inconsistente: ningún conjunto
        de pesos produce b.
      </p>
    `;
    return;
  }

  html += `
    <p>
      <strong>Sí.</strong>
      El sistema es consistente.
      Una elección de pesos es:
    </p>
  `;

  html += formulaTema(
    `x=${vectorLatex(r.solucion_particular)}`
  );

  const solucion = r.solucion_particular || [];
  const combinacion = columnas.map((vector, i) => {
    const peso = formatFrac(solucion[i] ?? "0");
    return `\\left(${peso}\\right)` + vectorLatex(vector);
  }).join("+");

  html += formulaTema(
    `${combinacion}=${vectorLatex(r.b)}`
  );

  html += `
    <p>
      ${r.tipo === "unica"
        ? "Los pesos son únicos."
        : "Los pesos no son únicos. Esta elección asigna cero a los parámetros libres."}
    </p>

    <h3 class="sec-titulo">
      Solución en forma vectorial
    </h3>
  `;

  const direcciones = (r.direcciones || []).map((vector, i) => {
    return `+t_{${i + 1}}${vectorLatex(vector)}`;
  }).join("");

  html += formulaTema(
    `x=${vectorLatex(solucion)}` + direcciones
  );

  if ((r.direcciones || []).length) {
    html += `
      <p>
        Cada parámetro t recorre los números reales.
        El vector particular p satisface Ap = b.
        Cada vector de dirección d satisface Ad = 0.
      </p>
    `;
  }

  panel.innerHTML = html;
}
