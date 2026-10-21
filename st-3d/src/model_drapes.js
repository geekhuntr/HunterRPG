/* Ring-handled draping / prep / ligating instruments. PROCEDURAL EDUCATIONAL MODELS, not scans.
   Registers: sponge (Foerster sponge stick), towel-perf (Backhaus perforating towel clip),
   towel-non (non-perforating towel clip), hemoclip (ligating clip applier with one clip loaded).
   All share the Babcock/Allis frame: two halves, half B mirrored (scale.y = -1) inside a pivot group, box lock + rivets on
   half B, shanks crossing inside the box with a small hidden z-joggle, setOpen(k) rotating the halves about Z. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const N = 300;
  const sm = U.smooth;

  // one swept bar, two part tags (shared vertices keep the seam smooth)
  // The kit's U.bar end caps (fans around the last two vertices) currently face inward, so an exposed bar end looks hollow.
  // Emit cap triangles with both windings: correct either way, and still correct if the kit is fixed.
  function splitBar(geo, keep = () => true) {
    const p = geo.attributes.position, idx = geo.index.array, out = [], c0 = p.count - 2;
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i], b = idx[i + 1], c = idx[i + 2], cx = (p.getX(a) + p.getX(b) + p.getX(c)) / 3;
      if (!keep(cx)) continue;
      out.push(a, b, c); if (a >= c0 || b >= c0 || c >= c0) out.push(a, c, b);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', p); g.setAttribute('normal', geo.attributes.normal); g.setIndex(out); return g;
  }
  const spaced = cl => new T.CatmullRomCurve3(cl.map(p => new T.Vector3(p[0], p[1], 0)), false, 'centripetal').getSpacedPoints(N);
  // handle part of the shank: ring -> box (half A side, +y), as in the Babcock/Allis
  const handleCL = rx0 => [[rx0, 0.50], [rx0 + 0.65, 0.42], [rx0 + 1.95, 0.40], [rx0 * 0.42, 0.30], [-1.0, 0.20], [0, 0]];
  const handleHW = x => 0.27 - 0.08 * sm(-3.2, 0.3, x);

  /* Shared frame. o: ring {cx, cy, rx, ry, wall}; cl(isB) centerline in that half's build frame; hw(x), th(x);
     zTip(x) extra distal z offset (times zs); ratchet {x0, x1} or null; extras(g, ctx); openA (rad per half at k = 1);
     init(grp) / onOpen(grp, a) for parts that live outside the halves (the hemoclip). */
  function frame(o) {
    function half(isB) {
      const zs = isB ? -1 : 1, g = new T.Group(), steel = U.steel(), cl = o.cl(isB), P = spaced(cl), xAt = s => P[Math.round(s * N)].x;
      const R = o.ring;
      g.add(U.mesh(U.extrude(U.ringShape(R.cx, R.cy, R.rx, R.ry, R.wall), 0.30, 0.05), steel, 'rings'));
      const jog = x => zs * (0.08 * sm(-1.0, -0.6, x) * (1 - sm(0.6, 1.0, x)) + (o.zTip ? o.zTip(x) : 0));
      const bar = U.bar(cl, s => o.hw(xAt(s)), s => o.th(xAt(s)), jog, N, 0.07);
      for (const [part, keep] of [['shanks', x => x < 0.6], ['jaws', x => x >= 0.6]]) g.add(U.mesh(splitBar(bar, keep), steel, part));
      if (o.ratchet) { // ratchet boss beside the ring: half thickness (front half on A, back half on B), teeth on the overlapping edge
        const { x0, x1 } = o.ratchet, pitch = 0.2, depth = 0.1, pts = [[x0, 0.30], [x1, 0.30], [x1, -0.02]];
        for (let x = x1; x > x0 + 0.01; x -= pitch) { pts.push([x - pitch * 0.15, -0.02 - depth]); pts.push([x - pitch, -0.02]); }
        pts.push([x0, 0.10]);
        const boss = U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), 0.15, 0.02); boss.translate(0, 0, zs * 0.075);
        g.add(U.mesh(boss, steel, 'ratchet'));
      }
      if (isB) { // box lock and flush domed rivets
        g.add(U.mesh(U.extrude(U.roundRect(-0.55, -0.38, 1.1, 0.76, 0.12), 0.55, 0.06), steel, 'box'));
        for (const s of [1, -1]) { const d = new T.Mesh(new T.SphereGeometry(0.12, 20, 10), steel.clone()); d.scale.z = 0.35; d.position.z = s * 0.275; d.userData.part = 'box'; d.userData.base = d.material.color.getHex(); g.add(d); }
      }
      const e = P[N], t = new T.Vector3().subVectors(P[N], P[N - 3]).normalize();
      if (o.extras) o.extras(g, { isB, zs, steel, end: new T.Vector3(e.x, e.y, jog(e.x)), tan: t });
      return g;
    }
    return function build() {
      const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
      A.add(half(false)); Bm.add(half(true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
      if (o.init) o.init(grp);
      const open = k => { const a = k * o.openA; A.rotation.z = -a; Bp.rotation.z = a; if (o.onOpen) o.onOpen(grp, a); };
      open(0);
      return { group: grp, setOpen: open, center: new T.Vector3(o.cx, 0, 0), size: o.size };
    };
  }

  // =============== Foerster sponge stick (ring forceps), ~24 cm ===============
  // Jaws: oval open loops lying across the ring plane (their faces meet when closed), serrated faces, no teeth.
  const SP = { cx: 7.25, rx: 1.35, rz: 0.85, w: 0.3, f: 0.03, t: 0.13 }; // oval jaw: center x, half-length, half-width, band width, face |y|, plate thickness
  function ridges(phase) { // transverse serration ridges across the band, on the grasping face (y = -f .. -f + h)
    const n = 60, h = 0.024, b = 0.036, m = 0.035, pos = [];
    for (let i = 0; i < n; i++) {
      const a = ((i + phase) / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const pin = [SP.cx + (SP.rx - SP.w + m) * c, (SP.rz - 0.95 * SP.w + m) * s], pout = [SP.cx + (SP.rx - m) * c, (SP.rz - m) * s];
      let dx = pout[0] - pin[0], dz = pout[1] - pin[1]; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
      const tx = -dz * b, tz = dx * b, yb = -SP.f - 0.01, ya = -SP.f + h;
      const A1 = [pin[0] + tx, yb, pin[1] + tz], A2 = [pin[0] - tx, yb, pin[1] - tz], A3 = [pin[0], ya, pin[1]];
      const B1 = [pout[0] + tx, yb, pout[1] + tz], B2 = [pout[0] - tx, yb, pout[1] - tz], B3 = [pout[0], ya, pout[1]];
      const M = new T.Vector3((pin[0] + pout[0]) / 2, (yb + ya) / 2, (pin[1] + pout[1]) / 2);
      for (const [p, q, r] of [[A1, B1, B3], [A1, B3, A3], [A2, A3, B3], [A2, B3, B2], [A1, A3, A2], [B1, B2, B3]]) {
        const P1 = new T.Vector3(...p), P2 = new T.Vector3(...q), P3 = new T.Vector3(...r);
        const nrm = new T.Vector3().subVectors(P2, P1).cross(new T.Vector3().subVectors(P3, P1));
        const cen = P1.clone().add(P2).add(P3).multiplyScalar(1 / 3).sub(M);
        if (nrm.dot(cen) < 0) pos.push(...p, ...r, ...q); else pos.push(...p, ...q, ...r);
      }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  const spongeBuild = frame({
    ring: { cx: -14.2, cy: 1.23, rx: 1.3, ry: 1.2, wall: 0.34 }, cx: -3.45, size: 24.1, openA: 0.12,
    cl: () => [...handleCL(-13.4), [0.6, -0.15], [1.6, -0.19], [3.0, -0.2], [4.5, -0.17], [5.4, -0.125], [6.05, -0.095]],
    hw: x => (x < 0.3 ? handleHW(x) : 0.19 - 0.07 * sm(0.3, 1.6, x) - 0.06 * sm(4.6, 5.95, x)),
    th: x => 0.30,
    ratchet: { x0: -12.75, x1: -11.35 },
    extras(g, c) {
      const oval = new T.Shape(U.ellipsePts(SP.cx, 0, SP.rx, SP.rz, 180)); oval.holes.push(new T.Path(U.ellipsePts(SP.cx, 0, SP.rx - SP.w, SP.rz - 0.95 * SP.w, 160).reverse()));
      g.add(U.mesh(U.plateXZ(oval, SP.t, -SP.f - SP.t / 2, 0.03), c.steel, 'jaws'));
      g.add(U.mesh(ridges(c.isB ? 0.5 : 0), U.steel({ roughness: 0.33 }), 'serrations'));
    }
  });

  // =============== Towel clips, ~13 cm: perforating (Backhaus) and non-perforating (blunt ball tips) ===============
  function towel(perf) {
    const jawCL = [[0.45, -0.12], [0.95, -0.38], [1.5, -0.64], [2.05, -0.72], [2.55, -0.56], [2.84, -0.32]];
    return frame({
      ring: { cx: -8.7, cy: 1.23, rx: 1.3, ry: 1.2, wall: 0.34 }, cx: -3.5, size: 13.1, openA: 0.24,
      cl: () => [...handleCL(-7.9), ...jawCL, perf ? [2.95, -0.12] : [2.92, -0.17]],
      hw: x => (x < 0.3 ? handleHW(x) : 0.19 - 0.07 * sm(0.3, 1.2, x) - (perf ? 0.05 : 0.03) * sm(2.1, 2.9, x)),
      th: x => (x < 0.3 ? 0.28 : 0.28 - (perf ? 0.13 : 0.06) * sm(2.2, 2.9, x)),
      zTip: perf ? x => 0.08 * sm(2.0, 2.75, x) : null, // sharp tips pass each other side by side
      ratchet: { x0: -7.3, x1: -5.9 },
      extras(g, c) {
        if (perf) { // sharp conical point continuing the jaw's curve inward, crossing the midline
          const h = 0.36, cone = new T.ConeGeometry(0.069, h, 28, 1);
          const m = U.mesh(cone, c.steel, 'tips'); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), c.tan);
          m.position.copy(c.end).addScaledVector(c.tan, h / 2); g.add(m);
          const ball = U.mesh(new T.SphereGeometry(0.071, 24, 14), c.steel, 'tips'); ball.position.copy(c.end); g.add(ball); // smooth shoulder over the bar end
        } else { // blunt ball tip: the two balls meet at the midline and cannot pierce the drape
          const m = U.mesh(new T.SphereGeometry(0.165, 32, 18), c.steel, 'tips');
          m.position.copy(c.end).addScaledVector(c.tan, 0.0); m.position.y = -0.168; g.add(m);
        }
      }
    });
  }

  // =============== Hemoclip (ligating clip) applier, ~20 cm, one clip loaded ===============
  // Long ring-handled applier without a ratchet; slender jaws angled ~20 deg near the tip, each with a groove (two rails)
  // that holds one leg of a V-shaped titanium clip. The clip's apex sits in the jaw throat; closing the jaws crimps it.
  const HC = { al: 0.35, b0: 5.0, b1: 5.7, face: 0.06, legOff: 0.03, legR: 0.03, xa: 5.86, xt: 6.44, tipX: 6.5 };
  const mid = (() => { const xs = [], ys = []; let y = 0; for (let x = 0; x <= 7.001; x += 0.01) { xs.push(x); ys.push(y); y += Math.tan(HC.al * sm(HC.b0, HC.b1, x)) * 0.01; } return x => ys[Math.max(0, Math.min(ys.length - 1, Math.round(x / 0.01)))]; })();
  const alpha = x => HC.al * sm(HC.b0, HC.b1, x);
  const nose = x => Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, x - (HC.tipX - 0.22)) / 0.27, 2)));
  const hcHW = x => (x < 0.3 ? handleHW(x) : Math.max(0.072, (0.19 - 0.08 * sm(0.3, 1.6, x) - 0.02 * sm(5.0, 6.4, x)) * (0.75 + 0.25 * nose(x))));
  // a point offset from the jaw midline along its normal (+ toward half B's side), in world (unrotated) coordinates
  const offPt = (x, d) => { const a = alpha(x); return [x - Math.sin(a) * d, mid(x) + Math.cos(a) * d]; };
  // d < 0 = toward the half's own side; half B is built pre-mirror, so its world point (offset to +n) is negated in y
  const sideCL = (isB, d) => xs => xs.map(x => { const p = offPt(x, isB ? -d(x) : d(x)); return isB ? [p[0], -p[1]] : [p[0], p[1]]; });
  const jawXs = [1.2, 2.2, 3.2, 4.2, 4.8, 5.1, 5.35, 5.6, 5.85, 6.1, 6.3, HC.tipX];
  function clipGeo(a) { // V clip: apex closed in the jaw throat, leg ends held on the (rotated) jaw faces; a = 0 -> crimped flat
    const rot = (p, ang) => [p[0] * Math.cos(ang) - p[1] * Math.sin(ang), p[0] * Math.sin(ang) + p[1] * Math.cos(ang)];
    const ax = alpha(HC.xa), ux = Math.cos(ax), uy = Math.sin(ax), lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const tA = rot(offPt(HC.xt, -HC.legOff), -a), tB = rot(offPt(HC.xt, HC.legOff), a);
    const sA = offPt(HC.xa + 0.06, -HC.legOff), sB = offPt(HC.xa + 0.06, HC.legOff), apex = offPt(HC.xa + 0.06 - HC.legOff * 1.1, 0);
    const pts = [tA, lerp(sA, tA, 0.55), sA, apex, sB, lerp(sB, tB, 0.55), tB].map(p => [p[0], p[1], 0]);
    return U.sweep(pts, () => HC.legR, 120, 14);
  }
  const hemoBuild = frame({
    ring: { cx: -12.15, cy: 1.23, rx: 1.3, ry: 1.2, wall: 0.34 }, cx: -3.45, size: 20.0, openA: 0.045,
    cl: isB => [...handleCL(-11.35), [0.6, -0.16], ...sideCL(isB, x => -(HC.face + hcHW(x)))(jawXs)],
    hw: hcHW,
    th: x => (x < 0.3 ? 0.28 : Math.max(0.15, (0.28 - 0.04 * sm(4.5, 6.4, x)) * (0.55 + 0.45 * nose(x)))),
    ratchet: null,
    extras(g, c) { // rounded nose over the bar end, then the groove: two low rails along each jaw face where the clip leg sits
      const nose = U.mesh(new T.SphereGeometry(0.076, 24, 14), c.steel, 'jaws'); nose.scale.set(1, 0.97, 1); nose.position.copy(c.end).addScaledVector(c.tan, -0.03); g.add(nose);
      const xs = []; for (let x = 5.7; x <= HC.tipX - 0.04; x += 0.1) xs.push(x);
      const cl = sideCL(c.isB, () => -(HC.face - 0.005))(xs);
      for (const z of [0.1, -0.1]) g.add(U.mesh(splitBar(U.bar(cl, () => 0.02, 0.05, () => z, 40, 0.012)), c.steel, 'jaws'));
    },
    init(grp) { const m = U.mesh(clipGeo(0), U.steel({ color: 0xa9a294, roughness: 0.42 }), 'clip'); grp.userData.clip = m; grp.add(m); },
    onOpen(grp, a) { const m = grp.userData.clip; if (!m) return; m.geometry.dispose(); m.geometry = clipGeo(a); }
  });

  // =============== registration ===============
  const common = { hasArticulation: true };
  const frontViews = (cx) => ({
    front: { pos: [cx, 0, 30], tgt: [cx, 0, 0] }, back: { pos: [cx, 0, -30], tgt: [cx, 0, 0] },
    side: { pos: [cx, 28, 0.01], tgt: [cx, 0, 0] }, oblique: { pos: [cx + 9, 10, 22], tgt: [cx, 0, 0] }
  });

  ST3D.models.sponge = Object.assign({
    id: 'sponge', recordId: 'sponge', build: spongeBuild,
    parts: [['rings', 'Finger rings'], ['ratchet', 'Ratchet'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['jaws', 'Oval ring jaws'], ['serrations', 'Serrated faces']],
    partViews: { rings: 'front', ratchet: 'ratchet', shanks: 'oblique', box: 'box', jaws: 'jaws', serrations: 'jawsOblique' },
    views: Object.assign(frontViews(-3.45), {
      jaws: { pos: [6.6, 7.6, 1.2], tgt: [6.6, 0, 0] },
      jawsOblique: { pos: [10.6, 3.6, 4.4], tgt: [7.0, 0, 0] },
      tip: { pos: [12.6, 0.8, 1.6], tgt: [7.6, 0, 0] },
      ratchet: { pos: [-12.0, 2.0, 5.5], tgt: [-12.0, 0.1, 0] },
      box: { pos: [0.6, 2.0, 5.5], tgt: [0, 0, 0] }
    }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural educational model, not a scan. Length (24 cm / 9.5 in), straight arms and oval, open (fenestrated), serrated jaws come from catalog listings. Approximated: the oval size (about 2.7 x 1.7 cm), band width, serration pitch, ring, ratchet and box-lock sizes. The oval loops lie across the ring plane so their serrated faces meet when closed. Shown without a gauze sponge. Not compared against a photograph because photo hosts are blocked in the build environment.' },
    dims: 'About 24 cm (9½ in) overall; oval ring jaws about 2.7 x 1.7 cm with serrated faces, no teeth.'
  }, common);

  const towelDef = (perf) => Object.assign({
    id: perf ? 'towel-perf' : 'towel-non', recordId: perf ? 'towel-perf' : 'towel-non', build: towel(perf),
    parts: [['rings', 'Finger rings'], ['ratchet', 'Ratchet'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['jaws', 'Curved jaws'], ['tips', perf ? 'Sharp points' : 'Blunt ball tips']],
    partViews: { rings: 'front', ratchet: 'ratchet', shanks: 'oblique', box: 'box', jaws: 'jaws', tips: 'tip' },
    views: Object.assign(frontViews(-3.5), {
      jaws: { pos: [1.6, -0.15, 6.0], tgt: [1.6, -0.15, 0] },
      jawsOblique: { pos: [5.2, 2.7, 3.4], tgt: [2.2, 0, 0] },
      tip: { pos: [4.9, 1.0, 2.2], tgt: [2.95, 0, 0] },
      ratchet: { pos: [-6.6, 2.0, 5.5], tgt: [-6.6, 0.1, 0] },
      box: { pos: [0.6, 2.0, 5.5], tgt: [0, 0, 0] }
    }),
    status: { state: 'complete-v1', reviewed: false, note: perf
      ? 'Procedural educational model, not a scan. Backhaus pattern: 13 cm (5¼ in), ratchet, curved jaws ending in small sharp points that face inward (catalog listings). Approximated: jaw curve and opening size, point length, ring, ratchet and box-lock sizes; the points are shown crossing slightly side by side when closed. Not compared against a photograph because photo hosts are blocked in the build environment.'
      : 'Procedural educational model, not a scan. Same 13 cm (5¼ in) ratcheted frame as the Backhaus, but the curved jaws end in blunt ball tips that meet without crossing, so they grip a drape without piercing it. Real non-perforating clips vary (Lorna/Edna blunt serrated jaws, ball tips, plastic tips); the ball tip is one representative style. Approximated: jaw curve, ball size, ring, ratchet and box-lock sizes. Not compared against a photograph because photo hosts are blocked in the build environment.' },
    dims: perf ? 'About 13 cm (5¼ in) overall; curved jaws with sharp inward points that cross when closed.' : 'About 13 cm (5¼ in) overall; curved jaws with ~3.3 mm blunt ball tips that meet without crossing.'
  }, common);
  ST3D.models['towel-perf'] = towelDef(true);
  ST3D.models['towel-non'] = towelDef(false);

  const tipDir = [Math.cos(HC.al), Math.sin(HC.al)], tipP = [HC.tipX - 0.05, mid(HC.tipX)];
  ST3D.models.hemoclip = Object.assign({
    id: 'hemoclip', recordId: 'hemoclip', build: hemoBuild,
    parts: [['rings', 'Finger rings'], ['shanks', 'Shanks (no ratchet)'], ['box', 'Box lock'], ['jaws', 'Angled grooved jaws'], ['clip', 'Ligating clip']],
    partViews: { rings: 'front', shanks: 'oblique', box: 'box', jaws: 'jaws', clip: 'tip' },
    views: Object.assign(frontViews(-3.45), {
      jaws: { pos: [5.2, 0.3, 5.4], tgt: [5.2, 0.2, 0] },
      jawsOblique: { pos: [8.2, 2.6, 2.7], tgt: [6.0, 0.3, 0] },
      tip: { pos: [tipP[0] + tipDir[0] * 3.0, tipP[1] + tipDir[1] * 3.0 + 0.5, 0.9], tgt: [tipP[0], tipP[1], 0] },
      box: { pos: [0.6, 2.0, 5.5], tgt: [0, 0, 0] }
    }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural educational model, not a scan. Open (non-endoscopic) applier about 20 cm (8 in) with jaws angled about 20 degrees, one of the catalog angles (straight, 20, 55 or 70 degrees; small to large clip sizes). Medium titanium clip about 5.8 mm long (catalog clip dimensions). Approximated: handle and box-lock design (modeled like a ring-handled clamp with no ratchet), jaw groove as two low rails, clip drawn as a round wire V with its apex in the jaw throat; real clips are flat-section and grooved. Opening the jaws spreads the clip legs; closing crimps it. Not compared against a photograph because photo hosts are blocked in the build environment.' },
    dims: 'About 20 cm (8 in) overall, no ratchet; jaws angled ~20°; one medium titanium clip (~5.8 mm) loaded.'
  }, common);
})(window);
