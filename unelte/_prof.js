const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: +process.env.DPR });
  await p.goto('file://' + path.resolve(process.argv[2]) + '?render');
  await p.evaluate(() => window.__ready);
  for (const t of [9, 9.1, 30, 30.1, 45, 45.1]) { const t0 = Date.now(); await p.evaluate(t => window.__frame(t), t); const t1 = Date.now(); await p.screenshot({ type: 'jpeg', quality: 93 }); console.log(t, 'render', t1 - t0, 'shot', Date.now() - t1); }
  await b.close();
})();
