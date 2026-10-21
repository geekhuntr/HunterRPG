/* D&C (dilation and curettage) tray: Sims, Auvard, Goodell, uterine sound, Hank dilators, endometrial and endocervical
   curettes, Jacobs and Skene tenacula, polyp forceps, Bozeman forceps, cervical biopsy punch, bowls.
   PROCEDURAL EDUCATIONAL MODELS, not scans. Shapes follow the student's own photographed D&C tray (assets/img/*.jpg);
   lengths come from catalog listings (cited per model in `dims`) cross-checked against the photo (the photo scale was taken
   from the 21.6 cm Jacobs tenaculum; the left side of the photo is magnified ~1.25x by camera tilt, which was corrected).
   Conventions (MODELING.md): 1 unit = 1 cm, instrument along X, working end toward +X, thickness along Z. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const sm = U.smooth, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const arc = (cx, cy, r, a0, a1, k = 10) => Array.from({ length: k + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / k); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const lenOf = pts => new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2] || 0)), false, 'centripetal').getLength();
  const darkMat = () => new T.MeshStandardMaterial({ color: 0x23282c, metalness: 0.5, roughness: 0.55 });

  // Curved sheet (vaginal blades, speculum handles): a 2D centerline in XY, the sheet's WIDTH runs along Z and it is dished
  // by `dFn` (sagitta, cm; positive = concave toward the +normal side, i.e. away from the handle on a bent blade).
  // `rad` rounds the far end over that many cm (width and dish shrink together along a quarter circle, so the tip stays clean).
  function trough(pts, wFn, dFn, th, rad = 0, n = 220, m = 20) {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], 0)), false, 'centripetal'), P = curve.getSpacedPoints(n), Lc = curve.getLength();
    // per ring: back face (m+1), front face (m+1), then the two rim edges with their own vertices so the edges shade crisply
    const pos = [], idx = [], F = m + 1, ring = 2 * F + 4, segs = [[0, m], [F, F + m], [2 * F, 2 * F + 1], [2 * F + 2, 2 * F + 3]];
    for (let i = 0; i <= n; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(n, i + 1)], tx = c.x - a.x, ty = c.y - a.y, l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, s = i / n;
      const e = (1 - s) * Lc, k = rad && e < rad ? Math.sqrt(Math.max(0, 1 - Math.pow((rad - e) / rad, 2))) : 1, w = (wFn(s) / 2) * Math.max(0.05, k), d = dFn(s) * k * k, t = (typeof th === 'function' ? th(s) : th) / 2;
      const pt = (u, side) => { const o = -d * (1 - u * u) + side * t; return [P[i].x + nx * o, P[i].y + ny * o, u * w]; };
      for (let j = 0; j <= m; j++) pos.push(...pt(1 - (2 * j) / m, -1)); // back face, z from +w to -w
      for (let j = 0; j <= m; j++) pos.push(...pt(-1 + (2 * j) / m, 1)); // front face, z from -w to +w
      pos.push(...pt(-1, -1), ...pt(-1, 1), ...pt(1, 1), ...pt(1, -1)); // rim edges
    }
    for (let i = 0; i < n; i++) for (const [j0, j1] of segs) for (let j = j0; j < j1; j++) { const a = i * ring + j, b = a + 1, c = (i + 1) * ring + j, d = c + 1; idx.push(a, b, c, b, d, c); }
    const outline = [...Array(2 * F).keys()];
    for (const end of [0, n]) { const ci = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (const j of outline) { cx += pos[(end * ring + j) * 3]; cy += pos[(end * ring + j) * 3 + 1]; cz += pos[(end * ring + j) * 3 + 2]; } pos.push(cx / outline.length, cy / outline.length, cz / outline.length);
      for (let q = 0; q < outline.length; q++) { const a = end * ring + outline[q], b = end * ring + outline[(q + 1) % outline.length]; end ? idx.push(ci, a, b) : idx.push(ci, b, a); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // Round rod along a 3D path whose radius may depend on the angle around it (fluting); parallel-transport frames, closed ends.
  function rod(pts3, rFn, n = 240, radial = 24) {
    const curve = new T.CatmullRomCurve3(pts3.map(p => new T.Vector3(p[0], p[1], p[2] || 0)), false, 'centripetal', 0.5), fr = curve.computeFrenetFrames(n, false);
    const pos = [], idx = [];
    for (let i = 0; i <= n; i++) { const P = curve.getPointAt(i / n), N = fr.normals[i], B = fr.binormals[i];
      for (let j = 0; j < radial; j++) { const a = (j / radial) * Math.PI * 2, r = rFn(i / n, a), c = Math.cos(a), s2 = Math.sin(a); pos.push(P.x + r * (c * N.x + s2 * B.x), P.y + r * (c * N.y + s2 * B.y), P.z + r * (c * N.z + s2 * B.z)); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) { const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = (i + 1) * radial + j, d = (i + 1) * radial + ((j + 1) % radial); idx.push(a, b, c, b, d, c); }
    for (const end of [0, n]) { const P = curve.getPointAt(end / n), ci = pos.length / 3; pos.push(P.x, P.y, P.z); for (let j = 0; j < radial; j++) { const a = end * radial + j, b = end * radial + ((j + 1) % radial); end ? idx.push(ci, a, b) : idx.push(ci, b, a); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.userData.curve = curve; return g;
  }
  // Solid shell of revolution about Y from an outer profile [[r, y], ...] (bottom to rim) and a wall thickness; rolled bead at the rim.
  function shell(outer, wall, seg = 72) {
    const inner = outer.slice().reverse().map(([r, y]) => [Math.max(0.001, r - wall), y + (r < wall * 2 ? wall : 0)]);
    const top = outer[outer.length - 1], bead = arc(top[0] - wall / 2, top[1], wall / 2 + 0.001, 0, Math.PI, 6);
    const prof = [[0.001, outer[0][1]], ...outer, ...bead.slice(1, -1), ...inner.map(([r, y]) => [r, y]), [0.001, inner[inner.length - 1][1]]];
    return new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), seg);
  }
  const cone = (base, dir, len, r, mat, part) => { const g = new T.ConeGeometry(r, len, 14); g.translate(0, len / 2, 0); const m = U.mesh(g, mat, part); m.position.set(...base); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...dir).normalize()); return m; };
  const rivet = (x, y, z, r, mat, part) => { const d = U.mesh(new T.SphereGeometry(r, 20, 10), mat, part); d.scale.z = 0.35; d.position.set(x, y, z); return d; };
  const views = (c, size, extra) => Object.assign({
    front: { pos: [c[0], c[1], 34], tgt: c }, back: { pos: [c[0], c[1], -34], tgt: c }, side: { pos: [c[0], c[1] + 32, 0.4], tgt: c },
    oblique: { pos: [c[0] + 12, c[1] + 14, 24], tgt: c }
  }, extra);

  // ---------------- ring-handled ratcheted forceps (shared by tenacula, polyp, Bozeman, punch) ----------------
  // o.ring {cx, cy, rx, ry, wall, th}; o.cl(isB) half-A-local centerline ring -> pivot (0,0) -> jaw; o.hw(s); o.th; o.z(x) out-of-plane offset;
  // o.ratchet {x0, x1, y}; o.box {l, h, t}; o.jaw(g, steel, isB, zFn) adds the working end; o.ang max opening (rad)
  function ringForceps(o) {
    const zf = o.z || (() => 0);
    function half(isB) {
      const g = new T.Group(), steel = U.steel(), zs = isB ? -1 : 1, R = o.ring;
      const ring = U.mesh(U.extrude(U.ringShape(R.cx, R.cy, R.rx, R.ry, R.wall), R.th, 0.06), steel, 'rings'); ring.position.z = zf(R.cx); g.add(ring);
      const jog = x => zs * 0.085 * sm(-1.4, -0.8, x) * (1 - sm(0.8, 1.4, x)) + zf(x);
      // one continuous bar split at the pivot (seam hidden inside the box lock): shank part and jaw part are separate highlightable meshes
      const cl = o.cl(isB), i0 = cl.findIndex(q => q[0] === 0 && q[1] === 0), P = cl.slice(0, i0 + 1), D = cl.slice(i0), Lp = lenOf(P), Ld = lenOf(D), Lt = Lp + Ld;
      g.add(U.mesh(U.bar(P, t => o.hw((t * Lp) / Lt), o.th, jog, 220, 0.07), steel, 'shanks'));
      g.add(U.mesh(U.bar(D, t => o.hw((Lp + t * Ld) / Lt), o.th, jog, 160, 0.07), steel, 'jaws'));
      // ratchet arm: from the shank toward the axis; front half on A, back half on B; teeth on the overlapping edge
      const { x0, x1, y } = o.ratchet, pitch = 0.17, depth = 0.09, pts = [[x0 + 0.15, y + 0.15], [x1 - 0.1, y + 0.15], [x1, -0.02]];
      for (let x = x1; x > x0 + pitch * 0.9; x -= pitch) { pts.push([x - pitch * 0.2, -0.02 - depth]); pts.push([x - pitch, -0.02]); }
      pts.push([x0, 0.25]);
      const rg = U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), o.th * 0.5, 0.02); rg.translate(0, 0, zs * o.th * 0.25 + zf(x0)); g.add(U.mesh(rg, steel, 'ratchet'));
      o.jaw(g, steel, isB, jog);
      if (isB) { const b = o.box, k = b.slant || 0, bs = new T.Shape([[-b.l / 2 - k, -b.h / 2], [b.l / 2 - k, -b.h / 2], [b.l / 2 + k, b.h / 2], [-b.l / 2 + k, b.h / 2]].map(p => new T.Vector2(p[0], p[1]))), bx = U.mesh(U.extrude(bs, b.t, 0.06), steel, 'box'); bx.position.z = zf(0); g.add(bx);
        for (const s of [1, -1]) g.add(rivet(0, 0, zf(0) + s * b.t / 2, 0.13, steel, 'box')); }
      return g;
    }
    return function build() {
      const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
      A.add(half(false)); Bm.add(half(true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
      const open = k => { const th = k * o.ang; A.rotation.z = -th; Bp.rotation.z = th; };
      open(0);
      return { group: grp, setOpen: open, center: new T.Vector3(...o.center), size: o.size };
    };
  }
  const FPARTS = [['rings', 'Finger rings'], ['ratchet', 'Ratchet'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['jaws', 'Jaws / working end']];
  // neck from the ring's distal-inner quadrant straight down to the shank line (as on the tray photo), ratchet at the junction
  const neck = (R, yr) => [[R.cx + R.rx * 0.74, R.cy - R.ry * 0.6], [R.cx + R.rx * 0.93, yr + 0.38], [R.cx + R.rx * 1.12, yr + 0.02], [R.cx + R.rx * 1.6, yr - 0.03]];

  // ---------------- Jacobs tenaculum (vulsellum): short, narrow slotted jaws ending in 2 x 2 incurved hooks ----------------
  const JAC = { ring: { cx: -13.4, cy: 2.6, rx: 1.27, ry: 1.2, wall: 0.29, th: 0.32 }, th: 0.32, ratchet: { x0: -12.5, x1: -11.6, y: 0.55 }, box: { l: 1.6, h: 0.7, t: 0.62, slant: 0.3 }, ang: 0.07, center: [-3.4, 0, 0], size: 21.6 };
  JAC.cl = () => [...neck(JAC.ring, 0.55), [-9, 0.44], [-5, 0.25], [-2, 0.08], [0, 0], [0.8, -0.13], [1.5, -0.22], [2.5, -0.24], [6.1, -0.24], [6.5, -0.23], [6.74, -0.17], [6.82, -0.09]];
  JAC.hw = s => (s < 0.62 ? 0.28 - 0.1 * sm(0.0, 0.62, s) : 0.18 - 0.04 * sm(0.66, 0.74, s) - 0.04 * sm(0.985, 1, s));
  JAC.jaw = (g, steel, isB, jog) => {
    // the jaw end turns in toward its partner and splits into two side-by-side sharp teeth (2 x 2)
    for (const z of [0.085, -0.085]) g.add(cone([6.8, -0.09, z], [-0.25, 1, 0], 0.1, 0.06, steel, 'jaws'));
  };
  // ---------------- Skene tenaculum: long jaws that bow apart into a long open loop and close to a single incurved tooth ----------------
  const SKE = { ring: { cx: -13.0, cy: 2.75, rx: 1.32, ry: 1.25, wall: 0.29, th: 0.32 }, th: 0.32, ratchet: { x0: -12.05, x1: -11.15, y: 0.55 }, box: { l: 1.6, h: 0.7, t: 0.62, slant: 0.3 }, ang: 0.06, center: [-1.0, 0, 0], size: 25.4 };
  SKE.cl = () => [...neck(SKE.ring, 0.55), [-8, 0.45], [-4, 0.25], [-1.5, 0.07], [0, 0], [1.0, -0.12], [3, -0.27], [6, -0.47], [9, -0.66], [10.3, -0.71], [10.78, -0.6], [10.98, -0.38], [11.0, -0.16]];
  SKE.hw = s => (s < 0.53 ? 0.28 - 0.1 * sm(0.0, 0.53, s) : 0.18 - 0.06 * sm(0.56, 0.66, s) - 0.04 * sm(0.985, 1, s));
  SKE.jaw = (g, steel, isB) => {
    // one tooth per jaw; the two points pass each other (A's in front, B's behind)
    const z = isB ? -0.075 : 0.075; g.add(cone([10.97, -0.2, z], [-0.3, 1, 0], 0.3, 0.07, steel, 'jaws'));
  };
  // ---------------- polyp forceps: short shanks, long slender jaws, small oval fenestrated tips ----------------
  const POL = { ring: { cx: -9.8, cy: 2.6, rx: 1.3, ry: 1.2, wall: 0.3, th: 0.3 }, th: 0.3, ratchet: { x0: -8.65, x1: -7.75, y: 0.5 }, box: { l: 1.9, h: 0.62, t: 0.58, slant: 0.3 }, ang: 0.08, center: [-1.2, 0, 0], size: 20.3 };
  POL.cl = () => [...neck(POL.ring, 0.5), [-5, 0.32], [-2.5, 0.15], [-1, 0.05], [0, 0], [1, -0.08], [2.5, -0.12], [5, -0.12], [7.3, -0.12]];
  POL.hw = s => (s < 0.5 ? 0.24 - 0.06 * sm(0, 0.5, s) : 0.18 - 0.075 * sm(0.55, 0.66, s));
  POL.jaw = (g, steel, isB, jog) => {
    // oval tip: each jaw ends in a half-oval loop; closed, the two make a small fenestrated oval with serrated faces
    g.add(U.mesh(U.bar([[7.05, -0.12], [7.5, -0.27], [7.95, -0.32], [8.4, -0.24], [8.62, -0.08], [8.64, -0.01]], () => 0.065, 0.34, jog, 80, 0.05), steel, 'jaws'));
    for (let x = 7.6; x < 8.4; x += 0.14) { const r = U.mesh(new T.BoxGeometry(0.045, 0.06, 0.36), steel, 'jaws'), yy = -0.24 - 0.07 * Math.sin(((x - 7.15) / 1.5) * Math.PI); r.position.set(x, yy, jog(x)); g.add(r); }
  };
  // ---------------- Bozeman uterine dressing forceps: long jaws with an S-curve out of the ring plane ----------------
  const BOZ = { ring: { cx: -12.7, cy: 3.1, rx: 1.45, ry: 1.35, wall: 0.33, th: 0.32 }, th: 0.33, ratchet: { x0: -11.5, x1: -10.5, y: 1.0 }, box: { l: 1.8, h: 0.74, t: 0.64, slant: 0.35 }, ang: 0.06, center: [-1.0, 0, 0.7], size: 26.0 };
  BOZ.z = x => 1.5 * sm(2.0, 9.5, x); // S-curve: jaws leave the ring plane and return parallel to it
  BOZ.cl = isB => { const c = x => (isB ? -1 : 1) * 0.32 * Math.pow(sm(8.0, 11.5, x), 1.6); // both jaws bend the same way near the tip
    return [...neck(BOZ.ring, 1.0), [-8, 0.78], [-4, 0.42], [-1.5, 0.13], [0, 0], [1.2, -0.18], [4, -0.17], [8, -0.13 + c(8)], [9.5, -0.12 + c(9.5)], [10.6, -0.1 + c(10.6)], [11.45, -0.08 + c(11.45)]]; };
  BOZ.hw = s => (s < 0.53 ? 0.28 - 0.08 * sm(0, 0.53, s) : 0.2 - 0.1 * sm(0.56, 1.0, s) - 0.04 * sm(0.985, 1, s));
  BOZ.jaw = () => {}; // the jaw is the distal part of the shank bar (serrations lie on the closed faces and are not modeled)
  // ---------------- cervical biopsy punch: long shanks, short jaws that end in two sharp biting cups ----------------
  const PUN = { ring: { cx: -16.8, cy: 3.1, rx: 1.25, ry: 1.18, wall: 0.3, th: 0.32 }, th: 0.32, ratchet: { x0: -15.5, x1: -14.5, y: 0.75 }, box: { l: 1.5, h: 0.7, t: 0.62, slant: 0.3 }, ang: 0.07, center: [-5.4, 0, 0], size: 24.0 };
  PUN.cl = () => [...neck(PUN.ring, 0.75), [-12, 0.6], [-6, 0.31], [-2, 0.1], [0, 0], [1.0, -0.13], [2.6, -0.15], [3.4, -0.2], [4.3, -0.235], [5.0, -0.22], [5.3, -0.18]];
  PUN.hw = s => (s < 0.75 ? 0.27 - 0.08 * sm(0, 0.75, s) : 0.19 - 0.105 * sm(0.78, 0.9, s));
  PUN.jaw = (g, steel, isB, jog) => {
    // slotted neck: thin rail bowing out, then the cup
    // biting cup: an oval shell whose sharp rim lies on the closing plane (y = 0), opening toward the other jaw
    const prof = arc(0, 0, 1, -Math.PI / 2, 0, 12).map(([x, y]) => [Math.max(0.001, x), y]);
    const cup = U.mesh(shell(prof, 0.22, 40), steel, 'jaws'); cup.scale.set(0.45, 0.26, 0.26); cup.position.set(5.55, 0.0, jog(5.55)); g.add(cup);
    if (isB) g.add(cone([5.92, -0.05, jog(5.9)], [-0.45, 1, 0], 0.15, 0.05, steel, 'jaws')); // tooth on the lower jaw
  };

  const reg = (id, def) => { ST3D.models[id] = Object.assign({ id, recordId: id, hasArticulation: false, parts: [], partViews: {} }, def); };
  const fViews = (o, jawX, jawZ, extra) => views(o.center, o.size, Object.assign({
    jawsOblique: { pos: [jawX + 4.5, 3.6, jawZ + 5.2], tgt: [jawX, 0, jawZ] }, tip: { pos: [jawX + 10, 0.3, jawZ + 0.8], tgt: [jawX + 2.5, 0, jawZ] },
    jaws: { pos: [jawX, 0, jawZ + 8.5], tgt: [jawX, 0, jawZ] }, ratchet: { pos: [o.ratchet.x0 + 0.5, 1.8, 5.5], tgt: [o.ratchet.x0 + 0.5, 0.2, 0] }, box: { pos: [0.6, 1.8, 5.5], tgt: [0, 0, 0] }
  }, extra));
  const fPV = { rings: 'front', ratchet: 'ratchet', shanks: 'side', box: 'box', jaws: 'jawsOblique' };

  reg('jacobs', { build: ringForceps(JAC), hasArticulation: true, parts: FPARTS, partViews: fPV, views: fViews(JAC, 5.2, 0, { teeth: { pos: [8.4, 1.4, 2.4], tgt: [6.6, 0, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: long straight ring-handled forceps with short, narrow slotted jaws (about 5 cm) that hook inward at the tip, so the jaws look like a closed slot, unlike the long open loop of the Skene on the same tray. Teeth are modeled as 2 × 2 incurved points as listed in a catalog; the photo is too small to count them. Ratchet, ring and box sizes are approximations.' },
    dims: 'About 21.5 cm (8½ in), 2 × 2 teeth (MedGyn Jacobs 8½ in, 215 mm). Jaw length about 6.5 cm measured from the tray photo.' });
  reg('skene', { build: ringForceps(SKE), hasArticulation: true, parts: FPARTS, partViews: fPV, views: fViews(SKE, 9.2, 0, { teeth: { pos: [12.8, 1.6, 2.8], tgt: [10.8, 0, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: the jaws are long (about 11 cm) and bow apart into a long, narrow open loop that closes only at the tip, where each jaw turns in to a single tooth and the two points pass each other. The list writes “singletooth/Skene”; one catalog lists the Skene with 2 × 2 teeth and a side curve, which the top-down photo cannot confirm. Shown straight with one tooth per jaw.' },
    dims: 'About 25.4 cm (10 in) (MedGyn Skene 10 in, 254 mm; Ambler 9½ in). Jaw length about 11 cm measured from the tray photo.' });
  reg('polyp', { build: ringForceps(POL), hasArticulation: true, parts: FPARTS, partViews: fPV, views: fViews(POL, 7.6, 0),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: ratchet right beside the rings, short shanks to a long box lock, then long slender jaws ending in a small oval fenestrated tip. Serrations are shown as small ridges; jaw curvature, ring and box sizes are approximations.' },
    dims: 'About 20 cm (8 in) (Laufe-type uterine polyp forceps, Ambler 31-588 / V. Mueller GL1820, about 8 in). Tip oval about 1.5 × 0.6 cm (approximate).' });
  reg('bozeman', { build: ringForceps(BOZ), hasArticulation: true, parts: FPARTS, partViews: fPV, views: fViews(BOZ, 9.5, 1.45, { side: { pos: [-1, 30, 0.7], tgt: [-1, 0, 0.7] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: long ring-handled forceps whose long, slender jaws (about 11 cm) take up nearly half the length and bend slightly near the tip; the S-curve that lifts the jaws out of the ring plane is seen from the edge-on view (the photo is top-down, so the amount of S-curve is from catalog descriptions, not measured). Partial serrations are simplified to ridges.' },
    dims: 'About 26 cm (10¼ in), S-curved, jaw about 10 cm (Sklar 95-374; Aesculap Bozemann-Douglas 260 mm; Surgical Direct GUDID B382SD9061381000).' });
  reg('punch', { build: ringForceps(PUN), hasArticulation: true, parts: FPARTS, partViews: fPV, views: fViews(PUN, 4.6, 0),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: very long shanks (rings to box about 16 cm) with short jaws whose distal part opens into a narrow slot and ends in two sharp oval biting cups, with a small tooth on the lower jaw. The photo shows ring handles like a long forceps (not the pistol-grip Kevorkian style). Cup size and tooth are approximations.' },
    dims: 'About 24 cm overall; catalog Tischler punch forceps are 8–9 in working length (V. Mueller GL1942/GL1943; Sklar 90-9570). Bite about 7 × 3 mm (approximate).' });

  // ---------------- uterine sound: malleable probe, cm marks, flat fluted paddle handle ----------------
  function sound() {
    const g = new T.Group(), steel = U.steel(), dark = darkMat();
    const path = [[-10.6, 0, 0], [-4, -0.25, 0], [3, -0.56, 0], [8.4, -0.82, 0], [9.3, -0.98, 0], [10.2, -1.28, 0], [11.2, -1.36, 0], [13.6, -1.18, 0], [16.4, -0.92, 0]];
    const L = lenOf(path), shaft = U.mesh(rod(path, s => { const d = s * L, e = (1 - s) * L; return 0.155 + 0.13 * (1 - sm(0, 0.9, d)) + (e < 0.35 ? 0.05 * Math.sqrt(Math.max(0, 1 - Math.pow((0.35 - e) / 0.35 - 0.3, 2))) : 0) - (e < 0.06 ? 0.2 * (0.06 - e) / 0.06 : 0); }, 320, 20), steel, 'shaft');
    g.add(shaft);
    // depth marks every cm from 2 to 20 cm measured from the tip (longer mark every 5 cm)
    const curve = shaft.geometry.userData.curve;
    for (let cm = 2; cm <= 20; cm++) { const u = 1 - cm / L, P = curve.getPointAt(u), tg = curve.getTangentAt(u), five = cm % 5 === 0;
      const m = new T.Mesh(new T.TorusGeometry(0.158, five ? 0.022 : 0.013, 6, 28), dark); m.position.copy(P); m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), tg); m.userData.part = 'marks'; g.add(m); }
    // collar and flat club-shaped handle with longitudinal flutes on both faces
    const col = U.mesh(new T.CylinderGeometry(0.3, 0.3, 0.55, 24), steel, 'handle'); col.rotation.z = Math.PI / 2; col.position.x = -10.75; g.add(col);
    const hwH = x => (x > -11.0 ? 0.3 : x > -12.0 ? 0.3 + 0.08 * sm(-11.0, -12.0, x) : 0.38 + 0.6 * sm(-12.0, -14.6, x));
    const outline = []; for (let x = -10.9; x >= -16.5; x -= 0.1) outline.push([x, hwH(x)]);
    const endArc = arc(-16.55 + 0.98, 0, 0.98, Math.PI / 2, 3 * Math.PI / 2, 14).slice(1, -1);
    const pts = [...outline.filter(p => p[0] > -15.57), ...endArc, ...outline.filter(p => p[0] > -15.57).reverse().map(([x, y]) => [x, -y])];
    g.add(U.mesh(U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), 0.38, 0.1), steel, 'handle'));
    for (const z of [0.19, -0.19]) for (const k of [-0.6, -0.2, 0.2, 0.6]) {
      const fp = []; for (let x = -12.6; x >= -16.0; x -= 0.3) fp.push([x, k * hwH(Math.max(x, -15.4)) * 0.85 * (x < -15.4 ? Math.sqrt(Math.max(0.05, 1 - Math.pow((x + 15.4) / 1.1, 2))) : 1), z]);
      g.add(U.mesh(U.tube(fp, 0.045, false, 40), steel, 'handle'));
    }
    return { group: g, setOpen() {}, center: new T.Vector3(0, 0, 0), size: 33 };
  }
  reg('sound', { build: sound, parts: [['shaft', 'Malleable shaft'], ['marks', 'Centimeter depth marks'], ['handle', 'Flat handle']], partViews: { shaft: 'oblique', marks: 'marks', handle: 'handle' },
    views: views([0, 0, 0], 33, { jawsOblique: { pos: [17.4, 1.6, 5.2], tgt: [13.6, -1.2, 0] }, tip: { pos: [24, -0.4, 1.4], tgt: [16.2, -0.92, 0] }, marks: { pos: [4.5, 1.0, 9], tgt: [4.5, -0.55, 0] }, handle: { pos: [-13.6, 3, 8.5], tgt: [-13.6, 0, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: long slender probe with a small S-kink about 7 cm from the tip, after which the tip section angles gently up, a blunt slightly bulbous tip, fine depth marks along the shaft and a flat club-shaped handle with longitudinal flutes behind a small collar. The bend angle is taken from the photo (the shaft is malleable, so it varies). Marks are drawn every centimeter from 2 to 20 cm, a common layout; the exact scale on the tray instrument could not be read.' },
    dims: 'About 33 cm (13 in), malleable, cm scale, flat handle (Ambler Sims uterine sound 13 in; Symmetry 13¼ in / 335 mm).' });

  // ---------------- endocervical curette (Kevorkian type): long octagonal handle, slim shaft, small angled cup ----------------
  function endocervical() {
    const g = new T.Group(), steel = U.steel();
    g.add(U.mesh(rod([[-11.9, 0, 0], [-6, 0, 0], [-1.2, 0, 0]], s => (s < 0.06 ? 0.08 + 0.22 * Math.sqrt(s / 0.06) : 0.3), 60, 8), steel, 'handle'));
    const sh = [[-1.5, 0, 0], [0.5, 0, 0], [6, 0, 0], [10.5, 0, 0], [11.15, 0.12, 0], [11.45, 0.38, 0]], Ls = lenOf(sh);
    g.add(U.mesh(rod(sh, s => { const d = s * Ls; return 0.11 + 0.19 * (1 - sm(0.2, 1.9, d)); }, 200, 16), steel, 'shaft'));
    // cutting cup: small oval basket facing the viewer, its long axis along the bent tip
    const prof = arc(0, 0, 1, -Math.PI / 2, 0, 12).map(([x, y]) => [Math.max(0.001, x), y]);
    const cup = U.mesh(shell(prof, 0.22, 36), steel, 'cup'); cup.scale.set(0.34, 0.2, 0.17); cup.rotation.set(Math.PI / 2, 0, 0);
    const cg = new T.Group(); cg.add(cup); cg.position.set(11.62, 0.6, 0.04); cg.rotation.z = 0.95; g.add(cg);
    for (const a of [-0.6, 0, 0.6]) g.add(cone([11.62 + 0.27 * Math.cos(0.95 + a * 0.5) * Math.cos(a), 0.6 + 0.27 * Math.sin(0.95) * Math.cos(a) , 0.05 + 0.15 * Math.sin(a)], [0, 0, 1], 0.07, 0.025, steel, 'cup'));
    return { group: g, setOpen() {}, center: new T.Vector3(0, 0, 0), size: 24 };
  }
  reg('endocervical', { build: endocervical, parts: [['handle', 'Long octagonal handle'], ['shaft', 'Slim shaft'], ['cup', 'Small cutting cup']], partViews: { handle: 'oblique', shaft: 'front', cup: 'jawsOblique' },
    views: views([0, 0, 0], 24, { jawsOblique: { pos: [13.6, 2.4, 3.6], tgt: [11.3, 0.4, 0] }, tip: { pos: [17.5, 1.8, 1.4], tgt: [11.5, 0.45, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: long eight-sided handle (almost half the length), a slim shaft and a tip that turns up into a small cutting cup. The cup is drawn as a small oval basket with a sharp rim and a few teeth; its exact size and tooth pattern could not be read from the photo.' },
    dims: 'About 24 cm (9½ in) measured from the tray photo against the 21.6 cm Jacobs tenaculum; cup about 6 × 3.5 mm (approximate).' });

  // ---------------- endometrial (Sims sharp) curettes, set of 4 graduated loops ----------------
  function endometrial() {
    const g = new T.Group(), steel = U.steel(), sizes = [1.4, 1.2, 1.0, 0.85], ys = [2.7, 0.9, -0.9, -2.7];
    sizes.forEach((W, i) => {
      const c = new T.Group(); c.position.y = ys[i]; g.add(c);
      // fluted hollow-looking handle: flat paddle, narrow neck toward the shaft, thumb dimple
      const hw = x => (x > -4.6 ? 0.24 : 0.24 + 0.5 * sm(-4.6, -8.6, x) + 0.06 * sm(-9, -13.4, x)), out = [];
      for (let x = -4.4; x >= -13.6; x -= 0.1) out.push([x, hw(x)]);
      const pts = [...out, ...arc(-13.6, 0, hw(-13.6), Math.PI / 2, 3 * Math.PI / 2, 14).slice(1, -1), ...out.slice().reverse().map(([x, y]) => [x, -y])];
      c.add(U.mesh(U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), 0.75, 0.26), steel, 'handle'));
      for (const k of [-0.5, -0.25, 0, 0.25, 0.5]) { const fp = []; for (let x = -8.4; x >= -14.0; x -= 0.3) fp.push([x, k * hw(x) * (x < -13.6 ? Math.sqrt(Math.max(0.05, 1 - Math.pow((x + 13.6) / 0.8, 2))) : 1), 0.37]); c.add(U.mesh(U.tube(fp, 0.04, false, 40), steel, 'handle')); }
      const dimple = new T.Mesh(new T.CircleGeometry(0.28, 28), U.steel({ color: 0x8d969d, roughness: 0.45 })); dimple.scale.x = 1.25; dimple.position.set(-7.3, 0, 0.377); dimple.userData.part = 'handle'; c.add(dimple);
      // shaft
      const lb = 14.5 - 2.1 * W, sh = [[-4.6, 0, 0], [0, 0, 0], [lb - 0.4, 0, 0], [lb + 0.02, 0, 0]], Ls = lenOf(sh);
      c.add(U.mesh(rod(sh, s => 0.13 + 0.07 * (1 - sm(0, 3, s * Ls)) + 0.03 * (1 - sm(0, 0.5, s)), 160, 16), steel, 'shaft'));
      // teardrop loop: apex at the shaft, broad rounded cutting end at the tip; tilted 15 degrees out of the handle plane
      const loop = new T.Group(); loop.position.x = lb; loop.rotation.y = -0.26; c.add(loop);
      const Lp = 2.1 * W, R = W / 2, cx = Lp - R, side = [], tipArc = arc(cx, 0, R, -Math.PI / 2 + 0.25, Math.PI / 2 - 0.25, 14);
      const rc = 0.2, ex = Lp - 0.06, lp = [[0, 0, 0], [ex * 0.5, R * 0.5, 0], [ex - rc * 1.2, R - 0.02, 0], ...arc(ex - rc, R - rc, rc, Math.PI * 0.6, 0, 5).slice(1).map(([x, y]) => [x, y, 0]), [ex, 0, 0], ...arc(ex - rc, -R + rc, rc, 0, -Math.PI * 0.6, 5).slice(0, -1).map(([x, y]) => [x, y, 0]), [ex - rc * 1.2, -R + 0.02, 0], [ex * 0.5, -R * 0.5, 0]];
      void side; void tipArc;
      loop.add(U.mesh(U.tube(lp, 0.07, true, 160), steel, 'loop'));
      // cutting edge: the distal part of the loop is a broader curved band
      loop.add(U.mesh(U.bar([[ex - 0.06, R - rc * 1.1], [ex - 0.03, 0], [ex - 0.06, -R + rc * 1.1]], () => 0.08, 0.26, () => 0, 40, 0.035), steel, 'loop'));
    });
    return { group: g, setOpen() {}, center: new T.Vector3(0, 0, 0), size: 29 };
  }
  reg('endometrial', { build: endometrial, parts: [['loop', 'Sharp loop tips (4 sizes)'], ['shaft', 'Shafts'], ['handle', 'Fluted handles']], partViews: { loop: 'jawsOblique', shaft: 'front', handle: 'handle' },
    views: views([0, 0, 0], 29, { jawsOblique: { pos: [16.4, 4.2, 7.4], tgt: [12.6, 0, 0.3] }, tip: { pos: [21, 0.6, 2], tgt: [13.5, 0, 0] }, handle: { pos: [-10.5, 1, 10], tgt: [-10.5, 0, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: four curettes side by side, each with a triangular loop (apex at the shaft, a straight, thickened cutting edge at the tip) in four graduated widths, a slim shaft and a flat fluted handle with a thumb dimple. Loop widths (about 14, 12, 10 and 8.5 mm) were measured from the photo and are approximate; the list says “confirm sizes”.' },
    dims: 'About 29 cm (11½ in) each, measured from the tray photo; loops about 0.85–1.4 cm wide (approximate).' });

  // ---------------- Hank dilators: set of 6, double-ended, S-curved, fluted larger end, stop collars ----------------
  function hanks() {
    const g = new T.Group(), steel = U.steel(), FR = [[9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20]];
    const path = [[-13.3, 1.05, 0], [-11.5, 0.72, 0], [-9.5, 0.3, 0], [-7.3, 0.05, 0], [-5.5, 0, 0], [5.5, 0, 0], [7.0, -0.05, 0], [9.0, -0.4, 0], [11.2, -0.9, 0], [13.1, -1.42, 0]];
    const L = lenOf(path), sC = [8.5 / L, 1 - 7.7 / L];
    FR.forEach(([a, b], i) => {
      const c = new T.Group(); c.position.y = -2.9 + i * 1.16; g.add(c);
      const rs = a / 60, rb = b / 60, rm = rb + 0.025; // French size / 3 = mm diameter
      const rFn = (s, ang) => { const d0 = s * L, d1 = (1 - s) * L;
        let r = d0 < 6 ? rb + (rm - rb) * sm(0, 6, d0) : d1 < 6 ? rs + (rm - rs) * sm(0, 6, d1) : rm;
        const e = Math.min(d0, d1); if (e < 0.3) r *= Math.sqrt(Math.max(0, 1 - Math.pow((0.3 - e) / 0.3, 2))) * 0.9 + 0.1; else if (e < 0.6) r *= 1 + 0.06 * Math.sin(((e - 0.3) / 0.3) * Math.PI);
        if (s < sC[0] - 0.01 && e > 0.6) r *= 1 - 0.07 * Math.pow(0.5 + 0.5 * Math.cos(ang * 10), 3); // flutes on the larger end
        return r; };
      const m = U.mesh(rod(path, rFn, 420, 40), steel, 'rods'); c.add(m);
      const curve = m.geometry.userData.curve;
      for (const u of sC) for (const du of [-0.004, 0.004]) { const P = curve.getPointAt(u + du), tg = curve.getTangentAt(u + du), t = U.mesh(new T.TorusGeometry(rm + 0.035, 0.07, 10, 28), steel, 'collars'); t.position.copy(P); t.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), tg); c.add(t); }
    });
    return { group: g, setOpen() {}, center: new T.Vector3(0, -0.2, 0), size: 27 };
  }
  reg('cervdil', { build: hanks, parts: [['rods', 'Graduated rods (9/10 to 19/20 Fr)'], ['collars', 'Stop collars']], partViews: { rods: 'oblique', collars: 'collars' },
    views: views([0, -0.2, 0], 27, { jawsOblique: { pos: [16.5, 1.5, 7], tgt: [11.3, -0.8, 0] }, tip: { pos: [20, -2.4, 2.5], tgt: [13.0, -1.3, 0] }, collars: { pos: [-4.8, 1.5, 7.5], tgt: [-4.8, -0.2, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: six double-ended rods lying side by side, each with a fluted larger end that curves one way, a smooth smaller end that curves the other way, and a small stop collar at the start of each curve. Diameters follow a six-piece Hank set (9/10 to 19/20 French; French ÷ 3 = mm). Curve shape and collar spacing are measured from the photo.' },
    dims: '26.7 cm (10½ in) each, double-ended, sizes 9/10, 11/12, 13/14, 15/16, 17/18, 19/20 Fr (Integra Miltex MH30-500 set of six; 30-505-xxxx singles).' });

  // ---------------- metal bowls: two deep stainless bowls as on the tray (side by side; the slider nests the small one inside) ----------------
  function bowls() {
    const g = new T.Group(), mat = U.steel({ roughness: 0.33 });
    const prof = [[0.001, 0], [3.8, 0], [4.9, 0.18], [5.9, 0.75], [6.6, 1.8], [6.98, 3.4], [7.15, 6.0]];
    const make = (k, part) => { const b = new T.Group(), sh = U.mesh(shell(prof.map(([r, y]) => [r * k, y * k]), 0.09, 96), mat, part); b.add(sh);
      const rim = U.mesh(new T.TorusGeometry(7.15 * k - 0.04, 0.11, 12, 96), mat, part); rim.rotation.x = Math.PI / 2; rim.position.y = 6.0 * k; b.add(rim); b.rotation.x = Math.PI / 2; return b; };
    const big = make(1, 'large'), small = make(0.63, 'small'); g.add(big, small);
    const set = k => { big.position.set(0, 5.6, 0); small.position.set(0.8 * (1 - k), -6.4 * (1 - k) + 5.6 * k, 0.12 * k); };
    set(0);
    return { group: g, setOpen: set, center: new T.Vector3(0.3, -0.5, 2.5), size: 26 };
  }
  reg('bowls', { build: bowls, hasArticulation: true, parts: [['large', 'Large bowl (about 14 cm)'], ['small', 'Small bowl (about 9 cm)']], partViews: { large: 'oblique', small: 'jawsOblique' },
    views: { front: { pos: [0.3, -0.5, 36], tgt: [0.3, -0.5, 2] }, back: { pos: [0.3, -0.5, -32], tgt: [0.3, -0.5, 2] }, side: { pos: [0.3, -34, 3.5], tgt: [0.3, -0.5, 3] }, oblique: { pos: [10, -22, 24], tgt: [0.3, -0.5, 2.5] },
      jawsOblique: { pos: [5.5, -13, 10], tgt: [0.8, -6.4, 1.5] }, tip: { pos: [0.3, -0.5, 14], tgt: [0.3, -0.5, 0] } },
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: two deep, round stainless bowls with rolled rims, one about 1.6 times the diameter of the other, shown side by side as photographed. The Open/close slider nests the small bowl inside the large one, the way they are stacked for sterilizing. Sizes come from the photo ratio and a typical solution-bowl listing.' },
    dims: 'Large about 14.3 cm across × 6 cm deep (22 oz solution bowl, Salvin: 5⅝ × 2¹⁹⁄₃₂ in); small about 9 cm × 3.8 cm. Approximate.' });

  // ---------------- Goodell cervical dilator: crossed levers, parallel serrated blades, spreading screw with thumb nut ----------------
  function goodell() {
    const g = new T.Group(), steel = U.steel(), PH = 0.17; // levers sit in two layers like scissors
    const lever = (sy, part) => { // sy = +1: lever whose handle is at +Y
      const L = new T.Group(), zl = sy * PH;
      const cl = [[-14.7, 4.0], [-13.8, 3.35], [-12.6, 3.0], [-10.5, 2.82], [-8.9, 2.62], [-6, 1.85], [-3, 0.95], [-1, 0.31], [0, 0], [1.5, -0.12], [3.0, -0.06], [4.6, 0.12], [6.3, 0.3], [6.6, 0.32]].map(([x, y]) => [x, sy * y]);
      L.add(U.mesh(U.bar(cl, s => (s < 0.12 ? 0.55 - 0.23 * sm(0, 0.12, s) : 0.32 - 0.04 * sm(0.6, 0.9, s)), 0.32, () => zl, 300, 0.08), steel, part));
      // boss where the screw passes (A) or is hinged (B)
      const bs = U.mesh(new T.CylinderGeometry(0.42, 0.42, 0.42, 24), steel, 'screw'); bs.rotation.x = Math.PI / 2; bs.position.set(-8.9, sy * 2.62, zl); L.add(bs);
      L.add(rivet(6.3, sy * 0.3, zl + sy * 0.16, 0.12, steel, 'pivot'));
      return L;
    };
    const A = lever(1, 'handles'), B = lever(-1, 'handles'); g.add(A, B);
    for (const s of [1, -1]) g.add(rivet(0, 0, s * 0.33, 0.16, steel, 'pivot'));
    // blades: inner edge straight, outer edge serrated, tips curving the same way; tongue under the opposite lever's layer
    const tipC = x => 0.3 * Math.pow(sm(10.6, 13.3, x), 2);
    const blade = sy => { const J = new T.Group(), o = [], i = [];
      for (let x = 6.9; x <= 13.05; x += 0.05) { const serr = x > 10.2 && x < 12.85 ? 0.05 * Math.pow(Math.abs(Math.sin(((x - 10.2) / 0.15) * Math.PI)), 0.6) : 0; i.push([x, sy * 0.02 + tipC(x)]); o.push([x, sy * (0.36 + serr - 0.04 * sm(7.2, 10, x)) + tipC(x) - (x > 12.85 ? sy * 0.12 * sm(12.85, 13.05, x) : 0)]); }
      const tip = arc(13.05, sy * 0.11 + tipC(13.05), 0.1, sy > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 6);
      const pts = sy > 0 ? [...i, ...tip.reverse(), ...o.reverse()] : [...o, ...tip, ...i.reverse()];
      const sh = new T.Shape(pts.map(p => new T.Vector2(p[0], p[1])));
      J.add(U.mesh(U.extrude(sh, 0.4, 0.05), steel, 'jaws'));
      const tg = U.mesh(U.extrude(U.roundRect(5.85, sy > 0 ? 0.04 : -0.4, 1.25, 0.36, 0.12), 0.3, 0.04), steel, 'jaws'); tg.position.z = -sy * PH; J.add(tg);
      J.add(rivet(6.3, sy * 0.3, -sy * (PH + 0.16), 0.12, steel, 'pivot'));
      return J; };
    const JA = blade(1), JB = blade(-1); g.add(JA, JB);
    // spreading screw: hinged to lever B's handle, passes lever A's handle, knurled thumb nut outside A
    const S = new T.Group(); g.add(S);
    const thr = rod([[0, 0, 0], [0, 4.2, 0], [0, 8.4, 0]], (s, a) => 0.14 + 0.025 * (0.5 + 0.5 * Math.sin(((s * 8.4) / 0.11) * Math.PI * 2 + a)), 400, 14);
    S.add(U.mesh(thr, steel, 'screw'));
    const nut = new T.Group(); nut.add(U.mesh(rod([[0, 0, 0], [0, 0.6, 0]], (s, a) => 0.5 + 0.03 * Math.sign(Math.sin(a * 14)), 12, 56), steel, 'screw'));
    const wing = U.mesh(U.extrude(U.roundRect(-0.85, 0.05, 1.7, 0.5, 0.22), 0.22, 0.05), steel, 'screw'); nut.add(wing); S.add(nut);
    const pA = new T.Vector2(-8.9, 2.62), pB = new T.Vector2(-8.9, -2.62);
    const set = k => { const f = 0.17 * k; A.rotation.z = f; B.rotation.z = -f;
      const ra = (p, a) => new T.Vector2(p.x * Math.cos(a) - p.y * Math.sin(a), p.x * Math.sin(a) + p.y * Math.cos(a));
      const qa = ra(new T.Vector2(6.3, 0.3), f), qb = ra(new T.Vector2(6.3, -0.3), -f); JA.position.set(qa.x - 6.3, qa.y - 0.3, 0); JB.position.set(qb.x - 6.3, qb.y + 0.3, 0);
      const a = ra(pA, f), b = ra(pB, -f), d = a.clone().sub(b); S.position.set(b.x, b.y, 0); S.rotation.z = Math.atan2(d.y, d.x) - Math.PI / 2; nut.position.y = d.length() + 0.45; };
    set(0);
    return { group: g, setOpen: set, center: new T.Vector3(-0.7, 0, 0), size: 28 };
  }
  reg('goodell', { build: goodell, hasArticulation: true, parts: [['handles', 'Crossed handles'], ['pivot', 'Pivot and blade pins'], ['jaws', 'Parallel serrated blades'], ['screw', 'Spreading screw and thumb nut']], partViews: { handles: 'front', pivot: 'screw', jaws: 'jawsOblique', screw: 'thumbscrew' },
    views: views([-0.7, 0, 0], 28, { jawsOblique: { pos: [14.6, 4.2, 6.4], tgt: [10.2, 0, 0] }, tip: { pos: [21, 0.4, 2.2], tgt: [12.5, 0, 0] }, screw: { pos: [1.5, 2.2, 6], tgt: [0.5, 0, 0] }, thumbscrew: { pos: [-6.0, 4.5, 11], tgt: [-8.9, 1.0, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: two levers cross at a central pivot, their distal arms run close together to pins that carry two parallel blades with serrated outer edges and slightly curved tips, and a threaded rod hinged to one handle passes through the other with a knurled thumb nut. Squeezing the handles (slider) spreads the blades; on the real instrument a parallel linkage keeps the blades parallel, which the model imitates without modeling every link.' },
    dims: 'About 28 cm (11 in) (Novo Surgical Goodell uterine dilator OB6340-21, 11 in / 28.0 cm, corrugated ends; HNM Goodell 11 in). Blade length about 7 cm measured from the photo.' });

  // ---------------- Sims: double-ended speculum with a cylindrical collar + Sims retractor with a ribbed hollow grip ----------------
  function sims() {
    const g = new T.Group(), steel = U.steel();
    // speculum: near blade (+X) bent 90 degrees down, neck, collar, then the far channel and blade (twisted at the collar as photographed)
    const S = new T.Group(); g.add(S);
    const p1 = [[-1.8, 0], [2, 0], [4.6, 0], ...arc(4.6, -1.0, 1.0, Math.PI / 2, 0, 8).slice(1), [5.6, -3], [5.66, -6], [5.76, -9.3]], L1 = lenOf(p1), b1 = (6.4 + Math.PI / 2) / L1;
    S.add(U.mesh(trough(p1, s => 1.3 + 2.2 * sm(b1 - 0.22, b1, s), s => 0.1 + 0.5 * sm(b1 - 0.25, b1 + 0.1, s), 0.2, 1.75), steel, 'speculum'));
    const col = U.mesh(new T.CylinderGeometry(0.95, 0.95, 3.6, 36), steel, 'collar'); col.rotation.z = Math.PI / 2; col.position.x = -3.55; S.add(col);
    for (const x of [-5.35, -1.75]) { const r = U.mesh(new T.TorusGeometry(0.93, 0.07, 10, 36), steel, 'collar'); r.rotation.y = Math.PI / 2; r.position.x = x; S.add(r); }
    const mouth = new T.Mesh(new T.CircleGeometry(0.82, 32), darkMat()); mouth.rotation.y = -Math.PI / 2; mouth.position.x = -5.36; mouth.userData.part = 'collar'; S.add(mouth);
    const far = new T.Group(); far.rotation.x = -0.96; far.position.y = -0.55; S.add(far);
    const p2 = [[-5.2, 0], [-9, 0], [-13.8, 0], ...arc(-13.8, -1.0, 1.0, Math.PI / 2, Math.PI, 8).slice(1), [-14.8, -4], [-14.9, -7.6]], L2 = lenOf(p2), b2 = (8.6 + Math.PI / 2) / L2;
    far.add(U.mesh(trough(p2, s => 1.7 + 1.3 * sm(b2 - 0.3, b2, s), s => -(0.35 + 0.2 * sm(b2 - 0.2, b2, s)), 0.2, 1.5), steel, 'speculum'));
    // retractor with ribbed hollow grip and hooked end; its larger blade sits outside the speculum's near blade
    const G = new T.Group(); G.position.y = 1.7; g.add(G);
    const p3 = [[1.0, 0], [5, 0], [7.1, 0], ...arc(7.1, -1.2, 1.2, Math.PI / 2, 0, 8).slice(1), [8.3, -5], [8.15, -9], [7.9, -11.0]], L3 = lenOf(p3), b3 = (6.1 + 0.6 * Math.PI) / L3;
    G.add(U.mesh(trough(p3, s => 1.4 + 2.6 * sm(b3 - 0.25, b3, s), s => 0.15 + 0.6 * sm(b3 - 0.25, b3 + 0.1, s), 0.22, 2.0), steel, 'grip'));
    const hp = [[0.8, 0.25, 0], [-3.5, 1.75, 0], [-8.4, 3.45, 0], [-9.7, 3.85, 0], [-10.9, 3.45, 0], [-11.5, 2.3, 0], [-11.35, 0.75, 0], [-10.95, -0.2, 0]], Lh = lenOf(hp), sh = 9.75 / Lh;
    G.add(U.mesh(rod(hp, s => { if (s < sh) { const u = s / sh, base = 0.6 + 0.75 * u, f = (u * 5) % 1; return base * (0.86 + 0.14 * Math.pow(f, 0.8)) * (u < 0.04 ? 0.7 + 7.5 * u : 1); } const e = (1 - s) * Lh; return (1.05 - 0.3 * (s - sh) / (1 - sh)) * (e < 0.25 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((0.25 - e) / 0.25, 2))) : 1); }, 420, 32), steel, 'grip'));
    return { group: g, setOpen() {}, center: new T.Vector3(-3.2, -3.4, 0), size: 26 };
  }
  reg('sims', { build: sims, parts: [['speculum', 'Double-ended Sims speculum (two blade sizes)'], ['collar', 'Collar on the speculum handle'], ['grip', 'Sims retractor with ribbed hollow grip']], partViews: { speculum: 'blades', collar: 'oblique', grip: 'oblique' },
    views: views([-3.2, -3.4, 0], 26, { jawsOblique: { pos: [13.5, 2.5, 8.5], tgt: [6.8, -4.5, 0] }, tip: { pos: [10, -18, 6], tgt: [6.7, -9.5, 0] }, blades: { pos: [-4.5, -8, 22], tgt: [-4.5, -4.5, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo, which shows two pieces under the “Simms retractor” label: a double-ended speculum (a blade bent about 90 degrees at each end, joined through a cylindrical collar, the far blade lying twisted toward the camera) and a single-bladed Sims-type retractor with a ribbed hollow grip ending in a hook. Both are modeled as photographed. Blade widths (along the viewing axis) cannot be measured from a top-down photo and come from catalog sizes; the collar may be a joint between two parts, which could not be confirmed.' },
    dims: 'Speculum about 27 cm end to end (photo); blades about 9 × 3.5 cm and 7.5 × 3 cm (Red Cross / MSF Sims size 2: 80 × 35 and 75 × 30 mm). Grip retractor blade about 11 × 4 cm, handle about 9.5 cm (photo). Approximate.' });

  // ---------------- Auvard weighted speculum: long concave blade, channel handle with keel, heavy egg-shaped weight ----------------
  function auvard() {
    const g = new T.Group(), steel = U.steel();
    const p = [[-11.6, 0], [-6, 0], [-1.2, 0], ...arc(-1.2, -1.3, 1.3, Math.PI / 2, -0.17, 10).slice(1), [0.08 - 0.17 * 5, -1.53 - 0.98 * 5], [0.08 - 0.17 * 10.5, -1.53 - 0.98 * 10.5]];
    const L = lenOf(p), bnd = (10.4 + 1.3 * (Math.PI / 2 + 0.17) / 2) / L;
    const w = s => 2.4 + 2.8 * Math.exp(-Math.pow((s - bnd) / 0.07, 2)) + (s > bnd ? 1.4 * sm(bnd, bnd + 0.1, s) - 0.5 * sm(bnd + 0.2, 1, s) : 0);
    g.add(U.mesh(trough(p, w, s => 0.5 + 0.45 * sm(bnd, bnd + 0.15, s) - 0.15 * Math.exp(-Math.pow((s - bnd) / 0.05, 2)), 0.25, 1.9), steel, 'blade'));
    // keel (gusset) under the channel handle, from the blade back to the weight
    const kp = [[-1.2, -0.45], [-1.65, -2.2], [-1.85, -3.6]]; for (let t = 0; t <= 1.001; t += 0.1) kp.push([-1.85 - 8.6 * t, -3.6 + 3.15 * Math.pow(t, 0.55)]);
    g.add(U.mesh(U.extrude(new T.Shape(kp.map(q => new T.Vector2(q[0], q[1]))), 0.3, 0.06), steel, 'handle'));
    const wt = U.mesh(new T.SphereGeometry(1, 48, 32), steel, 'weight'); wt.scale.set(4.0, 2.7, 2.6); wt.position.set(-14.8, -1.3, 0); g.add(wt);
    g.add(U.mesh(U.tube([[-18.5, -0.9, 0], [-19.5, -0.75, 0], [-20.2, -1.05, 0], [-20.25, -1.7, 0], [-19.9, -2.0, 0]], 0.17, false, 60), steel, 'weight'));
    return { group: g, setOpen() {}, center: new T.Vector3(-9.5, -5, 0), size: 24 };
  }
  reg('auvard', { build: auvard, parts: [['blade', 'Long concave blade'], ['handle', 'Channel handle and keel'], ['weight', 'Weight (ball) and end hook']], partViews: { blade: 'jawsOblique', handle: 'oblique', weight: 'weight' },
    views: views([-9.5, -5, 0], 24, { jawsOblique: { pos: [9.5, 2.5, 13], tgt: [-0.8, -5.5, 0] }, tip: { pos: [-1.5, -22, 2], tgt: [-1.4, -10, 0] }, weight: { pos: [-11, 4, 13], tgt: [-15, -1.4, 0] } }),
    status: { state: 'complete-v1', reviewed: false, note: 'Procedural model compared against the student’s tray photo: a long concave blade bent about 80 degrees from a channel-shaped handle, a flared heel at the bend, a keel under the handle, a large egg-shaped weight and a small hook at the end. The photo shows it lying on its side at an angle, so blade length and the weight’s shape are approximations; the weight is sized to about 1.1 kg (2½ lb) of steel.' },
    dims: 'Blade about 10.5 × 3.8 cm (catalog 3¼ × 1½ in and 4 × 1⅜ in blades; MedGyn 030921-030924, GUDID Surgix/Avalign 2½–3 lb). Overall about 21 cm. Approximate.' });
})(window);
