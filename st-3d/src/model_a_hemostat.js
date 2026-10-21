/* Shared factory for ring-handled, ratcheted, box-lock hemostats (Kelly, Crile). PROCEDURAL EDUCATIONAL MODELS, not scans.
   Named model_a_* so it loads before model_crile.js / model_kelly.js (files load alphabetically). Registers no model itself,
   only ST3D.hemostat(opts) -> model definition.
   Anatomy: two halves (finger ring + shank + ratchet boss + jaw); half B is built and mirrored (scale.y = -1) inside a pivot
   group and carries the box lock + rivet heads. The shanks run side by side proximal to the box and cross inside it
   (a small z-joggle hidden by the box). Each jaw is a custom sweep with a flat grasping face, chamfered face edges and a
   rounded back. Transverse serrations are a symmetric triangle-wave profile on the face (pitch/depth in opts), so they show
   face-on as a toothed seam and, with the jaws open, as ridges across the face. The two jaws' teeth interlock exactly when
   closed. Curved pattern: both jaws bend toward +Y within the ring plane; half B's curve is built inverted so that after
   mirroring it bends the same way as half A's. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- jaw sweep ----------
  // Section (local, jaw lies below its face): face at y = F (with teeth), chamfers, flat top/bottom, rounded back at y = Fb - w.
  // Normals use smoothing groups: the rounded body is smooth; face and chamfers are smooth along x only between teeth creases.
  function jawGeometry(o) {
    const xs = o.xs, nx = xs.length, NA = 6;
    const P = [];
    for (let i = 0; i < nx; i++) {
      const x = xs[i], Fb = o.faceBase(x), F = Fb + o.teeth(x), w = o.w(x), h = o.h(x), Bk = Fb - w;
      const ch = Math.min(o.chamfer, w * 0.3, h * 0.4);
      const r = Math.max(0.002, Math.min(h * 0.88, w - o.dHalf - ch - 0.004));
      const s = [[F, h - ch], [F - ch, h], [Bk + r, h]];
      for (let k = 1; k <= NA; k++) { const a = Math.PI / 2 + (k / NA) * (Math.PI / 2); s.push([Bk + r + r * Math.cos(a), h - r + r * Math.sin(a)]); }
      for (let k = 0; k <= NA; k++) { const a = Math.PI + (k / NA) * (Math.PI / 2); s.push([Bk + r + r * Math.cos(a), -h + r + r * Math.sin(a)]); }
      s.push([F - ch, -h], [F, -h + ch]);
      P.push(s.map(([y, z]) => new T.Vector3(x, y, z)));
    }
    const m = P[0].length;
    const SG = Array.from({ length: m }, (_, j) => (j === 0 ? 1 : j === m - 2 ? 3 : j === m - 1 ? 0 : 2));
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
      for (const ii of [vi - 1, vi]) { if (ii < 0 || ii > nx - 2) continue; for (const jj of [(vj - 1 + m) % m, vj % m]) if (gid(ii, jj) === g) n.add(qn[ii][jj]); }
      return n.normalize();
    };
    const pos = [], nor = [];
    const put = (p, n) => { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); };
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < m; j++) {
      const j1 = (j + 1) % m, g = gid(i, j);
      const c00 = [P[i][j], cornerN(i, j, g)], c01 = [P[i][j1], cornerN(i, j1, g)], c10 = [P[i + 1][j], cornerN(i + 1, j, g)], c11 = [P[i + 1][j1], cornerN(i + 1, j1, g)];
      for (const c of [c00, c01, c10, c01, c11, c10]) put(c[0], c[1]);
    }
    // end caps (fans)
    for (const [i, sgn] of [[0, -1], [nx - 1, 1]]) {
      const ctr = new T.Vector3(); P[i].forEach(p => ctr.add(p)); ctr.multiplyScalar(1 / m);
      const n = new T.Vector3(sgn, 0, 0);
      for (let j = 0; j < m; j++) { const a = P[i][j], b = P[i][(j + 1) % m]; if (sgn > 0) { put(ctr, n); put(a, n); put(b, n); } else { put(ctr, n); put(b, n); put(a, n); } }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    return g;
  }

  ST3D.hemostat = function (o) {
    const J0 = 0.45, BOXX = 0.5, XT = o.tipX, RT = 0.14; // jaw base (inside box), box half-length, tip x, tip rounding length
    const RING = { cx: -9.0, cy: 1.36, rx: 1.22, ry: 1.12, wall: 0.31 };
    const P = o.pitch, D = o.depth;
    // serration zone: whole teeth from sx0, ending before the tip rounding
    const sx0 = o.serrFrom, nTeeth = Math.floor((XT - RT - 0.04 - sx0) / P), sx1 = sx0 + nTeeth * P;
    const tri = x => { if (x < sx0 || x > sx1) return 0; const u = (((x - sx0) / P) % 1 + 1) % 1; return (D / 2) * (u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4); };
    const curve = x => o.curveK * Math.pow(Math.max(0, x - BOXX), 2);
    const uJ = x => clamp((x - BOXX) / (XT - BOXX), 0, 1);
    const tipF = x => (x <= XT - RT ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((x - (XT - RT)) / RT, 2))));
    const jawW = x => Math.max(0.016, (o.w0 + (o.w1 - o.w0) * uJ(x)) * tipF(x));
    const jawH = x => (o.h0 + (o.h1 - o.h0) * uJ(x)) * (0.42 + 0.58 * tipF(x));
    // stations along the jaw: coarse where smooth, every quarter pitch across the teeth, dense through the rounded tip
    const xs = [];
    for (let x = J0; x < sx0 - 1e-6; x += 0.04) xs.push(x);
    for (let k = 0; k <= nTeeth * 4; k++) xs.push(sx0 + (k * P) / 4);
    for (let x = sx1 + 0.04; x < XT - RT - 1e-6; x += 0.04) xs.push(x);
    for (let k = 0; k <= 12; k++) xs.push(XT - RT + RT * Math.sin((k / 12) * (Math.PI / 2)));
    const xsU = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1e-5);
    const xg = []; // smoothing group of each station interval: one per tooth flank, 0 elsewhere
    for (let i = 0; i < xsU.length - 1; i++) { const xm = (xsU[i] + xsU[i + 1]) / 2; xg.push(xm > sx0 && xm < sx1 ? 1 + Math.floor((xm - sx0 + P / 4) / (P / 2)) : 0); }

    function half(isB) {
      const sg = isB ? -1 : 1, zs = isB ? -1 : 1, g = new T.Group(), steel = U.steel();
      // finger ring
      g.add(U.mesh(U.extrude(U.ringShape(RING.cx, RING.cy, RING.rx, RING.ry, RING.wall), 0.32, 0.05), steel, 'rings'));
      // shank: leaves the ring's inner-distal quadrant, runs beside its partner (inner edge just off the axis) to the box,
      // and crosses to the other side inside the box. z-joggle only inside the box.
      const edge = x => 0.012 + 0.035 * clamp((-x - BOXX) / 6.8, 0, 1);
      const hwX = x => o.shankW * (0.18 + 0.08 * clamp((-x - BOXX) / 6.8, 0, 1));
      const cl = [[-8.62, 0.46], [-8.2, 0.36]];
      for (const x of [-7.7, -7.0, -6.0, -4.5, -3.0, -1.6, -0.62]) cl.push([x, edge(x) + hwX(x)]);
      cl.push([-0.2, 0.12], [0.15, -0.06], [J0, -o.w0 / 2]);
      const xOf = s => -8.62 + s * (J0 + 8.62);
      const hw = s => { const x = xOf(s); return x < -7.7 ? hwX(-7.7) * (0.82 + 0.18 * clamp((x + 8.62) / 0.92, 0, 1)) : x > -0.4 ? Math.min(hwX(x), o.w0 / 2 + 0.03) : hwX(x); };
      const jog = x => zs * 0.075 * U.smooth(-0.48, -0.3, x) * (1 - U.smooth(0.3, 0.46, x));
      g.add(U.mesh(U.bar(cl, hw, o.shankT, jog, 240, 0.07), steel, 'shanks'));
      // ratchet boss beside the ring: half thickness (front half on A, back half on B), teeth along the inner edge
      const x0 = -7.62, x1 = -6.3, pitch = 0.26, depth = 0.1, yb = -0.03;
      const pts = [[x0, 0.3], [x1, 0.3], [x1, yb]];
      for (let x = x1; x > x0 + pitch * 0.9; x -= pitch) { pts.push([x - pitch * 0.2, yb - depth]); pts.push([x - pitch, yb]); }
      pts.push([x0, 0.08]);
      const boss = U.extrude(new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))), 0.12, 0.02); boss.translate(0, 0, zs * 0.06);
      g.add(U.mesh(boss, steel, 'ratchet'));
      // jaw (curve and teeth inverted on half B so that, mirrored, it bends the same way and its teeth interlock with A's)
      const jaw = jawGeometry({ xs: xsU, xg, faceBase: x => sg * curve(x), teeth: x => sg * tri(x), w: jawW, h: jawH, chamfer: o.chamfer, dHalf: D / 2 });
      g.add(U.mesh(jaw, steel, 'jaws'));
      if (isB) { // box lock (on this half) with a flush domed rivet head on each face
        g.add(U.mesh(U.extrude(U.roundRect(-BOXX + 0.06, -0.37, 2 * BOXX - 0.12, 0.74, 0.1), 0.58, 0.06), steel, 'box'));
        for (const s of [1, -1]) { const d = new T.Mesh(new T.SphereGeometry(0.13, 20, 10), steel.clone()); d.scale.z = 0.32; d.position.z = s * 0.29; d.userData.part = 'box'; d.userData.base = d.material.color.getHex(); g.add(d); }
      }
      return g;
    }

    function build() {
      const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
      A.add(half(false)); Bm.add(half(true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
      const open = k => { const th = k * 0.16; A.rotation.z = -th; Bp.rotation.z = th; };
      open(0);
      return { group: grp, setOpen: open, center: new T.Vector3(-3.25, 0, 0), size: 14.2 };
    }

    const jc = (XT + BOXX) / 2, jy = curve(jc);
    return {
      id: o.id, recordId: o.recordId, build, hasArticulation: true,
      parts: [['rings', 'Finger rings'], ['ratchet', 'Ratchet'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['jaws', 'Jaws (serrated)']],
      partViews: { rings: 'front', ratchet: 'ratchet', shanks: 'oblique', box: 'box', jaws: 'jaws' },
      views: {
        front: { pos: [-3.25, 0, 30], tgt: [-3.25, 0, 0] },
        back: { pos: [-3.25, 0, -30], tgt: [-3.25, 0, 0] },
        side: { pos: [-3.25, 28, 0.01], tgt: [-3.25, 0, 0] },
        oblique: { pos: [5, 9, 21], tgt: [-3.25, 0, 0] },
        jaws: { pos: [jc - 0.15, jy, 6.6], tgt: [jc - 0.15, jy, 0] },
        jawsOblique: { pos: [jc + 3.2, jy + 3.6, 3.4], tgt: [jc + 0.2, jy, 0] },
        tip: { pos: [XT + 5.5, curve(XT) + 0.6, 1.4], tgt: [XT - 0.6, curve(XT), 0] },
        ratchet: { pos: [-6.95, 1.5, 4.6], tgt: [-6.95, 0.1, 0] },
        box: { pos: [0.5, 1.9, 4.8], tgt: [0.1, 0, 0] }
      },
      status: { state: 'complete-v1', note: o.note },
      dims: o.dims
    };
  };
})(window);
