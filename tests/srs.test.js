const assert = require('assert');
const SRS = require('../js/srs.js');
const { INSTRUMENTS } = require('../js/data.js');
const { MIN, DAY } = SRS;
const t0 = 1e12;
let n = 0; const test = (name, fn) => { fn(); n++; console.log('ok -', name); };

test('new card -> Good, Good graduates to 1 day', () => {
  let c = SRS.schedule(SRS.newCard(), 2, t0);
  assert.equal(c.state, 'learning'); assert.equal(c.due, t0 + 10 * MIN);
  c = SRS.schedule(c, 2, c.due);
  assert.equal(c.state, 'review'); assert.equal(c.interval, 1);
});
test('Easy on a new card jumps to 4 days', () => {
  const c = SRS.schedule(SRS.newCard(), 3, t0);
  assert.equal(c.state, 'review'); assert.equal(c.interval, 4);
});
test('Again on a new card restarts at 1 minute', () => {
  const c = SRS.schedule(SRS.newCard(), 0, t0); assert.equal(c.due, t0 + MIN);
});
test('review intervals grow with Good and ease is stable', () => {
  let c = Object.assign(SRS.newCard(), { state: 'review', interval: 10, due: t0, ease: 2.5 });
  const g = SRS.schedule(c, 2, t0); assert.equal(g.interval, 25); assert.equal(g.ease, 2.5);
  const h = SRS.schedule(c, 1, t0); assert.equal(h.interval, 12); assert.ok(h.ease < 2.5);
  const e = SRS.schedule(c, 3, t0); assert.ok(e.interval > g.interval); assert.ok(e.ease > 2.5);
});
test('lapse: relearning, ease drops (floored), interval shrinks', () => {
  let c = Object.assign(SRS.newCard(), { state: 'review', interval: 30, due: t0, ease: 1.35 });
  const l = SRS.schedule(c, 0, t0);
  assert.equal(l.state, 'relearning'); assert.equal(l.lapses, 1); assert.equal(l.ease, SRS.CFG.minEase); assert.equal(l.interval, 9);
  const back = SRS.schedule(l, 2, t0 + 10 * MIN);
  assert.equal(back.state, 'review'); assert.equal(back.interval, 9);
});
test('Hard always advances at least one day', () => {
  const c = Object.assign(SRS.newCard(), { state: 'review', interval: 1, due: t0 });
  assert.ok(SRS.schedule(c, 1, t0).interval >= 2);
});
test('interval capped', () => {
  const c = Object.assign(SRS.newCard(), { state: 'review', interval: 300, due: t0, ease: 3 });
  assert.equal(SRS.schedule(c, 3, t0).interval, SRS.CFG.maxInterval);
});
test('grading from quiz answers', () => {
  assert.equal(SRS.gradeFromAnswer({ correct: false }), 0);
  assert.equal(SRS.gradeFromAnswer({ correct: true, ms: 12000 }), 1);
  assert.equal(SRS.gradeFromAnswer({ correct: true, ms: 5000 }), 2);
  assert.equal(SRS.gradeFromAnswer({ correct: true, ms: 1500, streak: 3 }), 3);
  assert.equal(SRS.gradeFromAnswer({ correct: true, ms: 1500, close: true }), 1);
});
test('typed answers: exact, alias, typo, wrong', () => {
  const h = INSTRUMENTS.find(i => i.id === 'hegar');
  assert.equal(SRS.checkTyped('Hegar dilators', h), 'exact');
  assert.equal(SRS.checkTyped('hegar', h), 'exact');
  assert.equal(SRS.checkTyped('Hegarr dilator', h), 'close');
  assert.equal(SRS.checkTyped('sound', h), 'wrong');
  assert.equal(SRS.checkTyped('', h), 'wrong');
});
test('queue: due before new, respects new limit, no adjacent repeats', () => {
  const ids = INSTRUMENTS.map(i => i.id), cards = {};
  cards[SRS.key('ring', 'see')] = Object.assign(SRS.newCard(), { state: 'review', interval: 3, due: t0 - DAY, last: t0 - 4 * DAY });
  cards[SRS.key('sound', 'know')] = Object.assign(SRS.newCard(), { state: 'review', interval: 3, due: t0 + 2 * DAY, last: t0 });
  const q = SRS.buildQueue(cards, ids, t0, { newLimit: 4, newDone: 0 });
  assert.equal(q.length, 5); // 1 due + 4 new; the not-yet-due card is excluded
  assert.ok(q.some(x => x.id === 'ring' && x.facet === 'see'));
  assert.ok(!q.some(x => x.id === 'sound' && x.facet === 'know'));
  for (let i = 1; i < q.length; i++) assert.notEqual(q[i].id, q[i - 1].id);
  assert.equal(SRS.buildQueue(cards, ids, t0, { newLimit: 4, newDone: 4 }).length, 1);
});
test('distractors prefer look-alikes and past confusions', () => {
  const t = INSTRUMENTS.find(i => i.id === 'hegar');
  const d = SRS.pickDistractors(t, INSTRUMENTS, {}, 2, () => 0).map(x => x.id).sort();
  assert.deepEqual(d, ['pratt', 'sound']);
  const d2 = SRS.pickDistractors(t, INSTRUMENTS, { hegar: { ovum: 5 } }, 1, () => 0);
  assert.equal(d2[0].id, 'ovum');
});
test('every instrument has art key and required fields', () => {
  for (const i of INSTRUMENTS) for (const k of ['id', 'name', 'phase', 'family', 'art', 'use', 'look', 'mnemonic']) assert.ok(i[k], i.id + ' missing ' + k);
});
console.log(n + ' tests passed');
