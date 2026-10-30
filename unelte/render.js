// Randează cadrele videoului: node render.js pagina.html outdir fps start end
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [file, out, fps, a, b] = process.argv.slice(2);
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: +(process.env.DPR || 2) });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file://' + path.resolve(file) + '?render');
  await p.evaluate(() => window.__ready);
  if (+a === 0) fs.writeFileSync(out + '/cues.json', JSON.stringify(await p.evaluate(() => window.__cues)));
  for (let f = +a; f < +b; f++) {
    const fn = `${out}/f${String(f).padStart(5, '0')}.jpg`;
    if (fs.existsSync(fn)) continue;
    await p.evaluate(t => window.__frame(t), f / +fps);
    await p.screenshot({ path: fn, type: 'jpeg', quality: 93 });
    if (f % 50 === 0) console.log('cadru', f);
  }
  await br.close();
})();
