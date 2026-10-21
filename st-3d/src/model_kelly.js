/* Kelly hemostat, curved, about 14 cm (5 1/2 in). PROCEDURAL EDUCATIONAL MODEL, not a scan. Built by ST3D.hemostat (model_a_hemostat.js).
   Identifying geometry: ratcheted ring-handled hemostat with a box lock and short tapered jaws whose TRANSVERSE serrations cover
   only the DISTAL part (about half) of the jaw; the proximal jaw face next to the box is smooth. Slightly heavier jaws than a Crile.
   Sourced: ~14 cm / 5 1/2 in length; serrations on the distal half to two-thirds of the jaw only; straight and curved patterns exist
   (surgical-technology study guides and catalog listings, see status.note). Approximations: jaw length/width/thickness, curve
   radius, serration pitch/depth, ring/ratchet/box sizes are instrument knowledge, not measurements. */
(function (root) {
  const ST3D = root.ST3D;
  ST3D.models.kelly = ST3D.hemostat({
    id: 'kelly', recordId: 'kelly', reviewed: true,
    tipX: 3.85, serrFrom: 1.85, pitch: 0.075, depth: 0.036, chamfer: 0.015, curveK: 0.05,
    w0: 0.28, w1: 0.115, h0: 0.17, h1: 0.1, shankW: 1.0, shankT: 0.31,
    note: 'Procedural educational model of a CURVED Kelly (a straight pattern also exists), not a scan. Sourced from text descriptions (study guides, catalog listings): about 14 cm (5½ in), ratchet, box lock, transverse serrations on the distal half to two-thirds of the jaw only (modeled at ~55%), proximal part smooth. Approximations: jaw length (~3.3 cm beyond the box), jaw width/thickness, the amount of curve, serration pitch (0.75 mm) and depth, ring, ratchet and box-lock sizes; the box lock is a slanted box with face plates, a channel for the other shank and a flush pin; serrations are exaggerated slightly so they read at screen size. Not compared against a photograph because photo hosts are blocked in the build environment.',
    dims: 'About 14 cm (5½ in) overall; curved jaws ~3.3 cm long, ~5.6 mm wide (closed) at the base tapering to ~2.3 mm at the tip; serrations (≈0.75 mm pitch) on the distal ~2 cm (about 55% of the jaw) only. Proportions are approximations.'
  });
})(window);
