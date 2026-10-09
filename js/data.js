/* D&C (dilation & curettage) instrument tray content.
   phase  = where in the procedure the instrument is used (functional grouping)
   family = how it looks (visual-similarity grouping, drives "look-alike" distractors)
   Facility trays vary - always verify against your own pick list. */
(function (root) {
  const PHASES = {
    prep: 'Prep & drape',
    expose: 'Exposure',
    stabilize: 'Stabilize cervix',
    measure: 'Measure',
    dilate: 'Dilate',
    evacuate: 'Sample / evacuate'
  };
  const FAMILIES = { forceps: 'Ratcheted forceps', rods: 'Rods / dilators', curettes: 'Curettes & cannulas', retractors: 'Specula & retractors' };

  const INSTRUMENTS = [
    { id: 'towel', name: 'Towel clamp', aliases: ['backhaus towel clamp', 'backhaus', 'towel forceps'], phase: 'prep', family: 'forceps', art: 'towel',
      use: 'Pierces and secures the surgical drapes in place. Short, sharply pointed curved jaws that cross at the tips.',
      look: 'Ratcheted handles with short, hooked, pointed jaws curving toward each other.',
      mnemonic: 'Towel clamp = “clamps the cloth”.' },
    { id: 'ring', name: 'Sponge forceps', aliases: ['ring forceps', 'foerster', 'foerster sponge forceps', 'sponge stick', 'sponge forceps (ring)'], phase: 'prep', family: 'forceps', art: 'ring',
      use: 'Holds a gauze sponge soaked in antiseptic to prep the vagina and cervix, and can sponge blood from the field.',
      look: 'Long straight jaws ending in two open oval rings (fenestrated, serrated) that meet like a single ring.',
      mnemonic: 'RING at the tip = RING forceps.' },
    { id: 'graves', name: 'Graves speculum', aliases: ['graves', 'bivalve speculum', 'duckbill speculum', 'vaginal speculum'], phase: 'expose', family: 'retractors', art: 'graves',
      use: 'Self-retaining bivalve (“duckbill”) speculum. Opens the vaginal canal so the cervix can be seen; a thumb screw locks the blades open.',
      look: 'Two broad, rounded blades on a hinge with a thumb screw and two handles.',
      mnemonic: 'Two blades like a duck’s bill.' },
    { id: 'auvard', name: 'Auvard weighted speculum', aliases: ['auvard', 'weighted speculum', 'auvard speculum', 'weighted vaginal speculum'], phase: 'expose', family: 'retractors', art: 'auvard',
      use: 'Weighted speculum whose blade rests in the posterior vaginal fault. The weight holds the posterior wall down hands-free, keeping the cervix exposed.',
      look: 'A heavy block at the handle end and one wide, concave blade.',
      mnemonic: 'The weight does the work - no assistant needed.' },
    { id: 'sims', name: 'Sims retractor', aliases: ['sims', 'sims vaginal retractor', 'vaginal retractor', 'deaver'], phase: 'expose', family: 'retractors', art: 'sims',
      use: 'Double-ended retractor with different blade widths. Retracts the anterior vaginal wall to improve visualization of the cervix.',
      look: 'Long bar with a flat paddle at each end, one larger than the other.',
      mnemonic: 'Two ends, two sizes.' },
    { id: 'tenaculum', name: 'Single-tooth tenaculum', aliases: ['tenaculum', 'schroeder tenaculum', 'braun tenaculum', 'uterine tenaculum', 'schroeder', 'braun', 'single tooth tenaculum'], phase: 'stabilize', family: 'forceps', art: 'tenaculum',
      use: 'Grasps the anterior lip of the cervix to steady it and apply gentle traction, straightening the cervical-uterine angle before sounding and dilation.',
      look: 'Ratcheted handles, jaws curving down at the tip with a single sharp tooth.',
      mnemonic: 'ONE tooth, ONE grip on the anterior lip.' },
    { id: 'sound', name: 'Uterine sound', aliases: ['sound', 'uterine probe'], phase: 'measure', family: 'rods', art: 'sound',
      use: 'Thin, flexible, blunt-tipped probe with depth markings. Measures the depth and direction of the uterine cavity before dilation; the depth is documented.',
      look: 'Slender curved rod with a small ball tip and centimetre markings along the shaft.',
      mnemonic: '“Sound” the depth before you dilate.' },
    { id: 'hegar', name: 'Hegar dilators', aliases: ['hegar', 'hegar dilator', 'hegar dilators set'], phase: 'dilate', family: 'rods', art: 'hegar',
      use: 'Graduated, rigid, double-ended dilators sized in millimetres. Passed one after another in ascending size to gradually open the cervical canal.',
      look: 'A set of smooth, blunt-ended rods of increasing diameter, each with a different size at either end.',
      mnemonic: 'Hegar = graduated steps, mm sizes.' },
    { id: 'pratt', name: 'Pratt dilators', aliases: ['pratt', 'pratt dilator', 'pratt cervical dilator', 'hank', 'hank dilator'], phase: 'dilate', family: 'rods', art: 'pratt',
      use: 'Tapered, graduated cervical dilators, typically sized in French. Serve the same purpose as Hegar dilators: stepwise cervical dilation.',
      look: 'Single long rod with a knurled grip that tapers smoothly toward the tip.',
      mnemonic: 'Pratt is the taper (sized in French).' },
    { id: 'kevorkian', name: 'Kevorkian curette', aliases: ['kevorkian', 'endocervical curette', 'kevorkian curette (endocervical)', 'ecc curette'], phase: 'evacuate', family: 'curettes', art: 'kevorkian',
      use: 'Small sharp curette used for endocervical curettage - sampling the endocervical canal (done before dilation so the canal is not contaminated).',
      look: 'Slender shaft with an angled tip bearing a small spoon-shaped sampling cup.',
      mnemonic: 'Small and angled = the cervical canal sampler.' },
    { id: 'sharp', name: 'Sims sharp curette', aliases: ['sharp curette', 'sims curette', 'sims sharp', 'sharp sims curette', 'curette'], phase: 'evacuate', family: 'curettes', art: 'sharp',
      use: 'Spoon-shaped curette with a sharp cutting edge. Scrapes the uterine lining (endometrium) to obtain tissue for pathology.',
      look: 'Ribbed handle, thin shaft, and a solid oval spoon at the working end.',
      mnemonic: 'Solid spoon + sharp edge = scrape.' },
    { id: 'banjo', name: 'Thomas banjo curette', aliases: ['banjo curette', 'banjo', 'thomas curette', 'thomas', 'thomas banjo', 'wire loop curette'], phase: 'evacuate', family: 'curettes', art: 'banjo',
      use: 'Curette with an open wire loop (shaped like a banjo). Gently scrapes and collects endometrial tissue, with a gentler action than the solid sharp curette.',
      look: 'Ribbed handle and thin shaft ending in an open elongated loop - no solid cup.',
      mnemonic: 'A loop like a banjo’s body.' },
    { id: 'suction', name: 'Suction curette', aliases: ['karman cannula', 'novak curette', 'novak', 'karman', 'suction cannula', 'vacuum curette', 'cannula'], phase: 'evacuate', family: 'curettes', art: 'suction',
      use: 'Hollow cannula attached to suction tubing (or a syringe). Evacuates the uterine contents by vacuum aspiration.',
      look: 'Straight hollow tube with a connector hub on one end and side ports near the closed tip.',
      mnemonic: 'A hollow tube + ports = suction.' },
    { id: 'ovum', name: 'Ovum forceps', aliases: ['foerster ovum forceps', 'bierer', 'bierer ovum forceps', 'ovum forceps (foerster)'], phase: 'evacuate', family: 'forceps', art: 'ovum',
      use: 'Long forceps with fenestrated, serrated jaws that grasp and remove products of conception or larger tissue fragments from the uterus.',
      look: 'Ratcheted handles and two separate open oval jaws that stay apart.',
      mnemonic: 'Two open ovals = OVUM.' },
    { id: 'polyp', name: 'Polyp forceps', aliases: ['randall', 'uterine polyp forceps', 'polyp', 'polypectomy forceps'], phase: 'evacuate', family: 'forceps', art: 'polyp',
      use: 'Angled forceps with small cupped tips. Grasps endometrial or cervical polyps so they can be twisted free and removed.',
      look: 'Ratcheted handles with long jaws angling upward to small cupped tips.',
      mnemonic: 'The upturned tip hooks the polyp.' }
  ];

  root.DC_DATA = { PHASES, FAMILIES, INSTRUMENTS };
  if (typeof module !== 'undefined') module.exports = root.DC_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
