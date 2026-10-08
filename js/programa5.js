// Álgebra de matrices de las tareas 1–5. Comparte A y B con la ventana original.
const programa5 = { opcion: '6', k: '3', fila_i: '1', fila_j: '2', b: '', eje: 'fila', indice: '1', normalizar: false, ejemplo: 'principal', resultado: null };
const opcionesPrograma5 = {
  '0': 'Ver teoremas clave del módulo', '1': 'Suma', '2': 'Resta',
  '3': 'Multiplicación por escalar', '4': 'Producto matricial', '5': 'Transposición',
  '6': 'Determinante: cofactores, reducción y Sarrus', '7': 'Inversa por Gauss-Jordan',
  '8': 'Inversa por matriz adjunta', '9': 'Verificador de propiedades',
  '10': 'Regla de Cramer', '11': 'Factorización LU', '12': 'Resolver Ax = b con la inversa',
  '13': 'Propiedades de determinantes (también para matrices singulares)',
  '14': 'Resolver con L y U dadas: Gauss-Jordan'
};

function renderPrograma5(cont) {
  const op = programa5.opcion;
  const usaB = ['1', '2', '4', '9', '13', '14'].includes(op);
  const usaVector = ['10', '11', '12', '14'].includes(op);
  cont.innerHTML = `
    <article class="rounded-3xl border border-slate-800 bg-nexo-900 p-5 shadow-nexo sm:p-6">
      ${cardTitulo('Álgebra de matrices', 'Determinantes, inversas y métodos', 'Elige una operación y utiliza las matrices que ya tienes registradas.')}
      <label class="mt-5 block font-bold" for="p5-opcion">Operación</label>
      <select id="p5-opcion" class="select-nexo mt-2 w-full">${Object.entries(opcionesPrograma5).map(([id, nombre]) => `<option value="${id}" ${op===id?'selected':''}>${id}. ${nombre}</option>`).join('')}</select>
      ${op !== '0' ? `<div class="mt-5 grid gap-4 xl:grid-cols-${usaB?'2':'1'}">${matrizCardHTML('A', {contexto:'programa5', titulo:op==='14'?'Matriz L (inferior unitaria)':'Matriz A'})}${usaB?matrizCardHTML('B',{contexto:'programa5',titulo:op==='14'?'Matriz U (escalonada)':'Matriz B'}):''}</div>`:''}
      ${['3','9','13'].includes(op)?`<label class="mt-4 block">Escalar k <input id="p5-k" class="input-nexo" value="${escapeHtml(programa5.k)}"></label>`:''}
      ${['9','13'].includes(op) && matrixState.matrices.A.filas>1?`<div class="mt-4 flex flex-wrap gap-4"><label>${op==='13'?'Posición destino i':'Fila destino i'} <input id="p5-fila_i" class="input-nexo w-24" type="number" min="1" max="${matrixState.matrices.A.filas}" value="${programa5.fila_i}"></label><label>${op==='13'?'Otra posición j':'Otra fila j'} <input id="p5-fila_j" class="input-nexo w-24" type="number" min="1" max="${matrixState.matrices.A.filas}" value="${programa5.fila_j}"></label></div>`:''}
      ${op==='6'?`<div class="mt-4 flex flex-wrap gap-4"><label>Desarrollo por <select id="p5-eje" class="select-nexo">${['fila','columna','auto'].map(e=>`<option value="${e}" ${programa5.eje===e?'selected':''}>${e==='auto'?'Fila o columna con más ceros':e}</option>`).join('')}</select></label><label>Número <input id="p5-indice" type="number" min="1" max="${matrixState.matrices.A.filas}" class="input-nexo w-24" value="${programa5.indice}"></label><label><input id="p5-normalizar" type="checkbox" ${programa5.normalizar?'checked':''}> Extraer factores para obtener pivotes 1</label></div>`:''}
      ${op==='13'?`<label class="mt-4 block">Operaciones de <select id="p5-eje" class="select-nexo">${['fila','columna'].map(e=>`<option value="${e}" ${programa5.eje===e?'selected':''}>${e}</option>`).join('')}</select></label>`:''}
      ${usaVector?`<label class="mt-4 block" for="p5-b">Vector b, componentes separadas por espacios${op==='11'?' (opcional: vacío para obtener solo L y U)':''}</label><input id="p5-b" class="input-nexo mt-2 w-full" value="${escapeHtml(programa5.b)}" placeholder="1 2 3">`:''}
      ${op==='11'?`<label class="mt-4 block">Ejemplo de LU <select id="p5-ejemplo-clase" class="select-nexo">${[['principal','Ejemplo 1: 3 × 3'],['lu4','Ejemplo 2: 4 × 4'],['rectangular','Ejemplo 3: 4 × 5']].map(([id,t])=>`<option value="${id}" ${programa5.ejemplo===id?'selected':''}>${t}</option>`).join('')}</select></label>`:''}
      <div class="mt-5 flex flex-wrap gap-3"><button id="p5-calcular" class="btn-primario" title="Ejecutar el método seleccionado">${op==='0'?'Ver teoremas':'Realizar operación'}</button><button id="p5-ejemplo" class="btn-secundario" title="Cargar un caso de prueba de la guía">Cargar ejemplo</button></div>
    </article><section id="p5-resultado" class="mt-5 space-y-4" aria-live="polite"></section>`;
  document.getElementById('p5-opcion').addEventListener('change', e => {
    programa5.opcion = e.target.value; programa5.resultado = null; renderPrograma5(cont);
  });
  ['k','fila_i','fila_j','b','eje','indice'].forEach(id => document.getElementById('p5-'+id)?.addEventListener('input', e => {
    programa5[id] = e.target.value; document.getElementById('p5-resultado').innerHTML='';
  }));
  document.getElementById('p5-normalizar')?.addEventListener('change',e=>{programa5.normalizar=e.target.checked;programa5.resultado=null;document.getElementById('p5-resultado').innerHTML='';});
  conectarMatrices(cont);
  cont.querySelectorAll('[data-m-cell]').forEach(input=>input.addEventListener('input',()=>{
    programa5.resultado=null; document.getElementById('p5-resultado').innerHTML='';
  }));
  document.getElementById('p5-calcular').addEventListener('click', calcularPrograma5);
  document.getElementById('p5-ejemplo-clase')?.addEventListener('change',e=>{programa5.ejemplo=e.target.value;});
  document.getElementById('p5-ejemplo').addEventListener('click', ejemploPrograma5);
}

