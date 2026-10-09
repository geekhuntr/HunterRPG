/* Spaced-repetition scheduler (SM-2 style with Anki-like learning steps) plus
   queue building, mastery scoring and confusion-aware distractor selection.
   Each instrument has two independent "facets":
     see  - visual recognition  (image -> name)
     know - recall of knowledge (function -> name, typed names)
   Pure functions only, so it can be unit-tested in Node. */
(function (root) {
  const MIN = 60e3, DAY = 864e5;
  const FACETS = ['see', 'know'];
  const CFG = {
    learningSteps: [1, 10],   // minutes
    relearnSteps: [10],       // minutes after a lapse
    graduateDays: 1,
    easyDays: 4,
    startEase: 2.5,
    minEase: 1.3,
    lapseFactor: 0.3,         // interval multiplier after a lapse
    hardFactor: 1.2,
    easyBonus: 1.3,
    maxInterval: 365,
    learnAheadMin: 10
  };
  // grade: 0 Again, 1 Hard, 2 Good, 3 Easy

  function newCard() {
    return { state: 'new', step: 0, ease: CFG.startEase, interval: 0, due: 0, reps: 0, lapses: 0, streak: 0, seen: 0, correct: 0, last: 0 };
  }

  function schedule(card, grade, now) {
    const c = Object.assign({}, card);
    c.seen++; c.reps++; c.last = now;
    if (grade >= 2) { c.correct++; c.streak++; } else { c.streak = 0; }
    if (grade === 1) c.correct++;

    if (c.state === 'new' || c.state === 'learning' || c.state === 'relearning') {
      const steps = c.state === 'relearning' ? CFG.relearnSteps : CFG.learningSteps;
      if (c.state === 'new') { c.state = 'learning'; c.step = 0; }
      if (grade === 0) {
        c.step = 0; c.due = now + steps[0] * MIN;
      } else if (grade === 1) {
        c.due = now + steps[Math.min(c.step, steps.length - 1)] * 1.5 * MIN;
      } else if (grade === 2) {
        c.step++;
        if (c.step >= steps.length) graduate(c, c.state === 'relearning' ? Math.max(1, c.interval) : CFG.graduateDays, now);
        else c.due = now + steps[c.step] * MIN;
      } else {
        graduate(c, c.state === 'relearning' ? Math.max(2, Math.round(c.interval * 1.5)) : CFG.easyDays, now);
      }
      return c;
    }

    // review
    const overdue = Math.max(0, (now - c.due) / DAY);
    if (grade === 0) {
      c.lapses++;
      c.ease = Math.max(CFG.minEase, c.ease - 0.2);
      c.interval = Math.max(1, Math.round(c.interval * CFG.lapseFactor));
      c.state = 'relearning'; c.step = 0;
      c.due = now + CFG.relearnSteps[0] * MIN;
    } else {
      let iv;
      if (grade === 1) { c.ease = Math.max(CFG.minEase, c.ease - 0.15); iv = c.interval * CFG.hardFactor; }
      else if (grade === 2) { iv = (c.interval + overdue / 2) * c.ease; }
      else { c.ease += 0.15; iv = (c.interval + overdue) * c.ease * CFG.easyBonus; }
      iv = Math.max(Math.round(iv), c.interval + 1);
      graduate(c, Math.min(iv, CFG.maxInterval), now);
    }
    return c;
  }

  function graduate(c, days, now) {
    c.state = 'review'; c.step = 0; c.interval = days; c.due = now + days * DAY;
  }

  // Estimated recall probability (0..1) assuming 90% retention at the due date.
  function retrievability(c, now) {
    if (c.state === 'new') return 0;
    if (c.state !== 'review') return 0.5;
    const elapsed = Math.max(0, (now - c.last) / DAY);
    return Math.pow(0.9, elapsed / Math.max(c.interval, 0.01));
  }

  // 0..1 mastery used for the progress UI: long stable intervals = mastered.
  function mastery(c, now) {
    if (!c || c.state === 'new') return 0;
    if (c.state === 'learning') return 0.1 + 0.05 * c.step;
    if (c.state === 'relearning') return 0.15;
    const stability = Math.min(1, Math.log(1 + c.interval) / Math.log(1 + 21));
    return Math.max(0.2, stability * (0.5 + 0.5 * retrievability(c, now)));
  }

  // Convert how a quiz answer went into a grade.
  function gradeFromAnswer({ correct, ms = 5000, close = false, streak = 0 }) {
    if (!correct) return 0;
    if (close) return 1;
    if (ms > 9000) return 1;
    if (ms < 3000 && streak >= 2) return 3;
    return 2;
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  // Typed-answer check: returns 'exact' | 'close' | 'wrong'.
  function checkTyped(input, inst) {
    const x = norm(input);
    if (!x) return 'wrong';
    const names = [inst.name, ...(inst.aliases || [])].map(norm);
    if (names.includes(x)) return 'exact';
    for (const n of names) {
      const tol = n.length <= 6 ? 1 : 2;
      if (levenshtein(x, n) <= tol) return 'close';
    }
    return 'wrong';
  }

  const key = (id, facet) => id + '|' + facet;

  // Order work for a session: learning cards, then due reviews (weakest recall first),
  // with new cards folded in, never showing the same instrument back-to-back.
  function buildQueue(cards, ids, now, { newLimit = 10, newDone = 0, facets = FACETS } = {}) {
    const learning = [], reviews = [], fresh = [];
    for (const id of ids) for (const f of facets) {
      const c = cards[key(id, f)] || newCard();
      const item = { id, facet: f };
      if (c.state === 'new') fresh.push(item);
      else if (c.state === 'review') { if (c.due <= now) reviews.push({ item, r: retrievability(c, now) }); }
      else if (c.due <= now + CFG.learnAheadMin * MIN) learning.push({ item, due: c.due });
    }
    learning.sort((a, b) => a.due - b.due);
    reviews.sort((a, b) => a.r - b.r);
    const news = fresh.slice(0, Math.max(0, newLimit - newDone));
    const rest = [];
    const rv = reviews.map(x => x.item), nw = news.slice();
    while (rv.length || nw.length) {
      for (let i = 0; i < 3 && rv.length; i++) rest.push(rv.shift());
      if (nw.length) rest.push(nw.shift());
    }
    return spread([...learning.map(x => x.item), ...rest]);
  }

  // Practice-anything queue (cram): weakest first, ignores due dates.
  function buildCram(cards, ids, now, count = 20, facets = FACETS) {
    const all = [];
    for (const id of ids) for (const f of facets) all.push({ item: { id, facet: f }, m: mastery(cards[key(id, f)], now) + Math.random() * 0.15 });
    all.sort((a, b) => a.m - b.m);
    return spread(all.slice(0, count).map(x => x.item));
  }

  // Keep priority order, but never put the same instrument twice in a row when avoidable.
  function spread(list) {
    const rest = list.slice(), out = [];
    while (rest.length) {
      const prev = out.length ? out[out.length - 1].id : null;
      let k = rest.findIndex(x => x.id !== prev);
      if (k < 0) k = 0;
      out.push(rest.splice(k, 1)[0]);
    }
    return out;
  }

  // Wrong-answer options: look-alikes (same family), same-phase, and the instruments
  // this learner has actually confused with the target before score highest.
  function pickDistractors(target, all, confusions, n = 3, rnd = Math.random) {
    const conf = (confusions && confusions[target.id]) || {};
    return all.filter(x => x.id !== target.id)
      .map(x => ({ x, s: (x.family === target.family ? 3 : 0) + (x.phase === target.phase ? 2 : 0) + (conf[x.id] || 0) * 2.5 + rnd() * 2 }))
      .sort((a, b) => b.s - a.s).slice(0, n).map(o => o.x);
  }

  function fmtInterval(card, grade, now) {
    const n = schedule(card, grade, now);
    const ms = n.due - now;
    if (ms < 60 * MIN) return Math.max(1, Math.round(ms / MIN)) + 'm';
    if (ms < DAY) return Math.round(ms / (60 * MIN)) + 'h';
    const d = Math.round(ms / DAY);
    return d < 60 ? d + 'd' : Math.round(d / 30) + 'mo';
  }

  const api = { CFG, FACETS, MIN, DAY, newCard, schedule, retrievability, mastery, gradeFromAnswer, checkTyped, levenshtein, buildQueue, buildCram, pickDistractors, fmtInterval, key };
  root.SRS = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
