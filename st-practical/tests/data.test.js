const assert = require('assert'), fs = require('fs'), path = require('path');
const ROWS = require('../src/rows.js'), { CATS, RECORDS, FLAGS } = require('../src/records.js'), COMPARES = require('../src/compare.js'), E = require('../src/engine.js');
let n = 0; const test = (name, fn) => { fn(); n++; console.log('ok -', name); };
const byId = Object.fromEntries(RECORDS.map(r => [r.id, r]));
RECORDS.forEach(r => { r.rows = ROWS.filter(w => w[5] === r.id); r.allAliases = [...new Set([r.name, ...r.aliases, ...r.rows.map(w => w[2])])]; });

test('all 81 source rows present: Minor 23, Major 39, D&C 19', () => {
  assert.equal(ROWS.length, 81);
  for (const [t, c] of [['Minor', 23], ['Major', 39], ['D&C', 19]]) assert.equal(ROWS.filter(w => w[1] === t).length, c, t);
  assert.equal(new Set(ROWS.map(w => w[0])).size, 81, 'row ids unique');
});
test('every row maps to a record, every record has rows, flags resolve', () => {
  ROWS.forEach(w => { assert.ok(byId[w[5]], w[0] + ' record'); if (w[7]) assert.ok(FLAGS[w[7]], w[0] + ' flag'); assert.ok(w[3] >= 1 && w[3] <= 6, w[0] + ' qty'); });
  RECORDS.forEach(r => assert.ok(r.rows.length, r.id + ' has rows'));
  Object.entries(FLAGS).forEach(([k, f]) => f.rows.forEach(id => assert.ok(ROWS.find(w => w[0] === id), k + ' row ' + id)));
});
test('instructor wording and quantities preserved exactly (spot checks)', () => {
  const g = id => ROWS.find(w => w[0] === id);
  assert.deepEqual([g('M03')[2], g('M03')[3]], ['Kelly/ Rochester-Pean', 6]);
  assert.deepEqual([g('M09')[2], g('M09')[3]], ['Kocker- long', 2]);
  assert.deepEqual([g('M25')[2], g('M25')[3], g('M25')[4]], ['Deaver', 3, '1 Narrow, 1 wide, 1 medium']);
  assert.deepEqual([g('M29')[3], g('M29')[4]], [4, 'variety of sizes and angles']);
  assert.deepEqual([g('N09')[2], g('N09')[3]], ['Metzenbaum 5 or 7"', 1]);
  assert.deepEqual([g('D06')[2], g('D06')[3], g('D06')[4]], ['Cervical dilators- Hank or Hegar', 6, 'confirm sizes']);
  assert.equal(g('M35')[3], 1); assert.equal(g('M32')[3], 2); assert.equal(g('M39')[3], 1);
  // total instruments per tray by quantity
  const qty = t => ROWS.filter(w => w[1] === t).reduce((a, w) => a + w[3], 0);
  console.log('   total pieces: Minor', qty('Minor'), 'Major', qty('Major'), 'D&C', qty('D&C'));
});
test('meaningful variants are kept apart', () => {
  assert.ok(byId['mayo-straight'] && byId['mayo-curved'], 'straight vs curved Mayo');
  assert.ok(byId['towel-non'] && byId['towel-perf'], 'perforating vs not');
  assert.ok(byId['smooth-short'] && byId['smooth-long'] && byId['toothed-long'] && byId['adson'], 'toothed vs smooth, short vs long');
  const crile = byId.crile.rows.map(w => w[6]); assert.ok(crile.includes('curved') && crile.includes('straight'));
  const kocher = byId.kocher.rows.map(w => w[2]); assert.ok(kocher.includes('Kocker- long') && kocher.includes('Kocher- curved long'));
  const metz = byId.metz.rows.map(w => w[6]); assert.ok(metz.includes('7 in') && metz.includes('10 in'));
});
test('every record has the required study fields', () => {
  RECORDS.forEach(r => {
    for (const k of ['name', 'cat', 'g', 'fn', 'stem', 'ver']) assert.ok(r[k], r.id + ' missing ' + k);
    assert.ok(CATS[r.cat], r.id + ' category'); assert.ok(r.feat.length >= 2, r.id + ' features');
    assert.ok(r.fn.length < 220, r.id + ' function is one sentence-sized'); assert.equal((r.fn.match(/\. [A-Z]/g) || []).length <= 1, true, r.id + ' fn sentences');
    assert.ok(r.conf === null || (r.conf.name && r.conf.diff), r.id + ' confusion');
    if (r.conf && r.conf.rec) assert.ok(byId[r.conf.rec], r.id + ' conf rec');
  });
  COMPARES.forEach(c => c.items.forEach(i => assert.ok(byId[i.rec], c.id)));
});
test('no quiz question can have two defensible answers (choices span distinct groups)', () => {
  const pool = RECORDS.filter(r => r.quiz);
  for (let rep = 0; rep < 40; rep++) for (const r of pool) for (const t of ['A', 'B']) {
    const q = E.buildQuestion(r, t, pool), ch = q.choices.map(id => byId[id]);
    assert.equal(ch.length, 4, r.id + ' has 4 choices'); assert.equal(new Set(q.choices).size, 4);
    assert.equal(new Set(ch.map(c => c.g)).size, 4, r.id + ' choice groups ' + ch.map(c => c.g));
    assert.equal(new Set(ch.map(c => c.fn)).size, 4); assert.ok(q.choices.includes(r.id));
    assert.ok(ch.every(c => c.quiz), 'only confirmed records in quizzes');
  }
});
test('unconfirmed items are never quizzed', () => {
  ['nurse', 'babyblunt', 'skene'].forEach(id => assert.equal(byId[id].quiz, false, id));
});
test('typed-name matching: aliases, instructor wording, typos, wrong', () => {
  const ok = (s, id, want) => assert.equal(E.checkName(s, byId[id]), want, `${s} -> ${id}`);
  ok('Kelly', 'kelly', 'exact'); ok('kelly clamp', 'kelly', 'exact'); ok('Kelly- long', 'kelly', 'exact');
  ok('crile straight', 'crile', 'exact'); ok('Crile', 'crile', 'exact'); ok('Kely', 'kelly', 'close');
  ok('Metzenbaum', 'metz', 'exact'); ok('Metzenbam scissors', 'metz', 'close'); ok('metz', 'metz', 'exact');
  ok('Mayo', 'mayo-straight', 'close'); ok('straight mayo', 'mayo-straight', 'exact'); ok('curved mayo', 'mayo-straight', 'wrong');
  ok('hegar', 'cervdil', 'exact'); ok('Hanks dilators', 'cervdil', 'exact'); ok('Yankauer', 'yankauer', 'exact');
  ok('Simms retractor', 'sims', 'exact'); ok('sims', 'sims', 'exact'); ok('auvard', 'auvard', 'exact');
  ok('babcock', 'allis', 'wrong'); ok('', 'allis', 'wrong'); ok('Backhaus', 'towel-perf', 'exact'); ok('backhaus', 'towel-non', 'wrong');
  ok('weitlaner', 'weitlaner', 'exact'); ok('Weitlander', 'weitlaner', 'close');
});
test('prioritisation: missed items come first on average', () => {
  const prog = {}; E.mark(prog, 'crile', 'w'); E.mark(prog, 'kelly', 'c'); E.mark(prog, 'kelly', 'c'); E.mark(prog, 'kelly', 'c'); E.mark(prog, 'kelly', 'c');
  assert.ok(E.weight(prog, 'crile') > E.weight(prog, 'kelly') && E.weight(prog, 'kelly') < E.weight(prog, 'allis'));
  let crileFirst = 0, kellyFirst = 0;
  for (let i = 0; i < 400; i++) { const o = E.priorityOrder(prog, [byId.kelly, byId.crile, byId.allis]).map(r => r.id); if (o[0] === 'crile') crileFirst++; if (o[0] === 'kelly') kellyFirst++; }
  assert.ok(crileFirst > kellyFirst * 3, `${crileFirst} vs ${kellyFirst}`);
  assert.equal(prog.crile.box, 0); assert.equal(prog.kelly.box, 4); assert.ok(E.isMissed(prog, 'crile') && !E.isMissed(prog, 'kelly') && E.isMastered(prog, 'kelly'));
  E.mark(prog, 'kelly', 'w'); assert.equal(prog.kelly.box, 0); E.mark(prog, 'kelly', 'p'); assert.equal(prog.kelly.box, 0); assert.ok(E.isMissed(prog, 'kelly'));
});
test('photo files exist for every mapped D&C instrument', () => {
  const map = fs.readdirSync(path.join(__dirname, '..', 'photos')); assert.equal(map.length, 15);
});
console.log(n + ' tests passed');
