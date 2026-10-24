import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore } from '../js/scoring.js';
import { createState, beginTrip, settleTrip, saveState, loadState } from '../js/user_data.js';
import { ITEMS, TOOLS, UPGRADES, statsFor } from '../js/config.js';
import { purchaseUpgrade, purchaseTool, equipTool } from '../js/shop.js';
import { targetsAt, hitItem, pickWeighted } from '../js/fishing.js';

test('empty, unknown IDs and malformed quantities are safe', () => {
  for (const catches of [{}, null, { unknown: 99 }, { shirasu: -1, ika: Infinity, can: NaN }]) {
    const r = calculateScore(catches); assert.equal(r.count, 0); assert.equal(r.totalScore, 0);
  }
  assert.equal(calculateScore({ shirasu: 1.9 }).count, 1);
});
test('penalties multiply quantities and do not enter food count', () => {
  const r = calculateScore({ shirasu: 2, can: 3, seaweed: 2 });
  assert.equal(r.baseScore, 100); assert.equal(r.bonus, 80); assert.equal(r.penalty, 400);
  assert.equal(r.totalScore, -220); assert.equal(r.count, 2);
  assert.equal(calculateScore({ can: 0 }).penalty, 0);
  assert.equal(calculateScore({ can: 3 }, { penaltyReduction: .3 }).penalty, 210);
});
test('size boundaries and deterministic naming independent of size', () => {
  for (const [n, size] of [[0,'並盛'],[9,'並盛'],[10,'中盛'],[19,'中盛'],[20,'大盛']]) assert.equal(calculateScore({ ika: n }).size, size);
  assert.equal(calculateScore({ shirasu: 29 }).name, 'しらす丼');
  assert.equal(calculateScore({ shirasu: 30, maguro: 30 }).name, 'しらす丼');
  assert.equal(calculateScore({ maguro: 31, shirasu: 30 }).name, 'マグロ丼');
});
test('bonus dish names take priority while non-bonus naming is preserved', () => {
  const cases = [
    [{ shirasu: 1 }, 'しらす丼ボーナス', 'しらす丼'],
    [{ ikura: 1 }, 'いくら丼ボーナス', 'いくら丼'],
    [{ maguro: 1 }, 'マグロ丼ボーナス', 'マグロ丼'],
    [{ shirasu: 1, sakuraebi: 1, unagi: 1, kani: 1, tai: 1 }, '特上駿河湾ボーナス', '特上駿河湾丼'],
    [{ shirasu: 1, sakuraebi: 1, ika: 1, tai: 1, tea: 1 }, '五色ボーナス', '五色丼'],
    [{ shirasu: 30, sakuraebi: 2 }, '静岡ダブルボーナス', '静岡ダブル丼'],
    [{ tai: 30, ika: 1 }, '紅白ボーナス', '紅白丼'],
    [{}, 'ボーナスなし', '海鮮丼'],
    [{ can: 2 }, 'ボーナスなし', '海鮮丼'],
    [{ ika: 29 }, 'ボーナスなし', '海鮮丼'],
    [{ ika: 30 }, 'ボーナスなし', 'イカ丼'],
  ];
  for (const [catches, bonusName, name] of cases) {
    const result = calculateScore(catches);
    assert.equal(result.name, name);
    assert.equal(result.bonusName, bonusName);
  }
});

