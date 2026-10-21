// node tests/review_shots.js <outdir> [ids...] : renders every camera preset of each model (closed) plus front/close-up opened
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const [out, ...only] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 640 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/harness.html'); await p.waitForTimeout(600);
  const ids = only.length ? only : await p.evaluate(() => Object.keys(ST3D.models));
  for (const id of ids) {
    const info = await p.evaluate(id => { viewer.load(id); const m = ST3D.models[id]; return { views: Object.keys(m.views), art: !!m.hasArticulation }; }, id);
    for (const v of info.views) { await p.evaluate(v => { viewer.setOpen(0); viewer.view(v, true); }, v); await p.waitForTimeout(150); await p.screenshot({ path: `${out}/${id}_${v}_0.png` }); }
    if (info.art) for (const v of info.views.filter(v => /front|jawsOblique|blades|jaws$/.test(v))) { await p.evaluate(v => { viewer.setOpen(0.8); viewer.view(v, true); }, v); await p.waitForTimeout(150); await p.screenshot({ path: `${out}/${id}_${v}_open.png` }); }
  }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
