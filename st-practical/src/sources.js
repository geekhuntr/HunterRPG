(function (root) {
  const SOURCES = [
    ['Mayo scissors (Wikipedia)', 'https://en.wikipedia.org/wiki/Mayo_scissors', 'Straight vs curved Mayo; Metzenbaum comparison'],
    ['Red Cross catalogue: Mayo scissors', 'https://itemscatalogue.redcross.int/health--3/surgical-instruments--24/surgical-instruments--111/scissors-basic-dissecting-straightcurved-blunt-mayo--XSINMEDI035.aspx', 'Mayo uses'],
    ['Teleflex knife handles', 'https://us.myteleflex.com/All-Categories/Surgical-Instruments/General/Knife-Handles/p/su-KnifeHandles', '#3, #3L and #4 handle blade fit'],
    ['Senn retractor (Wikipedia)', 'https://en.wikipedia.org/wiki/Senn_retractor', 'Rake end and flat end'],
    ['UNFPA: Army-Navy retractor', 'https://globalsupply.unfpa.org/products/army-navy-retractors-double-ended-for-subumbilical-procedure-1002013.html', 'Double-ended, 90-degree blades'],
    ['Red Cross catalogue: Weitlaner', 'https://itemscatalogue.redcross.int/health--3/surgical-instruments--24/surgical-instruments--111/retractor-self-retaining-superficial-surgery-sharpblunt-weitlaner--XSINMEDI2422.aspx', 'Prongs, ratchet, uses'],
    ['Yankauer suction tip (Wikipedia)', 'https://en.wikipedia.org/wiki/Yankauer_suction_tip', 'Yankauer design and use'],
    ['Red Cross catalogue: Frazier, Yankauer, Poole', 'https://itemscatalogue.redcross.int/health--3/surgical-instruments--24/surgical-instruments--111/suction-tube-metal-chrome-plated-frazier-yankauer-poole--XSINMEDI098.aspx', 'Suction tip patterns'],
    ['Kelly vs Mosquito vs Crile (Ergodenta)', 'https://ergodenta.dk/blog/products-13/kelly-vs-mosquito-vs-crile-forceps-how-to-tell-them-apart-176', 'Crile and Kelly serrations'],
    ['Kelly clamps vs hemostats (WPI)', 'https://wpiinc.com/blog/post/kelly-clamps-vs-hemostats-whats-the-difference', 'Hemostat lengths and serrations'],
    ['Ochsner (Kocher) forceps (Teleflex)', 'https://us.myteleflex.com/Surgical-Instruments/General/Ochsner-Forceps-(Kocher),-Straight/p/su-OchsnerForcepsKocherStraight', 'Kocher/Ochsner 1×2 teeth'],
    ['Adson tissue forceps (Covetrus)', 'https://northamerica.covetrus.com/Product/printdetails?sku=004185', 'Adson 1×2 teeth, 4¾ in'],
    ['Hegar dilators (Wikipedia)', 'https://en.wikipedia.org/wiki/Hegar_dilators', 'Hegar rods'],
    ['Hank uterine dilators (Sklar / Avantor)', 'https://avantorsciences.com/us/en/product/17818469/hank-uterine-dilators-or-grade-sklar', 'Hank dilator description'],
    ['Goodell uterine dilator (MOHMA)', 'https://www.mohma.org/instruments/category/obstetrics_and_gynecology/uterine_dilator_goodells', 'Spreading dilator'],
    ['Sims’ vaginal speculum (Wikipedia)', 'https://en.wikipedia.org/wiki/Sims%27_vaginal_speculum', 'Hand-held, posterior wall'],
    ['KLS Martin: Jacobs tenaculum', 'https://klsmartin.com/shop/en/products/product/32-728-21-07', 'Jacobs tenaculum teeth'],
    ['Henry Schein: Bozeman uterine dressing forceps', 'https://www.henryschein.com/us-en/medical/p/medical-surgical-supplies/surgical-instruments/bozeman-uterine-drsng-frc/1208560', 'Bozeman use and shape'],
    ['GLOWM: Dilatation and curettage', 'https://www.glowm.com/section-view/heading/dilatation-and-curettage/item/37', 'D&C sequence']
  ];
  const NOT_SOURCED = 'Sponge-stick ring jaws, hemoclip applier, rake retractor, polyp forceps, endocervical curette, smooth/toothed long forceps, bowls';
  root.ST_SOURCES = { list: SOURCES, notSourced: NOT_SOURCED };
  if (typeof module !== 'undefined') module.exports = root.ST_SOURCES;
})(typeof window !== 'undefined' ? window : globalThis);
