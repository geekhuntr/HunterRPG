(() => {
  'use strict';
  const { INSTRUMENTS, PHASES } = window.DC_DATA;
  const SRS = window.SRS;
  const byId = Object.fromEntries(INSTRUMENTS.map(i => [i.id, i]));
  const IDS = INSTRUMENTS.map(i => i.id);
  const KEY = 'dcTray.v1';
  const view = document.getElementById('view');

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const today = () => new Date().toLocaleDateString('en-CA');
  const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
  const pct = x => Math.round(x * 100);

  // ---------- persistence ----------
  const fresh = () => ({ v: 1, cards: {}, conf: {}, photos: {}, settings: { newPerDay: 10 }, daily: { date: today(), newCount: 0, reviewed: 0, correct: 0 }, streak: { days: 0, last: '' } });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
  S.settings = Object.assign({ newPerDay: 10 }, S.settings);
  let storageOk = true;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }
    catch (e) { if (storageOk) toast('Could not save progress in this browser (storage full or blocked). Export from Progress to keep it.'); storageOk = false; }
  }
  function ensureDay() {
    if (S.daily.date !== today()) S.daily = { date: today(), newCount: 0, reviewed: 0, correct: 0 };
  }
  let toastT;
  function toast(msg) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3500);
  }

  // ---------- helpers ----------
  const card = (id, f) => S.cards[SRS.key(id, f)] || SRS.newCard();
  const instMastery = id => (SRS.mastery(S.cards[SRS.key(id, 'see')], Date.now()) + SRS.mastery(S.cards[SRS.key(id, 'know')], Date.now())) / 2;
  const pic = (inst, anon) => `<img class="photo" src="${S.photos[inst.id] || inst.img}" alt="${anon ? 'Instrument photo' : esc(inst.name)}" loading="lazy">`;

  function record(item, grade, chosenId) {
    ensureDay();
    const k = SRS.key(item.id, item.facet), old = S.cards[k] || SRS.newCard();
    if (old.state === 'new') S.daily.newCount++;
    const nw = SRS.schedule(old, grade, Date.now());
    S.cards[k] = nw;
    S.daily.reviewed++; if (grade >= 1) S.daily.correct++;
    if (S.streak.last !== today()) { S.streak.days = S.streak.last === yesterday() ? S.streak.days + 1 : 1; S.streak.last = today(); }
    if (grade === 0 && chosenId && chosenId !== item.id) {
      const c = (S.conf[item.id] = S.conf[item.id] || {}); c[chosenId] = (c[chosenId] || 0) + 1;
    }
    save();
    return nw;
  }

  // ---------- routing ----------
  let curKeys = null;
  const routes = { '': home, study: () => lobby('study', 'Flashcards', 'Flip the card, then rate how well you knew it. The scheduler brings back what you miss soon and what you know later.'),
    quiz: () => lobby('quiz', 'Quiz', 'Multiple choice, one question at a time. Wrong answers are drawn from look-alikes and instruments you have mixed up before.'),
    type: () => lobby('type', 'Type it', 'Hardest mode: produce the instrument name from the picture or the description. Small typos still count.'),
    match, library, progress };
  function route() {
    curKeys = null; sess = null;
    const r = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r));
    (routes[r] || home)();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (curKeys && !(e.target.matches && e.target.matches('input, select, textarea') && e.key !== 'Enter')) curKeys(e);
  });

  // ---------- home ----------
  function counts(queue) {
    const o = { due: 0, learning: 0, fresh: 0 };
    for (const it of queue) { const st = card(it.id, it.facet).state; if (st === 'new') o.fresh++; else if (st === 'review') o.due++; else o.learning++; }
    return o;
  }
  function home() {
    ensureDay();
    const q = SRS.buildQueue(S.cards, IDS, Date.now(), { newLimit: S.settings.newPerDay, newDone: S.daily.newCount });
    const c = counts(q);
    const avg = IDS.reduce((s, id) => s + instMastery(id), 0) / IDS.length;
    view.innerHTML = `
      <h1>D&amp;C tray trainer</h1>
      <p class="sub">${INSTRUMENTS.length} instruments · learn the look <b>and</b> the purpose. Spaced repetition schedules each one separately for recognition and recall.</p>
      <div class="stats">
        <div class="card stat"><b>${c.due + c.learning}</b><span>due now</span></div>
        <div class="card stat"><b>${c.fresh}</b><span>new today</span></div>
        <div class="card stat"><b>${pct(avg)}%</b><span>tray mastery</span></div>
        <div class="card stat"><b>${S.streak.last === today() || S.streak.last === yesterday() ? S.streak.days : 0}</b><span>day streak</span></div>
      </div>
      <div class="grid g2">
        <a class="card mode" href="#/study"><h3>Flashcards</h3><p>Flip &amp; rate. The core spaced-repetition loop.</p></a>
        <a class="card mode" href="#/quiz"><h3>Quiz</h3><p>Multiple choice with smart look-alike distractors.</p></a>
        <a class="card mode" href="#/type"><h3>Type it</h3><p>Name the instrument from memory.</p></a>
        <a class="card mode" href="#/match"><h3>Match</h3><p>Pair pictures with names against the clock.</p></a>
        <a class="card mode" href="#/library"><h3>Browse the tray</h3><p>Quizlet-style set view. Add photos of your own tray.</p></a>
        <a class="card mode" href="#/progress"><h3>Progress</h3><p>Weak spots, mix-ups, backup &amp; settings.</p></a>
      </div>
      <h2>Mastery by instrument</h2>
      <div class="heat">${INSTRUMENTS.map(i => `<a href="#/library" style="--m:${instMastery(i.id).toFixed(2)}">${esc(i.name)}</a>`).join('')}</div>`;
  }

  // ---------- session engine ----------
  let sess = null;
  const MODES = { study: showStudy, quiz: showQuiz, type: showType };

  function lobby(mode, title, blurb) {
    ensureDay();
    const q = SRS.buildQueue(S.cards, IDS, Date.now(), { newLimit: S.settings.newPerDay, newDone: S.daily.newCount });
    const c = counts(q);
    view.innerHTML = `
      <h1>${title}</h1><p class="sub">${blurb}</p>
      <div class="panel">
        <div class="stats" style="margin:0 0 14px">
          <div class="stat"><b>${c.due}</b><span>reviews due</span></div>
          <div class="stat"><b>${c.learning}</b><span>in learning</span></div>
          <div class="stat"><b>${c.fresh}</b><span>new cards</span></div>
        </div>
        ${q.length ? '' : '<p>🎉 You are all caught up. You can still drill your weakest cards.</p>'}
        <div class="row">
          <button class="primary" id="go" ${q.length ? '' : 'disabled'}>Start (${q.length} cards)</button>
          <button id="cram">Drill weakest 20</button>
        </div>
      </div>`;
    document.getElementById('go').onclick = () => startSession(mode, q);
    document.getElementById('cram').onclick = () => startSession(mode, SRS.buildCram(S.cards, IDS, Date.now(), 20));
  }

  function startSession(mode, queue) {
    sess = { mode, queue: queue.slice(), i: 0, answered: 0, correct: 0, missed: {}, t0: Date.now(), busy: false };
    nextItem();
  }
  function nextItem() {
    if (sess.i >= sess.queue.length) return summary();
    sess.busy = false;
    MODES[sess.mode](sess.queue[sess.i]);
  }
  function finish(item, grade, chosenId) {
    const nw = record(item, grade, chosenId);
    sess.answered++; if (grade >= 1) sess.correct++;
    if (grade === 0) sess.missed[item.id] = (sess.missed[item.id] || 0) + 1;
    if (nw.due - Date.now() < 20 * SRS.MIN) sess.queue.splice(Math.min(sess.queue.length, sess.i + (grade === 0 ? 4 : 7)), 0, item);
    sess.i++;
  }
  const progressBar = () => `<div class="sess-bar"><a href="#/${sess.mode}" aria-label="Quit session">✕</a><div class="bar"><i style="width:${pct(sess.i / Math.max(1, sess.queue.length))}%"></i></div><span class="pill">${Math.min(sess.i + 1, sess.queue.length)}/${sess.queue.length}</span></div>`;
  const facetTag = f => `<span class="pill tag-${f}">${f === 'see' ? 'Recognition' : 'Recall'}</span>`;

  function summary() {
    curKeys = e => { if (e.key === 'Enter') location.hash = '#/' + sess.mode; };
    const acc = sess.answered ? sess.correct / sess.answered : 0;
    const missed = Object.keys(sess.missed).map(id => byId[id].name);
    const mode = sess.mode;
    view.innerHTML = `<div class="card sum"><div>Session complete</div><div class="big">${pct(acc)}%</div>
      <p>${sess.answered} answers · ${Math.max(1, Math.round((Date.now() - sess.t0) / 60000))} min</p>
      ${missed.length ? `<p><b>Review:</b> ${missed.map(esc).join(', ')}</p>` : '<p>No misses. Nice.</p>'}
      <div class="row" style="justify-content:center"><a class="btn primary" href="#/${mode}" id="again">Keep going</a><a class="btn" href="#/">Home</a></div></div>`;
  }

  // ---------- flashcards ----------
  function showStudy(item) {
    const inst = byId[item.id], c = card(item.id, item.facet), now = Date.now();
    const front = item.facet === 'see'
      ? `${pic(inst, true)}<p class="q">What is this instrument?</p>`
      : `<p class="q">${esc(inst.use)}</p><p class="hint">Which instrument is this?</p>`;
    view.innerHTML = `${progressBar()}
      <div class="card fc" id="fc" tabindex="0" role="button" aria-label="Flip card"><div class="fc-in">
        <div class="face front">${facetTag(item.facet)}${front}<p class="hint">Tap or press Space to flip</p></div>
        <div class="face back">${pic(inst)}<h2>${esc(inst.name)}</h2>
          <p><b>Use:</b> ${esc(inst.use)}</p><p><b>Look for:</b> ${esc(inst.look)}</p><p><b>Remember:</b> ${esc(inst.mnemonic)}</p>
          <p><span class="pill">${esc(PHASES[inst.phase])}</span></p></div></div></div>
      <div class="grades" id="grades" hidden>
        ${['Again', 'Hard', 'Good', 'Easy'].map((n, g) => `<button class="g${g}" data-g="${g}">${n}<small>${SRS.fmtInterval(c, g, now)}</small></button>`).join('')}
      </div><div class="kbd">Space flip · 1–4 rate</div>`;
    const fc = document.getElementById('fc'), grades = document.getElementById('grades');
    const flip = () => { fc.classList.toggle('flip'); grades.hidden = !fc.classList.contains('flip'); };
    fc.onclick = flip;
    const rate = g => { if (sess.busy || grades.hidden) return; sess.busy = true; finish(item, g); nextItem(); };
    grades.onclick = e => { const b = e.target.closest('button'); if (b) rate(+b.dataset.g); };
    curKeys = e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (/^[1-4]$/.test(e.key)) rate(+e.key - 1);
    };
  }

  // ---------- quiz (multiple choice) ----------
  function showQuiz(item) {
    const inst = byId[item.id], c = card(item.id, item.facet), t0 = Date.now();
    const variant = item.facet === 'see' ? 'img' : (Math.random() < 0.7 ? 'use' : 'rev');
    const options = shuffle([inst, ...SRS.pickDistractors(inst, INSTRUMENTS, S.conf, 3)]);
    const prompt = variant === 'img' ? `${pic(inst, true)}<p class="q">What is this instrument?</p>`
      : variant === 'use' ? `<p class="q">${esc(inst.use)}</p><p class="hint">Which instrument is this?</p>`
      : `<p class="q">Which description fits the <b>${esc(inst.name)}</b>?</p>`;
    view.innerHTML = `${progressBar()}<div class="card stage">${facetTag(item.facet)}${prompt}
      <div class="opts" id="opts">${options.map((o, n) => `<button class="opt" data-id="${o.id}"><span class="k">${n + 1}</span>${esc(variant === 'rev' ? o.use : o.name)}</button>`).join('')}</div>
      <div id="fb"></div></div>`;
    const answer = id => {
      if (sess.busy) return; sess.busy = true;
      const ok = id === inst.id, ms = Date.now() - t0;
      finish(item, SRS.gradeFromAnswer({ correct: ok, ms, streak: c.streak }), ok ? null : id);
      document.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.dataset.id === inst.id) b.classList.add('right'); else if (b.dataset.id === id) b.classList.add('wrong'); });
      feedback(document.getElementById('fb'), inst, ok, ok ? null : byId[id]);
    };
    document.getElementById('opts').onclick = e => { const b = e.target.closest('.opt'); if (b) answer(b.dataset.id); };
    curKeys = e => {
      if (!sess.busy && /^[1-4]$/.test(e.key) && options[+e.key - 1]) answer(options[+e.key - 1].id);
      else if (sess.busy && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextItem(); }
    };
  }
  function feedback(host, inst, ok, wrongInst) {
    host.innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><h3>${ok ? 'Correct' : 'Not quite'} - ${esc(inst.name)}</h3>
      <p>${esc(inst.use)}</p><p><b>Look for:</b> ${esc(inst.look)}</p>
      ${wrongInst ? `<p><b>You picked ${esc(wrongInst.name)}:</b> ${esc(wrongInst.look)}</p>` : ''}
      <p><b>Remember:</b> ${esc(inst.mnemonic)}</p></div>
      <div class="row" style="margin-top:12px"><button class="primary" id="next">Next ↵</button></div>`;
    document.getElementById('next').onclick = nextItem;
    document.getElementById('next').focus();
  }

  // ---------- type it ----------
  function showType(item) {
    const inst = byId[item.id], c = card(item.id, item.facet), t0 = Date.now();
    const prompt = item.facet === 'see' ? `${pic(inst, true)}<p class="q">Name this instrument</p>`
      : `<p class="q">${esc(inst.use)}</p><p class="hint">Name this instrument</p>`;
    view.innerHTML = `${progressBar()}<div class="card stage">${facetTag(item.facet)}${prompt}
      <form id="f" autocomplete="off" style="margin-top:14px"><input type="text" id="ans" placeholder="Type the name…" aria-label="Instrument name" autocapitalize="off" spellcheck="false">
      <div class="row" style="margin-top:10px"><button class="primary" type="submit">Check</button><button type="button" id="idk">I don’t know</button></div></form><div id="fb"></div></div>`;
    const ans = document.getElementById('ans'); ans.focus();
    const done = (res, typed) => {
      if (sess.busy) return; sess.busy = true;
      const ok = res !== 'wrong';
      let chosen = null;
      if (!ok && typed) { const m = INSTRUMENTS.find(i => i.id !== inst.id && SRS.checkTyped(typed, i) !== 'wrong'); chosen = m && m.id; }
      finish(item, SRS.gradeFromAnswer({ correct: ok, ms: Date.now() - t0, close: res === 'close', streak: c.streak }), chosen);
      ans.disabled = true; document.getElementById('f').querySelectorAll('button').forEach(b => b.disabled = true);
      const fb = document.getElementById('fb'); feedback(fb, inst, ok, chosen && byId[chosen]);
      if (res === 'close') fb.querySelector('h3').textContent = 'Close enough - ' + inst.name;
    };
    document.getElementById('f').onsubmit = e => { e.preventDefault(); if (sess.busy) return nextItem(); if (ans.value.trim()) done(SRS.checkTyped(ans.value, inst), ans.value); };
    document.getElementById('idk').onclick = () => done('wrong', '');
    curKeys = e => { if (sess.busy && e.key === 'Enter') { e.preventDefault(); nextItem(); } };
  }

  // ---------- match ----------
  function match() {
    const now = Date.now();
    const pool = IDS.slice().sort((a, b) => SRS.mastery(S.cards[SRS.key(a, 'see')], now) - SRS.mastery(S.cards[SRS.key(b, 'see')], now)).slice(0, 10);
    const ids = shuffle(pool).slice(0, 6), t0 = Date.now();
    const miss = {}; let sel = null, left = ids.length;
    const L = shuffle(ids), R = shuffle(ids);
    view.innerHTML = `<h1>Match</h1><p class="sub">Tap a photo, then its name. Mix-ups feed your confusion tracker.</p>
      <div class="match"><div class="col">${L.map(id => `<button class="tile" data-s="L" data-id="${id}" aria-label="Instrument picture">${pic(byId[id], true)}</button>`).join('')}</div>
      <div class="col">${R.map(id => `<button class="tile" data-s="R" data-id="${id}">${esc(byId[id].name)}</button>`).join('')}</div></div><div id="fb"></div>`;
    view.querySelector('.match').onclick = e => {
      const t = e.target.closest('.tile'); if (!t || t.classList.contains('done')) return;
      if (!sel || sel.dataset.s === t.dataset.s) { if (sel) sel.classList.remove('sel'); sel = t; t.classList.add('sel'); return; }
      const [p, n] = sel.dataset.s === 'L' ? [sel, t] : [t, sel];
      if (p.dataset.id === n.dataset.id) {
        p.classList.add('done'); n.classList.add('done'); sel.classList.remove('sel'); sel = null;
        if (--left === 0) end();
      } else {
        miss[p.dataset.id] = (miss[p.dataset.id] || 0) + 1;
        const c = (S.conf[p.dataset.id] = S.conf[p.dataset.id] || {}); c[n.dataset.id] = (c[n.dataset.id] || 0) + 1;
        [p, n].forEach(x => { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 350); });
        sel.classList.remove('sel'); sel = null;
      }
    };
    function end() {
      const secs = Math.round((Date.now() - t0) / 1000);
      ids.forEach(id => record({ id, facet: 'see' }, miss[id] ? 0 : (secs < ids.length * 6 ? 3 : 2)));
      const errs = Object.values(miss).reduce((a, b) => a + b, 0);
      document.getElementById('fb').innerHTML = `<div class="card sum"><div class="big">${secs}s</div><p>${errs} mix-up${errs === 1 ? '' : 's'}${errs ? ': ' + Object.keys(miss).map(i => esc(byId[i].name)).join(', ') : ' - perfect round'}</p>
        <div class="row" style="justify-content:center"><a class="btn primary" href="#/match" id="re">Play again</a><a class="btn" href="#/">Home</a></div></div>`;
      document.getElementById('re').onclick = e => { e.preventDefault(); match(); };
    }
  }

  // ---------- library ----------
  function library() {
    let phase = '', q = '', hide = false;
    const draw = () => {
      const list = INSTRUMENTS.filter(i => (!phase || i.phase === phase) && (!q || (i.name + ' ' + i.aliases.join(' ') + ' ' + i.use).toLowerCase().includes(q)));
      document.getElementById('lib').innerHTML = list.map(i => `<div class="card" data-id="${i.id}" tabindex="0" role="button" aria-expanded="false">
        ${pic(i, hide)}<h3 class="nm">${hide ? '???' : esc(i.name)}</h3><div><span class="pill">${esc(PHASES[i.phase])}</span></div>
        <div class="det" hidden><p>${esc(i.use)}</p><p><b>Look for:</b> ${esc(i.look)}</p><p><b>Remember:</b> ${esc(i.mnemonic)}</p></div>
        <div class="meter"><i style="width:${pct(instMastery(i.id))}%"></i></div>
        <div class="photo-act row"><label class="btn" style="padding:4px 10px;font-size:.78rem">${S.photos[i.id] ? 'Replace my photo' : 'Use my own photo'}<input type="file" accept="image/*" hidden data-up="${i.id}"></label>
        ${S.photos[i.id] ? `<button data-rm="${i.id}" style="padding:4px 10px;font-size:.78rem">Back to tray photo</button>` : ''}</div></div>`).join('') || '<p>No matches.</p>';
    };
    view.innerHTML = `<h1>The tray</h1><p class="sub">Photos are from your labeled tray. Tap a card to reveal what it does, or use “hide names” to self-test.</p>
      <div class="row" style="margin-bottom:14px"><input type="search" id="q" placeholder="Search instruments" style="flex:1;min-width:160px" aria-label="Search">
      <select id="ph" style="width:auto" aria-label="Filter by phase"><option value="">All phases</option>${Object.entries(PHASES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <label class="row" style="gap:6px"><input type="checkbox" id="hide"> Hide names</label></div><div class="lib" id="lib"></div>`;
    draw();
    document.getElementById('q').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
    document.getElementById('ph').onchange = e => { phase = e.target.value; draw(); };
    document.getElementById('hide').onchange = e => { hide = e.target.checked; draw(); };
    const lib = document.getElementById('lib');
    const toggle = c => {
      const d = c.querySelector('.det'), open = d.hidden;
      d.hidden = !open; c.setAttribute('aria-expanded', open);
      if (hide) { c.querySelector('.nm').textContent = open ? byId[c.dataset.id].name : '???'; }
    };
    lib.onclick = e => {
      if (e.target.closest('.photo-act')) {
        const rm = e.target.closest('[data-rm]');
        if (rm) { delete S.photos[rm.dataset.rm]; save(); draw(); }
        return;
      }
      const c = e.target.closest('.card'); if (c) toggle(c);
    };
    lib.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card')) { e.preventDefault(); toggle(e.target); } };
    lib.onchange = e => {
      const f = e.target.files && e.target.files[0], id = e.target.dataset.up; if (!f || !id) return;
      thumb(f, url => { S.photos[id] = url; save(); draw(); toast('Photo saved to this browser.'); });
    };
  }
  function thumb(file, cb) {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 480 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); cb(cv.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => toast('Could not read that image.');
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  // ---------- progress ----------
  function progress() {
    const now = Date.now();
    const rows = INSTRUMENTS.map(i => {
      const a = S.cards[SRS.key(i.id, 'see')], b = S.cards[SRS.key(i.id, 'know')];
      const due = [a, b].filter(x => x && x.state !== 'new').map(x => x.due);
      const nxt = due.length ? Math.min(...due) : 0;
      return { i, a: SRS.mastery(a, now), b: SRS.mastery(b, now), lapses: (a ? a.lapses : 0) + (b ? b.lapses : 0), nxt };
    });
    const mix = [];
    for (const [a, o] of Object.entries(S.conf)) for (const [b, n] of Object.entries(o)) if (byId[a] && byId[b]) mix.push([a, b, n]);
    mix.sort((x, y) => y[2] - x[2]);
    const when = t => !t ? '-' : t <= now ? 'now' : t - now < 36e5 ? Math.round((t - now) / 6e4) + ' min' : t - now < 864e5 ? Math.round((t - now) / 36e5) + ' h' : Math.round((t - now) / 864e5) + ' d';
    const m = x => `<div class="meter" style="width:80px"><i style="width:${pct(x)}%"></i></div>`;
    view.innerHTML = `<h1>Progress</h1>
      <p class="sub">Today: ${S.daily.reviewed} answers, ${S.daily.reviewed ? pct(S.daily.correct / S.daily.reviewed) : 0}% correct.</p>
      <div class="panel" style="overflow-x:auto"><table><thead><tr><th>Instrument</th><th>Recognition</th><th>Recall</th><th>Lapses</th><th>Next</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.i.name)}</td><td>${m(r.a)}</td><td>${m(r.b)}</td><td>${r.lapses}</td><td>${when(r.nxt)}</td></tr>`).join('')}</tbody></table></div>
      <h2>Your mix-ups</h2><div class="panel">${mix.length ? '<ul style="margin:0;padding-left:20px">' + mix.slice(0, 8).map(([a, b, n]) => `<li><b>${esc(byId[a].name)}</b> mistaken for <b>${esc(byId[b].name)}</b> × ${n}</li>`).join('') + '</ul><p class="sub" style="margin:8px 0 0">These pairs are shown together more often in quizzes until they stick.</p>' : '<p style="margin:0">None yet. Mistakes in Quiz, Type and Match will show up here.</p>'}</div>
      <h2>Settings &amp; backup</h2><div class="panel"><div class="row">
        <label>New cards per day <input type="number" id="npd" min="2" max="30" value="${S.settings.newPerDay}" style="width:90px;display:inline-block"></label>
        <button id="exp">Export progress</button><label class="btn">Import<input type="file" id="imp" accept="application/json" hidden></label>
        <button id="rst" style="color:var(--bad)">Reset everything</button></div>
        <p class="sub" style="margin:10px 0 0">Progress is stored only in this browser. Export a backup if you switch devices.</p></div>`;
    document.getElementById('npd').onchange = e => { S.settings.newPerDay = Math.min(30, Math.max(2, +e.target.value || 10)); save(); toast('Saved.'); };
    document.getElementById('exp').onclick = () => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
      a.download = 'dc-tray-progress-' + today() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    document.getElementById('imp').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => {
        const d = JSON.parse(t);
        if (!d || typeof d.cards !== 'object' || d.v !== 1) throw new Error('bad');
        if (!confirm('Replace current progress with this backup?')) return;
        S = Object.assign(fresh(), d); save(); toast('Progress imported.'); progress();
      }).catch(() => toast('That file is not a valid backup.'));
    };
    document.getElementById('rst').onclick = () => { if (confirm('Erase all progress and photos on this device?')) { S = fresh(); save(); toast('Reset.'); progress(); } };
  }

  route();
})();
