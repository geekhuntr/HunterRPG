/* Instrument Lab 3D: the 3D viewport is the main experience. Study content (names, functions, features, inventory) comes from the
   existing tray data. Models live in ST3D.models; the inventory shows honestly which ones exist. */
(function () {
  'use strict';
  const E = window.ST_ENGINE, ST3D = window.ST3D, { CATS, RECORDS, FLAGS } = window.ST_DATA, COMPARES = window.ST_COMPARE;
  const TRAYS = ['Minor', 'Major', 'D&C'];
  const ROWS = window.ST_ROWS.map(r => ({ id: r[0], tray: r[1], wording: r[2], qty: r[3], note: r[4], rec: r[5], variant: r[6], flag: r[7] }));
  const byId = {}; RECORDS.forEach(r => { byId[r.id] = r; r.rows = []; }); ROWS.forEach(w => byId[w.rec].rows.push(w));
  RECORDS.forEach(r => { r.trays = TRAYS.filter(t => r.rows.some(w => w.tray === t)); r.allAliases = [...new Set([r.name, ...r.aliases, ...r.rows.map(w => w.wording)])]; });
  const qty = (r, t) => r.rows.filter(w => w.tray === t).reduce((a, w) => a + w.qty, 0);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // models <-> records
  const MODELS = ST3D.models, modelIds = () => Object.keys(MODELS).filter(k => MODELS[k].ready !== false);
  const modelOfRec = {}; Object.values(MODELS).forEach(m => (m.records || [m.recordId]).forEach(r => { modelOfRec[r] = m.id; }));
  const recOfModel = m => byId[MODELS[m].recordId];
  const VIEWLABEL = { front: 'Front', back: 'Back', side: 'Edge-on', oblique: '3/4 view', jaws: 'Jaws close-up', jawsOblique: 'Jaws 3/4', jawsTop: 'Jaws from above', tip: 'Tip end-on', ratchet: 'Ratchet', box: 'Box lock', blades: 'Blades', screw: 'Pivot screw', rings: 'Rings', teeth: 'Teeth', jawsOpen: 'Jaws open' };

  // ---------- storage ----------
  const KEY = 'st3d.v1';
  let S = { theme: 'system', prog: {}, sel: MODELS.babcock ? 'babcock' : modelIds()[0], tray: 'All', seen: {} };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* memory only */ }
  if (!MODELS[S.sel]) S.sel = MODELS.babcock ? 'babcock' : modelIds()[0];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  const applyTheme = () => { const r = document.documentElement; if (S.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme); };

  // ---------- state ----------
  let tab = (location.hash || '').replace('#', ''); if (!['inspect', 'identify', 'compare', 'inventory'].includes(tab)) tab = 'inspect';
  let viewer = null, viewer2 = null, revealed = false, activePart = null, openK = 0, invTray = 'All', invOpen = {}, ID = null, CMP = { i: 0, reveal: false, sync: true };
  const app = $('#app');
  function destroyViewers() { [viewer, viewer2].forEach(v => { if (v) { v.destroy(); } }); viewer = viewer2 = null; }

  function render() {
    destroyViewers();
    const ready = modelIds().length;
    app.innerHTML = `<header class="top"><div class="brand"><b>3D</b> Instrument Lab</div>
      <div class="row"><span class="stat" title="Models completed">${ready} of ${RECORDS.length} instruments modeled</span><button class="btn sm" data-act="theme">${S.theme[0].toUpperCase() + S.theme.slice(1)} mode</button></div></header>
      <nav class="tabs" aria-label="Sections">${[['inspect', 'Inspect'], ['identify', 'Identify'], ['compare', 'Compare'], ['inventory', 'Inventory']].map(([k, l]) => `<button class="tab" data-act="tab" data-v="${k}" ${k === tab ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</nav>
      <main id="view">${({ inspect: viewInspect, identify: viewIdentify, compare: viewCompare, inventory: viewInventory })[tab]()}</main>`;
    ({ inspect: mountInspect, identify: mountIdentify, compare: mountCompare, inventory: () => { } })[tab]();
  }
  const viewButtons = def => Object.keys(def.views).map(k => `<button class="vb" data-act="view" data-v="${k}">${VIEWLABEL[k] || k}</button>`).join('');

  // ---------- Inspect ----------
  function viewInspect() {
    const m = MODELS[S.sel], r = recOfModel(S.sel);
    return `<div class="stage"><section class="vpwrap" aria-label="3D viewport">
        <div class="vp" id="vp"></div>
        <div class="vp-hint" id="hint">Drag to rotate \u00b7 pinch or scroll to zoom</div>
        <button class="btn sm vp-reset" data-act="reset">Reset view</button>
        <button class="btn sm vp-ruler" data-act="ruler" aria-pressed="${S.ruler !== false}">10 cm ruler</button>
        ${m.hasArticulation ? `<label class="vp-open"><span>Open / close</span><input type="range" id="open" min="0" max="100" value="${Math.round(openK * 100)}" aria-label="Open or close the instrument"></label>` : ''}
        <div class="vp-views" role="group" aria-label="Camera views">${viewButtons(m)}</div></section>
      <aside class="side" id="side">${sideInspect(m, r)}</aside></div>`;
  }
  function sideInspect(m, r) {
    const ids = modelIds();
    const parts = m.parts.map(([k, l]) => `<button class="chip btnchip" data-act="part" data-v="${k}" aria-pressed="${activePart === k}">${l}</button>`).join('');
    let body;
    if (!revealed) body = `<span class="lab">Study this model</span><h2 class="mystery">Which instrument is this?</h2>
      <p class="muted">Rotate it, zoom in on the jaws, open and close it. Name the parts below, then check yourself.</p>
      <div class="chips" role="group" aria-label="Parts. Tap to highlight.">${parts}</div>
      <button class="btn pri big" data-act="reveal">Reveal name and function</button>`;
    else body = `<span class="lab">${esc(CATS[r.cat])}</span><h2 class="name">${esc(r.name)}</h2>
      <p class="fn">${esc(r.fn)}</p>
      <div><span class="lab">Key identifying features</span><ul class="feat">${r.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
      <div class="chips" role="group" aria-label="Parts. Tap to highlight.">${parts}</div>
      <div><span class="lab">Easily confused with</span><p>${r.conf ? `<b>${esc(r.conf.name)}.</b> ${esc(r.conf.diff)}` : 'See your instructor.'}</p></div>
      <div class="chips">${r.trays.map(t => `<span class="chip">${esc(t)} <span class="q">×${qty(r, t)}</span></span>`).join('')}</div>
      <div class="row"><button class="btn ok" data-act="know">Know it</button><button class="btn bad" data-act="again">Study again</button></div>
      <button class="btn sm" data-act="hide">Hide answer</button>`;
    return `<div class="selrow"><button class="btn sm" data-act="prev" aria-label="Previous model" ${ids.length < 2 ? 'disabled' : ''}>‹</button>
        <label class="sr" for="sel">Model</label><select id="sel">${ids.map(i => `<option value="${i}" ${i === S.sel ? 'selected' : ''}>${revealed && i === S.sel ? esc(recOfModel(i).name) : 'Model ' + (ids.indexOf(i) + 1) + (i === S.sel ? ' (name hidden)' : '')}</option>`).join('')}</select>
        <button class="btn sm" data-act="next" aria-label="Next model" ${ids.length < 2 ? 'disabled' : ''}>›</button></div>
      ${body}
      <details class="status"><summary>About this 3D model</summary><p>${esc(m.status.note)}</p><p class="muted">${esc(m.dims || '')}</p></details>`;
  }
  function mountInspect() {
    viewer = new ST3D.Viewer($('#vp'), { preserve: true }); viewer.rulerOn = S.ruler !== false; viewer.load(S.sel); viewer.setOpen(openK); window.__st3d.viewer = viewer;
    if (activePart) viewer.highlight(activePart);
    const o = $('#open'); if (o) o.addEventListener('input', () => { openK = o.value / 100; viewer.setOpen(openK); });
    viewer.controls.addEventListener('start', () => { const h = $('#hint'); if (h) h.classList.add('gone'); });
  }
  const refreshSide = () => { const s = $('#side'); if (s) s.innerHTML = sideInspect(MODELS[S.sel], recOfModel(S.sel)); };
  function switchModel(id) { S.sel = id; save(); revealed = false; activePart = null; openK = 0; viewer.load(id); viewer.setOpen(0); const sv = $('.vp-views'); if (sv) sv.innerHTML = viewButtons(MODELS[id]); const o = $('#open'); if (o) o.value = 0; const wrap = $('.vp-open'); if (wrap) wrap.hidden = !MODELS[id].hasArticulation; refreshSide(); }

  // ---------- Identify (model-based quiz) ----------
  function newIdentify() {
    const ids = E.priorityOrder(S.prog, modelIds().map(m => recOfModel(m))).map(r => modelOfRec[r.id]);
    const modeled = modelIds().map(m => recOfModel(m));
    const pickD = r => { const out = E.shuffle(modeled.filter(x => x.id !== r.id)).sort((a, b) => (b.cat === r.cat) - (a.cat === r.cat)).slice(0, 3);
      for (const x of E.pickDistractors(r, RECORDS.filter(q => q.quiz), 6)) { if (out.length >= 3) break; if (!out.includes(x) && x.id !== r.id) out.push(x); } return out; };
    ID = { qs: ids.map(mid => { const r = recOfModel(mid), d = pickD(r); return { m: mid, choices: E.shuffle([r, ...d]).map(x => x.id), answer: r.id, chosen: null }; }), i: 0, score: 0, done: false };
  }
  function viewIdentify() {
    if (!modelIds().length) return `<div class="panel">No models yet.</div>`;
    if (!ID) newIdentify();
    if (ID.done) return `<div class="panel"><span class="lab">Score</span><div class="score">${ID.score} / ${ID.qs.length}</div><button class="btn pri" data-act="idnew">Go again</button></div>`;
    const q = ID.qs[ID.i], r = byId[q.answer], done = q.chosen !== null;
    const ch = q.choices.map((id, k) => `<button class="choice ${done ? (id === q.answer ? 'right' : k === q.chosen ? 'wrong' : '') : ''}" data-act="idans" data-v="${k}" ${done ? 'disabled' : ''}><span class="L">${'ABCD'[k]}</span><span>${esc(byId[id].name)}</span></button>`).join('');
    const fb = done ? `<div class="fb ${q.choices[q.chosen] === q.answer ? 'ok' : 'no'}" role="status"><h3>${q.choices[q.chosen] === q.answer ? 'Correct' : 'Not quite'}: ${esc(r.name)}</h3><p>${esc(r.fn)}</p><p><b>Look for:</b> ${esc(r.feat[0])}.</p></div><button class="btn pri" data-act="idnext">${ID.i + 1 === ID.qs.length ? 'See score' : 'Next model'}</button>` : '';
    return `<div class="stage"><section class="vpwrap"><div class="vp" id="vp"></div><div class="vp-hint" id="hint">Rotate and zoom to inspect before you answer</div><button class="btn sm vp-reset" data-act="reset">Reset view</button>
        <div class="vp-views">${viewButtons(MODELS[q.m])}</div>${MODELS[q.m].hasArticulation ? `<label class="vp-open"><span>Open / close</span><input type="range" id="open" min="0" max="100" value="0"></label>` : ''}</section>
      <aside class="side"><span class="lab">Identify ${ID.i + 1} / ${ID.qs.length}</span><h2 class="mystery">What is this instrument?</h2><div class="choices">${ch}</div>${fb}</aside></div>`;
  }
  function mountIdentify() {
    if (!$('#vp')) return;
    viewer = new ST3D.Viewer($('#vp'), { preserve: true }); const q = ID.qs[ID.i]; viewer.load(q.m); window.__st3d.viewer = viewer;
    const o = $('#open'); if (o) o.addEventListener('input', () => viewer.setOpen(o.value / 100));
  }

  // ---------- Compare ----------
  const PAIRS = [['allis', 'babcock'], ['kelly', 'crile'], ['mayo-curved', 'metz'], ['mayo-straight', 'mayo-curved'], ['yankauer', 'poole'], ['yankauer', 'frazier'], ['richardson', 'deaver'], ['senn', 'armynavy']];
  const pairModels = p => p.map(r => modelOfRec[r]);
  function viewCompare() {
    const avail = PAIRS.map((p, i) => ({ p, i, ok: pairModels(p).every(Boolean) }));
    const cur = avail[CMP.i] && avail[CMP.i].ok ? avail[CMP.i] : null;
    const tabs = avail.map(a => `<button class="btn sm" data-act="cmp" data-v="${a.i}" aria-pressed="${a.i === CMP.i}" ${a.ok ? '' : 'disabled'}>${esc(byId[a.p[0]].name.replace(/ (hemostat|forceps|scissors.*)$/, ''))} vs ${esc(byId[a.p[1]].name.replace(/ (hemostat|forceps|scissors.*)$/, ''))}${a.ok ? '' : ' (model pending)'}</button>`).join('');
    if (!cur) return `<div class="panel"><h2>Side-by-side comparison</h2><p>Side-by-side 3D comparison needs a finished model for both instruments. ${avail.filter(a => !a.ok).length} comparison pairs are waiting on models.</p><div class="row">${tabs}</div></div>`;
    const [a, b] = cur.p.map(i => byId[i]), card = COMPARES.find(c => c.items.some(it => it.rec === a.id) && c.items.some(it => it.rec === b.id));
    return `<div class="row" style="margin-bottom:10px">${tabs}</div>
      <div class="cmpgrid"><section class="vpwrap small"><div class="vp" id="vp"></div><div class="tag" id="tagA">${CMP.reveal ? esc(a.name) : 'Instrument A'}</div></section>
        <section class="vpwrap small"><div class="vp" id="vp2"></div><div class="tag" id="tagB">${CMP.reveal ? esc(b.name) : 'Instrument B'}</div></section></div>
      <div class="vp-views plain">${viewButtons(MODELS[pairModels(cur.p)[0]])}</div>
      <div class="row" style="margin:8px 0"><label class="check"><input type="checkbox" id="sync" ${CMP.sync ? 'checked' : ''}> Sync both cameras</label><label class="vp-open static"><span>Open / close</span><input type="range" id="open" min="0" max="100" value="0"></label><button class="btn sm" data-act="reset">Reset both</button></div>
      <div class="panel">${CMP.reveal ? `<h3>${esc(a.name)} vs ${esc(b.name)}</h3><div class="cols"><div class="col"><h4>${esc(a.name)}</h4><p>${esc(a.fn)}</p><p><b>Look for:</b> ${esc(a.feat[0])}.</p></div><div class="col"><h4>${esc(b.name)}</h4><p>${esc(b.fn)}</p><p><b>Look for:</b> ${esc(b.feat[0])}.</p></div></div><div class="tip"><b>Quick rule:</b> ${esc(card ? card.practical : (a.conf && a.conf.rec === b.id ? a.conf.diff : ''))}</div><button class="btn sm" data-act="cmphide">Hide names</button>` : `<p>Inspect both models, then reveal which is which and how to tell them apart.</p><button class="btn pri" data-act="cmpreveal">Reveal names and the key difference</button>`}</div>`;
  }
  function mountCompare() {
    const a = $('#vp'), b = $('#vp2'); if (!a) return;
    const pm = pairModels(PAIRS[CMP.i]);
    viewer = new ST3D.Viewer(a, { preserve: true }); viewer2 = new ST3D.Viewer(b, { preserve: true });
    viewer.load(pm[0]); viewer2.load(pm[1]); window.__st3d.viewer = viewer; window.__st3d.viewer2 = viewer2;
    let lock = false;
    const sync = (from, to) => from.controls.addEventListener('change', () => { if (!CMP.sync || lock) return; lock = true; to.camera.position.copy(to.controls.target).add(from.camera.position.clone().sub(from.controls.target).setLength(to.camera.position.distanceTo(to.controls.target) * 0 + from.camera.position.distanceTo(from.controls.target))); to.camera.lookAt(to.controls.target); to.dirty(); lock = false; });
    sync(viewer, viewer2); sync(viewer2, viewer);
    const o = $('#open'); if (o) o.addEventListener('input', () => { viewer.setOpen(o.value / 100); viewer2.setOpen(o.value / 100); });
    const sy = $('#sync'); if (sy) sy.addEventListener('change', () => { CMP.sync = sy.checked; });
  }

  // ---------- Inventory ----------
  const stateOf = r => { const m = modelOfRec[r.id]; return m ? (MODELS[m].status.reviewed ? { k: 'ready', t: '3D model ready', n: MODELS[m].status.note } : { k: 'ready', t: '3D model (review pending)', n: MODELS[m].status.note }) : { k: 'none', t: 'No 3D model yet', n: 'Text details only for now.' }; };
  function viewInventory() {
    const list = RECORDS.filter(r => invTray === 'All' || r.trays.includes(invTray)).sort((a, b) => (modelOfRec[b.id] ? 1 : 0) - (modelOfRec[a.id] ? 1 : 0) || a.name.localeCompare(b.name));
    const per = TRAYS.map(t => { const rs = RECORDS.filter(r => r.trays.includes(t)); return `<span class="chip">${t}: <b>${rs.filter(r => modelOfRec[r.id]).length}</b> of ${rs.length} instruments modeled</span>`; }).join('');
    return `<div class="panel"><h2>Inventory and 3D status</h2><p class="muted">Every instrument from your Minor, Major and D&C lists is here (${ROWS.length} list rows combined into ${RECORDS.length} study records). A model counts as ready only when it is built and reviewed.</p><div class="chips">${per}</div>
      <div class="seg" role="group" aria-label="Tray">${['All', ...TRAYS].map(t => `<button class="btn sm" data-act="invtray" data-v="${esc(t)}" aria-pressed="${invTray === t}">${t}</button>`).join('')}</div></div>
      <div class="inv">${list.map(r => { const s = stateOf(r), open = invOpen[r.id]; return `<div class="invrow ${s.k}"><button class="invhead" data-act="invopen" data-v="${r.id}" aria-expanded="${!!open}"><span class="nm">${esc(r.name)}</span><span class="chip ${s.k === 'ready' ? 'okc' : ''}">${s.t}</span><span class="muted">${r.trays.map(t => t + ' ×' + qty(r, t)).join(' · ')}</span></button>
        ${open ? `<div class="invbody"><p>${esc(r.fn)}</p><ul class="feat">${r.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p class="muted">${esc(s.n)}</p>${s.k === 'ready' ? `<button class="btn sm pri" data-act="openmodel" data-v="${modelOfRec[r.id]}">Open the 3D model</button>` : ''}</div>` : ''}</div>`; }).join('')}</div>`;
  }

  // ---------- events ----------
  const acts = {
    tab: v => { tab = v; try { history.replaceState(null, '', '#' + v); } catch (e) { /* sandbox */ } if (v === 'identify') ID = null; render(); },
    theme: () => { S.theme = { system: 'light', light: 'dark', dark: 'system' }[S.theme]; applyTheme(); save(); },
    view: v => { viewer.view(v); if (viewer2) viewer2.view(v); },
    ruler: (v, el) => { S.ruler = S.ruler === false; save(); [viewer, viewer2].forEach(x => x && x.toggleRuler(S.ruler)); if (el) el.setAttribute('aria-pressed', S.ruler); },
    reset: () => { const o = $('#open'); if (o) o.value = 0; openK = 0; viewer.reset(); if (viewer2) viewer2.reset(); activePart = null; if (tab === 'inspect') refreshSide(); },
    reveal: () => { revealed = true; refreshSide(); },
    hide: () => { revealed = false; refreshSide(); },
    part: v => { activePart = activePart === v ? null : v; viewer.highlight(activePart); if (activePart) { const m = MODELS[S.sel]; const map = { rings: 'rings', shanks: 'front', box: 'box', ratchet: 'ratchet', jaws: 'jaws' }; if (m.partViews && m.partViews[v]) viewer.view(m.partViews[v]); else if (m.views[map[v]]) viewer.view(map[v]); } refreshSide(); },
    know: () => { E.mark(S.prog, recOfModel(S.sel).id, 'c'); save(); acts.next(); },
    again: () => { E.mark(S.prog, recOfModel(S.sel).id, 'w'); save(); acts.next(); },
    next: () => step(1), prev: () => step(-1),
    idans: v => { const q = ID.qs[ID.i]; if (q.chosen !== null) return; q.chosen = +v; const ok = q.choices[q.chosen] === q.answer; E.mark(S.prog, q.answer, ok ? 'c' : 'w'); save(); if (ok) ID.score++; keepView(); },
    idnext: () => { if (ID.i + 1 >= ID.qs.length) ID.done = true; else ID.i++; render(); },
    idnew: () => { ID = null; render(); },
    cmp: v => { CMP.i = +v; CMP.reveal = false; render(); }, cmpreveal: () => { CMP.reveal = true; render(); }, cmphide: () => { CMP.reveal = false; render(); },
    invtray: v => { invTray = v; render(); }, invopen: v => { invOpen[v] = !invOpen[v]; render(); },
    openmodel: v => { S.sel = v; save(); revealed = false; tab = 'inspect'; render(); }
  };
  // re-render the side panel of the identify tab without resetting the 3D camera
  function keepView() { const side = $('.side'); const tmp = document.createElement('div'); tmp.innerHTML = viewIdentify(); const ns = tmp.querySelector('.side'); if (side && ns) side.innerHTML = ns.innerHTML; }
  function step(d) { const ids = modelIds(); let i = ids.indexOf(S.sel); i = (i + d + ids.length) % ids.length; if (tab === 'inspect') switchModel(ids[i]); else { S.sel = ids[i]; render(); } }
  app.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const f = acts[el.dataset.act]; if (f) f(el.dataset.v, el); });
  app.addEventListener('change', e => { if (e.target.id === 'sel') switchModel(e.target.value); });
  document.addEventListener('keydown', e => { if (e.target.matches && e.target.matches('input, select, textarea')) return; if (tab === 'inspect' && viewer) { if (e.key === 'r') acts.reset(); } });

  window.__st3d = { get S() { return S; }, MODELS, byId, RECORDS, ROWS, acts, get tab() { return tab; } };
  applyTheme(); render();
})();
