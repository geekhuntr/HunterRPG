/* Mayo scissors, straight and curved, 17 cm (6 3/4 in) standard. PROCEDURAL EDUCATIONAL MODELS, not scans (factory: model_a_scissors.js).
   Identifying geometry: heavy pattern. Blades SHORT, WIDE and THICK relative to the handles (pivot-to-tip about a third of the
   overall length), semi-blunt rounded tips, beveled outer edges. Curved Mayo: blades bend to one side within the blade plane.
   Sourced: 15-17 cm overall (Wikipedia "Mayo scissors"; WPI 501751 Mayo 17 cm "heavy, thick blades, semi-blunt tips";
   Teleflex/Pilling 6 3/4 in), ~45 mm cutting edge on a 17 cm Mayo (Fine Science Tools listing via Fisher Scientific).
   Approximations: blade width/thickness, curve depth, ring and hub sizes, shank path (instrument knowledge, not measured). */
(function (root) {
  const ST3D = root.ST3D;
  const base = {
    size: 17.0, cx: -2.9, zr: 0.05, tH: 0.30, hubR: 0.6, screwR: 0.36, screwH: 0.09, ringScaleB: 1.06,
    ring: { cx: -10.1, cy: 1.35, rx: 1.3, ry: 1.1, wall: 0.3, t: 0.32 },
    shankPts: [[-7.0, 0.66], [-4.5, 0.45], [-2.2, 0.22], [-0.9, 0.07]],
    shankHW: [0.38, 0.34], jog: [-6.2, -3.8], closeDist: 9.5
  };
  const common = 'Procedural educational model, not a scan; not checked against a photograph because photo hosts are blocked in the build environment. Sourced: about 17 cm (6 3/4 in) overall and a cutting edge of roughly 4.5 cm on a 17 cm Mayo (catalog listings); heavy pattern with thick blades and semi-blunt tips. Approximated: blade width (~1.0 cm at the root, ~0.6 cm near the tip), blade thickness (~3 mm per blade), bevel shape, ring, hub and screw sizes, shank path. Each blade is one smooth plate; real blades are hollow-ground and the cutting edges are sharper.';
  ST3D.models['mayo-straight'] = ST3D.scissors(Object.assign({}, base, {
    id: 'mayo-straight', recordId: 'mayo-straight',
    blade: { L: 5.6, w0: 1.05, w1: 0.52, t0: 0.30, t1: 0.2, curve: 0, x0: 0.6 },
    note: 'Straight Mayo. ' + common,
    dims: 'About 17 cm (6¾ in) overall; blades about 5.6 cm from screw to tip (about a third of the length), up to about 1 cm wide and 3 mm thick each, straight, semi-blunt tips. Widths, thickness and ring sizes are approximations.'
  }));
  ST3D.models['mayo-curved'] = ST3D.scissors(Object.assign({}, base, {
    id: 'mayo-curved', recordId: 'mayo-curved',
    blade: { L: 5.6, w0: 1.05, w1: 0.52, t0: 0.30, t1: 0.2, curve: 0.85, x0: 0.6 },
    note: 'Curved Mayo, modeled at the 17 cm standard size (the trays also list 7 in and 10 in; the pattern is the same, only longer). Both blades bend about 8-9 mm to the same side over their length (approximated curve depth). ' + common,
    dims: 'Modeled at about 17 cm (6¾ in) overall (trays list 7 in and 10 in); blades about 5.6 cm from screw to tip, up to about 1 cm wide, curved about 8-9 mm to one side, semi-blunt tips. Curve depth, widths and ring sizes are approximations.'
  }));
})(window);
