const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const assert = require('assert'); const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = []; let ok = 0; const pass = m => { ok++; console.log('ok -', m); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 820 } }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await p.goto('file:///home/user/HunterRPG/st-3d/dist/index.html'); await p.waitForTimeout(900);
  const vb = await p.locator('#vp').boundingBox(); const sb = await p.locator('#side').boundingBox();
  assert(vb.width > sb.width * 1.8, 'viewport dominant'); pass(`viewport dominant (${Math.round(vb.width)}x${Math.round(vb.height)} vs side ${Math.round(sb.width)}px wide)`);
  // name and function hidden until reveal
  let t = await p.innerText('#side'); assert(!/Babcock/i.test(t) && !/atraumatic|delicate tubular/i.test(t)); assert(!/Babcock/i.test(await p.innerText('#sel'))); pass('name and function hidden before reveal (also in model selector)');
  await p.screenshot({ path: OUT + '/app_desktop_hidden.png' });
  // real mouse rotation
  const c = await p.evaluate(() => { const v = __st3d.viewer; return { p: v.camera.position.toArray(), d: v.distance() }; });
  await p.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2); await p.mouse.down(); await p.mouse.move(vb.x + vb.width / 2 + 220, vb.y + vb.height / 2 + 60, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(400);
  const c2 = await p.evaluate(() => ({ p: __st3d.viewer.camera.position.toArray(), d: __st3d.viewer.distance() }));
  const moved = Math.hypot(...c.p.map((x, i) => x - c2.p[i])); assert(moved > 5, 'rotation moved camera ' + moved); assert(Math.abs(c.d - c2.d) < 0.5, 'distance preserved'); pass('mouse drag rotates the camera around the model (' + moved.toFixed(1) + ' cm)');
  await p.screenshot({ path: OUT + '/app_desktop_rotated.png' });
  // wheel zoom
  const d0 = await p.evaluate(() => __st3d.viewer.distance()); await p.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2); for (let i = 0; i < 6; i++) await p.mouse.wheel(0, -240); await p.waitForTimeout(500);
  const d1 = await p.evaluate(() => __st3d.viewer.distance()); assert(d1 < d0 * 0.75, `zoom in ${d0} -> ${d1}`); for (let i = 0; i < 10; i++) await p.mouse.wheel(0, 300); await p.waitForTimeout(500); const d2 = await p.evaluate(() => __st3d.viewer.distance()); assert(d2 > d1 * 1.3); pass(`wheel zoom works (${d0.toFixed(1)} -> ${d1.toFixed(1)} -> ${d2.toFixed(1)} cm)`);
  // reset
  await p.click('[data-act="reset"]'); await p.waitForTimeout(900); const d3 = await p.evaluate(() => __st3d.viewer.distance()); const pos = await p.evaluate(() => __st3d.viewer.camera.position.toArray()); assert(Math.abs(pos[0] + 1.25) < 0.3 && Math.abs(pos[1]) < 0.3 && pos[2] > 25, 'reset position ' + pos); pass('reset returns to the front view');
  // open / close articulation
  const jawGap = () => p.evaluate(() => { const g = __st3d.viewer.model.group; const ys = []; g.traverse(o => { if (o.isMesh && o.userData.part === 'jaws') { o.updateWorldMatrix(true, false); o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); ys.push(bb.min.y, bb.max.y); } }); return Math.max(...ys) - Math.min(...ys); });
  const closedGap = await jawGap(); await p.locator('#open').fill('100'); await p.waitForTimeout(300); const openGap = await jawGap(); assert(openGap > closedGap + 1.2, `${closedGap} -> ${openGap}`); await p.screenshot({ path: OUT + '/app_desktop_open.png' }); await p.locator('#open').fill('0'); pass(`open/close slider moves the jaws apart (${closedGap.toFixed(2)} -> ${openGap.toFixed(2)} cm)`);
  // close-up presets
  await p.click('.vb[data-v="jaws"]'); await p.waitForTimeout(1000); const dj = await p.evaluate(() => __st3d.viewer.distance()); assert(dj < 9); await p.screenshot({ path: OUT + '/app_desktop_jaws.png' }); pass('jaw close-up preset (distance ' + dj.toFixed(1) + ' cm)');
  await p.click('.vb[data-v="jawsOblique"]'); await p.waitForTimeout(1000); await p.screenshot({ path: OUT + '/app_desktop_jaws34.png' });
  // part highlight
  await p.click('[data-act="part"][data-v="ratchet"]'); await p.waitForTimeout(1000); assert(await p.evaluate(() => { let n = 0; __st3d.viewer.model.group.traverse(o => { if (o.isMesh && o.material.emissiveIntensity > 0.5) n++; }); return n; }) >= 2); await p.screenshot({ path: OUT + '/app_desktop_ratchet.png' }); pass('part chips highlight and frame the part');
  // reveal
  await p.click('[data-act="reveal"]'); t = await p.innerText('#side'); assert(/Babcock forceps/i.test(t) && /Gently grasps delicate tubular/.test(t)); assert(/Key identifying features/i.test(t)); pass('reveal shows name + primary function'); await p.screenshot({ path: OUT + '/app_desktop_revealed.png' });
  await p.click('[data-act="know"]'); assert((await p.evaluate(() => __st3d.S.prog.babcock)).c === 1); pass('study control records progress for the instrument');
  // phone
  const m = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const mp = await m.newPage(); const merrs = [];
  mp.on('pageerror', e => merrs.push(e.message)); await mp.goto('file:///home/user/HunterRPG/st-3d/dist/index.html'); await mp.waitForTimeout(900);
  const mvb = await mp.locator('#vp').boundingBox(); assert(mvb.height > 400 && mvb.width > 360); pass(`phone: viewport ${Math.round(mvb.width)}x${Math.round(mvb.height)} px on a 412x915 screen`);
  assert((await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1); await mp.screenshot({ path: OUT + '/app_phone.png' });
  // touch pinch via CDP
  const cdp = await m.newCDPSession(mp); const cx = mvb.x + mvb.width / 2, cy = mvb.y + mvb.height / 2; const d0m = await mp.evaluate(() => __st3d.viewer.distance());
  const pinch = async (a0, a1) => { const steps = 10; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - a0, y: cy, id: 1 }, { x: cx + a0, y: cy, id: 2 }] }); for (let i = 1; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - a, y: cy, id: 1 }, { x: cx + a, y: cy, id: 2 }] }); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  await pinch(40, 140); await mp.waitForTimeout(500); const d1m = await mp.evaluate(() => __st3d.viewer.distance()); assert(d1m < d0m * 0.8, `pinch ${d0m} -> ${d1m}`); pass(`touch pinch zooms (${d0m.toFixed(1)} -> ${d1m.toFixed(1)} cm)`);
  const p0 = await mp.evaluate(() => __st3d.viewer.camera.position.toArray()); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - 80, y: cy, id: 1 }] }); for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 80 + i * 14, y: cy + i * 3, id: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await mp.waitForTimeout(400);
  const p1 = await mp.evaluate(() => __st3d.viewer.camera.position.toArray()); assert(Math.hypot(...p0.map((x, i) => x - p1[i])) > 2); pass('one-finger touch drag rotates');
  await mp.evaluate(() => window.scrollTo(0, 9999)); await mp.screenshot({ path: OUT + '/app_phone_panel.png' });
  console.log('\nERRORS:', JSON.stringify(errs), JSON.stringify(merrs)); console.log(ok, 'checks'); await b.close();
})().catch(e => { console.error('FAIL', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