async function calcularPrograma5() {
  const boton = document.getElementById('p5-calcular');
  setBusy(boton, true, 'Calculando…');
  try {
    const op = programa5.opcion;
    const nombres = op==='0'?[]:['A', ...(['1','2','4','9','13','14'].includes(op)?['B']:[])];
    if (!nombres.every(matrizCompleta)) throw new Error('Completa las celdas de las matrices necesarias.');
    const datos = {accion:'programa5', ...programa5, resultado:undefined};
    if(op==='13' && datos.eje==='auto') datos.eje='fila';
    nombres.forEach(n=>datos[n]=matrizTexto(n));
    programa5.resultado = await ejecutarTema(datos);
    const panel = document.getElementById('p5-resultado');
    panel.innerHTML = resultadoPrograma5HTML(programa5.resultado);
    renderMath(panel);
    panel.scrollIntoView({behavior:'smooth', block:'start'});
  } catch (error) { mostrarError(error, 'Revisa los datos'); }
  finally { setBusy(boton,false); }
}

function ejemploPrograma5() {
  const op = programa5.opcion;
  let A = [['1','2'],['3','4']], B = [['0','1'],['1','1']];
  if (op==='4') { A=[['1','2','3'],['4','5','6']];B=[['1','0'],['2','1'],['0','3']]; }
  if (op==='7') A=[['1','2','3'],['0','1','4'],['5','6','0']];
  if (['6','8'].includes(op)) A=[['1','3','-3'],['2','0','1'],['-1','4','-2']];
  if (op==='14') { A=[['1','0','0'],['-1','1','0'],['2','-5','1']]; B=[['3','-7','-2'],['0','-2','-1'],['0','0','-1']];programa5.b='-7 5 2'; }
  else if (op==='13') { A=[['6','1'],['3','2']]; B=[['4','3'],['1','2']]; }
  else if (op==='11') {
    A=[['3','-7','-2'],['-3','5','1'],['6','-4','0']];programa5.b='-7 5 2';
    if(programa5.ejemplo==='lu4') { A=[['3','-7','-2','2'],['-3','5','1','0'],['6','-4','0','-5'],['-9','5','-5','12']];programa5.b='-9 5 7 11'; }
    if(programa5.ejemplo==='rectangular') { A=[['2','4','-1','5','-2'],['-4','-5','3','-8','1'],['2','-5','-4','1','8'],['-6','0','7','-3','1']];programa5.b=''; }
  }
  else if(op!=='14') programa5.b = A.length===3?'1 2 3':'3 7';
  for (const [nombre,valores] of Object.entries({A,B})) matrixState.matrices[nombre]={filas:valores.length,columnas:valores[0].length,valores};
  programa5.eje='fila';programa5.indice='1';programa5.normalizar=false;
  programa5.k='3';programa5.fila_i='1';programa5.fila_j='2';
  matrixState.resultados={};guardarMemoriaMatrices();renderMatrizContenido();
}

