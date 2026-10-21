/* Weitlaner self-retaining retractor and Rake retractor. PROCEDURAL EDUCATIONAL MODELS.
   Weitlaner: two crossing arms on a pivot screw, finger rings, a curved toothed ratchet bar (centered on the pivot, so it slides
   through a catch on the other arm as the arms open), and outward-curving prongs (3 on one arm, 4 on the other) that point down into the wound (-Z).
   Rake: hand-held, flat handle ending in a fork of 4 curved prongs bending toward -Y (same orientation as the other hand-held retractors). */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;

  function weitlanerHalf(sign, nProngs, isB) {
    const g = new T.Group(), steel = U.steel();
    // finger ring and arm crossing the pivot (arm lies in its own Z layer, like scissors)
    const zc = isB ? -0.12 : 0.12;
    const ring = U.extrude(U.ringShape(-6.6, 1.25, 1.05, 0.95, 0.28), 0.24, 0.04); ring.translate(0, 0, zc); g.add(U.mesh(ring, steel, 'rings'));
    const arm = U.bar([[-5.6, 0.95], [-3.0, 0.55], [0, 0], [3.0, -0.55], [5.6, -1.0], [6.4, -1.25], [7.0, -1.33]], s => 0.24 - 0.04 * s, 0.24, () => zc, 160, 0.06);
    g.add(U.mesh(arm, steel, 'arms'));
    const hub = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.24, 32), steel.clone()); hub.rotation.x = Math.PI / 2; hub.position.z = zc; hub.userData.part = 'arms'; g.add(hub);
    // prong cross-bar at the distal end (stands below the arm plane) and prongs hooking outward (away from the axis) and down
    const bx = 6.45, by = -1.3, bar = U.sweep([[bx - 0.55, by + 0.05, zc - 0.1], [bx, by, zc - 0.18], [bx + 0.55, by - 0.05, zc - 0.1]], () => 0.12, 30, 14);
    g.add(U.mesh(bar, steel, 'prongs'));
    for (let i = 0; i < nProngs; i++) {
      const x = bx - 0.5 + (i * 1.0) / (nProngs - 1);
      g.add(U.mesh(U.sweep([[x, by, zc - 0.15], [x, by - 0.05, -0.55], [x, by - 0.25, -0.95], [x, by - 0.55, -1.1]], s => 0.075 - 0.055 * U.smooth(0.6, 1, s), 40, 12), steel, 'prongs'));
    }
    if (isB) { // curved ratchet bar on this arm, centered on the pivot (radius 4.2), teeth on its outer edge
      const R = 4.2, pts = []; for (let a = 2.95; a <= 4.02; a += 0.03) pts.push([R * Math.cos(a), R * Math.sin(a)]);
      const shape = U.ribbon(pts, () => 0.13, (s, x) => 0.13 + 0.12 * (((s * 18) % 1)), 160);
      const rb = U.extrude(shape, 0.16, 0.02); rb.translate(0, 0, -0.02); g.add(U.mesh(rb, steel, 'ratchet'));
    } else { // catch block on the other arm that the ratchet bar passes through
      const a = 3.0, R = 4.2, cx = R * Math.cos(a), cy = R * Math.sin(a);
      const blk = U.extrude(U.roundRect(cx - 0.3, cy - 0.32, 0.6, 0.64, 0.1), 0.42, 0.04); blk.translate(0, 0, 0.12); g.add(U.mesh(blk, steel, 'ratchet'));
    }
    return g;
  }
  function weitlaner() {
    const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
    A.add(weitlanerHalf(1, 3, false)); Bm.add(weitlanerHalf(-1, 4, true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
    const screw = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.6, 24), U.steel()); screw.rotation.x = Math.PI / 2; screw.userData.part = 'arms'; grp.add(screw);
    const setOpen = k => { const th = k * 0.32; A.rotation.z = -th; Bp.rotation.z = th; };
    setOpen(0.35);
    return { group: grp, setOpen: k => setOpen(0.1 + 0.9 * k), center: new T.Vector3(-0.3, 0, -0.3), size: 15 };
  }

  function rake() {
    const g = new T.Group(), steel = U.steel();
    // flat handle (thickness in-plane, width along Z) with a finger loop at the grip end
    const h = U.bar([[-10.8, -0.22], [-11.9, -0.7], [-12.9, -0.55], [-13.3, 0], [-12.9, 0.55], [-11.9, 0.5], [-11.0, 0.1], [-10.4, 0], [5.6, 0], [6.25, -0.1]], () => 0.12, s => (s < 0.88 ? 1.1 : 1.1 + 0.9 * U.smooth(0.88, 0.98, s)), () => 0, 160, 0.06);
    g.add(U.mesh(h, steel, 'handle'));
    for (const z of [-0.75, -0.25, 0.25, 0.75]) g.add(U.mesh(U.sweep([[5.85, -0.03, z], [6.7, -0.15, z], [7.05, -0.6, z], [7.05, -1.6, z], [6.75, -2.15, z]], s => 0.11 - 0.08 * U.smooth(0.65, 1, s), 60, 12), steel, 'prongs'));
    return { group: g, center: new T.Vector3(-3.4, -0.8, 0), size: 21 };
  }

  ST3D.models.weitlaner = {
    id: 'weitlaner', recordId: 'weitlaner', build: weitlaner, hasArticulation: true,
    parts: [['rings', 'Finger rings'], ['arms', 'Arms and pivot'], ['ratchet', 'Ratchet bar and catch'], ['prongs', 'Prongs (3 and 4)']],
    partViews: { rings: 'front', arms: 'front', ratchet: 'ratchet', prongs: 'jawsOblique' },
    views: { front: { pos: [-0.3, 0, 24], tgt: [-0.3, 0, -0.3] }, back: { pos: [-0.3, 0, -24], tgt: [-0.3, 0, -0.3] }, side: { pos: [-0.3, 22, -0.3], tgt: [-0.3, 0, -0.3] },
      oblique: { pos: [9, 9, 16], tgt: [-0.3, 0, -0.3] }, jawsOblique: { pos: [11, 4, -4], tgt: [6.2, 0, -0.6] }, tip: { pos: [14, 0, -1.5], tgt: [6.3, 0, -0.6] }, ratchet: { pos: [-4.2, 2.5, 6], tgt: [-4.0, 0, 0] } },
    status: { state: 'complete-v2', reviewed: true, note: 'Procedural model: self-retaining retractor with crossing arms on a pivot screw, finger rings, a curved toothed ratchet bar sliding through a catch, and outward-hooked prongs (3 on one arm, 4 on the other; sharp or blunt versions exist). The open/close slider spreads the prongs. Dimensions approximate.' },
    dims: 'About 14 cm (5½ in). Approximate.'
  };
  ST3D.models.rake = {
    id: 'rake', recordId: 'rake', build: rake, hasArticulation: false,
    parts: [['handle', 'Handle'], ['prongs', 'Prongs']], partViews: { prongs: 'jawsOblique' },
    views: { front: { pos: [-2.5, -0.8, 30], tgt: [-2.5, -0.8, 0] }, back: { pos: [-2.5, -0.8, -30], tgt: [-2.5, -0.8, 0] }, side: { pos: [-2.5, 28, 0.4], tgt: [-2.5, -0.8, 0] },
      oblique: { pos: [7, 18, 14], tgt: [-2.5, -0.8, 0] }, jawsOblique: { pos: [11, 2.5, 5.5], tgt: [6.6, -1.0, 0] } },
    status: { state: 'complete-v2', reviewed: true, note: 'Procedural model of a medium rake retractor: flat handle with a closed finger loop and a fork of four curved prongs. Your Major tray has small, medium and large blades; prongs may be sharp or blunt. Dimensions approximate.' },
    dims: 'About 20 cm; medium 4-prong blade about 2 cm wide. Approximate.'
  };
})(window);
