(function () {
  'use strict';
  const E = window.ST_ENGINE, { CATS, RECORDS, FLAGS } = window.ST_DATA, COMPARES = window.ST_COMPARE, SRC = window.ST_SOURCES, PHOTO0 = window.ST_PHOTOS || {};
  const TRAYS = ['Minor', 'Major', 'D&C'];
  const ROWS = window.ST_ROWS.map(r => ({ id: r[0], tray: r[1], wording: r[2], qty: r[3], note: r[4], rec: r[5], variant: r[6], flag: r[7] }));
  const byId = {};
  RECORDS.forEach(r => { byId[r.id] = r; r.rows = []; });
  ROWS.forEach(w => byId[w.rec].rows.push(w));
  RECORDS.forEach(r => {
    r.trays = TRAYS.filter(t => r.rows.some(w => w.tray === t));
    r.allAliases = [...new Set([r.name, ...r.aliases, ...r.rows.map(w => w.wording)])];
    r.flagIds = [...new Set([...(r.flags || []), ...r.rows.map(w => w.flag).filter(Boolean)])];
  });
  const rowsFor = (r, tray) => r.rows.filter(w => w.tray === tray);
  const trayQty = (r, tray) => rowsFor(r, tray).reduce((a, w) => a + w.qty, 0);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const shuffle = E.shuffle;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // ---------- persistence (localStorage may be blocked: everything works without it) ----------
  const KEY = 'stp.v1';
  const defaults = () => ({ theme: 'system', filters: { tray: 'All', cat: 'all', fav: false, missed: false }, prog: {}, fav: {}, confirmed: {}, photos: {}, qty: {},
    set: { fcDir: 'nf', fcOrder: 'smart', qType: 'mixed', qLen: 10, rType: 'name', rLen: 10, pLen: 10, cType: 'mixed', cLen: 10 } });
  let S = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}'), d = defaults();
    S = Object.assign(d, raw, { filters: Object.assign(d.filters, raw.filters), set: Object.assign(d.set, raw.set) });
  } catch (e) { /* in-memory only */ }
  let warned = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { if (!warned) { warned = true; toast('Progress cannot be saved in this browser. It will last until you close the page.'); } }
  }
  function applyTheme() {
    const r = document.documentElement;
    if (S.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
  }
  let toastT;
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:12px 16px;border-radius:12px;max-width:90vw;z-index:20;font-weight:700'; document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4000);
  }

  // ---------- deck ----------
  const isMissed = id => E.isMissed(S.prog, id);
  function deck(quizOnly) {
    const f = S.filters;
    return RECORDS.filter(r => (f.tray === 'All' || r.trays.includes(f.tray)) && (f.cat === 'all' || r.cat === f.cat) && (!f.fav || S.fav[r.id]) && (!f.missed || isMissed(r.id)) && (!quizOnly || r.quiz));
  }
  const photoOf = id => S.photos[id] || PHOTO0[id] || null;
  const photoCredit = id => (S.photos[id] ? 'Photo: uploaded by you.' : 'Photo: your D&C tray (class lab photo), handwritten labels removed.');
  const verChip = r => ({ s: '<span class="chip ver-s">Checked against references</span>', g: '<span class="chip ver-g">General teaching, not sourced</span>', u: '<span class="chip ver-u">Unconfirmed</span>' }[r.ver] || '');
  const flagChip = r => (r.flagIds.some(f => !S.confirmed[f]) ? '<span class="chip warn">Needs confirmation</span>' : '');
  const trayChips = r => r.trays.map(t => `<span class="chip"><span>${esc(t)}</span> <span class="q">×${trayQty(r, t)}</span></span>`).join('');
  const explain = r => `<p><b>${esc(r.name)}:</b> ${esc(r.fn)}</p><p><b>Look for:</b> ${esc(r.feat[0])}.</p>` +
    (r.conf ? `<p><b>Often confused with ${esc(r.conf.name)}:</b> ${esc(r.conf.diff)}</p>` : '<p>No confusable pair is given for this item; confirm details with your instructor.</p>');
  const empty = msg => `<div class="panel empty"><p>${esc(msg)}</p><p>Change the filters above to widen the deck.</p></div>`;
  const prog = (a, b) => `<div class="meter acc" role="progressbar" aria-valuemin="0" aria-valuemax="${b}" aria-valuenow="${a}"><i style="width:${pct(a, b)}%"></i></div>`;
  const lenOpts = (cur, name) => [[10, '10 questions'], [20, '20 questions'], [0, 'Full deck']].map(([v, l]) => `<button class="btn" data-act="set" data-k="${name}" data-v="${v}" aria-pressed="${+cur === v}">${l}</button>`).join('');
  const segOpts = (cur, name, opts) => opts.map(([v, l]) => `<button class="btn" data-act="set" data-k="${name}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('');
  const sliceLen = (list, n) => (n ? list.slice(0, n) : list);

  // ---------- sessions (reset whenever filters change) ----------
  let FC = null, QZ = null, RC = null, MT = null, PH = null, CQ = null, REFQ = '', REFOPEN = {}, CMPHIDE = false, CMPSHOW = {}, RESET_ARMED = false, ordOpen = false;
  const invalidate = () => { FC = QZ = RC = MT = PH = CQ = null; };

  // ---------- shell ----------
  const TABS = [['cards', 'Flashcards'], ['quiz', 'Quiz'], ['recall', 'Written recall'], ['match', 'Matching'], ['compare', 'Compare'], ['photos', 'Photo ID'], ['counts', 'Quantities'], ['table', 'Reference'], ['progress', 'Progress'], ['sources', 'Sources']];
  let tab = (location.hash || '').replace('#', '');
  if (!TABS.some(t => t[0] === tab)) tab = 'cards';
  let moreOpen = false;
  const app = $('#app');

  function render() {
    const d = deck();
    const mastered = d.filter(r => E.isMastered(S.prog, r.id)).length, missed = d.filter(r => isMissed(r.id)).length;
    const f = S.filters;
    app.innerHTML = `
      <div class="top"><div class="brand"><b>ST</b> Instrument Practical</div>
        <button class="btn sm" data-act="theme" aria-label="Color theme: ${S.theme}. Tap to change.">${S.theme[0].toUpperCase() + S.theme.slice(1)} mode</button></div>
      <nav class="tabs" aria-label="Study modes">${TABS.map(([k, l]) => `<button class="tab" data-act="tab" data-v="${k}" ${k === tab ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</nav>
      ${tab === 'sources' ? '' : `<section class="deckbar" aria-label="Deck filters">
        <div class="seg" role="group" aria-label="Tray">${[['All', 'All', 'All instruments'], ['Minor', 'Minor', 'Minor tray'], ['Major', 'Major', 'Major tray'], ['D&C', 'D&C', 'D&C tray']].map(([v, l, a]) => `<button class="btn" data-act="tray" data-v="${esc(v)}" aria-label="${a}" aria-pressed="${f.tray === v}">${l}</button>`).join('')}</div>
        <details class="more" ${moreOpen ? 'open' : ''}><summary>More filters${f.cat !== 'all' || f.fav || f.missed ? ' (active)' : ''}</summary><div class="grid">
          <label class="field">Category<select id="f-cat"><option value="all">All categories</option>${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${f.cat === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="check"><input type="checkbox" id="f-fav" ${f.fav ? 'checked' : ''}> Favorites only</label>
          <label class="check"><input type="checkbox" id="f-missed" ${f.missed ? 'checked' : ''}> Missed items only</label></div></details>
        <div class="deckstat"><span><b>${d.length}</b> instruments</span><span><b>${mastered}</b> mastered</span><span><b>${missed}</b> missed</span>${prog(mastered, d.length || 1)}</div>
      </section>`}
      <main id="view" tabindex="-1">${views[tab]()}</main>`;
    afterRender();
  }
  function afterRender() {
    if (tab === 'recall' && RC && RC.phase === 'run') { const el = $('#rc-text') || $('#rc-name'); if (el && !el.disabled) el.focus(); }
    if (tab === 'counts' && CQ && CQ.phase === 'run') { const b = $('[data-act="cnext"]'); if (b) b.focus(); }
    if ((tab === 'quiz' && QZ && QZ.phase === 'run' && QZ.qs[QZ.i].chosen !== null) || (tab === 'photos' && PH && PH.phase === 'run' && PH.qs[PH.i].chosen !== null)) { const b = $('[data-act="qnext"]') || $('[data-act="pnext"]'); if (b) b.focus(); }
  }

  const views = { cards: viewCards, quiz: viewQuiz, recall: viewRecall, match: viewMatch, compare: viewCompare, photos: viewPhotos, counts: viewCounts, table: viewTable, progress: viewProgress, sources: viewSources };

  // ---------- 1. flashcards ----------
  function fcBuild(only) {
    let list = only ? only.map(i => byId[i]) : deck();
    const o = S.set.fcOrder;
    list = o === 'shuffle' ? shuffle(list) : o === 'az' ? list.slice().sort((a, b) => a.name.localeCompare(b.name)) : E.priorityOrder(S.prog, list);
    FC = { ids: list.map(r => r.id), i: 0, flip: false, know: 0, again: 0, againSet: new Set() };
  }
  function viewCards() {
    if (!FC) fcBuild();
    const n = FC.ids.length;
    if (!n) return empty('No instruments match these filters.');
    const dirBtns = segOpts(S.set.fcDir, 'fcDir', [['nf', 'Name → Function'], ['fn', 'Function → Name']]);
    const ordBtns = segOpts(S.set.fcOrder, 'fcOrder', [['smart', 'Smart order'], ['shuffle', 'Shuffled'], ['az', 'A–Z']]);
    const opts = `<div class="opt-set"><div class="seg two" role="group" aria-label="Card direction">${dirBtns}</div><details class="mini-more" ${ordOpen ? 'open' : ''}><summary>Order and shuffle</summary><div class="seg" role="group" aria-label="Order" style="padding-top:6px">${ordBtns}<button class="btn" data-act="fcshuffle">Shuffle now</button></div></details></div>`;
    if (FC.i >= n) {
      const miss = [...FC.againSet];
      return `${opts}<div class="panel" style="margin-top:14px"><h2>Round complete</h2><p class="fnline">You marked <b>${FC.know}</b> as known and <b>${FC.again}</b> to study again.</p>
        <div class="row"><button class="btn pri" data-act="fcrestart">Restart deck</button>${miss.length ? `<button class="btn" data-act="fcmissed">Study the ${miss.length} marked again</button>` : ''}</div></div>`;
    }
    const r = byId[FC.ids[FC.i]], nf = S.set.fcDir === 'nf';
    let face;
    if (!FC.flip) face = nf ? `<span class="lab">Instrument</span><div class="name">${esc(r.name)}</div><span class="hint">Tap to flip and see the function</span>`
      : `<span class="lab">Which instrument is this?</span><p class="fnline">${esc(r.stem)}</p><span class="hint">Tap to flip and see the name</span>`;
    else face = (nf ? `<span class="lab">Function</span><p class="fnline">${esc(r.fn)}</p>` : `<span class="lab">Instrument</span><div class="name">${esc(r.name)}</div><p class="attr">Also called: ${esc(r.allAliases.filter(a => a !== r.name).slice(0, 5).join(', ') || 'no other names listed')}</p><span class="lab">Function</span><p>${esc(r.fn)}</p>`) +
      `<span class="lab">Key identifying features</span><ul class="feat">${r.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
       <div class="chips"><span class="chip cat">${esc(CATS[r.cat])}</span>${trayChips(r)}${flagChip(r)}</div>`;
    return `${opts}<div class="sess-head" style="margin-top:14px">${prog(FC.i, n)}<span class="count">${FC.i + 1} / ${n}</span></div>
      <div class="flash ${FC.flip ? 'back' : ''}" role="button" tabindex="0" data-act="flip" aria-label="${FC.flip ? 'Answer shown. Activate to hide.' : 'Activate to flip card'}">${face}</div>
      <div class="fc-actions"><button class="btn" data-act="fcprev" ${FC.i === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn bad" data-act="fcagain">Study again</button><button class="btn ok" data-act="fcknow">Know it</button>
        <button class="btn" data-act="fcnext">Next</button>
        <button class="btn" data-act="fav" data-v="${r.id}" aria-pressed="${!!S.fav[r.id]}">${S.fav[r.id] ? 'Favorited' : 'Add favorite'}</button></div>
      <p class="kbd">Space flips · ← → move · the answer stays hidden until you flip</p>`;
  }

  // ---------- 2. multiple-choice quiz ----------
  const quizPool = () => RECORDS.filter(r => r.quiz);
  function qzStart(ids) {
    let targets = ids ? ids.map(i => byId[i]) : deck(true);
    if (!targets.length) { QZ = { phase: 'setup', msg: 'No quizzable instruments match these filters.' }; return; }
    targets = sliceLen(E.priorityOrder(S.prog, targets), ids ? 0 : S.set.qLen);
    const t = S.set.qType;
    QZ = { phase: 'run', i: 0, score: 0, res: [], qs: targets.map(r => E.buildQuestion(r, t === 'mixed' ? (Math.random() < 0.5 ? 'A' : 'B') : t, quizPool())) };
  }
  function viewQuiz() {
    if (!QZ || QZ.phase === 'setup') {
      const n = deck(true).length, skipped = deck().length - n;
      return `<div class="panel"><h2>Multiple-choice quiz</h2>${QZ && QZ.msg ? `<p class="chip warn">${esc(QZ.msg)}</p>` : ''}
        <div class="opt-set"><span class="lab">Question type</span><div class="seg" role="group">${segOpts(S.set.qType, 'qType', [['mixed', 'Mixed'], ['A', 'What is this used for?'], ['B', 'Which instrument does this?']])}</div>
        <span class="lab">Length</span><div class="seg" role="group">${lenOpts(S.set.qLen, 'qLen')}</div></div>
        <p class="attr">${n} instruments in this deck can be quizzed${skipped ? `; ${skipped} flagged as unconfirmed are left out` : ''}. Every question has one best answer.</p>
        <button class="btn pri" data-act="qstart" ${n ? '' : 'disabled'}>Start quiz</button></div>`;
    }
    if (QZ.phase === 'done') {
      const miss = QZ.res.filter(x => !x.ok);
      return `<div class="panel"><span class="lab">Final score</span><div class="score">${QZ.score} / ${QZ.qs.length}</div><p class="fnline">${pct(QZ.score, QZ.qs.length)}% correct</p>
        ${miss.length ? `<div><span class="lab">Missed</span><ul class="feat">${miss.map(x => `<li><b>${esc(byId[x.id].name)}</b>: ${esc(byId[x.id].fn)}</li>`).join('')}</ul></div>` : '<p class="fnline">No misses.</p>'}
        <div class="row">${miss.length ? `<button class="btn pri" data-act="qretry">Retry the ${miss.length} missed</button>` : ''}<button class="btn" data-act="qnew">New quiz</button></div></div>`;
    }
    const q = QZ.qs[QZ.i], r = byId[q.id], done = q.chosen !== null;
    const head = q.t === 'A' ? `<span class="lab">What is this instrument used for?</span><h2 class="qname">${esc(r.name)}</h2>` : `<span class="lab">Which instrument performs this function?</span><p class="fnline">${esc(r.stem)}</p>`;
    const ch = q.choices.map((id, k) => {
      const c = byId[id], cls = done ? (id === q.answer ? 'right' : (k === q.chosen ? 'wrong' : '')) : '';
      return `<button class="choice ${cls}" data-act="qans" data-v="${k}" ${done ? 'disabled' : ''}><span class="L">${'ABCD'[k]}</span><span>${esc(q.t === 'A' ? c.fn : c.name)}</span></button>`;
    }).join('');
    let fb = '';
    if (done) { const ok = q.choices[q.chosen] === q.answer; fb = `<div class="fb ${ok ? 'ok' : 'no'}" role="status"><h3>${ok ? 'Correct' : 'Not quite'}</h3>${explain(r)}</div><button class="btn pri" data-act="qnext">${QZ.i + 1 === QZ.qs.length ? 'See score' : 'Next question'}</button>`; }
    return `<div class="sess-head">${prog(QZ.i + (done ? 1 : 0), QZ.qs.length)}<span class="count">${QZ.i + 1} / ${QZ.qs.length} · ${QZ.score} correct</span><button class="btn sm" data-act="qnew" aria-label="End session">End</button></div>
      <div class="panel">${head}<div class="choices" role="group" aria-label="Answer choices">${ch}</div>${fb}</div><p class="kbd">Keys 1–4 choose · Enter continues</p>`;
  }

  // ---------- 3. written recall ----------
  function rcStart(ids) {
    let t = ids ? ids.map(i => byId[i]) : deck(true);
    if (!t.length) { RC = { phase: 'setup', msg: 'No instruments match these filters.' }; return; }
    t = sliceLen(E.priorityOrder(S.prog, t), ids ? 0 : S.set.rLen);
    RC = { phase: 'run', dir: S.set.rType, ids: t.map(r => r.id), i: 0, shown: false, text: '', pending: null, res: [] };
  }
  function viewRecall() {
    if (!RC || RC.phase === 'setup') {
      return `<div class="panel"><h2>Written recall</h2>${RC && RC.msg ? `<p class="chip warn">${esc(RC.msg)}</p>` : ''}
        <div class="opt-set"><span class="lab">You type</span><div class="seg" role="group">${segOpts(S.set.rType, 'rType', [['name', 'Function (self-graded)'], ['fn', 'Instrument name (auto-checked)']])}</div>
        <span class="lab">Length</span><div class="seg" role="group">${lenOpts(S.set.rLen, 'rLen')}</div></div>
        <p class="attr">${S.set.rType === 'name' ? 'You see the instrument name and type its function. Reveal the model answer, then grade yourself so wording differences do not count against you.' : 'You see a description and type the name. Common aliases and small spelling errors are accepted.'}</p>
        <button class="btn pri" data-act="rstart">Start</button></div>`;
    }
    if (RC.phase === 'done') {
      const c = RC.res.filter(x => x === 'c').length, p = RC.res.filter(x => x === 'p').length, w = RC.res.filter(x => x === 'w').length;
      const missIds = RC.ids.filter((id, k) => RC.res[k] !== 'c');
      return `<div class="panel"><span class="lab">Session result</span><div class="score">${c} / ${RC.ids.length}</div>
        <p class="fnline">${c} correct · ${p} partial · ${w} incorrect</p>
        <div class="row">${missIds.length ? `<button class="btn pri" data-act="rretry" data-v="${missIds.join(',')}">Retry the ${missIds.length} not fully correct</button>` : ''}<button class="btn" data-act="rnew">New session</button></div></div>`;
    }
    const r = byId[RC.ids[RC.i]], n = RC.ids.length;
    const head = `<div class="sess-head">${prog(RC.i, n)}<span class="count">${RC.i + 1} / ${n}</span><button class="btn sm" data-act="rnew">End</button></div>`;
    if (RC.dir === 'name') {
      let body = `<span class="lab">Instrument</span><h2 class="qname">${esc(r.name)}</h2>
        <label class="field" for="rc-text">What is its primary function? Type it in your own words.</label><textarea id="rc-text" ${RC.shown ? 'disabled' : ''}>${esc(RC.text)}</textarea>`;
      if (!RC.shown) body += `<button class="btn pri" data-act="rreveal">Reveal answer</button>`;
      else body += `<div class="fb"><span class="lab">Model answer</span><p class="fnline">${esc(r.fn)}</p><ul class="feat">${r.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
        <span class="lab">How did you do?</span><div class="fc-actions" style="margin:0"><button class="btn ok" data-act="rgrade" data-v="c">Correct</button><button class="btn warn" data-act="rgrade" data-v="p">Partial</button><button class="btn bad" data-act="rgrade" data-v="w">Incorrect</button></div>`;
      return head + `<div class="panel">${body}</div>`;
    }
    let body = `<span class="lab">Which instrument is this?</span><p class="fnline">${esc(r.stem)}</p>
      <form id="rc-form" autocomplete="off"><label class="field" for="rc-name">Type the instrument name</label><input type="text" id="rc-name" value="${esc(RC.text)}" ${RC.pending ? 'disabled' : ''} autocapitalize="off" spellcheck="false"><div class="row" style="margin-top:10px">${RC.pending ? '' : '<button class="btn pri" type="submit">Check</button><button class="btn" type="button" data-act="rskip">I don’t know</button>'}</div></form>`;
    if (RC.pending) {
      const ok = RC.pending.res === 'c', how = RC.pending.how;
      body += `<div class="fb ${ok ? 'ok' : 'no'}" role="status"><h3>${how === 'exact' ? 'Correct' : how === 'close' ? 'Close enough, counted correct' : ok ? 'Counted correct' : 'Not quite'} – ${esc(r.name)}</h3>
        <p>Also accepted: ${esc(r.allAliases.filter(a => a !== r.name).slice(0, 6).join(', ') || 'no other names')}</p><p><b>Function:</b> ${esc(r.fn)}</p></div>
        <div class="row">${ok ? '' : '<button class="btn" data-act="roverride">I was right, count it correct</button>'}<button class="btn pri" data-act="rnext">Next</button></div>`;
    }
    return head + `<div class="panel">${body}</div>`;
  }

  // ---------- 4. matching ----------
  function mtRound() {
    const pool = deck(true), all = quizPool(), used = new Set(), picks = [];
    const prev = MT ? new Set(MT.ids) : new Set();
    const take = list => { for (const r of list) { if (picks.length === 5) break; if (!used.has(r.g) && !prev.has(r.id)) { used.add(r.g); picks.push(r); } } };
    take(E.priorityOrder(S.prog, pool)); if (picks.length < 5) take(E.priorityOrder(S.prog, all));
    if (picks.length < 5) { prev.clear(); take(E.priorityOrder(S.prog, all)); }
    MT = Object.assign(MT || { rounds: 0, perfect: 0 }, { ids: picks.map(r => r.id), names: shuffle(picks.map(r => r.id)), fns: shuffle(picks.map(r => r.id)), sel: null, done: [], miss: {}, shake: null, over: false, filled: pool.length < 5 });
  }
  function viewMatch() {
    if (!MT) mtRound();
    const m = MT, nm = id => m.done.includes(id);
    if (m.over) {
      const errs = Object.values(m.miss).reduce((a, b) => a + b, 0);
      return `<div class="panel"><span class="lab">Round ${m.rounds}</span><div class="score">${errs === 0 ? 'Perfect' : errs + ' miss' + (errs === 1 ? '' : 'es')}</div>
        ${errs ? `<p class="fnline">Review: ${Object.keys(m.miss).map(id => esc(byId[id].name)).join(', ')}</p>` : ''}<div class="row"><button class="btn pri" data-act="mnext">Next round</button></div></div>`;
    }
    return `<div class="panel"><h2>Match 5 names to 5 functions</h2><p class="attr">Tap a name, then the function it matches. ${m.filled ? 'This deck has fewer than five distinct instruments, so some come from other trays. ' : ''}Round ${m.rounds + 1}.</p>
      ${prog(m.done.length, 5)}
      <span class="lab">Instruments</span><div class="m-names">${m.names.map(id => `<button class="mbtn ${nm(id) ? 'done' : ''} ${m.sel === id ? 'sel' : ''} ${m.shake && m.shake[0] === id ? 'shake' : ''}" data-act="mname" data-v="${id}" ${nm(id) ? 'disabled' : ''}>${esc(byId[id].name)}</button>`).join('')}</div>
      <span class="lab">Functions</span><div class="m-fns">${m.fns.map(id => `<button class="mbtn fn ${nm(id) ? 'done' : ''} ${m.shake && m.shake[1] === id ? 'shake' : ''}" data-act="mfn" data-v="${id}" ${nm(id) ? 'disabled' : ''}>${esc(byId[id].stem)}</button>`).join('')}</div></div>`;
  }

  // ---------- 5. compare ----------
  function viewCompare() {
    const f = S.filters.tray;
    const list = COMPARES.filter(c => f === 'All' || c.items.some(i => byId[i.rec].trays.includes(f)));
    return `<div class="row" style="margin-bottom:12px"><h2 class="grow">Compare look-alikes</h2><button class="btn" data-act="cmphide" aria-pressed="${CMPHIDE}">${CMPHIDE ? 'Show all differences' : 'Test myself: hide differences'}</button></div>
      <div class="cmp">${list.map(c => {
        const hide = CMPHIDE && !CMPSHOW[c.id];
        return `<section class="panel"><h3>${esc(c.title)}</h3>
          <div class="cols">${c.items.map(i => `<div class="col"><h4>${esc(byId[i.rec].name)}</h4><div class="chips">${trayChips(byId[i.rec])}</div>${hide ? '<p class="attr">Hidden</p>' : `<p><b>Looks:</b> ${esc(i.look)}</p><p><b>Used for:</b> ${esc(i.use)}</p>`}</div>`).join('')}</div>
          ${hide ? `<button class="btn" data-act="cmpshow" data-v="${c.id}">Reveal differences</button>` : `<div class="tip"><b>Quick rule:</b> ${esc(c.practical)}</div>${c.note ? `<p class="attr">${esc(c.note)}</p>` : ''}`}</section>`;
      }).join('') || empty('No comparison cards for this tray.')}</div>`;
  }

  // ---------- 6. photo identification ----------
  function pStart() {
    const pool = deck().filter(r => photoOf(r.id));
    if (!pool.length) { PH = { phase: 'setup' }; return; }
    const t = sliceLen(E.priorityOrder(S.prog, pool), S.set.pLen), all = RECORDS;
    PH = { phase: 'run', i: 0, score: 0, res: [], qs: t.map(r => {
      const cands = all.filter(x => x.g !== r.g).map(x => ({ x, s: (photoOf(x.id) ? 2 : 0) + (x.cat === r.cat ? 2 : 0) + Math.random() * 2 })).sort((a, b) => b.s - a.s);
      const out = [], g = new Set();
      for (const { x } of cands) { if (!g.has(x.g)) { g.add(x.g); out.push(x); } if (out.length === 3) break; }
      return { id: r.id, choices: shuffle([r, ...out]).map(c => c.id), answer: r.id, chosen: null };
    }) };
  }
  function viewPhotos() {
    const n = deck().filter(r => photoOf(r.id)).length;
    if (!PH || PH.phase === 'setup') {
      return `<div class="panel"><h2>Photo identification</h2><p>Real photos only. ${Object.keys(PHOTO0).length} D&C instruments come with photos from your tray; the Minor and Major lists are text only. You can add your own photo to any instrument from the Reference tab.</p>
        <span class="lab">Length</span><div class="seg" role="group">${lenOpts(S.set.pLen, 'pLen')}</div>
        <p class="attr">${n} instruments with photos in this deck.</p><button class="btn pri" data-act="pstart" ${n ? '' : 'disabled'}>Start</button>${n ? '' : '<p class="chip warn">No photos in this deck. Try the D&C tray or add your own photos.</p>'}</div>`;
    }
    if (PH.phase === 'done') {
      const miss = PH.res.filter(x => !x.ok);
      return `<div class="panel"><span class="lab">Final score</span><div class="score">${PH.score} / ${PH.qs.length}</div>${miss.length ? `<ul class="feat">${miss.map(x => `<li>${esc(byId[x.id].name)}</li>`).join('')}</ul>` : '<p class="fnline">No misses.</p>'}<button class="btn pri" data-act="pnew">New session</button></div>`;
    }
    const q = PH.qs[PH.i], r = byId[q.id], done = q.chosen !== null;
    const ch = q.choices.map((id, k) => `<button class="choice ${done ? (id === q.answer ? 'right' : k === q.chosen ? 'wrong' : '') : ''}" data-act="pans" data-v="${k}" ${done ? 'disabled' : ''}><span class="L">${'ABCD'[k]}</span><span>${esc(byId[id].name)}</span></button>`).join('');
    const fb = done ? `<div class="fb ${q.choices[q.chosen] === q.answer ? 'ok' : 'no'}" role="status"><h3>${q.choices[q.chosen] === q.answer ? 'Correct' : 'Not quite'}: ${esc(r.name)}</h3><p><b>Look for:</b> ${esc(r.feat[0])}.</p><p><b>Function:</b> ${esc(r.fn)}</p></div><button class="btn pri" data-act="pnext">${PH.i + 1 === PH.qs.length ? 'See score' : 'Next photo'}</button>` : '';
    return `<div class="sess-head">${prog(PH.i + (done ? 1 : 0), PH.qs.length)}<span class="count">${PH.i + 1} / ${PH.qs.length}</span><button class="btn sm" data-act="pnew">End</button></div>
      <div class="panel"><span class="lab">What is this instrument?</span><img class="photo" src="${photoOf(r.id)}" alt="Instrument photograph to identify"><p class="attr">${esc(photoCredit(r.id))}</p><div class="choices" role="group">${ch}</div>${fb}</div>`;
  }

  // ---------- 7. quantities (optional separate quiz) ----------
  function cStart() {
    const d = deck(), ids = new Set(d.map(r => r.id)), tray = S.filters.tray;
    const rowsPool = ROWS.filter(w => ids.has(w.rec) && (tray === 'All' || w.tray === tray));
    if (!rowsPool.length) { CQ = { phase: 'setup', msg: 'No tray rows match these filters.' }; return; }
    const how = shuffle(rowsPool).map(w => ({ t: 'how', row: w })), which = shuffle(d).map(r => ({ t: 'which', id: r.id }));
    const t = S.set.cType;
    let qs = t === 'how' ? how : t === 'which' ? which : shuffle([...how.slice(0, Math.ceil(how.length / 2)), ...which.slice(0, Math.ceil(which.length / 2))]);
    qs = sliceLen(qs, S.set.cLen).map(q => Object.assign(q, { done: false, ok: false, pick: t === 'how' ? null : [] }));
    CQ = { phase: 'run', i: 0, score: 0, qs };
  }
  function viewCounts() {
    if (!CQ || CQ.phase === 'setup') {
      return `<div class="panel"><h2>Tray quantities</h2><p class="attr">An optional extra: how many of each item are in a tray, and which trays contain an instrument. It uses the tray filter above and does not affect your name and function progress.</p>${CQ && CQ.msg ? `<p class="chip warn">${esc(CQ.msg)}</p>` : ''}
        <div class="opt-set"><span class="lab">Question type</span><div class="seg" role="group">${segOpts(S.set.cType, 'cType', [['mixed', 'Mixed'], ['how', 'How many?'], ['which', 'Which trays?']])}</div><span class="lab">Length</span><div class="seg" role="group">${lenOpts(S.set.cLen, 'cLen')}</div></div>
        <button class="btn pri" data-act="cstart">Start</button></div>`;
    }
    if (CQ.phase === 'done') return `<div class="panel"><span class="lab">Final score</span><div class="score">${CQ.score} / ${CQ.qs.length}</div><button class="btn pri" data-act="cnew">New quiz</button></div>`;
    const q = CQ.qs[CQ.i];
    let body;
    if (q.t === 'how') {
      const w = q.row, r = byId[w.rec];
      body = `<span class="lab">How many are in the ${esc(w.tray)} tray?</span><h2 class="qname">${esc(w.wording)}</h2><div class="seg" role="group" aria-label="Quantity">${[1, 2, 3, 4, 5, 6].map(n => `<button class="btn ${q.done ? (n === w.qty ? 'ok' : (n === q.pick ? 'bad' : '')) : ''}" data-act="chow" data-v="${n}" ${q.done ? 'disabled' : ''}>${n}</button>`).join('')}</div>
        ${q.done ? `<div class="fb ${q.ok ? 'ok' : 'no'}" role="status"><h3>${q.ok ? 'Correct' : 'Not quite'}: ${w.qty} in the ${esc(w.tray)} tray</h3>${w.note ? `<p><b>List note:</b> ${esc(w.note)}</p>` : ''}<p>${esc(r.name)}${w.variant && w.variant !== 'standard' ? ' – ' + esc(w.variant) : ''}</p></div>` : ''}`;
    } else {
      const r = byId[q.id], want = r.trays;
      body = `<span class="lab">Which trays include this instrument?</span><h2 class="qname">${esc(r.name)}</h2><div class="seg" role="group" aria-label="Trays">${TRAYS.map(t => `<button class="btn ${q.done ? (want.includes(t) ? 'ok' : (q.pick.includes(t) ? 'bad' : '')) : ''}" data-act="ctray" data-v="${esc(t)}" aria-pressed="${q.pick.includes(t)}" ${q.done ? 'disabled' : ''}>${t}</button>`).join('')}</div>
        ${q.done ? `<div class="fb ${q.ok ? 'ok' : 'no'}" role="status"><h3>${q.ok ? 'Correct' : 'Not quite'}</h3><div class="chips">${trayChips(r)}</div></div>` : '<button class="btn pri" data-act="ccheck">Check answer</button>'}`;
    }
    return `<div class="sess-head">${prog(CQ.i + (q.done ? 1 : 0), CQ.qs.length)}<span class="count">${CQ.i + 1} / ${CQ.qs.length} · ${CQ.score} correct</span><button class="btn sm" data-act="cnew" aria-label="End session">End</button></div><div class="panel">${body}${q.done ? `<button class="btn pri" data-act="cnext">${CQ.i + 1 === CQ.qs.length ? 'See score' : 'Next'}</button>` : ''}</div>`;
  }

  // ---------- 8. reference table ----------
  const hay = r => (r.name + ' ' + r.allAliases.join(' ') + ' ' + r.fn + ' ' + r.feat.join(' ') + ' ' + CATS[r.cat] + ' ' + r.trays.join(' ')).toLowerCase();
  function tableRows() {
    const q = REFQ.trim().toLowerCase();
    const list = deck().filter(r => !q || q.split(/\s+/).every(t => hay(r).includes(t))).sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) return `<tr><td colspan="4" class="empty">No instruments match.</td></tr>`;
    return list.map(r => {
      const open = REFOPEN[r.id];
      const t = r.trays.map(x => `<span class="tl">${esc(x)} <span class="qtyc">×${trayQty(r, x)}</span></span>`).join(' · ');
      let s = `<tr class="r" data-act="refopen" data-v="${r.id}" tabindex="0" role="button" aria-expanded="${!!open}"><td class="nm" data-l="Instrument">${S.fav[r.id] ? '★ ' : ''}${esc(r.name)} ${flagChip(r)}</td><td data-l="Category">${esc(CATS[r.cat])}</td><td data-l="Function">${esc(r.fn)}</td><td data-l="Trays">${t}</td></tr>`;
      if (open) s += `<tr class="det"><td colspan="4"><div style="display:grid;gap:10px">
        ${photoOf(r.id) ? `<div><img class="photo" style="max-height:240px" src="${photoOf(r.id)}" alt="${esc(r.name)}"><p class="attr">${esc(photoCredit(r.id))}</p></div>` : ''}
        <div class="chips">${verChip(r)}<span class="chip cat">${esc(CATS[r.cat])}</span></div>
        <div><span class="lab">Key identifying features</span><ul class="feat">${r.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
        <div><span class="lab">Commonly confused with</span><p>${r.conf ? `<b>${esc(r.conf.name)}.</b> ${esc(r.conf.diff)}` : 'Not enough information to compare; confirm with your instructor.'}</p></div>
        <div><span class="lab">Also called</span><p>${esc(r.allAliases.filter(a => a !== r.name).join(', ') || '—')}</p></div>
        <div><span class="lab">Source rows (instructor wording)</span><table class="mini"><thead><tr><th>Tray</th><th>Listed as</th><th>Qty</th><th>Notes</th></tr></thead><tbody>${r.rows.map(w => `<tr><td>${esc(w.tray)}</td><td>${esc(w.wording)}${w.variant && !/^(standard|as written)/.test(w.variant) ? `<br><span class="attr">${esc(w.variant)}</span>` : ''}</td><td class="qtyc">${w.qty}</td><td>${esc(w.note)}${w.flag ? ' <span class="chip warn">check</span>' : ''}</td></tr>`).join('')}</tbody></table></div>
        <div class="row"><button class="btn sm" data-act="fav" data-v="${r.id}" aria-pressed="${!!S.fav[r.id]}">${S.fav[r.id] ? 'Remove favorite' : 'Add favorite'}</button>
          <label class="btn sm">${S.photos[r.id] ? 'Replace my photo' : 'Add my photo'}<input type="file" accept="image/*" data-up="${r.id}" hidden></label>${S.photos[r.id] ? `<button class="btn sm" data-act="rmphoto" data-v="${r.id}">Remove my photo</button>` : ''}</div></div></td></tr>`;
      return s;
    }).join('');
  }
  function viewTable() {
    return `<div class="row" style="margin-bottom:12px"><h2 class="grow">Instrument reference</h2></div>
      <label class="field" for="ref-q">Search names, aliases, functions or features</label><input type="search" id="ref-q" value="${esc(REFQ)}" placeholder="e.g. toothed, suction, curette" style="margin-bottom:12px">
      <div class="tablewrap"><table class="stack"><thead><tr><th>Instrument</th><th>Category</th><th>Primary function</th><th>Trays and quantity</th></tr></thead><tbody id="ref-body">${tableRows()}</tbody></table></div>
      <p class="attr" style="margin-top:8px">Tap a row for features, the look-alike to watch for, and your instructor’s exact wording.</p>`;
  }

  // ---------- 9. progress ----------
  function viewProgress() {
    const seen = RECORDS.filter(r => S.prog[r.id]), mastered = RECORDS.filter(r => E.isMastered(S.prog, r.id)), missed = RECORDS.filter(r => isMissed(r.id));
    const order = RECORDS.slice().sort((a, b) => E.weight(S.prog, b.id) - E.weight(S.prog, a.id));
    return `<h2 style="margin-bottom:12px">Progress</h2><div class="panel"><div class="row"><span class="count">${seen.length} / ${RECORDS.length} studied</span><span class="count">${mastered.length} mastered</span><span class="count">${missed.length} missed</span></div>${prog(mastered.length, RECORDS.length)}
      <p class="attr">Each instrument has its own box from 0 to 4. A correct answer moves it up, a miss sends it back to 0. Missed and unseen items are shown first in Smart order. Mastered means box 3 or higher with the last answer correct.</p></div>
      <h2 style="margin:18px 0 10px">Priority order</h2><div class="panel plist">${order.map(r => { const p = S.prog[r.id] || { box: 0, c: 0, p: 0, w: 0, n: 0 }; return `<div class="prow"><span class="nm">${esc(r.name)} ${isMissed(r.id) ? '<span class="chip warn">missed</span>' : ''}</span><span class="boxes" aria-label="Box ${p.box} of 4">${[1, 2, 3, 4].map(k => `<i class="${p.box >= k ? 'on' : ''}"></i>`).join('')}</span><span class="c3 attr q">${p.n ? `${p.c}✓ ${p.p}~ ${p.w}✗` : 'not studied'}</span></div>`; }).join('')}</div>
      <div class="panel" style="margin-top:16px"><h3>Reset</h3><p class="attr">Clears study progress and quantity scores on this device. Favorites, photos and confirmations stay.</p>
        <div class="row"><button class="btn bad" data-act="reset">${RESET_ARMED ? 'Tap again to erase progress' : 'Reset progress'}</button>${RESET_ARMED ? '<button class="btn" data-act="resetcancel">Cancel</button>' : ''}</div></div>`;
  }

  // ---------- 10. sources, checks, needs confirmation ----------
  function viewSources() {
    const per = TRAYS.map(t => [t, ROWS.filter(w => w.tray === t).length]), open = Object.keys(FLAGS).filter(k => !S.confirmed[k]).length;
    return `<h2 style="margin-bottom:12px">Needs confirmation</h2>
      <p class="attr" style="margin-bottom:10px">${open} of ${Object.keys(FLAGS).length} open. These entries were unclear, ambiguous or partly unreadable on your lists. Nothing here blocks studying. Tick an item once your instructor has answered.</p>
      <div class="plist">${Object.entries(FLAGS).map(([k, f]) => `<div class="flag ${S.confirmed[k] ? 'done' : ''}"><b>${esc(f.title)}</b><span class="attr">Rows: ${f.rows.map(id => { const w = ROWS.find(x => x.id === id); return esc(w.tray + ' “' + w.wording + '” ×' + w.qty); }).join('; ')}</span><p>${esc(f.issue)}</p><p><b>Ask:</b> ${esc(f.ask)}</p>
        <label class="check"><input type="checkbox" data-conf="${k}" ${S.confirmed[k] ? 'checked' : ''}> Confirmed with my instructor</label></div>`).join('')}</div>
      <h2 style="margin:22px 0 10px">Every source row is accounted for</h2>
      <div class="panel"><p class="fnline">${per.map(([t, n]) => `${t}: <b>${n}</b>`).join(' · ')} · total <b>${ROWS.length}</b> rows, each linked to one study record (${RECORDS.length} records after combining duplicates).</p>
        <details><summary class="btn sm" style="display:inline-flex;align-items:center">Show all ${ROWS.length} rows</summary><div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Row</th><th>Tray</th><th>Listed as</th><th>Qty</th><th>Notes</th><th>Study record</th></tr></thead><tbody>${ROWS.map(w => `<tr><td class="qtyc">${w.id}</td><td>${esc(w.tray)}</td><td>${esc(w.wording)}</td><td class="qtyc">${w.qty}</td><td>${esc(w.note)}</td><td>${esc(byId[w.rec].name)}</td></tr>`).join('')}</tbody></table></div></details></div>
      <h2 style="margin:22px 0 10px">Sources</h2>
      <div class="panel src"><p>Facts were checked through web search summaries. The linked pages could not be opened in full, and most are supplier catalogs, reference pages and teaching sites, not a surgical technology textbook. Compare against your course text before your practical.</p>
        <ul style="margin:0;padding-left:1.2rem">${SRC.list.map(s => `<li>${esc(s[0])} – <a href="${esc(s[1])}" target="_blank" rel="noopener noreferrer">${esc(s[1].replace(/^https?:\/\//, '').slice(0, 60))}</a> <span class="attr">(${esc(s[2])})</span></li>`).join('')}</ul>
        <p><b>General teaching, not independently sourced:</b> ${esc(SRC.notSourced)}.</p>
        <p class="attr">Photos of D&C instruments are cropped from your own tray photo; the Minor and Major lists were inventory lists, so those instruments are text only. Tray contents are exactly as written on your three lists.</p></div>`;
  }

  // ---------- events ----------
  const mk = (id, res) => { E.mark(S.prog, id, res); save(); };
  function go(t) { tab = t; try { history.replaceState(null, '', '#' + t); } catch (e) { /* sandboxed */ } render(); window.scrollTo(0, 0); }
  function flash(el) { render(); }
  const acts = {
    tab: v => go(v),
    theme: () => { S.theme = { system: 'light', light: 'dark', dark: 'system' }[S.theme]; applyTheme(); save(); render(); },
    tray: v => { S.filters.tray = v; invalidate(); save(); render(); },
    set: (v, el) => { S.set[el.dataset.k] = /^\d+$/.test(v) ? +v : v; if (el.dataset.k === 'fcDir') { if (FC) FC.flip = false; } if (el.dataset.k === 'fcOrder') FC = null; save(); render(); },
    fav: v => { S.fav[v] = !S.fav[v]; if (!S.fav[v]) delete S.fav[v]; save(); render(); },
    // flashcards
    flip: () => { if (FC && FC.i < FC.ids.length) { FC.flip = !FC.flip; render(); } },
    fcnext: () => { FC.i++; FC.flip = false; render(); },
    fcprev: () => { if (FC.i > 0) { FC.i--; FC.flip = false; render(); } },
    fcknow: () => { mk(FC.ids[FC.i], 'c'); FC.know++; FC.i++; FC.flip = false; render(); },
    fcagain: () => { const id = FC.ids[FC.i]; mk(id, 'w'); FC.again++; FC.againSet.add(id); FC.ids.splice(Math.min(FC.i + 5, FC.ids.length), 0, id); FC.i++; FC.flip = false; render(); },
    fcshuffle: () => { S.set.fcOrder = 'shuffle'; FC = null; save(); render(); },
    fcrestart: () => { FC = null; render(); },
    fcmissed: () => { fcBuild([...FC.againSet]); render(); },
    // quiz
    qstart: () => { qzStart(); render(); },
    qans: v => { const q = QZ.qs[QZ.i]; if (q.chosen !== null) return; q.chosen = +v; const ok = q.choices[q.chosen] === q.answer; mk(q.id, ok ? 'c' : 'w'); if (ok) QZ.score++; QZ.res.push({ id: q.id, ok }); render(); },
    qnext: () => { if (QZ.i + 1 >= QZ.qs.length) QZ.phase = 'done'; else QZ.i++; render(); },
    qretry: () => { qzStart(QZ.res.filter(x => !x.ok).map(x => x.id)); render(); },
    qnew: () => { QZ = null; render(); },
    // written recall
    rstart: () => { rcStart(); render(); },
    rreveal: () => { RC.text = ($('#rc-text') || {}).value || ''; RC.shown = true; render(); },
    rgrade: v => { mk(RC.ids[RC.i], v); RC.res.push(v); rAdvance(); },
    rskip: () => { RC.text = ''; RC.pending = { res: 'w', how: 'wrong' }; render(); },
    roverride: () => { RC.pending = { res: 'c', how: 'override' }; render(); },
    rnext: () => { mk(RC.ids[RC.i], RC.pending.res); RC.res.push(RC.pending.res); rAdvance(); },
    rretry: v => { rcStart(v.split(',')); render(); },
    rnew: () => { RC = null; render(); },
    // matching
    mname: v => { MT.sel = MT.sel === v ? null : v; render(); },
    mfn: v => {
      if (!MT.sel) { toast('Tap an instrument name first.'); return; }
      if (MT.sel === v) { MT.done.push(v); MT.sel = null; if (MT.done.length === 5) { MT.ids.forEach(id => mk(id, MT.miss[id] ? 'w' : 'c')); MT.rounds++; if (!Object.keys(MT.miss).length) MT.perfect++; MT.over = true; } render(); }
      else { MT.miss[MT.sel] = (MT.miss[MT.sel] || 0) + 1; MT.shake = [MT.sel, v]; MT.sel = null; render(); MT.shake = null; setTimeout(() => { if (tab === 'match' && MT && !MT.over) render(); }, 420); }
    },
    mnext: () => { mtRound(); render(); },
    // compare
    cmphide: () => { CMPHIDE = !CMPHIDE; CMPSHOW = {}; render(); },
    cmpshow: v => { CMPSHOW[v] = true; render(); },
    // photos
    pstart: () => { pStart(); render(); },
    pans: v => { const q = PH.qs[PH.i]; if (q.chosen !== null) return; q.chosen = +v; const ok = q.choices[q.chosen] === q.answer; mk(q.id, ok ? 'c' : 'w'); if (ok) PH.score++; PH.res.push({ id: q.id, ok }); render(); },
    pnext: () => { if (PH.i + 1 >= PH.qs.length) PH.phase = 'done'; else PH.i++; render(); },
    pnew: () => { PH = null; render(); },
    // quantities
    cstart: () => { cStart(); render(); },
    chow: v => { const q = CQ.qs[CQ.i]; if (q.done) return; q.pick = +v; q.done = true; q.ok = q.pick === q.row.qty; cScore(q, q.row.id); render(); },
    ctray: v => { const q = CQ.qs[CQ.i]; if (q.done) return; q.pick = q.pick.includes(v) ? q.pick.filter(x => x !== v) : [...q.pick, v]; render(); },
    ccheck: () => { const q = CQ.qs[CQ.i], want = byId[q.id].trays; q.done = true; q.ok = q.pick.length === want.length && want.every(t => q.pick.includes(t)); cScore(q, 'trays:' + q.id); render(); },
    cnext: () => { if (CQ.i + 1 >= CQ.qs.length) CQ.phase = 'done'; else CQ.i++; render(); },
    cnew: () => { CQ = null; render(); },
    // reference
    refopen: v => { REFOPEN[v] = !REFOPEN[v]; $('#ref-body').innerHTML = tableRows(); },
    rmphoto: v => { delete S.photos[v]; save(); $('#ref-body').innerHTML = tableRows(); },
    // progress
    reset: () => { if (!RESET_ARMED) { RESET_ARMED = true; render(); setTimeout(() => { if (RESET_ARMED) { RESET_ARMED = false; if (tab === 'progress') render(); } }, 6000); } else { S.prog = {}; S.qty = {}; RESET_ARMED = false; invalidate(); save(); toast('Progress reset.'); render(); } },
    resetcancel: () => { RESET_ARMED = false; render(); }
  };
  function cScore(q, key) { const p = S.qty[key] || (S.qty[key] = { n: 0, c: 0 }); p.n++; if (q.ok) { p.c++; CQ.score++; } save(); }
  function rAdvance() { RC.i++; RC.shown = false; RC.text = ''; RC.pending = null; if (RC.i >= RC.ids.length) RC.phase = 'done'; render(); }

  app.addEventListener('click', e => {
    const sm = e.target.closest('.more > summary'); if (sm) moreOpen = !sm.parentElement.open;
    const sm2 = e.target.closest('.mini-more > summary'); if (sm2) ordOpen = !sm2.parentElement.open;
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    if (e.target.closest('label.btn') && !el.matches('label')) return;
    const fn = acts[el.dataset.act];
    if (fn) fn(el.dataset.v, el);
  });
  app.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'f-cat') { S.filters.cat = t.value; invalidate(); save(); render(); }
    else if (t.id === 'f-fav') { S.filters.fav = t.checked; invalidate(); save(); render(); }
    else if (t.id === 'f-missed') { S.filters.missed = t.checked; invalidate(); save(); render(); }
    else if (t.dataset.conf) { if (t.checked) S.confirmed[t.dataset.conf] = true; else delete S.confirmed[t.dataset.conf]; save(); render(); }
    else if (t.dataset.up && t.files && t.files[0]) { thumb(t.files[0], url => { S.photos[t.dataset.up] = url; save(); const b = $('#ref-body'); if (b) b.innerHTML = tableRows(); toast('Photo added to this instrument.'); }); }
  });
  app.addEventListener('input', e => {
    if (e.target.id === 'ref-q') { REFQ = e.target.value; $('#ref-body').innerHTML = tableRows(); }
    else if (e.target.id === 'rc-text' && RC) RC.text = e.target.value;
  });
  app.addEventListener('submit', e => {
    if (e.target.id !== 'rc-form') return;
    e.preventDefault();
    if (!RC || RC.pending) return;
    const val = $('#rc-name').value, r = byId[RC.ids[RC.i]], how = E.checkName(val, r);
    RC.text = val; RC.pending = { res: how === 'wrong' ? 'w' : 'c', how }; render();
  });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.matches && t.matches('input, textarea, select')) return;
    if (tab === 'cards' && FC && FC.i < FC.ids.length) {
      if ((e.key === ' ' || e.key === 'Enter') && !(t.matches && t.matches('button, summary, a'))) { e.preventDefault(); acts.flip(); }
      else if (e.key === 'ArrowRight') acts.fcnext(); else if (e.key === 'ArrowLeft') acts.fcprev();
    } else if (tab === 'quiz' && QZ && QZ.phase === 'run') {
      const q = QZ.qs[QZ.i];
      if (/^[1-4]$/.test(e.key) && q.chosen === null) acts.qans(String(+e.key - 1)); else if (e.key === 'Enter' && q.chosen !== null && !(t.matches && t.matches('button'))) acts.qnext();
    } else if (tab === 'photos' && PH && PH.phase === 'run') {
      const q = PH.qs[PH.i];
      if (/^[1-4]$/.test(e.key) && q.chosen === null) acts.pans(String(+e.key - 1)); else if (e.key === 'Enter' && q.chosen !== null && !(t.matches && t.matches('button'))) acts.pnext();
    }
    if ((e.key === 'Enter' || e.key === ' ') && t.matches && t.matches('tr.r')) { e.preventDefault(); acts.refopen(t.dataset.v); }
  });
  function thumb(file, cb) {
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => { const sc = Math.min(1, 640 / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); cb(cv.toDataURL('image/jpeg', 0.8)); }; img.onerror = () => toast('That file could not be read as an image.'); img.src = fr.result; };
    fr.readAsDataURL(file);
  }

  window.__stp = { get S() { return S; }, get FC() { return FC; }, get QZ() { return QZ; }, get RC() { return RC; }, get MT() { return MT; }, get PH() { return PH; }, get CQ() { return CQ; }, byId, RECORDS, ROWS, deck, go };
  applyTheme();
  render();
})();
