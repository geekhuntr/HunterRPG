// Identify quiz, Compare and Inventory in the built app (WebGL via SwiftShader)
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const assert = require('assert'); const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 820 } }); const errs = []; let ok = 0; const pass = m => { ok++; console.log('ok -', m); };
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load/.test(m.text()) && errs.push(m.text()));
  await p.goto('file://' + __dirname + '/../dist/index.html'); await p.waitForTimeout(800);
  const n = await p.evaluate(() => Object.keys(__st3d.MODELS).length);
  // Inspect: switching models through the selector keeps names hidden
  await p.selectOption('#sel', 'kelly'); await p.waitForTimeout(300); assert(!/Kelly/i.test(await p.innerText('#side'))); assert(!/Kelly|Crile/i.test(await p.innerText('#sel'))); pass('model selector hides names until reveal (' + n + ' models)');
  await p.click('[data-act="reveal"]'); assert(/Kelly hemostat/.test(await p.innerText('#side'))); pass('reveal after switching model');
  // Identify
  await p.click('[data-act="tab"][data-v="identify"]'); await p.waitForTimeout(600);
  const qn = await p.evaluate(() => document.querySelectorAll('.choice').length); assert.equal(qn, 4);
  let right = 0, total = 0;
  const NQ = Math.min(n, 8);
  for (let i = 0; i < NQ; i++) {
    const q = await p.evaluate(() => { const side = document.querySelector('.side'); return side.innerText; });
    assert(/What is this instrument/.test(q));
    const cur = await p.evaluate(() => { const v = __st3d.viewer; return v.def.id; });
    const answerName = await p.evaluate(id => __st3d.byId[__st3d.MODELS[id].recordId].name, cur);
    const labels = await p.$$eval('.choice', bs => bs.map(b => b.innerText.replace(/^[A-D]\s*/, '')));
    assert(labels.includes(answerName), 'answer among choices'); assert.equal(new Set(labels).size, 4, 'distinct choices');
    const pick = i % 4 === 3 ? labels.findIndex(l => l !== answerName) : labels.indexOf(answerName); if (pick === labels.indexOf(answerName)) right++; total++;
    // rotate the model before answering, then answer; the camera must not reset when feedback appears
    const vb = await p.locator('#vp').boundingBox(); await p.mouse.move(vb.x + 300, vb.y + 300); await p.mouse.down(); await p.mouse.move(vb.x + 450, vb.y + 340, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(1500);
    const cam0 = await p.evaluate(() => __st3d.viewer.camera.position.toArray());
    await p.click(`.choice >> nth=${pick}`); await p.waitForTimeout(200);
    const cam1 = await p.evaluate(() => __st3d.viewer.camera.position.toArray()); const front = await p.evaluate(() => { const v = __st3d.viewer.def.views.front; return v.pos; }); assert(Math.hypot(...cam1.map((x, k) => x - front[k])) > 5 && Math.hypot(...cam0.map((x, k) => x - cam1[k])) < 3, 'camera kept after answering');
    assert(/Correct|Not quite/.test(await p.innerText('.fb')));
    if (i === 0) await p.screenshot({ path: OUT + '/identify.png' });
    await p.click('[data-act="idnext"]'); await p.waitForTimeout(500);
  }
  await p.evaluate(() => { const z = document.querySelector('[data-act="idnew"]'); }); pass(`identify quiz (first ${total} of ${n} models) scores ${right}/${total} correctly; 4 distinct choices each; camera kept on answer`);
  // Compare
  await p.click('[data-act="tab"][data-v="compare"]'); await p.waitForTimeout(800);
  const canv = await p.evaluate(() => document.querySelectorAll('canvas').length); assert.equal(canv, 2); assert(/Instrument A/.test(await p.innerText('main')) && !/Allis|Babcock forceps/.test(await p.innerText('.cmpgrid'))); pass('compare shows two live 3D viewports with names hidden');
  const vb = await p.locator('#vp').boundingBox(); const b0 = await p.evaluate(() => __st3d.viewer2.camera.position.toArray());
  await p.mouse.move(vb.x + 200, vb.y + 200); await p.mouse.down(); await p.mouse.move(vb.x + 330, vb.y + 240, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
  const b1 = await p.evaluate(() => __st3d.viewer2.camera.position.toArray()); assert(Math.hypot(...b0.map((x, k) => x - b1[k])) > 2); pass('rotating A also rotates B (synced cameras)');
  await p.click('.vb[data-v="jawsOblique"]'); await p.waitForTimeout(900); await p.locator('#open').fill('70'); await p.waitForTimeout(300); await p.click('[data-act="cmpreveal"]'); await p.waitForTimeout(800);
  assert(/Allis tissue forceps|Babcock/.test(await p.innerText('main')) && /Quick rule/.test(await p.innerText('main'))); pass('reveal shows names and the key difference'); await p.screenshot({ path: OUT + '/compare.png' });
  const NP = await p.locator('[data-act="cmp"]').count(); for (let i = 0; i < NP; i++) { await p.click(`[data-act="cmp"][data-v="${i}"]`); await p.waitForTimeout(500); assert.equal(await p.evaluate(() => document.querySelectorAll('canvas').length), 2, 'pair ' + i); }
  pass(`all ${NP} comparison pairs load two models`); await p.click('[data-act="cmp"][data-v="1"]'); await p.waitForTimeout(600); await p.click('.vb[data-v="jawsOblique"]'); await p.locator('#open').fill('80'); await p.waitForTimeout(900); await p.screenshot({ path: OUT + '/compare_kelly_crile.png' });
  // Inventory
  await p.click('[data-act="tab"][data-v="inventory"]'); await p.waitForTimeout(300); const t = await p.innerText('main');
  const ready = (t.match(/3D model/g) || []).length; assert(/81 list rows/.test(t) && /49 study records/.test(t)); assert.equal(await p.locator('.invrow').count(), 49); pass(`inventory lists all 49 instruments with status (${ready} with a 3D model label)`);
  await p.click('[data-act="invopen"][data-v="kocher"]'); assert(/No 3D model yet/.test(await p.innerText('main'))); await p.click('[data-act="invopen"][data-v="crile"]'); await p.click('[data-act="openmodel"][data-v="crile"]'); await p.waitForTimeout(500); assert.equal(await p.evaluate(() => __st3d.viewer.def.id), 'crile'); pass('inventory opens a model in the inspector; unmodeled items say so');
  await p.screenshot({ path: OUT + '/inventory_to_inspect.png' });
  // context count stays bounded after many tab switches (viewers are disposed)
  for (let i = 0; i < 6; i++) { await p.click('[data-act="tab"][data-v="compare"]'); await p.waitForTimeout(200); await p.click('[data-act="tab"][data-v="inspect"]'); await p.waitForTimeout(200); }
  assert(await p.evaluate(() => document.querySelectorAll('canvas').length) === 1); pass('viewers disposed on tab switch (no WebGL context leak)');
  console.log('\nERRORS:', JSON.stringify(errs)); console.log(ok, 'checks'); await b.close();
})().catch(e => { console.error('FAIL', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
