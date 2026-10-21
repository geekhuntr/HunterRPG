/* Crile hemostat, curved, about 14 cm (5 1/2 in). PROCEDURAL EDUCATIONAL MODEL, not a scan. Built by ST3D.hemostat (model_a_hemostat.js).
   Identifying geometry: ratcheted ring-handled hemostat with a box lock and short tapered jaws whose TRANSVERSE serrations run the
   FULL length of the jaw, from the box lock to the tip. Slightly slimmer jaws than a Kelly.
   Sourced: ~14 cm / 5 1/2 in length; full-length transverse serrations; straight and curved patterns exist (MSF/Red Cross
   catalogues, Kruuse listing, study guides, see status.note). Approximations: jaw length/width/thickness, curve radius,
   serration pitch/depth, ring/ratchet/box sizes are instrument knowledge, not measurements. */
(function (root) {
  const ST3D = root.ST3D;
  ST3D.models.crile = ST3D.hemostat({
    id: 'crile', recordId: 'crile',
    tipX: 3.85, serrFrom: 0.6, pitch: 0.07, depth: 0.034, chamfer: 0.015, curveK: 0.05,
    w0: 0.25, w1: 0.1, h0: 0.155, h1: 0.09, shankW: 0.94, shankT: 0.29,
    note: 'Procedural educational model of a CURVED Crile (a straight pattern also exists), not a scan. Sourced from text descriptions (MSF and Red Cross catalogues, catalog listings, study guides): about 14 cm (5½ in), ratchet, box lock, transverse serrations along the entire jaw. Approximations: jaw length (~3.3 cm beyond the box), jaw width/thickness (drawn slightly slimmer than the Kelly), the amount of curve, serration pitch (0.7 mm) and depth, ring, ratchet and box-lock sizes; the box lock is a solid block with rivet heads (no visible slot); serrations are exaggerated slightly so they read at screen size. Not compared against a photograph because photo hosts are blocked in the build environment.',
    dims: 'About 14 cm (5½ in) overall; curved jaws ~3.3 cm long, ~5 mm wide (closed) at the base tapering to ~2 mm at the tip; serrations (≈0.7 mm pitch) along the full jaw length. Proportions are approximations.'
  });
})(window);
