/* Babcock intestinal forceps, ~16.5 cm (about 6 1/2 in). PROCEDURAL EDUCATIONAL MODEL, not a scan.
   Built from published dimensional descriptions and standard instrument proportions; every dimension below is an approximation.
   Identifying geometry: two flat finger rings, long slender shanks that cross at a box lock, a short toothed ratchet on each
   inner shank edge, and jaws that are open fenestrated (windowed) loops with smooth, rounded tips and no teeth. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const L = { ringCx: -8.35, ringRx: 1.3, ringRy: 1.2, ringCy: 1.23, joint: 0, tip: 7.1 };

  function half(zs, isB) {
    const g = new T.Group(), steel = U.steel();
    const jog = x => zs * 0.17 * U.smooth(-2.1, -1.0, x) * (1 - U.smooth(1.0, 2.1, x));
    // finger ring (flat oval loop)
    const ring = U.mesh(U.extrude(U.ringShape(L.ringCx, L.ringCy, L.ringRx, L.ringRy, 0.36), 0.32, 0.05), steel, 'rings'); g.add(ring);
    // shank: slender flat bar from the ring, through the joint, to the jaw
    const cl = [[-7.1, 1.23], [-3.5, 0.62], [0, 0], [2.6, -0.46], [4.3, -0.40]];
    const hw = s => 0.30 - 0.05 * U.smooth(0.3, 0.9, s);
    const shank = U.mesh(U.bar(cl, s => hw(s), 0.30, x => jog(x), 200, 0.07), steel, 'shanks'); g.add(shank);
    // ratchet: sawtooth strip along the inner (axis-facing) edge of the handle shank
    // handle shanks run on the line y = -0.175 x; the strip covers only x = -4.9 .. -2.5
    const ly = x => -0.175 * x, x0 = -4.9, x1 = -2.5, ph = isB ? 0.2 : 0;
    const shape = U.ribbon([[x0, ly(x0)], [x1, ly(x1)]], () => 0.2, (s, x) => 0.22 + U.sawtooth(x, x0 + 0.02, x1 - 0.02, 0.4, 0.34), 140);
    g.add(U.mesh(U.extrude(shape, 0.26, 0.03), steel, 'ratchet'));
    // jaw: open, windowed (fenestrated) loop with a smooth rounded tip; inner edge flat so the pair meets along y=0
    const outline = U.spline([[2.7, -0.70], [3.6, -0.73], [4.5, -0.88], [5.4, -0.93], [6.3, -0.84], [6.9, -0.60], [7.12, -0.32], [7.02, -0.08], [6.6, 0.0], [5.6, 0.0], [4.6, 0.0], [3.8, -0.08], [3.0, -0.16], [2.7, -0.20]], 200);
    outline.holes.push(new T.Path(U.ellipsePts(5.55, -0.46, 1.28, 0.30, 56).reverse()));
    g.add(U.mesh(U.extrude(outline, 0.40, 0.07), steel, 'jaws'));
    if (isB) { // box lock: the slotted block on one half that the other shank passes through, with a pivot pin
      g.add(U.mesh(U.extrude(U.roundRect(-0.85, -0.55, 1.7, 1.1, 0.22), 0.80, 0.10), steel, 'box'));
      const pin = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.98, 28), steel.clone()); pin.rotation.x = Math.PI / 2; pin.userData.part = 'box'; pin.userData.base = steel.color.getHex(); g.add(pin);
    }
    return g;
  }

  function build() {
    const root_ = new T.Group();
    const A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
    A.add(half(+1, false));
    Bm.add(half(-1, true)); Bm.scale.y = -1; Bp.add(Bm);
    root_.add(A, Bp);
    const open = (k) => { const th = k * 0.17; A.rotation.z = -th; Bp.rotation.z = th; };
    open(0);
    return { group: root_, setOpen: open, center: new T.Vector3(-1.25, 0, 0), size: 17.5 };
  }

  ST3D.models.babcock = {
    id: 'babcock', recordId: 'babcock', build, hasArticulation: true,
    parts: [['rings', 'Finger rings'], ['shanks', 'Shanks'], ['box', 'Box lock'], ['ratchet', 'Ratchet'], ['jaws', 'Jaws']],
    views: {
      front: { pos: [-1.25, 0, 30], tgt: [-1.25, 0, 0] },
      back: { pos: [-1.25, 0, -30], tgt: [-1.25, 0, 0] },
      side: { pos: [-1.25, 28, 0.01], tgt: [-1.25, 0, 0] },
      oblique: { pos: [8, 10, 22], tgt: [-1.25, 0, 0] },
      jaws: { pos: [5.8, 1.6, 7.5], tgt: [5.7, -0.25, 0] },
      jawsOblique: { pos: [10.5, 4.5, 5.5], tgt: [5.8, -0.3, 0] },
      tip: { pos: [16, 0.3, 0.2], tgt: [6.8, -0.3, 0] },
      ratchet: { pos: [-3.7, 1.8, 7.5], tgt: [-3.7, 0, 0] },
      box: { pos: [0.8, 2.2, 6], tgt: [0, 0, 0] }
    },
    status: { state: 'complete-v1', note: 'Procedural model from published proportions; not a scan. Fenestrated jaws, rings, box lock and ratchet modeled.' },
    dims: 'About 16.5 cm (6½ in) overall. Shank, jaw and ring sizes are approximations.'
  };
})(window);
