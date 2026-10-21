/* Metzenbaum (dissecting) scissors, curved, 18 cm (7 in). PROCEDURAL EDUCATIONAL MODEL, not a scan (factory: model_a_scissors.js).
   Identifying geometry: delicate pattern. LONG handles/shanks and SHORT, NARROW, thin blades (about a quarter of the overall
   length or less) with blunt rounded tips, usually curved. Compare with Mayo: much longer handle-to-blade ratio, blades about
   half as wide and two-thirds as thick.
   Sourced: 18 cm curved blunt/blunt (MSF Unicat 04-33-18, UNFPA, Eickemeyer 118318), "shaft longer than the blades" (WPI),
   blade "approximately one quarter of the scissor length" (Covetrus listing), rounded tips for blunt dissection (Wikipedia).
   Approximations: blade width/thickness, curve depth, ring and hub sizes, shank path (instrument knowledge, not measured). */
(function (root) {
  const ST3D = root.ST3D;
  ST3D.models.metz = ST3D.scissors({
    id: 'metz', recordId: 'metz',
    size: 18.0, cx: -4.8, zr: 0.03, tH: 0.2, hubR: 0.42, screwR: 0.28, screwH: 0.07, ringScaleB: 1.06,
    ring: { cx: -12.6, cy: 1.3, rx: 1.2, ry: 1.05, wall: 0.26, t: 0.26 },
    shankPts: [[-9.5, 0.58], [-6.5, 0.38], [-3.5, 0.19], [-1.2, 0.05]],
    shankHW: [0.24, 0.2], jog: [-8.2, -4.6], closeDist: 7.5,
    blade: { L: 4.2, w0: 0.6, w1: 0.34, t0: 0.2, t1: 0.12, curve: 0.5, x0: 0.5 },
    note: 'Curved Metzenbaum, modeled at 18 cm (7 in); the trays also list 5-7 in and 10 in versions with the same proportions. Procedural educational model, not a scan; not checked against a photograph because photo hosts are blocked in the build environment. Sourced: 18 cm curved blunt/blunt pattern, shaft longer than the blades, blade about a quarter of the length, rounded tips (catalog listings). Approximated: blade width (~0.6 cm at the root, ~0.35 cm near the tip), thickness (~2 mm per blade), curve depth (~5 mm), ring, hub and screw sizes, shank path. Each blade is one smooth plate; real blades are hollow-ground with sharper edges.',
    dims: 'About 18 cm (7 in) overall; blades about 4.2 cm from screw to tip (under a quarter of the length), about 6 mm wide at the root and 2 mm thick each, curved about 5 mm, blunt rounded tips; handles/shanks about 13.8 cm. Widths, thickness, curve and ring sizes are approximations.'
  });
})(window);
