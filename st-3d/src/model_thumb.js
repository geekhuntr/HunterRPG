/* Thumb (tissue / dressing) forceps family and the #3 knife handle. PROCEDURAL EDUCATIONAL MODELS, not scans.
   Thumb forceps = two flat spring blades joined at the proximal end (no rings, no ratchet, no box lock).
   Orientation: joined end at the origin, blades run toward +X, the FACE of each blade (its width) is in the XY plane,
   blade A lies at +Z and blade B at -Z (B is built in a scale.z = -1 group). Squeezing closes the tips at z = 0;
   setOpen(k) swings each blade about the joined end (k = 1 -> ~1.2 cm between the tips).
   Identifying geometry per model (tip close-ups are where they differ):
   - adson: 12 cm, wide flat ribbed grip that steps down sharply (shoulders) to a slender ~2 mm tip; 1x2 teeth.
   - smooth-short / smooth-long: plain gradual taper, fine transverse serrations on the inner tip faces, no teeth.
   - toothed-long: same long body, 1x2 teeth at the tip.
   - rat: 14 cm, thicker and wider than the Adson, gradual taper, larger 1x2 interlocking teeth.
   - debakey: 20 cm, slim handle, long slender ~2 mm tips with longitudinal rows of tiny teeth (1 row meets 2 rows).
   - ferris: 18 cm, heavy broad flat handle, broad ~3.5 mm tip with a serrated platform plus 1x2 teeth.
   1x2 teeth: blade A ends in one central hooked tooth, blade B in two hooked teeth with a notch between them; when closed
   the single tooth drops into the notch and the pair flank it (they interlock across the width).
   Sourced (text listings; no photos reachable): Adson 12 cm (4 3/4 in) 1x2 (FDA GUDID listings, Eickemeyer 132812);
   DeBakey 8 in with 1.5-2.5 mm atraumatic tips (Stoelting 52120-57/58, B-Med DATF82M, Hayden GUDID 2.0 mm);
   Ferris-Smith 7 in / 180 mm, 1x2 teeth, jaw width 3.5 mm, serrated platform, flat handle (B. Braun BD610R, Ambler 30-265);
   #3 handle 12.5 cm, #3L about 21 cm, blades 10/11/12/15 (MSF catalogue, V. Mueller, GDC listings).
   Approximations: widths/thicknesses, spread, tooth and serration sizes, rib pitch, the blade-fitting rail profile. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const V2 = (x, y) => new T.Vector2(x, y);

  // monotone cubic interpolation through [x, y] control points (no overshoot at the Adson shoulder)
  function mono(pts) {
    const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
      if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return x => {
      if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }

  // triangle soup with flat normals (teeth, serrations, ribs, knurling)
  class Acc {
    constructor() { this.p = []; }
    t(a, b, c) { this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
    out(a, b, c, ins) { // order so the normal points away from the interior point `ins`
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const dx = (a[0] + b[0] + c[0]) / 3 - ins[0], dy = (a[1] + b[1] + c[1]) / 3 - ins[1], dz = (a[2] + b[2] + c[2]) / 3 - ins[2];
      if (nx * dx + ny * dy + nz * dz < 0) this.t(a, c, b); else this.t(a, b, c);
    }
    geo() { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3)); g.computeVertexNormals(); return g; }
  }
  // prism: closed polygon profile in the X-Z plane ([[x, z], ...], may be non-convex), extruded across Y from y0 to y1
  function prismY(acc, prof, y0, y1) {
    const P = prof.slice(); if (T.ShapeUtils.isClockWise(P.map(p => V2(p[0], p[1])))) P.reverse();
    for (const [i, j, k] of T.ShapeUtils.triangulateShape(P.map(p => V2(p[0], p[1])), [])) {
      const a = P[i]; let b = P[j], c = P[k];
      if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0) { const q = b; b = c; c = q; }
      acc.t([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]]); // CCW in x-z -> normal -Y
      acc.t([a[0], y1, a[1]], [c[0], y1, c[1]], [b[0], y1, b[1]]);
    }
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], A = [p[0], y0, p[1]], B = [q[0], y0, q[1]], C = [q[0], y1, q[1]], D = [p[0], y1, p[1]];
      acc.t(A, C, B); acc.t(A, D, C);
    }
  }
  function splitBar(geo, keep) {
    const p = geo.attributes.position, idx = geo.index.array, out = [];
    for (let i = 0; i < idx.length; i += 3) { const cx = (p.getX(idx[i]) + p.getX(idx[i + 1]) + p.getX(idx[i + 2])) / 3; if (keep(cx)) out.push(idx[i], idx[i + 1], idx[i + 2]); }
    const g = new T.BufferGeometry(); g.setAttribute('position', p); g.setAttribute('normal', geo.attributes.normal); g.setIndex(out); return g;
  }
  // U.bar closes its ends with fans whose shared vertices smear the end-ring normals (dark spot at a rounded tip):
  // re-derive the side normals without the caps and give the caps their own flat-shaded geometry
  function capsApart(geo) {
    const n = geo.attributes.position.count, c0 = n - 2, c1 = n - 1, idx = geo.index.array, side = [], cap = [];
    for (let i = 0; i < idx.length; i += 3) { const t = [idx[i], idx[i + 1], idx[i + 2]]; (t.includes(c0) || t.includes(c1) ? cap : side).push(...t); }
    geo.setIndex(side); geo.computeVertexNormals();
    const cg = new T.BufferGeometry(); cg.setAttribute('position', geo.attributes.position); cg.setIndex(cap);
    const caps = cg.toNonIndexed(); caps.computeVertexNormals();
    return { side: geo, caps };
  }
  // straight flat bar along +X (same section as U.bar) sampled at the given x stations, with the corner radius
  // shrinking with the section so a tip can taper to a closed, rounded point
  function flatBar(xs, hwX, thX, zX, rMax) {
    const arc = 4, prof = [], pos = [], idx = [];
    for (const [sx, sy, k] of [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]]) for (let j = 0; j <= arc; j++) { const t = (k * Math.PI) / 2 + (j / arc) * (Math.PI / 2); prof.push([sx, sy, Math.cos(t), Math.sin(t)]); }
    const m = prof.length, n = xs.length - 1;
    for (const x of xs) { const hw = hwX(x), b = thX(x) / 2, r = Math.min(rMax, hw * 0.98, b * 0.98), z0 = zX(x);
      for (const [sx, sy, ca, sa] of prof) pos.push(x, sx * (hw - r) + r * ca, z0 + sy * (b - r) + r * sa); }
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = i * m + j, b2 = i * m + ((j + 1) % m), c = (i + 1) * m + j, d = (i + 1) * m + ((j + 1) % m); idx.push(a, b2, c, b2, d, c); }
    for (const end of [0, n]) { const ci = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let j = 0; j < m; j++) { cx += pos[(end * m + j) * 3] / m; cy += pos[(end * m + j) * 3 + 1] / m; cz += pos[(end * m + j) * 3 + 2] / m; } pos.push(cx, cy, cz); for (let j = 0; j < m; j++) { const a = end * m + j, b2 = end * m + ((j + 1) % m); end ? idx.push(ci, a, b2) : idx.push(ci, b2, a); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  const stations = (x0, x1, xf, coarse = 0.03, fine = 0.004) => { const xs = []; for (let x = x0; x < x1 - 1e-9;) { xs.push(x); x += x < xf ? coarse : fine; } xs.push(x1); return xs; };
  const straightBar = (x0, x1, hwX, thX, zX, n, r) => U.bar([[x0, 0], [x1, 0]], s => hwX(x0 + s * (x1 - x0)), s => thX(x0 + s * (x1 - x0)), zX, n, r);

  /* ------------------------------------------------------------------ thumb forceps factory
     o.L length; o.hw [[s, half-width cm]] along s = x / L; o.th [grip, tip] thickness; o.gap max inner gap per blade at rest-closed;
     o.peak s of widest spread; o.P flat tip platform length; o.J joined-end length; o.tip: 'serr' | 'teeth' | 'debakey';
     o.teeth {a: tooth zone length, d: tooth height}; o.serr {len, pitch, depth}; o.grip [s0, s1] ribbed zone. */
  function thumb(o) {
    const L = o.L, hwS = mono(o.hw), R = 0.035;
    const hwX = x => hwS(x / L);
    const thB = x => o.th[0] + (o.th[1] - o.th[0]) * U.smooth(0.4 * L, 0.92 * L, x);
    const thX = thB;
    const h = o.tip === 'teeth' && !o.serr ? 0.01 : 0.014; // inner face height above z = 0 at the closed tip
    const xp = o.J - 0.05, xm = o.peak * L, xe = L - o.P;
    const gapX = x => x <= xp ? 0 : x < xm ? o.gap * Math.sin(Math.PI / 2 * (x - xp) / (xm - xp)) : x < xe ? o.gap * 0.5 * (1 + Math.cos(Math.PI * (x - xm) / (xe - xm))) : 0;
    const zi = x => gapX(x) + h * U.smooth(xp, xe, x);       // inner face of blade A
    const zc = x => zi(x) + thX(x) / 2;                     // blade centre
    const zo = x => zi(x) + thX(x);                         // outer face
    const a = o.tip === 'teeth' ? o.teeth.a : 0, xEnd = L - a; // blade body ends here; teeth carry on to L
    const rTip = hwX(L);
    const hwT = x => { // rounded tip in face view for the untoothed tips
      if (a || x < L - rTip) return hwX(x);
      const u = (x - (L - rTip)) / rTip; return Math.max(0.004, hwX(x) * Math.sqrt(Math.max(0, 1 - u * u)));
    };
    // in side view the untoothed tip rounds off on the outer face (inner face stays flat)
    const rT = thX(L) * 0.9;
    const thT = x => { if (a || x < L - rT) return thX(x); const u = (x - (L - rT)) / rT; return Math.max(0.004, thX(x) * Math.sqrt(Math.max(0, 1 - u * u))); };
    const zcT = x => zi(x) + thT(x) / 2;

    function blade(isB) {
      const g = new T.Group(), steel = U.steel();
      // one swept bar (smooth normals across the seam), split into the blade and the tip part
      const bar = capsApart(flatBar(stations(o.J - 0.35, xEnd, xEnd - 0.25), hwT, thT, zcT, R));
      g.add(U.mesh(splitBar(bar.side, x => x < xe), steel, 'blades'));
      g.add(U.mesh(splitBar(bar.side, x => x >= xe), steel, 'tips'));
      g.add(U.mesh(bar.caps, steel, 'tips'));
      // transverse grip ribs on the outer face
      const rib = new Acc(), x0 = o.grip[0] * L, x1 = o.grip[1] * L, pitch = 0.11, w = 0.062, hgt = 0.02;
      for (let x = x0; x <= x1; x += pitch) {
        const xa = x - w / 2, xb = x + w / 2, ya = hwX(x) - R - 0.012;
        prismY(rib, [[xa, zo(xa) - 0.01], [xb, zo(xb) - 0.01], [xb - 0.016, zo(xb) + hgt], [xa + 0.016, zo(xa) + hgt]], -ya, ya);
      }
      g.add(U.mesh(rib.geo(), steel, 'grip'));
      const tip = new Acc(), t = thX(L);
      if (o.serr) { // fine transverse serrations on the inner face; blade B offset half a pitch so the ridges mesh
        const { len, pitch: p, depth: d } = o.serr, stop = a ? xEnd - 0.03 : L - rTip * 0.55;
        for (let x = L - len + (isB ? p / 2 : 0); x + p / 2 <= stop; x += p) {
          const yh = hwT(x) - R * 0.7; if (yh < 0.03) continue;
          prismY(tip, [[x - p / 2, h + 0.006], [x + p / 2, h + 0.006], [x, h - d]], -yh, yh);
        }
      }
      if (o.tip === 'teeth') { // 1x2: A = one central hooked tooth, B = two hooked teeth with a notch between
        const { d } = o.teeth, wE = hwX(xEnd), c = 0.007, xs = xEnd - 0.02;
        const prof = [[xs, h + 0.004], [L - 0.55 * a, h + 0.004], [L - 0.14 * a, h - d], [L, h - 0.5 * d], [L, h + t * 0.55], [L - t * 0.4, h + t - 0.004], [xs, h + t - 0.004]];
        if (!isB) prismY(tip, prof, -(wE / 3 - c), wE / 3 - c);
        else for (const s of [1, -1]) { const ya = s * (wE / 3 + c), yb = s * (wE - R * 0.6); prismY(tip, prof, Math.min(ya, yb), Math.max(ya, yb)); }
      }
      if (o.tip === 'debakey') { // longitudinal rows of tiny teeth: A one central row, B two rows that flank it
        const rows = isB ? [[0.04, 0.082], [-0.082, -0.04]] : [[-0.028, 0.028]], xa = L - o.P + 0.15, xb = L - 0.14, p = 0.036;
        for (const [y0, y1] of rows) {
          const prof = [[xa, h + 0.006]]; let k = 0;
          for (let x = xa + (isB ? p / 2 : 0); x < xb; x += p / 2, k++) prof.push([x, k % 2 ? h - 0.024 : h - 0.011]);
          prof.push([xb, h - 0.011], [xb, h + 0.006]);
          prismY(tip, prof, y0, y1);
        }
      }
      if (tip.p.length) g.add(U.mesh(tip.geo(), steel, 'tips'));
      return g;
    }

    function build() {
      const grp = new T.Group(), steel = U.steel();
      // joined (spring) end: one solid piece holding both blade roots, rounded in face view
      const R0 = hwX(0) + 0.008, th2 = 2 * o.th[0] + 0.02;
      const jhw = x => { const w = hwX(x) + 0.008; if (x >= R0) return w; const u = (R0 - x) / R0; return Math.max(R + 0.01, w * Math.sqrt(Math.max(0, 1 - u * u))); };
      const jb = capsApart(straightBar(0, o.J, jhw, () => th2, () => 0, 80, R + 0.01));
      grp.add(U.mesh(jb.side, steel, 'joint'), U.mesh(jb.caps, steel, 'joint'));
      const A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
      const a1 = blade(false); a1.position.x = -xp; A.add(a1); A.position.x = xp;
      const b1 = blade(true); b1.position.x = -xp; Bm.add(b1); Bm.scale.z = -1; Bp.add(Bm); Bp.position.x = xp;
      grp.add(A, Bp);
      const th = Math.atan(0.6 / (L - xp));
      const open = k => { A.rotation.y = -k * th; Bp.rotation.y = k * th; };
      open(0);
      return { group: grp, setOpen: open, center: new T.Vector3(L / 2, 0, 0), size: L };
    }

    const gm = (o.grip[0] + o.grip[1]) / 2 * L;
    const views = {
      front: { pos: [L / 2, 0, 30], tgt: [L / 2, 0, 0] },
      back: { pos: [L / 2, 0, -30], tgt: [L / 2, 0, 0] },
      side: { pos: [L / 2, 30, 0.01], tgt: [L / 2, 0, 0] },
      oblique: { pos: [L / 2 + 7, 13, 22], tgt: [L / 2, 0, 0] },
      tip: { pos: [L - 0.55, 2.5, 0.02], tgt: [L - 0.55, 0, 0] },
      jawsOblique: { pos: [L + 1.6, 1.25, 1.5], tgt: [L - 0.3, 0, 0] },
      grip: { pos: [gm + 1.8, 3.2, 6.2], tgt: [gm, 0, 0.3] },
      joint: { pos: [o.J + 2.2, 2.6, 3.8], tgt: [o.J * 0.6, 0, 0] }
    };
    return { build, views };
  }

  const PARTS = [['blades', 'Spring blades'], ['grip', 'Ribbed grip area'], ['tips', 'Working tips (teeth / serrations)'], ['joint', 'Joined (spring) end']];
  const PV = { blades: 'side', grip: 'grip', tips: 'jawsOblique', joint: 'joint' };
  const reg = (id, o, note, dims) => {
    const f = thumb(o);
    ST3D.models[id] = { id, recordId: id, build: f.build, hasArticulation: true, parts: PARTS, partViews: PV, views: f.views, status: { state: 'complete-v1', reviewed: false, note }, dims };
  };
  const COMMON = ' Procedural educational model, not a scan; no photographs could be reached while building it, so widths, thickness, spread, rib pitch and tooth/serration sizes are approximations from catalog text.';

  reg('adson', { L: 12, hw: [[0, 0.4], [0.1, 0.47], [0.55, 0.48], [0.64, 0.15], [0.8, 0.125], [1, 0.11]], th: [0.13, 0.09], gap: 0.42, peak: 0.42, P: 0.8, J: 1.1,
    tip: 'teeth', teeth: { a: 0.2, d: 0.12 }, grip: [0.18, 0.5] },
  'Adson with teeth: short (12 cm), wide flat ribbed grip that narrows sharply at shoulders into a slender tip about 2 mm wide; one tooth on one blade meets two teeth on the other (1x2) and they interlock when closed. Some Adsons also have a small serrated platform behind the teeth; this one shows teeth only.' + COMMON,
  'About 12 cm (4¾ in); grip about 9.5 mm wide, tip about 2.2 mm wide with 1×2 teeth. Widths and tooth size approximate.');

  reg('smooth-short', { L: 12.7, hw: [[0, 0.36], [0.1, 0.42], [0.35, 0.41], [0.75, 0.24], [1, 0.13]], th: [0.13, 0.09], gap: 0.45, peak: 0.4, P: 1.4, J: 1.1,
    tip: 'serr', serr: { len: 1.3, pitch: 0.05, depth: 0.022 }, grip: [0.2, 0.5] },
  'Smooth (dressing) thumb forceps, short: plain gradual taper with no shoulders, rounded tip, fine transverse serrations on the inner tip faces that mesh when closed, and no teeth. Short versions are sold at 12-14 cm; this one is 12.7 cm (5 in).' + COMMON,
  'About 12.7 cm (5 in); tip about 2.6 mm wide with fine cross-serrations (~0.5 mm pitch). Approximate.');

  const LONG = { L: 25, hw: [[0, 0.4], [0.07, 0.46], [0.3, 0.45], [0.75, 0.25], [1, 0.14]], th: [0.15, 0.1], gap: 0.6, peak: 0.36, J: 1.5, grip: [0.15, 0.36] };
  reg('smooth-long', Object.assign({}, LONG, { P: 1.8, tip: 'serr', serr: { len: 1.6, pitch: 0.055, depth: 0.024 } }),
  'Smooth thumb forceps, long: the same plain serrated, untoothed tip as the short smooth forceps on a 25 cm body for deep work. Length varies by maker (about 20-30 cm); 25 cm (10 in) shown.' + COMMON,
  'About 25 cm (10 in); tip about 2.8 mm wide with fine cross-serrations. Approximate.');
  reg('toothed-long', Object.assign({}, LONG, { P: 1.0, tip: 'teeth', teeth: { a: 0.24, d: 0.14 } }),
  'Toothed thumb forceps, long: same 25 cm body as the long smooth forceps, but the tip ends in 1x2 interlocking teeth instead of serrations. Tooth count (1x2 vs 2x3) varies by maker; 1x2 shown.' + COMMON,
  'About 25 cm (10 in); tip about 2.8 mm wide with 1×2 teeth. Approximate.');

  reg('rat', { L: 14, hw: [[0, 0.42], [0.1, 0.5], [0.4, 0.49], [0.8, 0.27], [1, 0.17]], th: [0.18, 0.13], gap: 0.48, peak: 0.4, P: 0.9, J: 1.3,
    tip: 'teeth', teeth: { a: 0.28, d: 0.17 }, grip: [0.2, 0.5] },
  'Rat-tooth forceps: 14 cm, thicker and wider than the Adson with a gradual taper (no sharp shoulders) and larger 1x2 interlocking teeth at a ~3.4 mm tip. The student list writes "rat/mouse tooth"; both names are used for this toothed pattern, and some makers use "mouse tooth" for finer teeth, so confirm with your instructor.' + COMMON,
  'About 14 cm (5½ in); tip about 3.4 mm wide with 1×2 teeth. Approximate.');

  reg('debakey', { L: 20, hw: [[0, 0.32], [0.1, 0.37], [0.5, 0.35], [0.78, 0.13], [0.86, 0.11], [1, 0.105]], th: [0.12, 0.085], gap: 0.55, peak: 0.38, P: 2.4, J: 1.3,
    tip: 'debakey', grip: [0.17, 0.45] },
  'DeBakey atraumatic forceps, 8 in: slim handle with transverse grip ribs, long slender tips about 2 mm wide. The inner tip faces carry fine longitudinal rows of tiny teeth: one central row on one blade fits between two rows on the other, so the grip is atraumatic. Catalogs list 1.5-2.5 mm tip widths; 2 mm shown.' + COMMON,
  'About 20 cm (8 in); tips about 2.1 mm wide with longitudinal tooth rows (1 row meets 2) over the last ~2.3 cm. Approximate.');

  reg('ferris', { L: 18, hw: [[0, 0.55], [0.1, 0.68], [0.5, 0.66], [0.82, 0.27], [1, 0.19]], th: [0.2, 0.13], gap: 0.5, peak: 0.4, P: 1.5, J: 1.4,
    tip: 'teeth', teeth: { a: 0.28, d: 0.16 }, serr: { len: 1.3, pitch: 0.06, depth: 0.024 }, grip: [0.18, 0.5] },
  'Ferris-Smith tissue forceps: heavy 18 cm (7 in) forceps with a broad flat handle (~1.35 cm), a ~3.5 mm tip with a serrated platform and 1x2 teeth. The student list says "Ferris-Smith or Bonnie": a Bonney forceps is a similar heavy 1x2-toothed forceps (usually with a narrower handle); this model shows the Ferris-Smith pattern, so confirm which one your tray uses.' + COMMON,
  'About 18 cm (7 in); handle about 1.35 cm wide; tip about 3.8 mm wide with serrated platform and 1×2 teeth. Approximate.');

  /* ------------------------------------------------------------------ #3 knife (scalpel) handle
     Flat handle 12.5 cm, centred on the origin, blade fitting toward +X. */
  function knife() {
    const grp = new T.Group(), steel = U.steel(), X0 = -6.25, XS = 4.15, XT = 6.25, TH = 0.24, TF = 0.13;
    const hw = mono([[X0, 0.44], [-5.6, 0.47], [2.3, 0.47], [3.5, 0.31], [XS, 0.29]]);
    // handle outline (face view): squared butt with rounded corners, gentle neck down to the shoulder at XS
    const rc = 0.2, o = [];
    for (let x = X0 + rc; x <= XS + 1e-6; x += 0.05) o.push(V2(x, hw(x)));
    o.push(V2(XS, hw(XS)), V2(XS, -hw(XS)));
    for (let x = XS - 0.05; x >= X0 + rc - 1e-6; x -= 0.05) o.push(V2(x, -hw(x)));
    const h0 = hw(X0 + rc);
    for (let i = 0; i <= 8; i++) { const t = -Math.PI / 2 - (i / 8) * Math.PI / 2; o.push(V2(X0 + rc + rc * Math.cos(t), -h0 + rc + rc * Math.sin(t))); }
    for (let i = 0; i <= 8; i++) { const t = Math.PI - (i / 8) * Math.PI / 2; o.push(V2(X0 + rc + rc * Math.cos(t), h0 - rc + rc * Math.sin(t))); }
    grp.add(U.mesh(U.extrude(new T.Shape(o), TH, 0.05), steel, 'handle'));
    // blade fitting: thinner tongue stepped down from the shoulder, rounded nose
    const fw = 0.21, fs = new T.Shape(); fs.moveTo(XS - 0.2, -fw); fs.lineTo(XT - fw, -fw); fs.absarc(XT - fw, 0, fw, -Math.PI / 2, Math.PI / 2, false); fs.lineTo(XS - 0.2, fw); fs.lineTo(XS - 0.2, -fw);
    grp.add(U.mesh(U.extrude(fs, TF, 0.025), steel, 'fitting'));
    // raised central rail on each face with an undercut groove along each side (the blade's slot rides in the grooves)
    const rail = new Acc(), zf = TF / 2, xa = XS - 0.03, xb = XT - 0.3;
    prismY(rail, [[xa, zf - 0.012], [xb - 0.04, zf - 0.012], [xb - 0.04, zf + 0.032], [xa, zf + 0.032]], -0.05, 0.05);
    prismY(rail, [[xa, zf + 0.032], [xb - 0.03, zf + 0.032], [xb - 0.11, zf + 0.066], [xa, zf + 0.066]], -0.1, 0.1);
    // knurled grip band (small pyramids) on both faces
    const kn = new Acc(), p = 0.085, z0 = TH / 2 - 0.004, z1 = TH / 2 + 0.026;
    for (let x = -0.6; x <= 2.2; x += p) for (let y = -0.34; y <= 0.341; y += p) {
      const s = p * 0.49, c = [[x - s, y - s, z0], [x + s, y - s, z0], [x + s, y + s, z0], [x - s, y + s, z0]], ap = [x, y, z1], ins = [x, y, z0 - 0.01];
      for (let i = 0; i < 4; i++) kn.out(c[i], c[(i + 1) % 4], ap, ins);
      kn.out(c[0], c[1], c[2], [x, y, z1]); kn.out(c[0], c[2], c[3], [x, y, z1]);
    }
    const railG = rail.geo(), knG = kn.geo();
    for (const sz of [1, -1]) { const s = new T.Group(); s.scale.z = sz; s.add(U.mesh(railG, steel, 'fitting')); s.add(U.mesh(knG, steel, 'grip')); grp.add(s); }
    return { group: grp, setOpen: () => {}, center: new T.Vector3(0, 0, 0), size: 12.5 };
  }
  ST3D.models.knife = {
    id: 'knife', recordId: 'knife', build: knife, hasArticulation: false,
    parts: [['handle', 'Flat handle'], ['grip', 'Knurled grip area'], ['fitting', 'Blade fitting (rail and grooves)']],
    partViews: { handle: 'front', grip: 'grip', fitting: 'jawsOblique' },
    views: {
      front: { pos: [0, 0, 30], tgt: [0, 0, 0] }, back: { pos: [0, 0, -30], tgt: [0, 0, 0] },
      side: { pos: [0, 30, 0.01], tgt: [0, 0, 0] }, oblique: { pos: [6, 12, 24], tgt: [0, 0, 0] },
      tip: { pos: [5.25, 0.5, 3.4], tgt: [5.25, 0, 0] },
      jawsOblique: { pos: [7.4, 1.9, 1.9], tgt: [5.2, 0, 0] },
      grip: { pos: [1.4, 1.6, 4.2], tgt: [0.8, 0, 0] }
    },
    status: { state: 'complete-v1', reviewed: false, note: '#3 scalpel (Bard-Parker type) handle: flat 12.5 cm steel handle with a knurled grip band near the blade end and, at the tip, a thinner blade fitting with a raised central rail and an undercut groove along each side; a #10, #11, #12 or #15 blade\'s slot slides along those grooves until it seats against the shoulder. The #3L is the same fitting on a longer (~21 cm) handle. Procedural model, not a scan: rail/groove profile, knurl pattern and widths are approximations; ruler graduations and the stamped size number are not modeled, and no blade is shown.' },
    dims: 'About 12.5 cm long, ~9.5 mm wide, ~2.4 mm thick; fitting ~2.3 cm long. #3L is about 21 cm. Approximate.'
  };
})(window);
