/* Stylized SVG illustrations of each instrument (viewBox 240x120, working end on the right).
   Meant for learning shape cues; users can replace them with photos of their own tray. */
(function (root) {
  // Thick steel bar: dark outline stroke with a lighter stroke on top.
  const bar = (d, w = 7) => `<path class="ln" stroke-width="${w}" d="${d}"/><path class="ln2" stroke-width="${w - 3}" d="${d}"/>`;
  const rings = `<circle class="st" cx="22" cy="34" r="14"/><circle class="st" cx="22" cy="86" r="14"/>
    ${bar('M33 41 L124 64')}${bar('M33 79 L124 56')}<circle class="st" cx="78" cy="60" r="5"/>
    <path class="hl" d="M52 55 l6 1 M56 63 l6 -1 M60 59 h5"/>`;
  const ribs = (x1, x2, y1, y2) => { let s = ''; for (let x = x1; x <= x2; x += 7) s += `M${x} ${y1} V${y2} `; return `<path class="hl" d="${s}"/>`; };

  const ART = {
    towel: rings + bar('M124 56 Q175 36 208 70', 6) + bar('M124 64 Q175 84 208 64', 6) +
      '<path class="st" d="M204 62 l12 8 l-12 4 z"/><path class="st" d="M204 70 l12 -2 l-8 8 z"/>',
    ring: rings + bar('M124 56 L186 58', 6) + bar('M124 64 L186 62', 6) +
      '<ellipse class="st open" cx="208" cy="60" rx="24" ry="12"/><path class="hl" d="M190 53 v14 M198 49 v22 M206 48 v24 M214 48 v24 M222 50 v20"/>',
    graves: `<path class="st" d="M92 40 L222 32 Q238 42 226 58 L92 58 Z"/><path class="st" d="M92 62 L226 62 Q238 78 222 88 L92 80 Z"/>
      ${bar('M92 50 L36 26')}${bar('M92 70 L36 94')}<circle class="st" cx="30" cy="22" r="8"/><circle class="st" cx="30" cy="98" r="8"/>
      <circle class="st" cx="92" cy="60" r="6"/><rect class="st" x="58" y="53" width="22" height="14" rx="4"/><path class="hl" d="M62 56 v8 M67 56 v8 M72 56 v8"/>`,
    auvard: `<rect class="st" x="8" y="58" width="58" height="50" rx="14"/><path class="hl" d="M20 70 q10 -6 28 0"/>
      ${bar('M66 82 L112 60', 10)}${bar('M112 60 L112 22', 8)}<circle class="st" cx="112" cy="16" r="8"/>
      <path class="st" d="M104 46 L214 46 Q238 50 236 72 L214 80 L104 66 Z"/><path class="hl" d="M126 54 L214 54"/>`,
    sims: `${bar('M34 62 L206 62', 8)}<path class="st" d="M6 36 H44 Q50 62 44 88 H6 Q-1 62 6 36 Z"/>
      <path class="st" d="M200 46 H228 Q238 62 228 78 H200 Z"/><path class="hl" d="M14 48 H36 M14 62 H38 M14 76 H36"/>`,
    tenaculum: rings + bar('M124 56 L190 56', 6) + bar('M124 64 L186 64', 6) + bar('M190 56 Q216 56 218 86', 6) + bar('M186 64 Q204 64 206 84', 5) +
      '<path class="st" d="M214 84 l8 0 l-4 16 z"/><path class="hl" d="M44 50 l8 3 M48 56 l8 3 M42 66 l8 -3"/>',
    sound: `<rect class="st" x="6" y="50" width="66" height="20" rx="8"/>${ribs(16, 62, 54, 66)}
      <path class="ln" stroke-width="6" fill="none" d="M72 60 Q150 60 224 46"/><path class="ln2" stroke-width="3" fill="none" d="M72 60 Q150 60 224 46"/>
      <circle class="st" cx="228" cy="45" r="5"/><path class="hl" d="M110 54 v12 M130 54 v12 M150 53 v12 M170 52 v12 M190 50 v12 M210 47 v12"/>`,
    hegar: [[28, 7, 'M6'], [60, 11, 'M7'], [92, 15, 'M8']].map(([y, w]) =>
      `<path class="ln" stroke-width="${w + 3}" stroke-linecap="round" d="M14 ${y} H226"/><path class="ln2" stroke-width="${w}" stroke-linecap="round" d="M14 ${y} H226"/>
       <rect class="st" x="98" y="${y - w / 2 - 3}" width="44" height="${w + 6}" rx="3"/>`).join(''),
    pratt: `<rect class="st" x="6" y="46" width="80" height="28" rx="9"/>${ribs(16, 78, 50, 70)}
      <path class="st" d="M84 49 L226 56 Q232 60 226 64 L84 71 Z"/><path class="hl" d="M96 54 L214 59"/>`,
    kevorkian: `<rect class="st" x="6" y="44" width="68" height="22" rx="8"/>${ribs(16, 64, 48, 62)}
      ${bar('M74 55 L172 55', 5)}${bar('M172 55 L202 82', 5)}<ellipse class="st" cx="214" cy="92" rx="20" ry="8" transform="rotate(38 214 92)"/>
      <path class="st" d="M196 96 l-4 8 l10 -3 z"/>`,
    sharp: `<rect class="st" x="6" y="46" width="76" height="24" rx="9"/>${ribs(16, 72, 50, 66)}
      ${bar('M82 58 L184 58', 5)}<ellipse class="st" cx="208" cy="58" rx="26" ry="12"/><path class="hl" d="M190 52 Q208 46 228 54"/>
      <path class="edge" d="M184 58 Q196 44 220 46 Q236 54 220 70 Q196 72 184 58 Z"/>`,
    banjo: `<rect class="st" x="6" y="46" width="76" height="24" rx="9"/>${ribs(16, 72, 50, 66)}
      ${bar('M82 58 L160 58', 5)}<rect class="st open thin" x="160" y="44" width="70" height="28" rx="14"/>`,
    suction: `<rect class="st" x="6" y="46" width="30" height="26" rx="4"/><rect class="st" x="34" y="40" width="16" height="38" rx="4"/><path class="hl" d="M12 52 v14 M18 52 v14 M24 52 v14"/>
      <path class="st" d="M50 50 H218 Q234 50 234 59 Q234 68 218 68 H50 Z"/>
      <ellipse class="port" cx="176" cy="59" rx="8" ry="5"/><ellipse class="port" cx="200" cy="59" rx="8" ry="5"/><path class="hl" d="M60 54 H160"/>`,
    ovum: rings + bar('M124 56 L170 52', 6) + bar('M124 64 L170 70', 6) +
      '<ellipse class="st open" cx="200" cy="46" rx="22" ry="10" transform="rotate(-10 200 46)"/><ellipse class="st open" cx="200" cy="76" rx="22" ry="10" transform="rotate(10 200 76)"/>',
    polyp: rings + bar('M124 56 L186 56 Q204 56 212 38', 6) + bar('M124 64 L190 64 Q214 64 222 44', 6) +
      '<ellipse class="st" cx="220" cy="36" rx="9" ry="6" transform="rotate(-55 220 36)"/><ellipse class="st" cx="230" cy="42" rx="8" ry="5" transform="rotate(-50 230 42)"/>'
  };

  function art(key, label) {
    return `<svg class="art" viewBox="0 0 240 120" role="img" aria-label="${label || key}" xmlns="http://www.w3.org/2000/svg">${ART[key] || ''}</svg>`;
  }
  root.DC_ART = art;
})(window);
