/* Shared factory for operating scissors (Mayo straight / Mayo curved / Metzenbaum). PROCEDURAL EDUCATIONAL MODELS, not scans.
   Named model_a_* so it loads before model_mayo.js / model_metz.js (files load alphabetically). Registers no model itself.
   Anatomy: each half = finger ring + shank + round hub at the pivot + blade. The two halves lie in two layers
   (half A in z > 0, half B in z < 0) that slide past each other on their flat inner (shearing) faces; a slotted pivot screw
   at the origin joins them. No ratchet, no box lock. Blade section: flat inner face, a bevel ground on the outer face toward
   the cutting edge, a rounded back. Curved patterns: both blades bend toward +Y within the blade plane (visible face-on).
   Half B is built and then mirrored (scale.y = -1), so its curve is built inverted to end up on the same side as half A's. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D, U = ST3D.kit;
  const GAP = 0.004; // clearance between the two shearing faces (avoids coplanar z-fighting)

  // Swept blade with a crisp-edged section. o: { L, w0, w1, t0, t1, curve, x0 } ; zs = +1 (half A layer) or -1 (half B layer); cs = curve sign.
  function bladeGeo(o, zs, cs) {
    const n = 140, xs = -0.05, L = o.L;
    const yc = x => cs * o.curve * Math.pow(Math.max(0, (x - o.x0) / (L - o.x0)), 2);
    const taper = x => { const s = Math.max(0, x) / L; return o.w0 / 2 + (o.w1 / 2 - o.w0 / 2) * Math.pow(Math.min(1, s), 1.25); };
    const rt = taper(L) * 1.15, xr = L - rt; // rounded (blunt) tip: elliptical closure over the last rt cm
    const hwAt = x => (x <= xr ? taper(x) : taper(x) * Math.sqrt(Math.max(0, 1 - Math.pow((x - xr) / rt, 2))));
    const thAt = x => { const s = Math.max(0, x) / L, q = x <= xr ? 0 : (x - xr) / rt; return (o.t0 + (o.t1 - o.t0) * s) * (0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - q * q))); };
    // stations: denser toward the tip
    const X = []; for (let i = 0; i <= n; i++) { const u = i / n; X.push(xs + (L - xs) * Math.sin(u * Math.PI / 2)); }
    // section faces as polylines in (u across the blade: + = cutting edge side, v = height above the shearing face); CCW loop
    const faces = hw => {
      const t = thAt(hw.x), w = Math.max(hw.h, 0.0005), e = Math.min(0.025, t * 0.3), bw = w * 0.5, r = Math.min(t * 0.45, w * 0.35);
      const back = [[w - bw, t], [-w + r, t]];
      for (let j = 1; j <= 5; j++) { const a = Math.PI / 2 + (j / 5) * (Math.PI / 2); back.push([-w + r + r * Math.cos(a), t - r + r * Math.sin(a)]); }
      back.push([-w, 0]);
      return [[[-w, 0], [w, 0]], [[w, 0], [w, e]], [[w, e], [w - bw, t]], back];
    };
    const pos = [], idx = [];
    const P = X.map(x => [x, yc(x)]);
    const secs = X.map(x => faces({ x, h: hwAt(x) }));
    const nf = secs[0].length;
    for (let f = 0; f < nf; f++) {
      const m = secs[0][f].length, base = pos.length / 3;
      for (let i = 0; i <= n; i++) {
        const a = P[Math.max(0, i - 1)], c = P[Math.min(n, i + 1)], tx = c[0] - a[0], ty = c[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
        for (const [u, v] of secs[i][f]) pos.push(P[i][0] + nx * u, P[i][1] + ny * u, zs * (GAP + v));
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < m - 1; j++) {
        const a = base + i * m + j, b = a + 1, c = a + m, d = c + 1;
        if (zs > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
      }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  // Slotted screw head (two D-shaped halves over a thin base disc), axis along Z, sitting on z = z0 and rising toward +Z.
  function screwHead(R, H, slot, z0, ang) {
    const a0 = Math.acos(slot / R), sh = new T.Shape();
    sh.moveTo(slot, -R * Math.sin(a0)); sh.absarc(0, 0, R, -a0, a0, false); sh.lineTo(slot, -R * Math.sin(a0));
    const parts = [];
    for (const rot of [0, Math.PI]) { const g = U.extrude(sh, H, 0.018); g.rotateZ(rot + ang); g.translate(0, 0, z0 + H / 2); parts.push(g); }
    const base = U.extrude(new T.Shape(U.ellipsePts(0, 0, R * 0.995, R * 0.995, 48)), H * 0.35, 0.01); base.translate(0, 0, z0 + H * 0.175); parts.push(base);
    return parts;
  }

  ST3D.scissors = function (o) {
    const RING = o.ring, LAYER = GAP + o.tH / 2; // z centre of each half's hub / blade-root layer
    function half(zs, isB) {
      const g = new T.Group(), steel = U.steel();
      const k = isB ? (o.ringScaleB || 1) : 1, rx = RING.rx * k, ry = RING.ry * k;
      const cx = RING.cx - (rx - RING.rx), cy = RING.cy + (ry - RING.ry) * 0.6;
      // finger ring, nearly in the common mid-plane (offset ±zr) so both rings look coplanar edge-on
      const ring = U.extrude(U.ringShape(cx, cy, rx, ry, RING.wall), RING.t, 0.06); ring.translate(0, 0, zs * o.zr);
      g.add(U.mesh(ring, steel, 'rings'));
      // shank: leaves the distal-inner side of the ring, converges on the pivot; joggles from the ring plane into its own layer
      const aa = -0.62, mw = RING.wall / 2;
      const p0 = [cx + (rx - mw) * Math.cos(aa), cy + (ry - mw) * Math.sin(aa)];
      const cl = [p0, ...o.shankPts, [0.0, 0.0]];
      const jog = x => zs * (o.zr + (LAYER - o.zr) * U.smooth(o.jog[0], o.jog[1], x));
      const hw = s => o.shankHW[0] + (o.shankHW[1] - o.shankHW[0]) * s + (o.hubR * 0.75 - o.shankHW[1]) * U.smooth(0.9, 1, s);
      const thick = Math.min(RING.t, o.tH);
      g.add(U.mesh(U.bar(cl, hw, thick, jog, 200, Math.min(0.08, thick * 0.3)), steel, 'shanks'));
      // hub: round boss around the screw, full layer thickness
      const hub = U.extrude(new T.Shape(U.ellipsePts(0, 0, o.hubR, o.hubR, 64)), o.tH, 0.04); hub.translate(0, 0, zs * LAYER);
      g.add(U.mesh(hub, steel, 'blades'));
      // blade (curve sign inverted on B because the whole half is mirrored in Y afterwards)
      g.add(U.mesh(bladeGeo(o.blade, zs, isB ? -1 : 1), steel, 'blades'));
      const zOut = GAP + o.tH;
      if (!isB) { // slotted head on half A; the slot floor is a slightly darker, duller disc so the slot reads at a glance
        const geos = screwHead(o.screwR, o.screwH, o.screwR * 0.2, zOut - 0.004, 0.5), dark = U.steel({ color: 0x7c868e, roughness: 0.5 });
        geos.forEach((geo, i) => g.add(U.mesh(geo, i === geos.length - 1 ? dark : steel, 'screw')));
      }
      else { // flush threaded end / nut face on the other side
        const nut = U.extrude(new T.Shape(U.ellipsePts(0, 0, o.screwR * 0.82, o.screwR * 0.82, 48)), 0.06, 0.02); nut.translate(0, 0, -(zOut + 0.026));
        g.add(U.mesh(nut, steel, 'screw'));
      }
      return g;
    }
    function build() {
      const grp = new T.Group(), A = new T.Group(), Bp = new T.Group(), Bm = new T.Group();
      A.add(half(+1, false)); Bm.add(half(-1, true)); Bm.scale.y = -1; Bp.add(Bm); grp.add(A, Bp);
      const open = k => { const th = k * (o.maxOpen || 0.3); A.rotation.z = -th; Bp.rotation.z = th; };
      open(0);
      return { group: grp, setOpen: open, center: new T.Vector3(o.cx, 0, 0), size: o.size };
    }
    const L = o.blade.L, bc = L * 0.5, cyB = o.blade.curve * 0.3, cx = o.cx, d = o.closeDist || 9;
    return {
      id: o.id, recordId: o.recordId, build, hasArticulation: true,
      parts: [['rings', 'Finger rings'], ['shanks', 'Shanks'], ['screw', 'Pivot screw'], ['blades', 'Blades']],
      partViews: { rings: 'front', shanks: 'oblique', screw: 'screw', blades: 'blades' },
      views: {
        front: { pos: [cx, 0, 30], tgt: [cx, 0, 0] },
        back: { pos: [cx, 0, -30], tgt: [cx, 0, 0] },
        side: { pos: [cx, 28, 0.01], tgt: [cx, 0, 0] },
        oblique: { pos: [cx + 9, 10, 22], tgt: [cx, 0, 0] },
        blades: { pos: [bc, cyB, d], tgt: [bc, cyB, 0] },
        jawsOblique: { pos: [bc + d * 0.55, cyB + d * 0.45, d * 0.62], tgt: [bc, cyB, 0] },
        tip: { pos: [L + 3.4, o.blade.curve + 2.4, 4.4], tgt: [L - 1.0, o.blade.curve * 0.6, 0] },
        screw: { pos: [0.9, 1.3, 4.6], tgt: [0, 0, 0] }
      },
      status: { state: 'complete-v1', note: o.note },
      dims: o.dims
    };
  };
})(window);
