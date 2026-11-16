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
