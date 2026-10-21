/* Suction tips: Yankauer, Poole, Frazier. PROCEDURAL EDUCATIONAL MODELS of the reusable metal versions.
   Ports and perforations are shown as dark recesses on the surface, not cut-through holes. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const barb = (x0, steel, part) => { // ribbed hose connector at the proximal end, axis along X
    const g = new T.Group();
    for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.CylinderGeometry(0.30, 0.42, 0.55, 28), steel.clone()); c.rotation.z = Math.PI / 2; c.position.x = x0 + 0.3 + i * 0.55; c.userData.part = part; g.add(c); }
    return g;
  };

  // ---- Yankauer: rigid tube bent ~30 deg, tapering then flaring into a bulbous tip with a central opening and side holes; removable-tip seam ----
  function yankauer() {
    const g = new T.Group(), steel = U.steel();
    g.add(barb(-13.4, steel, 'handle'));
    const path = [[-12.0, 0, 0], [-4, 0, 0], [1.0, 0, 0], [3.0, -0.5, 0], [5.5, -1.7, 0], [9.0, -3.6, 0]];
    const r = s => (s < 0.5 ? 0.42 : s < 0.955 ? 0.42 - 0.20 * U.smooth(0.5, 0.93, s) : 0.22 + 0.16 * U.smooth(0.955, 1, s));
    const geo = U.sweep(path, r, 240), curve = geo.userData.curve, L = curve.getLength();
    g.add(U.mesh(geo, steel, 'shaft'));
    const tipC = curve.getPointAt(1), tipDir = curve.getTangentAt(1);
    const bulb = U.mesh(new T.SphereGeometry(0.38, 32, 20), steel, 'tip'); bulb.position.copy(tipC); g.add(bulb);
    g.add(U.port(0.15, tipC.clone().addScaledVector(tipDir, 0.38).toArray(), tipDir.toArray()));
    const side = new T.Vector3(0, 0, 1);
    for (const a of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) { const n = side.clone().applyAxisAngle(tipDir, a), p = tipC.clone().addScaledVector(n, 0.38).addScaledVector(tipDir, 0.04); g.add(U.port(0.085, p.toArray(), n.toArray())); }
    // seam where the removable tip screws on, about 4 cm before the tip
    const sp = curve.getPointAt(1 - 4 / L), st = curve.getTangentAt(1 - 4 / L), seam = new T.Mesh(new T.CylinderGeometry(0.27, 0.27, 0.15, 32), steel.clone());
    seam.position.copy(sp); seam.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), st); seam.userData.part = 'tip'; g.add(seam);
    return { group: g, center: new T.Vector3(-2.0, -1.4, 0), size: 24.5 };
  }
  // ---- Poole: straight tube inside a removable outer sleeve covered in small perforations ----
  function poole() {
    const g = new T.Group(), steel = U.steel();
    g.add(barb(-12.6, steel, 'handle'));
    g.add(U.mesh(U.sweep([[-11.2, 0, 0], [0, 0, 0], [3.5, 0, 0]], () => 0.40, 80), steel, 'shaft'));
    const sl = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 8.6, 40, 1, false), steel.clone()); sl.rotation.z = Math.PI / 2; sl.position.x = 7.6; sl.userData.part = 'sleeve'; g.add(sl);
    const cap = new T.Mesh(new T.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), steel.clone()); cap.rotation.z = -Math.PI / 2; cap.position.x = 11.9; cap.userData.part = 'sleeve'; g.add(cap);
    const collar = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.45, 40), steel.clone()); collar.rotation.z = Math.PI / 2; collar.position.x = 3.25; collar.userData.part = 'sleeve'; g.add(collar);
    for (let i = 0; i < 12; i++) for (let k = 0; k < 8; k++) { const x = 4.2 + i * 0.62, a = (k / 8) * Math.PI * 2 + (i % 2) * (Math.PI / 8), n = [0, Math.cos(a), Math.sin(a)]; g.add(U.port(0.075, [x, 0.555 * n[1], 0.555 * n[2]], n)); }
    g.add(U.port(0.13, [12.45, 0, 0], [1, 0, 0]));
    return { group: g, center: new T.Vector3(-0.2, 0, 0), size: 25.5 };
  }
  // ---- Frazier: small-bore angled tube with a finger-control hub (vent hole) and a wire stylet ----
  function frazier() {
    const g = new T.Group(), steel = U.steel();
    g.add(barb(-6.4, steel, 'handle'));
    const hub = U.mesh(U.sweep([[-5.0, 0, 0], [-2.0, 0, 0], [0, 0, 0]], s => 0.38 - 0.16 * U.smooth(0.6, 1, s), 60), steel, 'handle'); g.add(hub);
    g.add(U.mesh(U.plateXZ(U.roundRect(-3.5, -0.3, 1.8, 0.6, 0.18), 0.1, 0.36, 0.03), steel, 'handle'));
    const vent = U.port(0.125, [-2.6, 0.415, 0], [0, 1, 0]); vent.scale.x = 2.1; g.add(vent);
    const path = [[-0.2, 0, 0], [1.6, 0, 0], [2.6, -0.25, 0], [4.0, -1.0, 0], [8.8, -3.4, 0]];
    g.add(U.mesh(U.sweep(path, () => 0.12, 160), steel, 'cannula'));
    g.add(U.port(0.07, [8.83, -3.415, 0], [2, -1, 0]));
    // stylet: thin wire through the cannula with a ring grip at the proximal end
    const st = U.mesh(U.tube([[-7.26, 0, 0], [-6.6, 0, 0], [-5.9, 0, 0]], 0.04, false, 12), steel, 'stylet'); g.add(st);
    const loop = new T.Mesh(new T.TorusGeometry(0.42, 0.06, 12, 36), steel.clone()); loop.position.set(-7.68, 0, 0); loop.userData.part = 'stylet'; g.add(loop);
    return { group: g, center: new T.Vector3(0.4, -1.0, 0), size: 17.5 };
  }

  const views = (c, len, tip, tipDir) => ({
    front: { pos: [c[0], c[1], 32], tgt: c }, back: { pos: [c[0], c[1], -32], tgt: c }, side: { pos: [c[0], 30, 0.01], tgt: c },
    oblique: { pos: [c[0] + 10, c[1] + 10, 24], tgt: c }, tip: { pos: [tip[0] + tipDir[0] * 4 + 0.5, tip[1] + tipDir[1] * 4 + 1.6, 2.5], tgt: tip }, jawsOblique: { pos: [tip[0] - 2.5, tip[1] + 2.4, 4.2], tgt: tip }
  });
  const reg = (id, fn, parts, v, note, dims) => { ST3D.models[id] = { id, recordId: id, build: fn, hasArticulation: false, parts, partViews: {}, views: v, status: { state: 'complete-v2', reviewed: true, note }, dims }; };
  reg('yankauer', yankauer, [['handle', 'Hose connector'], ['shaft', 'Angled shaft'], ['tip', 'Bulb tip'], ['ports', 'Openings']], views([-2.0, -1.4, 0], 24.5, [9.0, -3.6, 0], [0.88, -0.47]),
    'Procedural model of a reusable metal Yankauer: rigid tube bent about 30 degrees, tapering then flaring into a bulb tip with an end opening and side holes, and a seam where the tip unscrews. Openings are shown as dark recesses. Exact length and angle vary ("variety of sizes and angles" on your list).', 'About 25 cm overall; bulb about 1 cm long. Approximate.');
  reg('poole', poole, [['handle', 'Hose connector'], ['shaft', 'Inner tube'], ['sleeve', 'Perforated sleeve'], ['ports', 'Perforations']], views([-0.2, 0, 0], 25.5, [11.5, 0, 0], [1, 0]),
    'Procedural model of a metal Poole suction: straight inner tube with a removable outer sleeve covered in small holes that keep tissue from blocking the tip. Perforations are shown as dark recesses.', 'About 25 cm overall; sleeve about 9 cm. Approximate.');
  reg('frazier', frazier, [['handle', 'Hub and connector'], ['ports', 'Finger vent'], ['cannula', 'Angled cannula'], ['stylet', 'Stylet']], views([0.4, -1.0, 0], 17.5, [8.8, -3.4, 0], [0.9, -0.45]),
    'Procedural model of a Frazier suction: small-bore angled cannula, a hub with a finger-control vent hole, and a wire stylet with a ring grip for clearing clogs (stylet shown parked at the hub end). Openings are dark recesses.', 'Cannula about 9 cm working length; small bore. Approximate.');
})(window);
