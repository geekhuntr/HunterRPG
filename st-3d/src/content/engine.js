/* Study engine: no DOM. Prioritisation, alias matching, distractor and question building. */
(function (root) {
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---- progress ----
  // prog[id] = { n, c, p, w, box 0..4, last 'c'|'p'|'w' }
  function mark(prog, id, res) {
    const p = prog[id] || (prog[id] = { n: 0, c: 0, p: 0, w: 0, box: 0, last: '' });
    p.n++; p[res]++; p.last = res;
    if (res === 'c') p.box = Math.min(4, p.box + 1);
    else if (res === 'w') p.box = 0;
    return p;
  }
  const isMissed = (prog, id) => !!prog[id] && (prog[id].last === 'w' || prog[id].last === 'p');
  const isMastered = (prog, id) => !!prog[id] && prog[id].box >= 3 && prog[id].last === 'c';
  function weight(prog, id) {
    const p = prog[id];
    if (!p) return 3;
    let w = [5, 3, 2, 1, 0.5][p.box];
    if (p.last === 'w') w += 3; else if (p.last === 'p') w += 1.5;
    return w;
  }
  // Weighted random order: missed and unseen items tend to come first.
  function priorityOrder(prog, list, rnd = Math.random) {
    return list.map(r => ({ r, k: -Math.log(rnd() || 1e-9) / weight(prog, r.id) })).sort((a, b) => a.k - b.k).map(x => x.r);
  }

  // ---- text matching ----
  const STOP = new Set(['forcep', 'forceps', 'clamp', 'clamps', 'scissor', 'scissors', 'hemostat', 'tip', 'suction', 'tissue', 'the', 'a', 'an', 'of', 'dilator', 'dilators', 'retractor', 'clip']);
  function tokens(s) {
    let t = String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9#]+/g, ' ').trim().split(' ').filter(Boolean);
    t = t.map(w => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
    const kept = t.filter(w => !STOP.has(w));
    return (kept.length ? kept : t).sort();
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n];
  }
  // 'exact' | 'close' | 'wrong'. aliases = everything the instructor or standard names call it.
  function checkName(input, rec) {
    const x = tokens(input);
    if (!x.length) return 'wrong';
    const xs = x.join(' ');
    let best = 99;
    for (const a of rec.allAliases) {
      const t = tokens(a), ts = t.join(' ');
      if (ts === xs) return 'exact';
      const tol = ts.length <= 5 ? 1 : 2;
      const d = lev(xs, ts);
      if (d <= tol) best = Math.min(best, d);
    }
    if (best < 99) return 'close';
    if (rec.fam && tokens(rec.fam).join(' ') === xs) return 'close';
    return 'wrong';
  }

  // ---- question building ----
  // Distractors come from OTHER quiz groups only, so two answers can never both be right.
  function pickDistractors(rec, pool, n = 3, rnd = Math.random) {
    const cands = pool.filter(x => x.g !== rec.g && x.quiz).map(x => ({ x, s: (x.cat === rec.cat ? 2 : 0) + rnd() * 2 })).sort((a, b) => b.s - a.s);
    const out = [], seenG = new Set(), seenFn = new Set([rec.fn]);
    for (const { x } of cands) {
      if (seenG.has(x.g) || seenFn.has(x.fn)) continue;
      out.push(x); seenG.add(x.g); seenFn.add(x.fn);
      if (out.length === n) break;
    }
    return out;
  }
  // type A: name -> which function; type B: function -> which name
  function buildQuestion(rec, type, pool) {
    const choices = shuffle([rec, ...pickDistractors(rec, pool)]);
    return { id: rec.id, t: type, choices: choices.map(c => c.id), answer: rec.id, chosen: null };
  }

  const api = { shuffle, mark, isMissed, isMastered, weight, priorityOrder, tokens, lev, checkName, pickDistractors, buildQuestion };
  root.ST_ENGINE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
