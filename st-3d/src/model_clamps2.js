/* Ring-handled clamps built with ST3D.hemostat (model_a_hemostat.js): Halsted mosquito, Kocher (Ochsner), Schmidt tonsil,
   Mixter right-angle, needle driver (Mayo-Hegar style). PROCEDURAL EDUCATIONAL MODELS, not scans.
   Sourced (text only; photo/3D hosts are blocked in the build environment):
   - Mosquito: 5 in (~12.7 cm), curved, serrated (Jarit/Integra, Cooper Surgical, EMS listings: https://www.emsdiasum.com/halstead-mosquito-forcept-curved).
   - Kocher/Ochsner: 16 cm straight, full serrations + 1x2 teeth, ~4.2 mm tip (Teleflex https://us.myteleflex.com/Surgical-Instruments/General/Ochsner-Forceps-(Kocher),-Straight/p/su-OchsnerForcepsKocherStraight ; Sklar 17-2655).
   - Tonsil (Schmidt/Schnidt): 19 cm, curved, finely serrated jaws, ratchet (https://remma.fr/en/model/schnidt-tonsil-forceps-with-slightly-curved-serrated-jaws-19-cm).
   - Mixter: right-angle jaws, transverse serrations, sold in 14-23 cm (MSF https://unicat.msf.org/cat/product/14073).
   - Needle driver: Mayo-Hegar 16 cm, cross-serrated (crosshatch) jaws (https://www.alimed.com/products/mayo-hegar-needle-holder).
   Approximations: jaw lengths/widths/thicknesses, curve and bend radii, serration/crosshatch pitch, tooth size, ring/ratchet/box sizes. */
