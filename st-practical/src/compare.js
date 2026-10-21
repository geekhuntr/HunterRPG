/* Comparison cards for instruments that are easy to confuse. */
(function (root) {
  const C = (id, title, items, practical, note) => ({ id, title, items: items.map(([rec, look, use]) => ({ rec, look, use })), practical, note: note || '' });
  const COMPARES = [
    C('kelly-crile', 'Kelly vs Crile vs Mosquito', [
      ['crile', 'Serrated along the whole length of the jaw.', 'Small to medium vessels.'],
      ['kelly', 'Serrated on the distal part of the jaw only; heavier.', 'Larger vessels and pedicles in deeper tissue.'],
      ['mosquito', 'Smallest, with the finest, narrowest tips.', 'Tiny vessels in delicate tissue.']],
      'All three are ratcheted hemostats. Check the serrations: whole jaw means Crile, far end only means Kelly, and the smallest one is the Mosquito.',
      'Your Major list has “Kelly/ Rochester-Pean”. A Rochester-Pean is a different, heavier clamp, so confirm which one is meant.'),
    C('allis-babcock', 'Allis vs Babcock', [
      ['allis', 'Rows of small interlocking teeth.', 'Tough tissue or tissue that will be removed.'],
      ['babcock', 'Smooth, rounded, flared tips with no teeth.', 'Delicate tubular structures such as bowel.']],
      'Both have open (fenestrated) jaws. Teeth mean Allis; smooth rounded tips mean Babcock. An Allis can tear bowel, so bowel gets the Babcock.'),
    C('sponge-allis', 'Sponge stick vs Allis vs Babcock', [
      ['sponge', 'Long handles, large open ring-shaped serrated jaws.', 'Carries a gauze sponge for prepping or blotting.'],
      ['allis', 'Short, with small toothed jaws.', 'Grasps tough tissue.'],
      ['babcock', 'Short, with smooth rounded jaws.', 'Grasps delicate tubular structures.']],
      'The sponge stick is the long one with big rings and a sponge in its jaws. The other two are short tissue graspers.'),
    C('mayo-metz', 'Mayo vs Metzenbaum', [
      ['metz', 'Long handles, thin light blades, blunt tips, usually curved.', 'Delicate tissue.'],
      ['mayo-straight', 'Short, heavy, straight blades.', 'Sutures and tough material.'],
      ['mayo-curved', 'Short, heavy, curved blades.', 'Heavy tissue such as fascia and muscle.']],
      'Look at the blade length against the handle. Long handle with slim blades is a Metzenbaum. Short, thick blades are a Mayo. Then straight or curved tells you which Mayo.',
      'One supplier notes that surgeons sometimes use these interchangeably; this card shows the standard teaching distinction.'),
    C('suction', 'Suction tips: Yankauer vs Poole vs Frazier', [
      ['yankauer', 'Rigid, curved, bulb head with side holes and a wide bore.', 'Mouth, pharynx and open wounds.'],
      ['poole', 'Straight tube inside a perforated outer sleeve with many holes.', 'Large volumes of pooled abdominal fluid.'],
      ['frazier', 'Thin, angled, small tip with a finger-control hole and a stylet.', 'Small, delicate areas.']],
      'Bulb with holes is a Yankauer. A sleeve full of holes is a Poole. The slim angled tip with a stylet is a Frazier.'),
    C('kocher-kelly', 'Kocher vs Kelly', [
      ['kocher', 'Heavy, with interlocking teeth at the tip.', 'Heavy, tough tissue such as fascia.'],
      ['kelly', 'Lighter, smooth tip, serrations on the distal part.', 'Vessels and pedicles.']],
      'Both are ratcheted and look alike from a distance. Teeth at the tip mean Kocher; a smooth tip means Kelly. Catalogs also list the Kocher pattern as Ochsner.'),
    C('tonsil-rightangle', 'Tonsil clamp vs Right-angle clamp', [
      ['tonsil', 'Long with a gentle curve.', 'Reaches tissue and vessels in deep, narrow spaces.'],
      ['rightangle', 'Jaws bent roughly at a right angle.', 'Passes behind a vessel or duct to carry a tie.']],
      'A long gentle curve is a tonsil clamp. A sharp bend near the tip is a right-angle clamp.'),
    C('towel', 'Perforating vs non-perforating towel clip', [
      ['towel-perf', 'Sharp, pointed tips.', 'Pierces the drape to anchor it.'],
      ['towel-non', 'Blunt tips.', 'Holds the drape without piercing it.']],
      'Pointed tips pierce the drape. Blunt tips leave the drape intact as a barrier.',
      'One source describes the Backhaus as blunt and another as piercing, so rely on the tip style of the clip in your tray.'),
    C('thumbf', 'Thumb forceps: toothed vs smooth, short vs long', [
      ['adson', 'Short and fine, with 1×2 teeth.', 'Skin and fascia during closure.'],
      ['smooth-short', 'Short, serrated tips with no teeth.', 'Gentle handling of tissue and dressings.'],
      ['smooth-long', 'Long, serrated tips with no teeth.', 'Gentle handling deep in a wound.'],
      ['toothed-long', 'Long, with interlocking teeth.', 'Secure grasp deep in a wound.'],
      ['debakey', 'Slim, fine parallel grooves, slender rounded tips.', 'Vessels and delicate tissue.']],
      'First ask: teeth or serrations? Then ask: long or short? DeBakey is the slim one with fine parallel grooves.'),
    C('deepretract', 'Richardson vs Deaver vs Malleable', [
      ['richardson', 'Angled blade with a rolled lip.', 'Abdominal wall, fascia and muscle.'],
      ['deaver', 'Longer, flat, gently curved blade.', 'Deep abdominal and pelvic structures.'],
      ['malleable', 'Flat, thin metal strip you bend by hand.', 'Holds tissue aside in a shape you choose.']],
      'The malleable one bends; the other two are rigid. A Deaver reaches deeper; a Richardson works on the abdominal wall.'),
    C('handretract', 'Senn vs Army-Navy vs Rake', [
      ['senn', 'Double-ended: 3-prong rake on one end, flat blade on the other.', 'Small incisions, shallow tissue.'],
      ['armynavy', 'Double-ended: flat right-angle blade on both ends.', 'Small or shallow incisions.'],
      ['rake', 'One working end with a row of prongs.', 'Superficial tissue and fascia.']],
      'Rake on one end and flat on the other is a Senn. Flat on both ends is Army-Navy. One end with prongs only is a rake retractor.'),
    C('vagret', 'Sims retractor vs Auvard speculum', [
      ['sims', 'Hand-held, double-ended, no weight.', 'Retracts the posterior vaginal wall; someone holds it.'],
      ['auvard', 'Heavy weight attached to the blade.', 'Holds the posterior wall down hands-free.']],
      'If it has a weight, it is an Auvard and it stays put. If you need a hand to hold it, it is a Sims.'),
    C('dilate', 'Hank/Hegar vs Goodell', [
      ['cervdil', 'Set of solid graduated rods, usually double-ended.', 'Passed in order, small to large.'],
      ['goodell', 'Scissor handles with a central screw.', 'Spreads open as the screw is turned.']],
      'A set of graduated rods is Hank or Hegar. One scissor-handled instrument with a screw is the Goodell.',
      'Hank has a stop ring near each end; Hegar has a tapered, rounded tip. Your list says “Hank or Hegar”, so confirm which is in the tray.'),
    C('curettes', 'Endometrial curette vs Endocervical curette vs Uterine sound', [
      ['endometrial', 'Larger loop or cup tip, graduated sizes.', 'Scrapes the uterine lining.'],
      ['endocervical', 'Slim, with a small tip.', 'Samples the cervical canal.'],
      ['sound', 'Blunt, depth-marked probe with no cutting tip.', 'Measures uterine depth and direction.']],
      'Bigger loop is endometrial; slimmer and smaller is endocervical. A blunt depth-marked probe is the sound.'),
    C('dnc-forceps', 'Polyp forceps vs Bozeman vs Cervical biopsy punch', [
      ['polyp', 'Small oval, serrated tips.', 'Grasps polyps.'],
      ['bozeman', 'Long, slightly curved shanks.', 'Places or removes packing and dressings.'],
      ['punch', 'Small cupped, sharp-edged jaws.', 'Bites off a cervical tissue sample.']],
      'Cupped, sharp jaws that bite are the punch. Long forceps for packing are the Bozeman. Small serrated oval tips for polyps are the polyp forceps.'),
    C('tenac', 'Jacobs vs Skene / single-tooth tenaculum', [
      ['jacobs', 'Straight, with multiple teeth.', 'Grasps the cervix.'],
      ['skene', 'Described as curved to the side; the list also says “singletooth”.', 'Grasps the cervix.']],
      'Both hold the cervix. The tip patterns are the difference.',
      'The source is unclear about which pattern “singletooth/Skene” is. Confirm with your instructor before relying on this card.'),
    C('needle', 'Needle driver vs hemostat', [
      ['needle', 'Short, stout jaws with a crosshatched grip.', 'Holds and drives the suture needle.'],
      ['kelly', 'Longer jaws with parallel serrations.', 'Clamps vessels.']],
      'Short thick crosshatched jaws are a needle driver. Longer jaws with parallel serrations are a hemostat.')
  ];
  root.ST_COMPARE = COMPARES;
  if (typeof module !== 'undefined') module.exports = COMPARES;
})(typeof window !== 'undefined' ? window : globalThis);
