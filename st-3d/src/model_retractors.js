/* Hand-held retractors: Army-Navy, Senn, Richardson, Deaver, Malleable (ribbon). PROCEDURAL EDUCATIONAL MODELS.
   Orientation: handle along X, blades bend toward -Y, blade WIDTH runs along Z (so the front view shows each retractor's profile,
   the view from above shows blade widths). Built as bent flat bars (U.bar with thickness in-plane and width along Z). */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const flat = (pts, thick, widthFn, steel, part, n = 260) => U.mesh(U.bar(pts, () => thick / 2, widthFn, () => 0, n, Math.min(thick / 2, 0.05) * 0.95), steel, part);
  const arcPts = (cx, cy, r, a0, a1, k = 10) => Array.from({ length: k + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / k); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

  // Army-Navy: double-ended, both blades bent ~90 deg to the same side, different blade sizes, small lip at each blade tip.
  function armyNavy() {
    const g = new T.Group(), steel = U.steel();
    const pts = [[-10.5, -4.0], [-10.75, -3.3], [-10.75, -0.6], ...arcPts(-10.15, -0.6, 0.6, Math.PI, Math.PI / 2, 6).slice(1), [-9.5, 0], [9.5, 0], ...arcPts(9.5, -0.6, 0.6, Math.PI / 2, 0, 6).slice(1), [10.1, -0.6], [10.1, -2.8], [9.85, -3.4]];
    // width along Z: blade A (left) 1.6 cm, handle 1.2 cm, blade B (right) 1.35 cm
    const len = pts.length; const w = s => (s < 0.17 ? 1.6 : s > 0.86 ? 1.35 : 1.2);
    g.add(flat(pts, 0.22, s => w(s), steel, 'blades'));
    return { group: g, center: new T.Vector3(0, -1.6, 0), size: 21.5 };
  }
  // Senn: small double-ended; one end a 3-prong rake, the other a flat bent blade.
  function senn() {
    const g = new T.Group(), steel = U.steel();
    const pts = [[-7.4, -1.9], [-7.55, -1.2], [-7.55, -0.4], ...arcPts(-7.15, -0.4, 0.4, Math.PI, Math.PI / 2, 5).slice(1), [-6.75, 0], [6.6, 0]];
    g.add(flat(pts, 0.18, s => (s < 0.15 ? 0.95 : 0.75), steel, 'blades'));
    // rake end: three curved prongs with points, bending down at x = 6.6
    for (const z of [-0.28, 0, 0.28]) {
      const pr = U.mesh(U.sweep([[6.4, 0, z], [7.05, -0.05, z], [7.35, -0.4, z], [7.4, -1.1, z], [7.2, -1.55, z]], s => 0.08 - 0.06 * U.smooth(0.7, 1, s), 80, 14), steel, 'prongs'); g.add(pr);
    }
    return { group: g, center: new T.Vector3(0, -0.8, 0), size: 16.5 };
  }
  // Richardson: single-ended, broad blade bent ~90 deg with a rolled lip; flat handle ending in a curled grip.
  function richardson() {
    const g = new T.Group(), steel = U.steel();
    const pts = [[-11.2, 1.0], ...arcPts(-10.6, 0.4, 0.85, Math.PI * 0.75, Math.PI * 1.5, 8).slice(1), [-10.0, -0.45], [-9.4, 0], [7.0, 0], ...arcPts(7.0, -0.7, 0.7, Math.PI / 2, 0, 6).slice(1), [7.7, -0.7], [7.7, -4.6], ...arcPts(8.05, -4.6, 0.35, Math.PI, Math.PI * 1.7, 5).slice(1)];
    g.add(flat(pts, 0.24, s => (s < 0.62 ? 1.4 : 2.6 * U.smooth(0.62, 0.7, s) + 1.4 * (1 - U.smooth(0.62, 0.7, s))), steel, 'blade'));
    return { group: g, center: new T.Vector3(-1.5, -1.9, 0), size: 21 };
  }
  // Deaver: long flat blade curving in a broad "?" arc for deep retraction; handle with a curled grip at the end.
  function deaver() {
    const g = new T.Group(), steel = U.steel();
    const pts = [[-13.2, 1.3], ...arcPts(-12.6, 0.6, 0.9, Math.PI * 0.75, Math.PI * 1.5, 8).slice(1), [-12.0, -0.3], [-11.2, 0], [2.0, 0], ...arcPts(2.0, -5.0, 5.0, Math.PI / 2, -Math.PI * 0.3, 16).slice(1)];
    g.add(flat(pts, 0.22, s => (s < 0.45 ? 1.5 : 1.5 + 1.1 * U.smooth(0.45, 0.6, s)), steel, 'blade'));
    return { group: g, center: new T.Vector3(-2.5, -3.0, 0), size: 26 };
  }
  // Malleable (ribbon): long thin flat strip with rounded ends, shown bent near one end the way it is shaped before use.
  function malleable() {
    const g = new T.Group(), steel = U.steel({ roughness: 0.38 });
    const pts = [[-16, 0], [8, 0], ...arcPts(8, -3.0, 3.0, Math.PI / 2, 0, 12).slice(1), [11.0, -6.0]];
    g.add(flat(pts, 0.1, () => 2.5, steel, 'ribbon'));
    return { group: g, center: new T.Vector3(-2.5, -2.2, 0), size: 30 };
  }

  const V = (c, close) => ({
    front: { pos: [c[0], c[1], 34], tgt: c }, back: { pos: [c[0], c[1], -34], tgt: c }, side: { pos: [c[0], 32, 0.4], tgt: c },
    oblique: { pos: [c[0] + 10, c[1] + 22, 18], tgt: c }, blades: { pos: [close[0] + 3.5, close[1] + 3.0, 8.5], tgt: close }
  });
  const reg = (id, fn, parts, c, close, note, dims, extra) => { ST3D.models[id] = Object.assign({ id, recordId: id, build: fn, hasArticulation: false, parts, partViews: {}, views: V(c, close), status: { state: 'complete-v1', reviewed: false, note }, dims }, extra || {}); };
  reg('armynavy', armyNavy, [['blades', 'Blades and handle']], [0, -1.6, 0], [10, -1.8, 0], 'Procedural model: double-ended flat retractor, both blades bent about 90 degrees to the same side, two blade sizes. Dimensions approximate.', 'About 21.5 cm (8½ in); blades about 1.6 and 1.35 cm wide. Approximate.');
  reg('senn', senn, [['blades', 'Flat blade end'], ['prongs', 'Rake end (3 prongs)']], [0, -0.8, 0], [7, -0.8, 0], 'Procedural model: small double-ended retractor with a flat bent blade on one end and three curved prongs on the other. Prongs may be sharp or blunt.', 'About 16 cm. Approximate.');
  reg('richardson', richardson, [['blade', 'Blade and handle']], [-1.5, -1.9, 0], [7.6, -2.6, 0], 'Procedural model: single-ended retractor with a right-angle blade and a slightly rolled lip, flat handle ending in a curled grip. Your Major tray has narrow and wide; the Minor tray has a baby size. This model shows one size.', 'About 21 cm; blade about 2.6 cm wide and 4.5 cm deep. Approximate.');
  reg('deaver', deaver, [['blade', 'Curved blade and handle']], [-2.5, -3.0, 0], [5.5, -5.5, 0], 'Procedural model: long flat blade sweeping in a broad curve for deep abdominal retraction, handle with a curled grip. Your Major tray has narrow, medium and wide; this shows one width.', 'About 30 cm measured along the blade (about 21 cm end to end); blade about 2.6 cm wide. Approximate.');
  reg('malleable', malleable, [['ribbon', 'Bendable ribbon']], [-2.5, -2.2, 0], [9.5, -3.0, 0], 'Procedural model: thin, flat, bendable steel strip with rounded ends, shown bent near one end as it would be shaped for use.', 'About 33 cm × 2.5 cm. Approximate.');
})(window);
