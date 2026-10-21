// usage: node shot3d.js <outdir> <page> [views comma list] [open]  -> screenshots of named camera views
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const [out, page, views = 'front,side,jaws', open = '0', model = 'babcock'] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + page + '?model=' + model); await p.waitForTimeout(700);
  for (const v of views.split(',')) { await p.evaluate(([v, o]) => { viewer.setOpen(+o); viewer.view(v, true); }, [v, open]); await p.waitForTimeout(250); await p.screenshot({ path: `${out}/${model}_${v}_${open}.png` }); }
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
