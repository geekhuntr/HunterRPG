/* 3D toolkit for the instrument models. Units: 1 unit = 1 cm. Instruments lie in the XY plane,
   working end toward +X, thickness along Z. Everything is generated procedurally with THREE.js. */
(function (root) {
  const T = root.THREE;
  const ST3D = (root.ST3D = root.ST3D || { models: {}, status: {} });
  const U = (ST3D.kit = {});
  const V2 = (x, y) => new T.Vector2(x, y);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  U.smooth = smooth;

  // ---- materials: brushed-steel look needs an environment to reflect ----
  U.steel = (o = {}) => new T.MeshStandardMaterial({ color: o.color || 0xd4dade, metalness: 0.96, roughness: o.roughness == null ? 0.27 : o.roughness, envMapIntensity: o.env || 1.0 });
  U.makeEnv = function (renderer) {
    const s = new T.Scene();
    const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#c4cfd8'); gr.addColorStop(0.45, '#6b7883'); gr.addColorStop(1, '#2f3841'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    s.add(new T.Mesh(new T.SphereGeometry(60, 32, 16), new T.MeshBasicMaterial({ map: tex, side: T.BackSide })));
    const panel = (w, h, x, y, z, ry, rx, k) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k, k), side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); m.lookAt(0, 0, 0); s.add(m); };
    panel(40, 14, 0, 38, 10, 0, 0, 5); panel(14, 36, -38, 6, 14, 0, 0, 3.2); panel(14, 36, 38, 2, 8, 0, 0, 2.4); panel(22, 12, 0, 6, 44, 0, 0, 0.7); panel(34, 6, 0, 8, -42, 0, 0, 3);
    const pm = new T.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.03); pm.dispose(); return rt.texture;
  };

  // ---- shapes ----
  U.ellipsePts = (cx, cy, rx, ry, n = 64) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return V2(cx + rx * Math.cos(a), cy + ry * Math.sin(a)); });
  U.ringShape = (cx, cy, rx, ry, wall) => { const s = new T.Shape(U.ellipsePts(cx, cy, rx, ry, 72)); s.holes.push(new T.Path(U.ellipsePts(cx, cy, rx - wall, ry - wall * 0.95, 64).reverse())); return s; };
  // Flat bar following a centerline. left/right = offset functions (cm) of normalized length s; teeth etc. can be added in the offsets.
  U.ribbon = (pts, left, right, n = 220) => {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], 0)), false, 'centripetal');
    const P = curve.getSpacedPoints(n), L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, s = i / n;
      const dl = left(s, P[i].x), dr = right(s, P[i].x);
      L.push(V2(P[i].x + nx * dl, P[i].y + ny * dl)); R.push(V2(P[i].x - nx * dr, P[i].y - ny * dr));
    }
    return new T.Shape([...L, ...R.reverse()]);
  };
  U.extrude = (shape, thick, bevel = 0.04) => {
    const g = new T.ExtrudeGeometry(shape, { depth: Math.max(0.01, thick - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 28 });
    g.translate(0, 0, -(thick - 2 * bevel) / 2); return g;
  };
  // Bend the part in Z as a function of x (used for the joggle where one shank passes the other).
  U.joggle = (geo, fn) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + fn(p.getX(i), p.getY(i))); p.needsUpdate = true; geo.computeVertexNormals(); return geo; };
  // Swept flat bar with a rounded-rectangle section along a 2D centerline; zFn(x) lifts it in Z (joggle). Smooth normals, closed ends.
  U.bar = (pts, hwFn, th, zFn, n = 140, r = 0.06) => {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], 0)), false, 'centripetal'), P = curve.getSpacedPoints(n);
    const arc = 4, prof = [], thF = typeof th === 'function' ? th : () => th;
    const corners = [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]];
    for (const [sx, sy, k] of corners) for (let j = 0; j <= arc; j++) { const a = (k * Math.PI) / 2 + (j / arc) * (Math.PI / 2); prof.push([sx, sy, Math.cos(a), Math.sin(a)]); }
    const pos = [], idx = [], m = prof.length;
    for (let i = 0; i <= n; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(n, i + 1)], tx = c.x - a.x, ty = c.y - a.y, l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, hw = hwFn(i / n), z0 = zFn(P[i].x), b = thF(i / n) / 2;
      for (const [sx, sy, ca, sa] of prof) { const u = sx * (hw - r) + r * ca, v = sy * (b - r) + r * sa; pos.push(P[i].x + nx * u, P[i].y + ny * u, z0 + v); }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = i * m + j, b2 = i * m + ((j + 1) % m), c = (i + 1) * m + j, d = (i + 1) * m + ((j + 1) % m); idx.push(a, b2, c, b2, d, c); }
    for (const end of [0, n]) { const ci = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let j = 0; j < m; j++) { cx += pos[(end * m + j) * 3]; cy += pos[(end * m + j) * 3 + 1]; cz += pos[(end * m + j) * 3 + 2]; } pos.push(cx / m, cy / m, cz / m); for (let j = 0; j < m; j++) { const a = end * m + j, b2 = end * m + ((j + 1) % m); end ? idx.push(ci, a, b2) : idx.push(ci, b2, a); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  // Round wire/rail along a 3D path (Babcock jaw loops, Allis tips, etc.)
  U.tube = (pts3, r, closed = false, n = 160) => new T.TubeGeometry(new T.CatmullRomCurve3(pts3.map(p => new T.Vector3(...p)), closed, 'centripetal', 0.5), n, r, 12, closed);
  // Flat plate whose outline is drawn in the X-Z plane (width across the instrument's thickness), thickness along Y, centered at y = yc.
  U.plateXZ = (shape, thick, yc, bevel = 0.03) => { const g = U.extrude(shape, thick, bevel); g.rotateX(Math.PI / 2); g.translate(0, yc, 0); return g; };
  // Round tube along a 3D path with a radius that varies along its length (suction tips, cannulas, handles); closed ends.
  U.sweep = (pts3, rFn, n = 160, radial = 24) => {
    const curve = new T.CatmullRomCurve3(pts3.map(p => new T.Vector3(...p)), false, 'centripetal', 0.5), fr = curve.computeFrenetFrames(n, false);
    const pos = [], idx = [];
    for (let i = 0; i <= n; i++) { const P = curve.getPointAt(i / n), r = rFn(i / n), N = fr.normals[i], B = fr.binormals[i];
      for (let j = 0; j < radial; j++) { const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s2 = Math.sin(a); pos.push(P.x + r * (c * N.x + s2 * B.x), P.y + r * (c * N.y + s2 * B.y), P.z + r * (c * N.z + s2 * B.z)); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) { const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = (i + 1) * radial + j, d = (i + 1) * radial + ((j + 1) % radial); idx.push(a, b, c, b, d, c); }
    for (const end of [0, n]) { const P = curve.getPointAt(end / n), ci = pos.length / 3; pos.push(P.x, P.y, P.z); for (let j = 0; j < radial; j++) { const a = end * radial + j, b = end * radial + ((j + 1) % radial); end ? idx.push(ci, a, b) : idx.push(ci, b, a); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.userData.curve = curve; return g;
  };
  // A dark recess on a surface (suction ports). Shown as a shallow dark disc, not a true cut-through hole.
  U.port = (r, at, normal) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, 0.02, 24), new T.MeshStandardMaterial({ color: 0x07090b, roughness: 0.9, metalness: 0 })); const nn = new T.Vector3(...normal).normalize(); m.position.set(...at).addScaledVector(nn, -0.009); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), nn); m.userData.part = 'ports'; m.userData.port = true; return m; };
  // Box lock, the joint of a ring-handled instrument, built in half B's local frame around the pivot at the origin.
  // The female shank widens into a flat box with slanted ends: two thin face plates (leaves) top and bottom, joined by side
  // walls, with a channel between them that the other shank passes through (both shanks exit the channel at the box ends),
  // and a small flush pin through the middle. o: L length, W width, T thickness, slant (x offset of the top edge vs bottom),
  // shankT thickness of the shanks, sw half-width of the shanks at the box, m |slope| of the shanks through the pivot.
  // piecewise-linear y(x) along a centerline given as [[x, y], ...] with increasing x
  U.lerpY = cl => x => { if (x <= cl[0][0]) return cl[0][1]; for (let i = 1; i < cl.length; i++) if (x <= cl[i][0]) { const [x0, y0] = cl[i - 1], [x1, y1] = cl[i]; return y0 + ((y1 - y0) * (x - x0)) / ((x1 - x0) || 1e-9); } return cl[cl.length - 1][1]; };
  U.boxLock = (o) => {
    const L = o.L, W = o.W, TH = o.T, k = o.slant == null ? 0.22 : o.slant, tc = o.shankT + 0.03, tl = (TH - tc) / 2, m = o.m, sw = o.sw;
    const outline = [[-L / 2 - k, -W / 2], [L / 2 - k, -W / 2], [L / 2 + k, W / 2], [-L / 2 + k, W / 2]];
    const steel = U.steel(), g = new T.Group();
    const shapeOf = pts => new T.Shape(pts.map(p => new T.Vector2(p[0], p[1])));
    for (const s of [1, -1]) { const leaf = U.extrude(shapeOf(outline), tl, 0.02); leaf.translate(0, 0, s * (TH / 2 - tl / 2)); g.add(U.mesh(leaf, steel, 'box')); }
    // side walls: the parts of the box outside both shank strips (y = +-m x +- sw), as four convex pieces
    const clip = (poly, a, b, c) => { const out = []; for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length], fp = a * P[0] + b * P[1] + c, fq = a * Q[0] + b * Q[1] + c; if (fp >= 0) out.push(P); if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); } } return out; };
    const area = poly => Math.abs(poly.reduce((a, P, i) => { const Q = poly[(i + 1) % poly.length]; return a + P[0] * Q[1] - Q[0] * P[1]; }, 0)) / 2;
    // strip A = the other shank (mirror of this half's centerline), strip B = this shank; each is the band of half-width sw
    // around the chord through the shank's positions at the two box ends (o.yAt(x) = this half's centerline y), else slope m
    const xL = -L / 2 - k, xR = L / 2 + k, yB = o.yAt ? [o.yAt(xL), o.yAt(xR)] : [-m * xL, -m * xR];
    const line = (px, py, qx, qy) => { let a = -(qy - py), b = qx - px; const n = Math.hypot(a, b) || 1; a /= n; b /= n; return [a, b, -(a * px + b * py)]; };
    const lA = line(xL, -yB[0], xR, -yB[1]), lB = line(xL, yB[0], xR, yB[1]);
    const H = { aboveA: [lA[0], lA[1], lA[2] - sw], belowA: [-lA[0], -lA[1], -lA[2] - sw], aboveB: [lB[0], lB[1], lB[2] - sw], belowB: [-lB[0], -lB[1], -lB[2] - sw] };
    for (const [h1, h2] of [['aboveA', 'aboveB'], ['belowA', 'belowB'], ['aboveA', 'belowB'], ['belowA', 'aboveB']]) {
      let poly = clip(clip(outline, ...H[h1]), ...H[h2]);
      if (poly.length >= 3 && area(poly) > 1e-4) g.add(U.mesh(U.extrude(shapeOf(poly), tc + 0.002, 0.004), steel, 'box'));
    }
    // pin: a plain cylinder through the box, just proud of each face so its circular edge reads
    const pin = new T.Mesh(new T.CylinderGeometry(o.pinR || 0.1, o.pinR || 0.1, TH + 0.02, 32), steel.clone()); pin.rotation.x = Math.PI / 2; pin.userData.part = 'box'; pin.userData.base = steel.color.getHex(); g.add(pin);
    g.userData.part = 'box'; return g;
  };
  U.mesh = (geo, mat, part) => { const m = new T.Mesh(geo, mat.clone()); m.userData.part = part; m.userData.base = m.material.color.getHex(); return m; };
  U.roundRect = (x, y, w, h, r) => { const s = new T.Shape(); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  // closed smooth outline from control points
  U.spline = (pts, n = 90) => new T.Shape(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], 0)), true, 'centripetal').getSpacedPoints(n).slice(0, -1).map(p => V2(p.x, p.y)));
  U.sawtooth = (x, x0, x1, pitch, amp) => { if (x < x0 || x > x1) return 0; const u = ((x - x0) / pitch) % 1; return amp * u; };
})(window);