function p5Valor(valor) {
  if (Array.isArray(valor) && Array.isArray(valor[0])) return `$$${matrixLatex(valor)}$$<p class="text-xs text-slate-500">${valor.length} × ${valor[0].length}</p>`;
  if (Array.isArray(valor)) return `$$${vectorLatex(valor)}$$`;
  return `$$${formatFrac(String(valor))}$$`;
}

function p5Tarjeta(titulo, contenido) {
  return `<article class="rounded-2xl border border-slate-800 bg-nexo-900 p-5 overflow-x-auto"><h3 class="font-bold text-sky-200">${escapeHtml(titulo)}</h3><div class="mt-3">${contenido}</div></article>`;
}

function p5Pasos(pasos) {
  if (!pasos?.length) return '<p>No se necesitan operaciones de fila.</p>';
  return `<details><summary class="cursor-pointer font-bold text-sky-200">Ver ${pasos.length} pasos</summary>${pasos.map(p=>`<div class="mt-4 border-t border-slate-800 pt-3"><p>${escapeHtml(p.descripcion)}</p>${p5Valor(p.matriz)}</div>`).join('')}</details>`;
}

function resultadoPrograma5HTML(r) {
  if (r.teoremas) return p5Tarjeta('Teoremas clave', `<ol class="list-decimal pl-5 space-y-3">${r.teoremas.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ol>`);
  let html = '';
  if(r.diagnostico) html+=p5Tarjeta('Diagnóstico',escapeHtml(r.diagnostico));
  const etiquetas={A:'Matriz A',B:'Matriz B',producto_AB:'Producto AB',determinante_A:'det(A)',determinante_B:'det(B)',b:'Vector b',resultado:'Resultado',escalar:'Escalar',determinante:'det(A)',cofactores:'Matriz de cofactores',adjunta:'adj(A) = Cᵀ',inversa:'Matriz inversa',inversa_adjunta:'Inversa por adjunta',producto:'A · A⁻¹',producto_izquierdo:'A⁻¹ · A',L:'Matriz L',U:'Matriz U',producto_LU:'Comprobación L · U = A',y:'Solución intermedia de Ly = b',solucion:r.sistema?.tipo==='infinitas'?'Solución particular p':'Solución x',comprobacion:'Comprobación Ax = b'};
  html+=`<div class="grid gap-4 xl:grid-cols-2">${Object.entries(etiquetas).filter(([k])=>r[k]!=null).map(([k,t])=>p5Tarjeta(t,p5Valor(r[k]))).join('')}</div>`;
  if(r.expansion) html+=p5Tarjeta(`Expansión por cofactores: ${r.desarrollo?.eje || 'fila'} ${r.desarrollo?.indice || 1}`,`<details><summary class="cursor-pointer">Ver menores y términos</summary>${r.expansion.map(t=>`<div class="mt-4"><p>C${t.fila}${t.columna}: signo ${t.signo}, det(menor) ${escapeHtml(t.det_menor)}; elemento ${escapeHtml(t.elemento)}, cofactor ${escapeHtml(t.cofactor)}, término ${escapeHtml(t.termino)}</p>${t.menor.length?p5Valor(t.menor):'<p>Menor de orden cero: determinante 1.</p>'}</div>`).join('')}</details>`);
  if(r.detalle_cofactores) html+=p5Tarjeta('Paso 2: cálculo de cada cofactor',p5DetalleCofactores(r.detalle_cofactores));
  if(r.reciproco_determinante!=null) html+=p5Tarjeta('Paso 4: A⁻¹ = (1/det(A)) · adj(A)',p5Valor(r.reciproco_determinante));
  if(r.reduccion) html+=p5Tarjeta('Reducción triangular',p5Valor(r.reduccion.triangular)+`<p>Intercambios: ${r.reduccion.intercambios}. Factores extraídos: ${escapeHtml(r.reduccion.factor_filas)}.</p><p>Producto diagonal: ${escapeHtml(r.reduccion.producto_diagonal)}. Determinante corregido: ${escapeHtml(r.reduccion.determinante)}.</p>`+p5Pasos(r.reduccion.pasos));
  if(r.sarrus) html+=p5Tarjeta('Regla de Sarrus (3 × 3)',p5Valor(r.sarrus.arreglo)+`<p>Se repiten los dos primeros renglones, como en clase.</p><p>Diagonales positivas: ${r.sarrus.positivas.map(escapeHtml).join(' + ')}</p><p>Diagonales negativas: ${r.sarrus.negativas.map(escapeHtml).join(' + ')}</p><p>Se resta la suma negativa de la positiva.</p>${p5Valor(r.sarrus.determinante)}`);
  if(r.gauss) html+=p5Tarjeta(r.gauss.inversa ? 'Gauss-Jordan: [A | I] → [I | A⁻¹]' : 'Gauss-Jordan: matriz singular, no se obtiene [I | A⁻¹]',`<p>Pivotes en A: ${r.gauss.pivotes}</p>${p5Valor(r.gauss.inicial)}${p5Valor(r.gauss.reducida)}${p5Pasos(r.gauss.pasos)}`);
  if(r.matrices_cramer) html+=r.matrices_cramer.map((M,i)=>p5Tarjeta(`A${i+1}: sustituir la columna ${i+1} por b`,p5Valor(M)+`<p>det(A${i+1}) = ${escapeHtml(r.determinantes_cramer[i])}. x${i+1} = ${escapeHtml(r.determinantes_cramer[i])} / (${escapeHtml(r.determinante)}) = ${escapeHtml(r.solucion[i])}.</p>`)).join('');
  if(r.suma_determinantes) {
    const c=r.suma_determinantes;
    html+=p5Tarjeta('Advertencia: el determinante no es aditivo',`<p>Matriz A + B:</p>${p5Valor(c.matriz_suma)}<div class="grid gap-3 md:grid-cols-2"><div>det(A + B)${p5Valor(c.izquierda)}</div><div>det(A) + det(B)${p5Valor(c.derecha)}</div></div><p>${c.coinciden?'En este ejemplo los valores coinciden.':'En este ejemplo los valores son distintos.'}</p><p>${escapeHtml(c.nota)}</p>`);
  }
  if(r.propiedades) html+=r.propiedades.map(p=>p5Tarjeta(p.nombre,`<div class="grid gap-3 md:grid-cols-2"><div>Miembro izquierdo${p5Valor(p.izquierda)}</div><div>Miembro derecho${p5Valor(p.derecha)}</div></div><p class="font-bold ${p.cumple?'text-emerald-300':'text-rose-300'}">${p.cumple?'Se cumple':'No se cumple'}</p>${p.matriz?`<details><summary>Matriz utilizada</summary>${p5Valor(p.matriz)}</details>`:''}`)).join('');
  if(r.pasos) html+=p5Tarjeta('Paso 1: reducir A a U usando solo reemplazos',p5Pasos(r.pasos));
  if(r.construccion_L) html+=p5Tarjeta('Paso 2: construir L con los multiplicadores',r.construccion_L.map(c=>`<p>Columna ${c.columna_L} de L: pivote ${escapeHtml(c.pivote)} en columna ${c.columna_pivote_U} de U.</p>${p5Valor(c.entradas)}<p>Dividir entre ${escapeHtml(c.pivote)}:</p>${p5Valor(c.cocientes)}`).join(''));
  if(r.columnas_pivote) html+=p5Tarjeta('Columnas pivote de U',p5Valor(r.columnas_pivote));
  for(const [k,t] of [['reduccion_L','Comprobación: mismas operaciones, L → I'],['etapa_Ly','Paso 3: Gauss-Jordan de [L | b] a [I | y]'],['etapa_Ux','Paso 4: Gauss-Jordan de [U | y] para obtener x']]) if(r[k]) html+=p5Tarjeta(t,p5Valor(r[k].inicial)+p5Valor(r[k].reducida)+p5Pasos(r[k].pasos));
  if(r.sistema) html+=p5SistemaLU(r.sistema);

  for(const [k,t] of [['coinciden','Los métodos coinciden'],['verificada','Comprobación exacta'],['solucion_verificada','Ax = b'],['L_reducida_a_I','L se reduce a I con las mismas operaciones'],['direcciones_verificadas','Las direcciones satisfacen Av = 0']]) if(typeof r[k]==='boolean') html+=p5Tarjeta(t,`<p class="font-bold ${r[k]?'text-emerald-300':'text-rose-300'}">${r[k]?'Se cumple':'No se cumple'}</p>`);
  if(r.nota) html+=p5Tarjeta('Observación',escapeHtml(r.nota));
  return html;
}

function p5DetalleCofactores(terminos) {
  return `<details><summary>Ver menores, signos y cofactores</summary>${terminos.map(t=>`<div class="mt-4"><p>C${t.fila}${t.columna} = (${t.signo}) · (${escapeHtml(t.det_menor)}) = ${escapeHtml(t.cofactor)}</p>${t.menor.length?p5Valor(t.menor):'<p>Menor de orden cero: det = 1.</p>'}</div>`).join('')}</details>`;
}

function p5SistemaLU(sistema) {
  let html = `<p>${escapeHtml(sistema.clasificacion)}</p>`;
  if(sistema.tipo==='infinitas') html+=`<p>x = p + t₁v₁ + …, con parámetros reales.</p><p>Solución particular p:</p>${p5Valor(sistema.solucion_particular)}<p>Variables libres: ${sistema.variables_libres.map(i=>'x'+i).join(', ')}</p>${sistema.direcciones.map((v,i)=>`<p>Dirección v${i+1}:</p>${p5Valor(v)}`).join('')}`;
  return p5Tarjeta('Clasificación del sistema',html);
}
