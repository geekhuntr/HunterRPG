/* Instrument set taken from the labeled tray photo (assets/img/*.jpg are crops of it).
   phase  = where in the procedure the item is used (functional grouping)
   family = how it looks (visual-similarity grouping, drives "look-alike" distractors)
   Descriptions are general study notes; confirm details with your instructor and facility pick list. */
(function (root) {
  const PHASES = {
    setup: 'Setup & supplies',
    prep: 'Prep',
    expose: 'Exposure',
    stabilize: 'Stabilize cervix',
    measure: 'Measure',
    dilate: 'Dilate',
    sample: 'Sample & remove tissue'
  };
  const FAMILIES = { forceps: 'Ratcheted forceps', rods: 'Rods & probes', curettes: 'Curettes', retractors: 'Specula & retractors', supplies: 'Supplies' };

  const I = (id, name, aliases, phase, family, use, look, mnemonic) =>
    ({ id, name, aliases, phase, family, img: 'assets/img/' + id + '.jpg', use, look, mnemonic });

  const INSTRUMENTS = [
    I('telfa', 'Telfa pad', ['telfa', 'non-adherent pad', 'nonstick pad', 'telfa dressing'], 'setup', 'supplies',
      'Non-adherent absorbent pad. Soaks up drainage without sticking to tissue or the skin.',
      'Flat, light-tan rectangle with a smooth non-stick face.',
      'Telfa = the pad that will not stick.'),
    I('bowls', 'Bowls', ['bowl', 'basin', 'basins', 'stainless bowls', 'medicine cup'], 'setup', 'supplies',
      'Stainless-steel bowls on the back table. They hold prep solution, saline, or tissue specimens.',
      'Deep, round, polished metal bowls; a large one with a smaller one beside it.',
      'Solution in, specimen out.'),
    I('catheter', 'Straight catheter', ['red rubber catheter', 'straight cath', 'robinson catheter', 'in and out catheter', 'catheter'], 'setup', 'supplies',
      'Empties the bladder before the procedure so it is out of the way and less likely to be injured. Removed right after draining.',
      'Long, thin, bright-red rubber tube with an open eye near a rounded tip and no balloon.',
      'Straight = in and out. No balloon, no staying.'),
    I('smooth', 'Smooth forceps', ['smooth pickups', 'smooth tissue forceps', 'long smooth forceps', 'thumb forceps', 'dressing forceps'], 'setup', 'forceps',
      'Long thumb forceps with smooth (non-toothed) tips. Handle gauze and tissue gently without puncturing it.',
      'Two long, thin, springy blades joined at the top, flat smooth tips.',
      'Smooth = no teeth.'),
    I('sponge', 'Sponge sticks', ['sponge stick', 'sponge forceps', 'ring forceps', 'foerster forceps', 'sponge sticks (ring forceps)'], 'prep', 'forceps',
      'Ring forceps holding a gauze sponge. Used to apply antiseptic prep to the vagina and cervix and to blot blood.',
      'Long ratcheted forceps with open ring-shaped tips, here gripping a ball of gauze.',
      'A stick that carries a sponge.'),
    I('sims', 'Sims retractor', ['sims', 'sims vaginal retractor', 'vaginal retractor'], 'expose', 'retractors',
      'Retracts a vaginal wall so the cervix can be seen. Shaped for hands-on retraction by an assistant.',
      'Bent retractor with a ribbed handle and a broad, flat blade.',
      'Sims = the one a person holds, the wall held back.'),
    I('auvard', 'Auvard weighted vaginal speculum', ['auvard', 'auvard speculum', 'weighted speculum', 'weighted vaginal speculum', 'auvard weighted speculum'], 'expose', 'retractors',
      'Weighted speculum. The weighted blade rests in the back of the vagina and holds the posterior wall down hands-free, keeping the cervix in view.',
      'Heavy rounded weight on one end of a long shaft and a wide blade at the other.',
      'The weight does the holding.'),
    I('jacobs', 'Jacobs vulsellum', ['jacobs', 'jacobs tenaculum', 'jacobs forceps', 'vulsellum', 'tenaculum'], 'stabilize', 'forceps',
      'Long ratcheted forceps that grasp the cervix, holding it steady and allowing gentle traction while the uterus is sounded and dilated.',
      'Long ratcheted forceps with a narrow, open-looking tip and finger rings at the far end.',
      'Jacobs grabs the cervix.'),
    I('skene', 'Skene forceps', ['skene', 'skene uterine forceps', 'skene tenaculum'], 'stabilize', 'forceps',
      'Long ratcheted forceps with an open oval tip, used for grasping and holding on the cervix or uterine tissue. Confirm its exact use with your instructor.',
      'Long ratcheted forceps whose jaws form one open, elongated oval at the tip.',
      'Skene = the open oval tip.'),
    I('sound', 'Uterine sound', ['sound', 'uterine probe'], 'measure', 'rods',
      'Slender blunt probe. Measures the depth and direction of the uterine cavity before dilation; the depth is documented.',
      'Long thin rod with a slight bend near the tip and a flat ribbed grip at the other end.',
      'Sound the depth before you dilate.'),
    I('hanks', 'Hanks dilators', ['hank dilators', 'hanks', 'hank', 'hanks dilator', 'hank dilator'], 'dilate', 'rods',
      'Set of graduated, curved metal dilators. Passed one after another in increasing size to open the cervix gradually.',
      'Five or six curved rods side by side, each slightly thicker than the last.',
      'Hanks = the graduated curved set.'),
    I('goodell', 'Goodell dilator', ['goodell', 'goodell cervical dilator', 'cervical dilator', 'goodell uterine dilator'], 'dilate', 'forceps',
      'Spreading cervical dilator. The tines are placed in the cervical canal and the thumb screw widens them to stretch the cervix open.',
      'Scissor-style handles with a thumb screw between them and notched tines at the working end.',
      'Turn the screw and the tines spread.'),
    I('endocervical', 'Endocervical curette', ['ecc', 'ecc curette', 'endocervical curettage', 'endocervical'], 'sample', 'curettes',
      'Slim curette with a tiny cup. Scrapes the lining of the cervical canal for a sample, usually before dilation.',
      'The thinnest, shortest curette on the tray with a tiny cup at one end.',
      'Small and slim = the cervical canal.'),
    I('endometrial', 'Endometrial curettes', ['endometrial curette', 'curette', 'curettes', 'sharp curette', 'banjo curette', 'uterine curette'], 'sample', 'curettes',
      'Set of loop-ended curettes in graduated sizes. Scrape the uterine lining (endometrium) to collect tissue; the size is matched to the cavity.',
      'Four long loop-ended curettes with fluted handles, the loops increasing in size.',
      'Loops that scrape the lining.'),
    I('punch', 'Cervical punch biopsy forceps', ['punch biopsy', 'cervical punch', 'cervical biopsy forceps', 'kevorkian', 'kevorkian-younge', 'biopsy forceps', 'cervical punch biopsy'], 'sample', 'forceps',
      'Long ratcheted forceps with small cupped jaws. Bites off a small sample of cervical tissue for pathology.',
      'Very long ratcheted forceps ending in small, cupped, sharp-edged jaws.',
      'Punch = bite out a sample.'),
    I('polyp', 'Polyp forceps', ['polyp', 'polyp forcep', 'polypectomy forceps', 'uterine polyp forceps'], 'sample', 'forceps',
      'Ratcheted forceps with a small oval, serrated tip. Grasps a polyp so it can be removed.',
      'Medium-length ratcheted forceps with a small oval tip, shorter than the Bozeman.',
      'The little oval grabs the polyp.'),
    I('bozeman', 'Bozeman forceps', ['bozeman', 'bozeman uterine packing forceps', 'uterine packing forceps', 'bozeman packing forceps'], 'sample', 'forceps',
      'Very long, gently bent ratcheted forceps. Reaches deep into the uterus to pack gauze or to grasp and remove tissue.',
      'The longest forceps on the tray, with a bent, pointed tip.',
      'Bozeman = the long reach.')
  ];

  root.DC_DATA = { PHASES, FAMILIES, INSTRUMENTS };
  if (typeof module !== 'undefined') module.exports = root.DC_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
