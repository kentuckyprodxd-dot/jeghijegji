// Captură rapidă a câtorva momente (verificare vizuală): node snap.js pagina.html outdir t1 t2 ...
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [file, out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: +(process.env.DPR || 1) });
  p.on('console', m => console.log('console:', m.type(), m.text().slice(0, 300))); p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file://' + path.resolve(file) + '?render');
  const info = await p.evaluate(() => window.__ready); console.log('total', info.total);
  for (const t of ts) { const t0 = Date.now(); await p.evaluate(t => window.__frame(t), +t); await p.screenshot({ path: `${out}/t${(+t).toFixed(1)}.jpg`, type: 'jpeg', quality: 88 }); console.log(t, Date.now() - t0, 'ms'); }
  await b.close();
})();
