// Requiere una compilación web servida en NEXO_URL y Playwright en NODE_PATH.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const url = process.env.NEXO_URL || "http://127.0.0.1:4173/";
const out = "evidencia-rediseno01";
fs.mkdirSync(out, {recursive:true});
const groups = ["Clasificación", "Rangos y pivotes", "Gauss", "Gauss-Jordan", "Solución", "Comprobación"];
const cases = [
  {rows:"1 1 3\n1 -1 1", groups, text:"A · xₚ = (3, 1) = b.", math:"x=2,\\quad y=1"},
  {rows:"1 1 3\n2 2 6", groups:["Solución","Comprobación"], text:"Dirección 1 · A · v1 = (0, 0).", math:"\\left(3,\\,0\\right)+t_{1}\\left(-1,\\,1\\right)"},
  {rows:"1 1 3\n2 2 7", groups:["Rangos y pivotes"], text:"Rango de A = 1 · Rango de [A | b] = 2"},
  {rows:"1 1 3\n2 2 7", groups:["Rangos y pivotes","Clasificación"], text:"Sistema incompatible"},
  {rows:"1 0 1 2\n0 1 1 3", groups:["Gauss-Jordan"], math:"1&0&1&2\\\\0&1&1&3"},
  {rows:"2 1", groups:["Solución"], math:"x=\\frac{1}{2}"},
];
async function run() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:1440,height:840}});
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(url);
    await page.locator('[data-startup="ready"]').waitFor();
    await page.locator(".cosmonaut").evaluate(img => img.decode());
    await page.screenshot({path:path.join(out,"inicio.png")});
    await page.setViewportSize({width:1440,height:640});
    const travel = await page.evaluate(() => Math.min(420, document.documentElement.scrollHeight-innerHeight));
    for (const [name,fraction] of [["mitad",0.5],["tarjetas",1]]) {
      await page.evaluate(y => scrollTo(0,y), Math.floor(travel*fraction));
      await page.waitForFunction(() => Number(document.querySelector(".observatory").style.getPropertyValue("--travel"))>0);
      await page.screenshot({path:path.join(out,name+".png")});
    }
    await page.emulateMedia({reducedMotion:"reduce"});
    const astronaut = page.locator(".cosmonaut");
    const transform = await astronaut.evaluate(e => getComputedStyle(e).transform);
    await page.evaluate(() => scrollTo(0,0));
    assert.equal(await astronaut.evaluate(e => getComputedStyle(e).transform),transform);
    await page.screenshot({path:path.join(out,"movimiento-reducido.png")});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:path.join(out,"movil.png")});
    await page.getByRole("button",{name:"Resolver un sistema"}).click();
    await page.getByText(/Elegir resultados ·/).click();
    const firstCell = page.getByRole("textbox",{name:"Fila 1, columna 1",exact:true});
    const answer = page.locator(".system-answer");
    for (const mode of ["explorador","serio"]) {
      await page.locator("#modo-"+mode).click();
      for (const item of cases) {
        await firstCell.evaluate((input,rows) => {
          const data = new DataTransfer();
          data.setData("text/plain",rows);
          input.dispatchEvent(new ClipboardEvent("paste",{clipboardData:data,bubbles:true,cancelable:true}));
        }, item.rows);
        for(const label of groups)
          await page.getByRole("checkbox",{name:label,exact:true}).setChecked(item.groups.includes(label));
        await firstCell.press("Control+Enter");
        await answer.waitFor();
        if (item.text) assert.ok((await answer.innerText()).includes(item.text));
        if (item.math) assert.ok((await answer.locator("annotation").allTextContents()).some(v=>v.includes(item.math)));
        assert.equal(await answer.locator(":scope > section").count(),item.groups.length);
        await page.getByRole("button",{name:"Editar matriz"}).click();
      }
    }
    await page.setViewportSize({width:390,height:420});
    await firstCell.fill("1/0");
    await firstCell.press("Control+Enter");
    await page.waitForSelector('.augmented-grid input[aria-invalid="true"]:focus');
    assert.equal(await page.getByRole("textbox",{name:"Término b, fila 1"}).inputValue(),"1");
    await firstCell.fill("2");
    await firstCell.press("Control+Enter");
    await answer.waitFor();
    assert.deepEqual(errors,[]);
    console.log("Cinco sistemas en ambos modos, selección, pegado, foco, altura móvil y movimiento reducido verificados.");
  } finally {await browser.close()}
}
run().catch(error=>{console.error(error);process.exitCode=1});