(function (root) {
  const ST3D = root.ST3D, H = ST3D.hemostat;
  const common = 'Procedural educational model, not a scan; not compared against a photograph (photo hosts are blocked in the build environment). Box lock is a solid block with rivet heads (no visible slot); the ratchet is two half-thickness toothed plates. Serrations are slightly exaggerated so they read at screen size.';

  ST3D.models.mosquito = H({
    id: 'mosquito', recordId: 'mosquito', reviewed: true, L: 2.35, kappa: s => (s > 0.05 ? 0.17 : 0),
    box: { hx: 0.4, hy: 0.3, t: 0.5 }, ring: { cx: -8.6, cy: 1.22, rx: 1.08, ry: 1.0, wall: 0.27 }, ringT: 0.28,
    w0: 0.17, w1: 0.05, h0: 0.12, h1: 0.065, shankW: 0.8, shankT: 0.26,
    pitch: 0.055, depth: 0.026, chamfer: 0.012, serrFromS: 0.1, tipR: 0.08,
    note: 'CURVED Halsted mosquito (straight also exists). Sourced: about 5 in (12.5-12.7 cm), small ratcheted box-lock hemostat, slender fine-tipped jaws with transverse serrations along the full jaw. Approximations: jaw ~2.3 cm long, ~3.4 mm closed width at the base tapering to ~1 mm, curve radius, serration pitch 0.55 mm, ring/ratchet/box sizes. ' + common,
    dims: 'About 12.5 cm (5 in) overall; curved jaws ~2.3 cm long, ~3.4 mm wide (closed) at the base, ~1 mm at the tip; fine serrations along the full jaw.'
  });

  ST3D.models.kocher = H({
    id: 'kocher', recordId: 'kocher', reviewed: true, L: 3.6, jawLabel: 'Jaws (serrated)',
    box: { hx: 0.55, hy: 0.44, t: 0.64 }, ring: { cx: -10.55 },
    w0: 0.3, w1: 0.21, h0: 0.19, h1: 0.15, shankW: 1.1, shankT: 0.34,
    pitch: 0.08, depth: 0.038, chamfer: 0.015, serrFromS: 0.12,
    tipTeeth: { len: 0.24, height: 0.14, base: 0.17 }, jawsTilt: 0.4,
    note: 'STRAIGHT Kocher (Ochsner) clamp (curved also exists). Sourced: 16 cm (6¼ in), heavy ratcheted box-lock clamp, transverse serrations the full length of the jaw plus interlocking 1×2 teeth at the tip, ~4.2 mm tip (Teleflex, Sklar listings). Modeled: the last 2.4 mm of each jaw is split into prongs, two outer prongs with teeth on one jaw and one central prong with a tooth on the other, the teeth crossing the parting line. Approximations: jaw ~3.6 cm long, jaw width/thickness, tooth size and shape, serration pitch 0.8 mm, ring/ratchet/box sizes. ' + common,
    dims: 'About 16 cm (6¼ in) overall; straight heavy jaws ~3.6 cm long, ~6 mm wide (closed) at the base, ~4.2 mm at the tip; full-length serrations ending in 1×2 interlocking teeth.'
  });

  ST3D.models.tonsil = H({
    id: 'tonsil', recordId: 'tonsil', reviewed: true, L: 4.0, kappa: s => (s > 0.05 ? 0.11 : 0),
    ring: { cx: -13.3 }, w0: 0.24, w1: 0.085, h0: 0.16, h1: 0.085, shankW: 0.92, shankT: 0.3,
    pitch: 0.065, depth: 0.03, chamfer: 0.014, serrFromS: 0.12, tipR: 0.12,
    note: 'Schmidt (Schnidt) tonsil clamp. Sourced: about 19 cm (7½ in), long slender shanks, ratchet, box lock, curved jaws with fine transverse serrations; versions with slight and strong curves exist (a gentle long curve is modeled). Approximations: jaw ~4 cm long with a ~9 cm curve radius, jaw width/thickness, serration pitch 0.65 mm, ring/ratchet/box sizes. ' + common,
    dims: 'About 19 cm (7½ in) overall; gently curved jaws ~4 cm long, ~4.8 mm wide (closed) at the base, ~1.7 mm at the tip; serrated along the jaw.'
  });

  const BEND0 = 1.9, BR = 0.62, BLEN = (Math.PI / 2) * BR;
  ST3D.models.rightangle = H({
    id: 'rightangle', recordId: 'rightangle', reviewed: true, L: BEND0 + BLEN + 1.1, kappa: s => (s > BEND0 && s < BEND0 + BLEN ? 1 / BR : 0),
    ring: { cx: -15.66 }, w0: 0.24, w1: 0.08, h0: 0.16, h1: 0.08, shankW: 0.95, shankT: 0.31,
    pitch: 0.06, depth: 0.028, chamfer: 0.014, serrFromS: 0.12, tipR: 0.1,
    note: 'Mixter right-angle clamp. Sourced: ratcheted box-lock clamp whose jaws bend roughly at a right angle near the tip (exact angle varies by maker), fine transverse serrations; sold in about 14-23 cm (about 20 cm modeled). Approximations: 1.9 cm straight jaw, 90° bend of ~6 mm radius, ~1.1 cm tip leg, jaw width/thickness, serration pitch 0.6 mm, ring/ratchet/box sizes. ' + common,
    dims: 'About 20 cm overall; jaws run ~1.9 cm straight then bend 90° (radius ~6 mm) into a ~1.1 cm tip leg; fine serrations along the jaw.'
  });

  ST3D.models.needle = H({
    id: 'needle', recordId: 'needle', reviewed: true, L: 1.75, jawLabel: 'Jaws (crosshatched)',
    box: { hx: 0.6, hy: 0.5, t: 0.72 }, ring: { cx: -12.35 },
    w0: 0.36, w1: 0.25, h0: 0.25, h1: 0.2, shankW: 1.15, shankT: 0.36,
    pattern: 'crosshatch', pitch: 0.1, depth: 0.035, chamfer: 0.015, serrFromS: 0.1, serrToS: 1.67, tipR: 0.2, openAngle: 0.18,
    note: 'Needle driver, modeled as a Mayo-Hegar-style holder. The student lists do not specify the pattern or size; 16 cm Mayo-Hegar with crosshatch (cross-serrated) jaws is a common default (catalog listings). Short, stout jaws with a diamond crosshatch gripping face; ratchet and box lock. Approximations: jaw ~1.75 cm long, ~7 mm wide (closed) at the base, crosshatch pitch 1 mm (real carbide inserts are often finer), no separate insert plates or gold handles, ring/ratchet/box sizes. ' + common,
    dims: 'About 16 cm overall (pattern and size not stated on the lists); short stout jaws ~1.75 cm long, ~7 mm wide (closed) at the base, with crosshatched gripping faces.'
  });
})(window);
