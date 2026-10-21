/* Hand-held retractors: Army-Navy, Senn, Richardson, Deaver, Malleable (ribbon). PROCEDURAL EDUCATIONAL MODELS.
   Orientation: handle along X, blades bend toward -Y, blade WIDTH runs along Z (so the front view shows each retractor's profile,
   the view from above shows blade widths). Built as bent flat bars (U.bar with thickness in-plane and width along Z). */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const flat = (pts, thick, widthFn, steel, part, n = 260) => U.mesh(U.bar(pts, () => thick / 2, widthFn, () => 0, n, Math.min(thick / 2, 0.05) * 0.95), steel, part);
  const lenOf = pts => new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], 0)), false, 'centripetal').getLength();
  // round off the blade ends: width shrinks along a quarter-circle over the last `rad` cm at each end
  const roundEnds = (wFn, L, rad, ends = [true, true]) => s => { const w = wFn(s), d0 = s * L, d1 = (1 - s) * L; let k = 1;
    for (const [d, on] of [[d0, ends[0]], [d1, ends[1]]]) if (on && d < rad) k = Math.min(k, Math.sqrt(Math.max(0, 1 - Math.pow((rad - d) / rad, 2)))); return Math.max(0.14, w * (0.35 + 0.65 * k)); };
  const arcPts = (cx, cy, r, a0, a1, k = 10) => Array.from({ length: k + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / k); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

  // Army-Navy: double-ended, both blades bent ~90 deg to the same side, different blade sizes, small lip at each blade tip.
  function armyNavy() {
    const g = new T.Group(), steel = U.steel();
    // both blades bend to the same side; they differ in DEPTH (about 4.3 and 2.2 cm), similar widths (~1.55 cm)
    const pts = [[-10.45, -4.85], [-10.75, -4.25], [-10.75, -0.6], ...arcPts(-10.15, -0.6, 0.6, Math.PI, Math.PI / 2, 6).slice(1), [-9.5, 0], [9.5, 0], ...arcPts(9.5, -0.6, 0.6, Math.PI / 2, 0, 6).slice(1), [10.1, -0.6], [10.1, -1.75], [9.85, -2.35]];
    const L = lenOf(pts), w = s => 1.55 - 0.35 * U.smooth(0.15, 0.2, s) * (1 - U.smooth(0.87, 0.92, s));
    g.add(flat(pts, 0.22, roundEnds(w, L, 0.4), steel, 'blades'));
    return { group: g, center: new T.Vector3(0, -1.8, 0), size: 21.5 };
  }
  // Senn: small double-ended; one end a 3-prong rake, the other a flat bent blade.
  function senn() {
    const g = new T.Group(), steel = U.steel();
    const pts = [[-7.4, -1.9], [-7.55, -1.2], [-7.55, -0.4], ...arcPts(-7.15, -0.4, 0.4, Math.PI, Math.PI / 2, 5).slice(1), [-6.75, 0], [6.6, 0]];
    g.add(flat([...pts.slice(0, -1), [6.85, 0]], 0.18, roundEnds(() => 0.75, lenOf(pts), 0.25, [true, false]), steel, 'blades'));
    // rake end: three curved prongs with points, bending down at x = 6.6
    for (const z of [-0.28, 0, 0.28]) {
      const pr = U.mesh(U.sweep([[6.4, 0, z], [7.05, 0.05, z], [7.35, 0.4, z], [7.4, 1.1, z], [7.2, 1.55, z]], s => 0.08 - 0.06 * U.smooth(0.7, 1, s), 80, 14), steel, 'prongs'); g.add(pr);
    }
    return { group: g, center: new T.Vector3(0, 0, 0), size: 16.5 };
  }
  // Richardson: single-ended, broad blade bent ~90 deg with a rolled lip; flat handle ending in a curled grip.
  function richardson() {
    const g = new T.Group(), steel = U.steel();
    // closed teardrop loop handle, ~23.5 cm overall, right-angle blade ~5.5 cm deep and ~2.2 cm wide, lip curling back toward the handle
    const pts = [[-11.0, -0.25], [-12.2, -0.75], [-13.4, -0.62], [-13.85, 0.0], [-13.4, 0.6], [-12.4, 0.55], [-11.4, 0.12], [-10.6, 0], [7.0, 0], ...arcPts(7.0, -0.7, 0.7, Math.PI / 2, 0, 6).slice(1), [7.7, -0.7], [7.7, -5.5], ...arcPts(7.35, -5.5, 0.35, 0, -0.7 * Math.PI, 5).slice(1)];
    const L = lenOf(pts), w = s => 1.4 + 0.8 * U.smooth(0.76, 0.8, s);
    g.add(flat(pts, 0.24, roundEnds(w, L, 0.35, [false, true]), steel, 'blade'));
    return { group: g, center: new T.Vector3(-3.0, -2.5, 0), size: 23 };
  }
  // Deaver: long flat blade curving in a broad "?" arc for deep retraction; handle with a curled grip at the end.
  function deaver() {
    const g = new T.Group(), steel = U.steel();
    // ~30.5 cm (12 in); broad curve (r ~6.5 cm) for deep retraction; curled handle grip
    const pts = [[-20.2, 1.3], ...arcPts(-19.6, 0.6, 0.9, Math.PI * 0.75, Math.PI * 1.5, 8).slice(1), [-19.0, -0.3], [-18.2, 0], [2.0, 0], ...arcPts(2.0, -6.5, 6.5, Math.PI / 2, -Math.PI / 6, 16).slice(1)];
    const L = lenOf(pts), w = s => 1.5 + 1.1 * U.smooth(0.6, 0.7, s);
    g.add(flat(pts, 0.22, roundEnds(w, L, 0.5, [false, true]), steel, 'blade'));
    return { group: g, center: new T.Vector3(-5.5, -3.8, 0), size: 30 };
  }
  // Malleable (ribbon): long thin flat strip with rounded ends, shown bent near one end the way it is shaped before use.
  function malleable() {
    const g = new T.Group(), steel = U.steel({ roughness: 0.38 });
    const pts = [[-16, 0], [8, 0], ...arcPts(8, -3.0, 3.0, Math.PI / 2, 0, 12).slice(1), [11.0, -6.0]];
    g.add(flat(pts, 0.1, roundEnds(() => 2.5, lenOf(pts), 1.25), steel, 'ribbon'));
    return { group: g, center: new T.Vector3(-2.5, -2.2, 0), size: 30 };
  }

  const V = (c, close) => ({
    front: { pos: [c[0], c[1], 34], tgt: c }, back: { pos: [c[0], c[1], -34], tgt: c }, side: { pos: [c[0], 32, 0.4], tgt: c },
    oblique: { pos: [c[0] + 10, c[1] + 22, 18], tgt: c }, blades: { pos: [close[0] + 3.5, close[1] + 3.0, 8.5], tgt: close }
  });
  const reg = (id, fn, parts, c, close, note, dims, extra) => { ST3D.models[id] = Object.assign({ id, recordId: id, build: fn, hasArticulation: false, parts, partViews: {}, views: V(c, close), status: { state: 'complete-v2', reviewed: true, note }, dims }, extra || {}); };
  reg('armynavy', armyNavy, [['blades', 'Blades and handle']], [0, -1.6, 0], [10, -1.8, 0], 'Procedural model: double-ended flat retractor, both blades bent about 90 degrees to the same side, two blade sizes. Dimensions approximate.', 'About 21.5 cm (8½ in); blades about 1.6 and 1.35 cm wide. Approximate.');
  reg('senn', senn, [['blades', 'Flat blade end'], ['prongs', 'Rake end (3 prongs)']], [0, 0, 0], [7, 0.6, 0], 'Procedural model: small double-ended retractor with a flat bent blade on one end and three curved prongs on the other, the two ends pointing in opposite directions (a similar retractor with both ends on the same side is the Mathieu). Prongs may be sharp or blunt.', 'About 16 cm. Approximate.');
  reg('richardson', richardson, [['blade', 'Blade and handle']], [-3.0, -2.5, 0], [7.6, -3.2, 0], 'Procedural model: single-ended retractor with a right-angle blade whose lip curls back toward the handle, and a closed loop handle. Your Major tray has narrow and wide; the Minor tray has a baby size. This model shows one size.', 'About 23.5 cm; blade about 2.2 cm wide and 5.5 cm deep. Approximate.');
  reg('deaver', deaver, [['blade', 'Curved blade and handle']], [-5.5, -3.8, 0], [7.5, -6.5, 0], 'Procedural model: long flat blade sweeping in a broad curve for deep abdominal retraction, handle with a curled grip. Your Major tray has narrow, medium and wide; this shows one width.', 'About 30.5 cm (12 in) along its length; blade about 2.6 cm wide. Approximate.');
  reg('malleable', malleable, [['ribbon', 'Bendable ribbon']], [-2.5, -2.2, 0], [9.5, -3.0, 0], 'Procedural model: thin, flat, bendable steel strip with rounded ends, shown bent near one end as it would be shaped for use.', 'About 33 cm × 2.5 cm. Approximate.');
})(window);
