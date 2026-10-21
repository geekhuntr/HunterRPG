/* Allis tissue forceps, standard 15.5 cm (6 in). PROCEDURAL EDUCATIONAL MODEL, not a scan.
   Identifying geometry (what separates it from the Babcock):
   - Seen face-on (ring plane), slender jaws leave a narrow lens-shaped space behind the tips; only the tips meet.
   - Each jaw ends in a short head bent in toward its partner that widens to a ~5.6 mm spade with a small window
     (fenestration) just behind the grasping edge.
   - The grasping edges carry sharp INTERLOCKING teeth: 4 on one jaw, 5 on the other ("4x5"), which mesh when closed.
     A Babcock instead has a smooth, wider (~9 mm) tip bar and wire-loop jaws that bow far apart.
   - Flat finger rings, ratchet beside the rings, box lock, like the other ring-handled clamps.
   Sourced: 15-15.5 cm length and 4x5 teeth (WPI 501324, Vet Spectrum SAH.752015, UNICEF S0738000, Spiggle & Theis
   80-400-15 GUDID); tips meet only at the very end with small interlocking teeth; blades straight, becoming triangular
   at the tips (museum catalogue records). Approximations: tip width, tooth size, window size, gap profile, ring/ratchet/box. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const RING = { cx: -8.75, cy: 1.23, rx: 1.3, ry: 1.2, wall: 0.34 };
  // tip head (half A, whose jaw lies at y < 0; its grasping face looks toward +y)
  const FACE = -0.062, HEAD_T = 0.14, HX0 = 5.03, HX1 = 5.44, TX0 = 5.29, TX1 = 5.41;
  const TB = 0.052, TH = 0.088, PITCH = 0.106, EDGE = 0.262; // tooth base plane (|y|), tooth height, pitch across the tip width

  // shank centerline (ring -> box -> jaw); jaw part diverges slightly then turns in to the head
  const CL = [[-7.95, 0.50], [-7.3, 0.42], [-6.0, 0.40], [-3.2, 0.30], [-1.0, 0.20], [0, 0], [0.7, -0.13], [1.5, -0.17],
    [2.5, -0.215], [3.5, -0.245], [4.25, -0.24], [4.65, -0.208], [4.88, -0.165], [5.07, -0.13]];
  const N = 260;
  const clPts = new T.CatmullRomCurve3(CL.map(p => new T.Vector3(p[0], p[1], 0)), false, 'centripetal').getSpacedPoints(N);
  const xAt = s => clPts[Math.round(s * N)].x;
  const hw = s => { const x = xAt(s); // in-plane half-width: handle shank, slimmer jaw, slight taper into the head
    return x < 0.3 ? 0.27 - 0.08 * U.smooth(-3.2, 0.3, x) : 0.19 - 0.09 * U.smooth(0.3, 1.6, x) - 0.035 * U.smooth(4.3, 4.95, x); };

  // row of triangular-prism teeth across the tip width (z), pointing toward +y, extruded along x
  // edge: when set, the row is carried to +-edge with a half-tooth flank at each end (the 4-tooth jaw), so the teeth span the tip
  function teeth(centers, edge) {
    const s = new T.Shape(), w = PITCH * 0.8, lo = -TB - 0.03, k = TH / (w / 2);
    const cN = centers[centers.length - 1], v = cN + PITCH / 2 + (PITCH - w) / 2; // start of the outer half-tooth flank
    const z1 = edge ? edge : cN + w / 2, z0 = -z1;
    s.moveTo(z0, lo);
    if (edge) { s.lineTo(-edge, -TB + k * (edge - v)); s.lineTo(-v, -TB); }
    for (const c of centers) { s.lineTo(c - w / 2, -TB); s.lineTo(c, -TB + TH); s.lineTo(c + w / 2, -TB); }
    if (edge) { s.lineTo(v, -TB); s.lineTo(edge, -TB + k * (edge - v)); }
    s.lineTo(z1, lo); s.lineTo(z0, lo);
    const g = new T.ExtrudeGeometry(s, { depth: TX1 - TX0, bevelEnabled: false });
    g.rotateY(Math.PI / 2); g.translate(TX0, 0, 0); // shape u -> -z (rows are symmetric), depth -> +x
    return g.toNonIndexed();
  }

  function splitBar(geo, keep) {
    const p = geo.attributes.position, idx = geo.index.array, out = [];
    for (let i = 0; i < idx.length; i += 3) { const cx = (p.getX(idx[i]) + p.getX(idx[i + 1]) + p.getX(idx[i + 2])) / 3; if (keep(cx)) out.push(idx[i], idx[i + 1], idx[i + 2]); }
    const g = new T.BufferGeometry(); g.setAttribute('position', p); g.setAttribute('normal', geo.attributes.normal); g.setIndex(out); return g;
  }

  function half(zs, isB) {
    const g = new T.Group(), steel = U.steel();
    g.add(U.mesh(U.extrude(U.ringShape(RING.cx, RING.cy, RING.rx, RING.ry, RING.wall), 0.30, 0.05), steel, 'rings'));
    // shank + jaw in one swept bar; z-joggle hidden inside the box lock
    const jog = x => zs * 0.02 * U.smooth(-1.0, -0.6, x) * (1 - U.smooth(0.6, 1.0, x));
    const bar = U.bar(CL, hw, 0.28, jog, N, 0.07);
    // one sweep, two part tags: distal to the box lock it is the jaw (shared vertices keep the seam smooth)
    for (const [part, keep] of [['shanks', x => x < 0.6], ['jaws', x => x >= 0.6]]) g.add(U.mesh(splitBar(bar, keep), steel, part));
    // ratchet boss next to the ring (front half on A, back half on B), teeth on the overlapping edge
    const x0 = -7.35, x1 = -5.95, pitch = 0.2, depth = 0.1;
    const pts = [[x0, 0.30], [x1, 0.30], [x1, -0.02]];
    for (let x = x1; x > x0 + 0.01; x -= pitch) { pts.push([x - pitch * 0.15, -0.02 - depth]); pts.push([x - pitch, -0.02]); }
    pts.push([x0, 0.10]);
    const boss = U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), 0.15, 0.02); boss.translate(0, 0, zs * 0.075);
    g.add(U.mesh(boss, steel, 'ratchet'));
    // tip head: spade widening to ~5.6 mm, inner face just behind the teeth, small window behind the tooth row
    const head = U.spline([[HX0, 0.0], [HX0 + 0.01, 0.15], [5.13, 0.2], [5.29, 0.272], [HX1 - 0.012, 0.272], [HX1, 0.24], [HX1, -0.24],
      [HX1 - 0.012, -0.272], [5.29, -0.272], [5.13, -0.2], [HX0 + 0.01, -0.15]], 120);
    head.holes.push(new T.Path(U.spline([[5.1, 0], [5.13, 0.06], [5.2, 0.125], [5.245, 0.105], [5.245, -0.105], [5.2, -0.125], [5.13, -0.06]], 60).getPoints().reverse()));
    g.add(U.mesh(U.plateXZ(head, HEAD_T, FACE - HEAD_T / 2, 0.025), steel, 'jaws'));
    // interlocking teeth: 4 on half A, 5 on half B (offset half a pitch so they mesh)
    const c = isB ? [-2, -1, 0, 1, 2].map(i => i * PITCH) : [-1.5, -0.5, 0.5, 1.5].map(i => i * PITCH);
    const tm = U.mesh(teeth(c, isB ? 0 : EDGE), U.steel({ roughness: 0.32 }), 'teeth'); tm.geometry.computeVertexNormals(); g.add(tm);
    if (isB) g.add(U.boxLock({ L: 1.25, W: 0.78, T: 0.44, slant: 0.22, shankT: 0.28, sw: 0.22, yAt: U.lerpY(CL) })); // box lock on this half
    return g;
  }

  function build() {
    const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
    A.add(half(+1, false)); Bm.add(half(-1, true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
    const open = k => { const th = k * 0.2; A.rotation.z = -th; Bp.rotation.z = th; };
    open(0);
    return { group: grp, setOpen: open, center: new T.Vector3(-2.3, 0, 0), size: 15.5 };
  }

  ST3D.models.allis = {
    id: 'allis', recordId: 'allis', build, hasArticulation: true,
    parts: [['rings', 'Finger rings'], ['ratchet', 'Ratchet'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['jaws', 'Jaw tips (fenestrated)'], ['teeth', 'Interlocking teeth']],
    partViews: { rings: 'front', ratchet: 'ratchet', shanks: 'oblique', box: 'box', jaws: 'jawsTop', teeth: 'tip' },
    views: {
      front: { pos: [-2.3, 0, 30], tgt: [-2.3, 0, 0] },
      back: { pos: [-2.3, 0, -30], tgt: [-2.3, 0, 0] },
      side: { pos: [-2.3, 28, 0.01], tgt: [-2.3, 0, 0] },
      oblique: { pos: [7, 10, 22], tgt: [-2.3, 0, 0] },
      jaws: { pos: [3.6, 0, 7.0], tgt: [3.6, 0, 0] },
      jawsTop: { pos: [5.0, 4.5, 0.4], tgt: [5.0, -0.1, 0] },
      jawsOblique: { pos: [8.0, 2.0, 3.0], tgt: [4.95, 0, 0] },
      tip: { pos: [8.4, 0.3, 0.0], tgt: [5.4, 0, 0] },
      ratchet: { pos: [-6.6, 2.0, 5.5], tgt: [-6.6, 0.1, 0] },
      box: { pos: [0.6, 2.0, 5.5], tgt: [0, 0, 0] }
    },
    status: { state: 'complete-v1', reviewed: true, note: 'Procedural educational model, not a scan. Length (15.5 cm) and the 4x5 interlocking teeth come from catalog listings; that the tips alone meet and the blades become triangular at the tips comes from museum catalogue descriptions. Approximated: tip width (~5.6 mm), tooth height and pitch (one row of 4 vs 5 sharp prisms carried edge to edge, the 4-tooth jaw ending in half-tooth flanks; real teeth are finer), window size, the narrow space between the jaws, ring, ratchet and box-lock sizes. Not compared against a photograph because photo hosts are blocked in the build environment. A long Allis (~19-25 cm) has the same jaws on longer shanks.' },
    dims: 'About 15.5 cm (6 in) overall; tips ~5.6 mm wide with 4x5 interlocking teeth. Long Allis versions (~19-25 cm) share the same jaws.'
  };
})(window);
