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
  // round off the ends of a width function over `rad` cm (quarter circle)
  const roundEnds = (wFn, L, rad, ends = [true, true], min = 0.25) => s => { const w = wFn(s), d0 = s * L, d1 = (1 - s) * L; let k = 1;
    for (const [d, on] of [[d0, ends[0]], [d1, ends[1]]]) if (on && d < rad) k = Math.min(k, Math.sqrt(Math.max(0, 1 - Math.pow((rad - d) / rad, 2)))); return Math.max(min, w * k); };

  // Curved sheet (vaginal blades, speculum handles): a 2D centerline in XY, the sheet's WIDTH runs along Z and it is dished
  // by `dFn` (sagitta, cm; positive = concave toward the +normal side, i.e. away from the handle on a bent blade).
  function trough(pts, wFn, dFn, th, n = 220, m = 20) {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], 0)), false, 'centripetal'), P = curve.getSpacedPoints(n);
    const pos = [], idx = [], ring = 2 * (m + 1);
    for (let i = 0; i <= n; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(n, i + 1)], tx = c.x - a.x, ty = c.y - a.y, l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, s = i / n;
      const w = wFn(s) / 2, d = dFn(s), t = (typeof th === 'function' ? th(s) : th) / 2;
      const put = (u, side) => { const o = -d * (1 - u * u) + side * t; pos.push(P[i].x + nx * o, P[i].y + ny * o, u * w); };
      for (let j = 0; j <= m; j++) put(1 - (2 * j) / m, -1); // back face, z from +w to -w
      for (let j = 0; j <= m; j++) put(-1 + (2 * j) / m, 1); // front face, z from -w to +w
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < ring; j++) { const a = i * ring + j, b = i * ring + ((j + 1) % ring), c = (i + 1) * ring + j, d = (i + 1) * ring + ((j + 1) % ring); idx.push(a, b, c, b, d, c); }
    for (const end of [0, n]) { const ci = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let j = 0; j < ring; j++) { cx += pos[(end * ring + j) * 3]; cy += pos[(end * ring + j) * 3 + 1]; cz += pos[(end * ring + j) * 3 + 2]; } pos.push(cx / ring, cy / ring, cz / ring);
      for (let j = 0; j < ring; j++) { const a = end * ring + j, b = end * ring + ((j + 1) % ring); end ? idx.push(ci, b, a) : idx.push(ci, a, b); } }
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
    const g = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), seg); g.computeVertexNormals(); return g;
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
      g.add(U.mesh(U.bar(o.cl(isB), o.hw, o.th, jog, 320, 0.07), steel, 'shanks'));
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
})(window);