test('bonus rules are pure, food-only and select one priority', () => {
  const c = { ikura: 2, can: 1 }; const a = calculateScore(c), b = calculateScore(c);
  assert.deepEqual(a, b); assert.deepEqual(c, { ikura: 2, can: 1 });
  assert.equal(a.bonusName, 'いくら丼ボーナス'); assert.equal(a.bonus, 192);
  assert.equal(calculateScore({ shirasu: 2, sakuraebi: 2 }).bonus, 360);
  const r = calculateScore({ shirasu: 2, sakuraebi: 2, unagi: 1, kani: 1, tai: 1 });
  assert.equal(r.bonusName, '特上駿河湾ボーナス');
  assert.equal(r.totalScore, r.baseScore + r.bonus - r.penalty);
});
test('real fish IDs all have valid scoring and weighted selection', () => {
  for (const item of ITEMS) {
    assert.ok(Number.isFinite(calculateScore({ [item.id]: 1 }).totalScore));
    assert.ok(item.maxHp > 0 && item.appearance > 0);
  }
  assert.equal(pickWeighted(() => 0).id, ITEMS[0].id);
  assert.equal(pickWeighted(() => .999999).id, ITEMS.at(-1).id);
});
test('purchase checks funds, maximum levels, ownership and equipment', () => {
  const s = createState(); assert.equal(purchaseUpgrade(s, 'time'), false); assert.equal(purchaseTool(s, 'net'), false);
  assert.equal(equipTool(s, 'net'), false); assert.equal(purchaseUpgrade(s, '__proto__'), false);
  s.money = 10000000;
  for (const [id, def] of Object.entries(UPGRADES)) {
    for (let i = 0; i < def.max; i++) assert.equal(purchaseUpgrade(s, id), true);
    assert.equal(purchaseUpgrade(s, id), false);
  }
  assert.equal(purchaseTool(s, 'net'), true); assert.equal(s.equipment, 'net');
  const balance = s.money; assert.equal(purchaseTool(s, 'net'), false); assert.equal(s.money, balance);
  const stats = statsFor(s); assert.equal(stats.duration, 60); assert.equal(stats.attack, 9);
  assert.equal(stats.radius, 210); assert.equal(stats.spawnRate, 2.6); assert.equal(stats.speedFactor, .52);
  assert.ok(Math.abs(stats.penaltyReduction - .9) < 1e-10);
  equipTool(s, 'spear'); assert.equal(statsFor(s).radius, 0);
});
test('trip settlement is exactly once; tools break and can be replaced', () => {
  const s = createState(); s.money = 5000; purchaseTool(s, 'net');
  for (let i = 0; i < TOOLS.net.durability; i++) {
    const trip = beginTrip(s); assert.equal(beginTrip(s), null);
    assert.equal(purchaseUpgrade(s, 'time'), false);
    assert.equal(settleTrip(s, trip.id + 1, { shirasu: 1 }), null);
    const before = s.money; const result = settleTrip(s, trip.id, { shirasu: 1 });
    assert.equal(s.money, before + result.totalScore);
    assert.equal(settleTrip(s, trip.id, { shirasu: 1 }), null);
    assert.equal(s.money, before + result.totalScore);
  }
  assert.equal(s.tools.net, 0); assert.equal(s.equipment, 'spear'); assert.equal(s.lastResult.brokenTool, 'net');
  assert.equal(equipTool(s, 'net'), false); assert.equal(purchaseTool(s, 'net'), true);
});
test('spear is unbreakable, losses do not block another free trip', () => {
  const s = createState(); const trip = beginTrip(s); settleTrip(s, trip.id, { can: 3 });
  assert.equal(s.money, -300); assert.equal(s.equipment, 'spear'); assert.equal(s.tools.spear, null);
  assert.ok(beginTrip(s));
});
test('save roundtrip restores upgrades, tools and result without crediting twice', () => {
  let saved; const storage = { setItem: (_, v) => { saved = v; }, getItem: () => saved };
  const s = createState(); s.money = 2000; purchaseUpgrade(s, 'time'); purchaseTool(s, 'net');
  const trip = beginTrip(s); settleTrip(s, trip.id, { tai: 3 });
  assert.equal(saveState(s, storage), true); const restored = loadState(storage);
  assert.equal(restored.money, s.money); assert.equal(restored.upgrades.time, 1); assert.equal(restored.tools.net, 5);
  assert.deepEqual(restored.lastResult, s.lastResult); assert.equal(restored.activeTrip, null);
  beginTrip(s); saveState(s, storage); assert.equal(loadState(storage).activeTrip, null);
  saved = '{broken'; assert.deepEqual(loadState(storage), createState());
  assert.equal(saveState(s, { setItem() { throw Error('blocked'); } }), false);
});
test('range attack, single target, HP and miss probability', () => {
  const items = [{ uid: '1', x: 10, y: 10, hp: 2 }, { uid: '2', x: 50, y: 10, hp: 1 }, { uid: '3', x: 300, y: 10, hp: 1 }];
  assert.equal(targetsAt(items, { x: 10, y: 10 }, 90).length, 2);
  assert.deepEqual(targetsAt(items, { x: 0, y: 0 }, 0, '2'), [items[1]]);
  assert.equal(hitItem(items[0], 1, .15, () => .1), 'miss'); assert.equal(items[0].hp, 2);
  assert.equal(hitItem(items[0], 1, 0), 'hit'); assert.equal(items[0].hp, 1);
  assert.equal(hitItem(items[0], 1, 0), 'caught'); assert.equal(hitItem(items[0], 1, 0), 'done');
  assert.equal(targetsAt(items, { x: 10, y: 10 }, 90).length, 1);
});
