/* Babcock intestinal (tissue) forceps, about 16.5 cm (6 1/2 in). PROCEDURAL EDUCATIONAL MODEL, not a scan.
   Identifying geometry (v2, after visual review):
   - Seen face-on (ring plane), the closed jaws bow apart into an oval space that cradles bowel or a tube.
   - Seen from above, each jaw is a triangular fenestrated (windowed) loop that widens to a ~9 mm flat tip bar;
     the window lies perpendicular to the ring plane and the tip bars face each other. No teeth.
   - Flat finger rings, a small toothed ratchet next to the rings, slender shanks crossing at a box lock.
   Sourced: 16 cm length, ~9 mm jaw width, triangular/circumferential fenestrated jaws (Red Cross, MSF, Sklar catalog listings).
   Approximations (instrument knowledge, not measured): bow profile, ratchet tooth size/position, box-lock and ring sizes. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const RING = { cx: -8.35, cy: 1.23, rx: 1.3, ry: 1.2, wall: 0.34 };

  // jaw A bow (y as a function of x) and half-width of the triangular loop (z as a function of x)
  const bowPts = [[2.9, -0.30], [3.9, -0.41], [4.8, -0.45], [5.9, -0.36], [6.6, -0.18], [6.95, -0.10]];
  const bowCurve = new T.SplineCurve(bowPts.map(p => new T.Vector2(p[0], p[1])));
  const bow = x => { let best = bowPts[0][1], bd = 1e9; for (let i = 0; i <= 200; i++) { const q = bowCurve.getPoint(i / 200), d = Math.abs(q.x - x); if (d < bd) { bd = d; best = q.y; } } return best; };
  const halfW = x => 0.15 + 0.27 * Math.min(1, Math.max(0, (x - 3.0) / 3.85));

  function half(zs, isB) {
    const g = new T.Group(), steel = U.steel();
    // finger ring
    g.add(U.mesh(U.extrude(U.ringShape(RING.cx, RING.cy, RING.rx, RING.ry, RING.wall), 0.30, 0.05), steel, 'rings'));
    // shank: leaves the ring's inner-distal side, runs close to the axis past the ratchet, crosses at the box lock,
    // stays close to its partner distal to the box, then becomes the jaw. Small z-joggle hidden mostly inside the box.
    const cl = [[-7.55, 0.50], [-6.9, 0.42], [-5.6, 0.40], [-3.0, 0.30], [-1.0, 0.20], [0, 0], [0.9, -0.17], [2.0, -0.19], [2.55, -0.24], [3.05, -0.30]];
    const hw = s => (s < 0.62 ? 0.27 - 0.08 * U.smooth(0.45, 0.62, s) : 0.19 - 0.11 * U.smooth(0.9, 1, s));
    const jog = x => zs * 0.02 * U.smooth(-1.0, -0.6, x) * (1 - U.smooth(0.6, 1.0, x));
    g.add(U.mesh(U.bar(cl, hw, 0.30, jog, 220, 0.07), steel, 'shanks'));
    // ratchet boss next to the ring: half thickness, front half on A / back half on B; small teeth on the overlapping edge
    const x0 = -6.95, x1 = -5.55, pitch = 0.2, depth = 0.1;
    const pts = [[x0, 0.30], [x1, 0.30], [x1, -0.02]];
    for (let x = x1; x > x0 + 0.01; x -= pitch) { pts.push([x - pitch * 0.15, -0.02 - depth]); pts.push([x - pitch, -0.02]); }
    pts.push([x0, 0.10]);
    const boss = U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), 0.15, 0.02); boss.translate(0, 0, zs * 0.075);
    g.add(U.mesh(boss, steel, 'ratchet'));
    // jaw: triangular fenestrated loop in the X-Z plane, bowed outward in Y; rails are ~1.4 mm round section
    const loop = [[2.7, bow(2.7), 0]];
    for (let x = 3.2; x <= 6.81; x += 0.3) loop.push([x, bow(x), halfW(x)]);
    loop.push([6.9, bow(6.9), 0.4]); loop.push([6.9, bow(6.9), -0.4]);
    for (let x = 6.8; x >= 3.19; x -= 0.3) loop.push([x, bow(x), -halfW(x)]);
    g.add(U.mesh(U.tube(loop, 0.08, true, 260), steel, 'jaws'));
    // tip bar: flat ~9 mm wide grasping face whose inner face sits on y = 0 when closed (smooth, atraumatic)
    g.add(U.mesh(U.plateXZ(U.roundRect(6.84, -0.46, 0.28, 0.92, 0.08), 0.18, -0.09, 0.03), steel, 'jaws'));
    if (isB) g.add(U.boxLock({ L: 1.25, W: 0.78, T: 0.46, slant: 0.22, shankT: 0.30, sw: 0.22, yAt: U.lerpY(cl) })); // box lock on this half
    return g;
  }

  function build() {
    const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
    A.add(half(+1, false)); Bm.add(half(-1, true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
    const open = k => { const th = k * 0.16; A.rotation.z = -th; Bp.rotation.z = th; };
    open(0);
    return { group: grp, setOpen: open, center: new T.Vector3(-1.25, 0, 0), size: 17.2 };
  }

  ST3D.models.babcock = {
    id: 'babcock', recordId: 'babcock', build, hasArticulation: true,
    parts: [['rings', 'Finger rings'], ['ratchet', 'Ratchet'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['jaws', 'Jaws']],
    partViews: { rings: 'front', ratchet: 'ratchet', shanks: 'oblique', box: 'box', jaws: 'jawsTop' },
    views: {
      front: { pos: [-1.25, 0, 30], tgt: [-1.25, 0, 0] },
      back: { pos: [-1.25, 0, -30], tgt: [-1.25, 0, 0] },
      side: { pos: [-1.25, 28, 0.01], tgt: [-1.25, 0, 0] },
      oblique: { pos: [8, 10, 22], tgt: [-1.25, 0, 0] },
      jaws: { pos: [5.0, 0, 8.5], tgt: [5.0, 0, 0] },
      jawsTop: { pos: [5.0, 8.5, 0.6], tgt: [5.0, -0.3, 0] },
      jawsOblique: { pos: [9.5, 5.5, 6.5], tgt: [5.2, -0.2, 0] },
      tip: { pos: [13, 0.4, 0.6], tgt: [7.0, 0, 0] },
      ratchet: { pos: [-6.2, 2.0, 5.5], tgt: [-6.2, 0.1, 0] },
      box: { pos: [0.6, 2.0, 5.5], tgt: [0, 0, 0] }
    },
    status: { state: 'complete-v2', reviewed: true, note: 'Procedural educational model, not a scan. Version 2 after a visual-accuracy review: fenestrated triangular jaws perpendicular to the ring plane, bowed jaws that leave an oval grasping space, ratchet beside the rings, smaller box lock. Length and ~9 mm jaw width come from catalog listings; bow profile, ratchet and box-lock sizes are approximations. Not compared against a photograph because photo hosts are blocked in the build environment.' },
    dims: 'About 16.5 cm (6½ in) overall, ~9 mm wide jaw tips.'
  };
})(window);
