// Comprueba el recorrido real HTML -> Pyodide -> Python -> resultado visible.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const output = path.resolve('evidencia-ci');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const report = { commit: process.env.GITHUB_SHA, casos: [], errores: errors };
  try {
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => typeof pythonEstaListo === 'function' && pythonEstaListo(),
      null, { timeout: 180000 }
    );
    await page.locator('#contenedor-carga').waitFor({ state: 'hidden' });
    await page.locator('#sel-ecuaciones').selectOption('2');
    await page.locator('#sel-variables').selectOption('2');
    const matrix = [['2', '1'], ['1', '-1']];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        await page.locator('[data-sis-a="' + i + ',' + j + '"]').fill(matrix[i][j]);
      }
      await page.locator('[data-sis-b="' + i + '"]').fill(['5', '1'][i]);
    }
    await page.locator('#btn-resolver-sistema').click();
    await page.locator('#resultado-sistema').waitFor({ state: 'visible' });
    const result = await page.evaluate(() => sistemaState.resultado);
    assert.equal(result.tipo, 'unica');
    assert.deepEqual(result.solucion_particular.map(String), ['2', '1']);
    const visible = await page.locator('#resultado-sistema').innerText();
    assert.match(visible, /única/i);
    report.casos.push({ nombre: 'sistema 2x2', A: matrix, b: ['5', '1'], esperado: ['2', '1'], observado: result.solucion_particular, aprobado: true });
    await page.screenshot({ path: path.join(output, 'sistema-2x2.png'), fullPage: true });

    await page.locator('nav [data-nav="basica"]').click();
    await page.locator('#basica-expresion').fill('(8+2)/5');
    await page.locator('#basica-calcular').click();
    await page.waitForFunction(() => document.querySelector('#basica-resultado').textContent.trim() === '2');
    report.casos.push({ nombre: 'aritmética', expresion: '(8+2)/5', esperado: '2', observado: await page.locator('#basica-resultado').innerText(), aprobado: true });
    await page.screenshot({ path: path.join(output, 'calculadora.png'), fullPage: true });

    // Racional exacto a través de Ans y de los botones de la calculadora.
    await page.locator('#basica-expresion').fill('1/3');
    await page.locator('#basica-calcular').click();
    await page.waitForFunction(() => document.querySelector('#basica-resultado').textContent.trim() === '1/3');
    await page.locator('#basica-expresion').fill('Ans*3');
    await page.locator('#basica-calcular').click();
    await page.waitForFunction(() => document.querySelector('#basica-resultado').textContent.trim() === '1');
    report.casos.push({ nombre: 'Ans racional', esperado: '1', aprobado: true });

    await page.locator('nav [data-nav="calculo"]').click();
    await page.locator('#calculo-expresion').fill('x^2');
    await page.locator('#calculo-operacion').selectOption('definida');
    await page.locator('#calculo-inferior').fill('-1');
    await page.locator('#calculo-superior').fill('1');
    await page.locator('#calculo-resolver').click();
    await page.locator('#calculo-resultado').waitFor({ state: 'visible' });
    const exactText = await page.locator('#calculo-resultado').innerText();
    assert.match(exactText, /2\/3/);
    assert.match(exactText, /exacto/);
    report.casos.push({ nombre: 'integral racional exacta', esperado: '2/3', aprobado: true });
    for (const expression of ['1/x+0', '2*(1/x)']) {
      await page.locator('#calculo-expresion').fill(expression);
      await page.locator('#calculo-resolver').click();
      await page.locator('.swal2-popup').waitFor({ state: 'visible' });
      assert.match(await page.locator('.swal2-popup').innerText(), /singularidad|dominio/i);
      await page.locator('.swal2-confirm').click();
      report.casos.push({ nombre: 'singularidad ' + expression, aprobado: true });
    }

    await page.locator('nav [data-nav="matrices"]').click();
    for (const name of ['A', 'B']) {
      await page.locator('[data-m-dim="' + name + ',f"]').selectOption('1');
      await page.locator('[data-m-dim="' + name + ',c"]').selectOption('1');
    }
    await page.locator('[data-m-cell="A,0,0"]').fill('9007199254740993/2');
    await page.locator('[data-m-cell="B,0,0"]').fill('1');
    await page.locator('#btn-mat-todo').click();
    await page.locator('#btn-exportar-producto').waitFor({ state: 'visible' });
    const formulas = await page.locator('#matriz-contenido .katex-mathml annotation').allTextContents();
    assert.ok(formulas.some(text => text.includes('9007199254740993')));
    const downloading = page.waitForEvent('download');
    await page.locator('#btn-exportar-producto').click();
    const download = await downloading;
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.result.matrix[0][0], '9007199254740993/2');
    fs.writeFileSync(path.join(output, 'producto-exportado.json'), JSON.stringify(exported, null, 2));
    await page.screenshot({ path: path.join(output, 'fraccion-grande.png'), fullPage: true });
    report.casos.push({ nombre: 'fracción grande en pantalla y exportación', esperado: '9007199254740993/2', aprobado: true });

    const nativeCases = JSON.parse(fs.readFileSync(path.join(output, 'contratos-nativos.json'), 'utf8'));
    for (const test of nativeCases) {
      const web = await page.evaluate(request => ejecutarContrato(request), test.solicitud);
      assert.deepEqual(web, test.respuesta);
      report.casos.push({ nombre: 'paridad ' + test.solicitud.operation_id + ' ' + web.status, aprobado: true });
    }

    assert.deepEqual(errors, []);
    report.aprobado = true;
    console.log(JSON.stringify(report));
  } catch (error) {
    report.aprobado = false;
    report.error = error.message;
    await page.screenshot({ path: path.join(output, 'fallo.png'), fullPage: true });
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'interfaz.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
