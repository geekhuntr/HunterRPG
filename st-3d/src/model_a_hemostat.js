/* Shared factory for ring-handled, ratcheted, box-lock clamps (Kelly, Crile, mosquito, Kocher, tonsil, right-angle, needle driver).
   PROCEDURAL EDUCATIONAL MODELS, not scans. Named model_a_* so it loads before the model files (files load alphabetically).
   Registers no model itself, only ST3D.hemostat(opts) -> model definition.
   Anatomy: two halves (finger ring + shank + ratchet boss + jaw); half B is built and mirrored (scale.y = -1) inside a pivot
   group and carries the box lock + rivet heads. The shanks run side by side proximal to the box and cross inside it
   (a small z-joggle hidden by the box). Each jaw is a custom sweep along a path in the ring plane (straight, gently curved or
   bent to a right angle; defined by its curvature) with a flat grasping face, chamfered face edges and a rounded back.
   Face patterns: 'transverse' serrations (triangle-wave ridges across the face; they interlock exactly when closed) or
   'crosshatch' (a diamond grid of pyramids, needle-driver style). Optional 1x2 tip teeth (Kocher): the last few mm of each
   jaw become prongs, two on half A and one (central) on half B, each with a tooth that crosses the parting line.
   Half B's path and face pattern are built inverted so that after mirroring it bends the same way as half A and its face
   meets half A's face. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // Make a closed indexed mesh wind outward (positive signed volume). Older kit versions wound U.bar inward; now a no-op.
  function outward(g) {
    const p = g.attributes.position, ix = g.index.array, a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(); let v = 0;
    for (let i = 0; i < ix.length; i += 3) { a.fromBufferAttribute(p, ix[i]); b.fromBufferAttribute(p, ix[i + 1]); c.fromBufferAttribute(p, ix[i + 2]); v += a.dot(b.cross(c)); }
    if (v < 0) { for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.index.needsUpdate = true; g.computeVertexNormals(); }
    return g;
  }

  // ---------- jaw path (curvature-defined, arc-length parameter s from the jaw base) ----------
  function makePath(x0, L, kappa) {
    const DS = 0.002, N = Math.ceil(L / DS) + 2, X = [], Y = [], TH = [];
    let x = x0, y = 0, th = 0;
    for (let i = 0; i < N; i++) { X.push(x); Y.push(y); TH.push(th); const k = kappa(i * DS), tm = th + (k * DS) / 2; x += DS * Math.cos(tm); y += DS * Math.sin(tm); th += k * DS; }
    return s => { const f = clamp(s / DS, 0, N - 1.0001), i = Math.floor(f), t = f - i; return { x: X[i] + (X[i + 1] - X[i]) * t, y: Y[i] + (Y[i + 1] - Y[i]) * t, th: TH[i] + (TH[i + 1] - TH[i]) * t }; };
  }
  // local (half-frame) point from path coords: sg = -1 builds half B's mirrored path; u is along the left normal, jaw at u < 0
  const toLocal = (path, sg, s, u, z) => { const p = path(s), c = Math.cos(p.th), sn = Math.sin(p.th); return new T.Vector3(p.x - sg * sn * u, sg * p.y + c * u, z); };

  // ---------- jaw sweep ----------
  // Section (u, z): face at u = F (+ pattern) spanning z in [-h+ch, h-ch], chamfers, flat top/bottom, rounded back at u = -w.
  // Normals: smoothing groups (rounded body smooth; face/chamfers smooth only between teeth creases); crosshatch facets flat.
  function jawGeometry(o) {
    const ss = o.ss, nx = ss.length, NA = 6, nf = o.nf;
    const P = [];
    let m0 = 0;
    for (let i = 0; i < nx; i++) {
      const s = ss[i], w = o.w(s), h = o.h(s), tr = o.teeth(s);
      const ch = Math.min(o.chamfer, w * 0.3, h * 0.4);
      const r = Math.max(0.002, Math.min(h * 0.88, w - o.dHalf - ch - 0.004));
      const fz = k => -h + ch + ((2 * h - 2 * ch) * k) / nf, fu = k => tr + o.hatch(i, k);
      const cu = o.hatchRow(i) >= 0 ? -o.dHalf : tr; // chamfer inner edge follows transverse teeth; below the crosshatch valleys
      const sec = [[fu(nf), fz(nf)], [cu - ch, h], [-w + r, h]];
      for (let k = 1; k <= NA; k++) { const a = Math.PI / 2 + (k / NA) * (Math.PI / 2); sec.push([-w + r + r * Math.cos(a), h - r + r * Math.sin(a)]); }
      for (let k = 0; k <= NA; k++) { const a = Math.PI + (k / NA) * (Math.PI / 2); sec.push([-w + r + r * Math.cos(a), -h + r + r * Math.sin(a)]); }
      sec.push([cu - ch, -h], [fu(0), fz(0)]);
      m0 = sec.length;
      for (let k = 1; k < nf; k++) sec.push([fu(k), fz(k)]);
      P.push(sec.map(([u, z]) => o.map(s, u, z)));
    }
    const m = P[0].length;
    const SG = Array.from({ length: m }, (_, j) => (j === 0 ? 1 : j === m0 - 2 ? 3 : j >= m0 - 1 ? 0 : 2));
    const kOf = j => (j === 0 ? nf : j - (m0 - 1));
    const flat = (i, j) => SG[j] !== 2 && o.hatchRow(i) >= 0 && o.hatchRow(i + 1) >= 0;
    const gid = (i, j) => (SG[j] === 2 ? -1 : SG[j] * 100000 + o.xg[i]);
    const qn = [], A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3();
    for (let i = 0; i < nx - 1; i++) {
      qn.push([]);
      for (let j = 0; j < m; j++) {
        const a = P[i][j], b = P[i][(j + 1) % m], c = P[i + 1][j], d = P[i + 1][(j + 1) % m];
        const n1 = A.subVectors(b, a).clone().cross(B.subVectors(c, a)), n2 = A.subVectors(d, b).clone().cross(C.subVectors(c, b));
        qn[i].push(n1.add(n2));
      }
    }
    const cornerN = (vi, vj, g) => {
      const n = new T.Vector3();
      for (const ii of [vi - 1, vi]) { if (ii < 0 || ii > nx - 2) continue; for (const jj of [(vj - 1 + m) % m, vj % m]) if (!flat(ii, jj) && gid(ii, jj) === g) n.add(qn[ii][jj]); }
      return n.normalize();
    };
    const pos = [], nor = [];
    const put = (p, n) => { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); };
    const triFlat = (a, b, c) => { const n = B.subVectors(b, a).clone().cross(C.subVectors(c, a)).normalize(); put(a, n); put(b, n); put(c, n); };
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < m; j++) {
      const j1 = (j + 1) % m;
      if (flat(i, j)) { // crosshatch facets: split each quad along its valley-valley diagonal so every triangle is a pyramid face
        const p00 = P[i][j], p01 = P[i][j1], p10 = P[i + 1][j], p11 = P[i + 1][j1];
        const valley00 = SG[j] === 0 && (o.hatchRow(i) + kOf(j)) % 2 === 0;
        if (valley00 || SG[j] !== 0) { triFlat(p00, p01, p11); triFlat(p00, p11, p10); } else { triFlat(p00, p01, p10); triFlat(p01, p11, p10); }
        continue;
      }
      const g = gid(i, j);
      const c00 = [P[i][j], cornerN(i, j, g)], c01 = [P[i][j1], cornerN(i, j1, g)], c10 = [P[i + 1][j], cornerN(i + 1, j, g)], c11 = [P[i + 1][j1], cornerN(i + 1, j1, g)];
      for (const c of [c00, c01, c10, c01, c11, c10]) put(c[0], c[1]);
    }
    // end caps (fans), flat normals
    for (const [i, last] of [[0, false], [nx - 1, true]]) {
      const ctr = new T.Vector3(); P[i].forEach(p => ctr.add(p)); ctr.multiplyScalar(1 / m);
      for (let j = 0; j < m; j++) { const a = P[i][j], b = P[i][(j + 1) % m]; if (last) triFlat(ctr, a, b); else triFlat(ctr, b, a); }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    return g;
  }

  ST3D.hemostat = function (o) {
    const BX = Object.assign({ hx: 0.5, hy: 0.4, t: 0.58 }, o.box || {}), BOXX = BX.hx, J0 = BOXX - 0.05, bs = BOXX / 0.5;
    const RING = Object.assign({ cx: -9.0, cy: 1.36, rx: 1.22, ry: 1.12, wall: 0.31 }, o.ring || {});
    const shankT = o.shankT, ringT = o.ringT || Math.max(0.32, shankT + 0.02);
    // jaw path: arc length L from the jaw base; legacy options (tipX, curveK, serrFrom as x) map onto it
    const L = o.L != null ? o.L : o.tipX - J0;
    const kappa = o.kappa || (o.curveK ? s => (s > BOXX - J0 ? 2 * o.curveK : 0) : () => 0);
    const path = makePath(J0, L + 0.01, kappa);
    const tipTeeth = !!o.tipTeeth, TZ = tipTeeth ? o.tipTeeth.len : 0, LB = L - TZ; // jaw body ends at LB; prongs from LB to L
    const RT = tipTeeth ? 0 : o.tipR != null ? o.tipR : 0.14;
    const uJ = s => clamp((s - 0.05) / (L - 0.05), 0, 1);
    const tipF = s => (RT <= 0 || s <= LB - RT ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((s - (LB - RT)) / RT, 2))));
    const jawW = s => Math.max(0.016, (o.w0 + (o.w1 - o.w0) * uJ(s)) * tipF(s));
    const jawH = s => (o.h0 + (o.h1 - o.h0) * uJ(s)) * (0.42 + 0.58 * tipF(s));
    // face pattern zones
    const hatch = o.pattern === 'crosshatch';
    const P = o.pitch, D = o.depth;
    const sx0 = o.serrFromS != null ? o.serrFromS : o.serrFrom != null ? o.serrFrom - J0 : 0.1;
    const sEnd = o.serrToS != null ? o.serrToS : tipTeeth ? LB - 0.03 : L - 0.05;
    const nTeeth = hatch ? 0 : Math.floor((sEnd - sx0) / P), sx1 = sx0 + nTeeth * P;
    const tri = s => { if (hatch || s < sx0 || s > sx1) return 0; const u = (((s - sx0) / P) % 1 + 1) % 1; return (D / 2) * (u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4); };
    const G = P / 2, nH = hatch ? Math.floor((sEnd - sx0) / G) : 0; // crosshatch grid step (diamond pitch = P)
    const nf = hatch ? Math.max(2, 2 * Math.round((o.h0 - o.chamfer) / G)) : 1;
    // stations: coarse where smooth, quarter pitch across transverse teeth, grid step across crosshatch, dense through the tip
    const ss = [];
    for (let s = 0; s < sx0 - 1e-6; s += 0.04) ss.push(s);
    if (hatch) for (let k = 0; k <= nH; k++) ss.push(sx0 + k * G);
    else for (let k = 0; k <= nTeeth * 4; k++) ss.push(sx0 + (k * P) / 4);
    const zEnd = hatch ? sx0 + nH * G : sx1;
    for (let s = zEnd + 0.04; s < LB - RT - 1e-6; s += 0.04) ss.push(s);
    if (RT > 0) for (let k = 0; k <= 12; k++) { const s = LB - RT + RT * Math.sin((k / 12) * (Math.PI / 2)); if (s > zEnd + 0.004) ss.push(s); }
    else ss.push(LB);
    ss.sort((a, b) => a - b);
    const ssU = ss.filter((s, i) => s <= LB + 1e-9 && (i === 0 || s - ss[i - 1] > 1e-5));
    const xg = []; // smoothing group of each station interval: one per tooth flank, 0 elsewhere
    for (let i = 0; i < ssU.length - 1; i++) { const sm = (ssU[i] + ssU[i + 1]) / 2; xg.push(sm > sx0 && sm < sx1 ? 1 + Math.floor((sm - sx0 + P / 4) / (P / 2)) : 0); }
    const hatchRow = i => { if (!hatch || i < 0 || i >= ssU.length) return -1; const r = Math.round((ssU[i] - sx0) / G); return r >= 0 && r <= nH && Math.abs(ssU[i] - (sx0 + r * G)) < 1e-6 ? r : -1; };
    const hatchU = (i, k) => { const r = hatchRow(i); if (r < 0) return 0; return ((r + k) % 2 ? 1 : -1) * (D / 2); };

    // geometry extents (for the views)
    const tipP = path(L), tipDir = [Math.cos(tipP.th), Math.sin(tipP.th)];
    let jx0 = 1e9, jx1 = -1e9, jy0 = 1e9, jy1 = -1e9;
    for (let s = 0; s <= L; s += 0.02) { const p = path(s); jx0 = Math.min(jx0, p.x); jx1 = Math.max(jx1, p.x); jy0 = Math.min(jy0, p.y); jy1 = Math.max(jy1, p.y); }
    const ringOuter = RING.cx - RING.rx - 0.05, xMax = jx1 + 0.1, cX = (ringOuter + xMax) / 2, size = xMax - ringOuter;
    const RX0 = RING.cx + 1.38, RX1 = RING.cx + 2.7; // ratchet span

    function prong(sg, z0, z1) { // a Kocher tip prong: (s, u) profile with a tooth crossing the parting line, extruded z0..z1
      const tt = o.tipTeeth, wb = jawW(LB) * 0.96, p = tt.height, a = LB - 0.03;
      const pts = [[a, -wb], [L - 0.04, -wb], [L, -wb + 0.04], [L, 0.03], [L - 0.035, p], [L - tt.base, 0], [a, 0]];
      const geo = new T.ExtrudeGeometry(new T.Shape(pts.map(q => new T.Vector2(q[0], q[1]))), { depth: z1 - z0 - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 2 });
      const pa = geo.attributes.position;
      // keep the prong inside the jaw's rounded-back outline (same section as jawGeometry at s = LB), so no corners stick out
      const w = jawW(LB), h = jawH(LB), ch = Math.min(o.chamfer, w * 0.3, h * 0.4), r = Math.max(0.002, Math.min(h * 0.88, w - D / 2 - ch - 0.004));
      const uMin = z => { const dz = Math.abs(z) - (h - r); return dz <= 0 ? -w : -w + r - Math.sqrt(Math.max(0, r * r - dz * dz)); };
      for (let i = 0; i < pa.count; i++) { const z = clamp(z0 + 0.015 + pa.getZ(i), -h, h), v = toLocal(path, sg, pa.getX(i), Math.max(pa.getY(i), uMin(z)), z); pa.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals();
      return geo;
    }

    function half(isB) {
      const sg = isB ? -1 : 1, zs = isB ? -1 : 1, g = new T.Group(), steel = U.steel();
      // finger ring
      g.add(U.mesh(U.extrude(U.ringShape(RING.cx, RING.cy, RING.rx, RING.ry, RING.wall), ringT, 0.05), steel, 'rings'));
      // shank: leaves the ring's inner-distal quadrant, runs beside its partner (narrow V-gap, widest at the ratchet) to the
      // box, and crosses to the other side inside the box. z-joggle only inside the box.
      const E = -(RING.cx + 2.5) - BOXX, xs0 = RING.cx + 0.45, yb0 = RING.cy - RING.ry + 0.19;
      const edge = x => 0.012 + 0.14 * Math.pow(clamp((-x - BOXX) / E, 0, 1), 1.3);
      const hwX = x => o.shankW * (0.18 + 0.08 * clamp((-x - BOXX) / (E + 0.8), 0, 1));
      const cl = [[xs0, yb0], [RING.cx + 0.85, yb0 - 0.01]];
      const xa = RING.cx + 2.0, nseg = Math.max(1, Math.ceil((-0.62 * bs - xa) / 1.5));
      cl.push([RING.cx + 1.3, edge(RING.cx + 1.3) + hwX(RING.cx + 1.3)]);
      for (let k = 0; k <= nseg; k++) { const x = xa + ((-0.62 * bs - xa) * k) / nseg; cl.push([x, edge(x) + hwX(x)]); }
      cl.push([-0.2 * bs, 0.12 * bs], [0.15 * bs, -0.06 * bs], [J0, -o.w0 / 2]);
      const xOf = s => xs0 + s * (J0 - xs0);
      const hw = s => { const x = xOf(s); return x < RING.cx + 1.3 ? hwX(RING.cx + 1.3) * (0.74 + 0.26 * clamp((x - xs0) / 0.85, 0, 1)) : x > -0.4 * bs ? Math.min(hwX(x), o.w0 / 2 + 0.03) : hwX(x); };
      const jog = x => zs * 0.075 * U.smooth(-0.48 * bs, -0.3 * bs, x) * (1 - U.smooth(0.3 * bs, 0.46 * bs, x));
      g.add(U.mesh(outward(U.bar(cl, hw, shankT, jog, 300, 0.07)), steel, 'shanks'));
      // ratchet boss beside the ring: front half on A / back half on B (thinner than the shank), teeth along the inner edge
      const pitch = 0.26, depth = 0.09, yb = 0.0, bt = Math.min(0.12, shankT / 2 - 0.025);
      const pts = [[RX0, 0.34], [RX1, 0.34], [RX1, yb]];
      for (let x = RX1; x > RX0 + pitch * 0.9; x -= pitch) { pts.push([x - pitch * 0.2, yb - depth]); pts.push([x - pitch, yb]); }
      pts.push([RX0, 0.1]);
      const boss = U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), bt, 0.02); boss.translate(0, 0, (zs * bt) / 2);
      g.add(U.mesh(boss, steel, 'ratchet'));
      // jaw (path and face pattern inverted on half B so that, mirrored, it bends the same way and its face meets A's)
      const jaw = jawGeometry({
        ss: ssU, xg, nf, w: jawW, h: jawH, chamfer: o.chamfer, dHalf: hatch ? D / 2 : D / 2,
        teeth: s => sg * tri(s), hatch: (i, k) => sg * hatchU(i, k), hatchRow, map: (s, u, z) => toLocal(path, sg, s, u, z)
      });
      g.add(U.mesh(jaw, steel, 'jaws'));
      if (tipTeeth) { // 1x2 interlocking teeth: two outer prongs on A, one central prong on B
        const hE = jawH(LB), c = hE * 0.34, gap = 0.012;
        if (!isB) { g.add(U.mesh(prong(sg, c + gap, hE), steel, 'tipteeth')); g.add(U.mesh(prong(sg, -hE, -c - gap), steel, 'tipteeth')); }
        else g.add(U.mesh(prong(sg, -c, c), steel, 'tipteeth'));
      }
      if (isB) { // box lock (on this half) with a flush domed rivet head on each face
        g.add(U.mesh(U.extrude(U.roundRect(-BOXX + 0.06, -BX.hy, 2 * BOXX - 0.12, 2 * BX.hy, 0.1), BX.t, 0.06), steel, 'box'));
        for (const s of [1, -1]) { const d = new T.Mesh(new T.SphereGeometry(0.13 * bs, 20, 10), steel.clone()); d.scale.z = 0.32; d.position.z = (s * BX.t) / 2; d.userData.part = 'box'; d.userData.base = d.material.color.getHex(); g.add(d); }
      }
      return g;
    }

    function build() {
      const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
      A.add(half(false)); Bm.add(half(true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
      const open = k => { const th = k * (o.openAngle || 0.16); A.rotation.z = -th; Bp.rotation.z = th; };
      open(0);
      return { group: grp, setOpen: open, center: new T.Vector3(cX, 0, 0), size };
    }

    // jaw close-ups use ONE fixed camera distance for every factory-built clamp (the Kelly's), so close-ups convey real size
    const jcx = (jx0 + jx1) / 2 - 0.1, jcy = (jy0 + jy1) / 2, jd = 7.2;
    const jt = o.jawsTilt || 0; // tilts the jaw close-up off face-on (Kocher: shows the 1x2 tip prongs in depth)
    const rcx = (RX0 + RX1) / 2, f = (a, b) => +(a + b).toFixed(3);
    const parts = [['rings', 'Finger rings'], ['ratchet', 'Ratchet'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['jaws', o.jawLabel || 'Jaws (serrated)']];
    const partViews = { rings: 'front', ratchet: 'ratchet', shanks: 'oblique', box: 'box', jaws: 'jaws' };
    if (tipTeeth) { parts.push(['tipteeth', 'Tip teeth (1×2)']); partViews.tipteeth = 'jawsOblique'; }
    return {
      id: o.id, recordId: o.recordId, build, hasArticulation: true, parts, partViews,
      views: {
        front: { pos: [cX, 0, 30], tgt: [cX, 0, 0] },
        back: { pos: [cX, 0, -30], tgt: [cX, 0, 0] },
        side: { pos: [cX, 28, 0.01], tgt: [cX, 0, 0] },
        oblique: { pos: [cX + 8.3, 9, 21], tgt: [cX, 0, 0] },
        jaws: { pos: [f(jcx, jt * 0.25 * jd), f(jcy, jt * jd), +(jd * Math.sqrt(1 - jt * jt)).toFixed(3)], tgt: [jcx, jcy, 0] },
        jawsOblique: { pos: [jcx + 0.48 * jd, jcy + 0.55 * jd, 0.52 * jd], tgt: [jcx + 0.3, jcy, 0] },
        tip: { pos: [f(tipP.x, tipDir[0] * 5.5 - tipDir[1] * 0.6), f(tipP.y, tipDir[1] * 5.5 + tipDir[0] * 0.6), 1.4], tgt: [f(tipP.x, -tipDir[0] * 0.6), f(tipP.y, -tipDir[1] * 0.6), 0] },
        ratchet: { pos: [rcx, 1.5, 4.6], tgt: [rcx, 0.1, 0] },
        box: { pos: [0.5 * bs, 1.9 * bs, 4.8 * bs], tgt: [0.1 * bs, 0, 0] }
      },
      status: { state: 'complete-v1', reviewed: !!o.reviewed, note: o.note },
      dims: o.dims
    };
  };
})(window);
