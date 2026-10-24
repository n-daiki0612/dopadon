import test from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer as reduce, initialState } from './reducer.js';
import { BALANCE, spawnInterval, upgradeCost, randomFish } from './constants.js';
const catchOne = (state, species, id = crypto.randomUUID()) => reduce(reduce(state, { type: 'SPAWN_FISH', fish: { id, species } }), { type: 'CATCH_FISH', id });
test('収穫は所持品に追加され、同じ個体は二重収穫できない', () => {
  const state = catchOne(initialState(), 'maguro', 'fish-1');
  assert.equal(state.inventory.maguro, 1);
  assert.equal(state.activeFish.length, 0);
  assert.strictEqual(reduce(state, { type: 'CATCH_FISH', id: 'fish-1' }), state);
});
test('食材消費・250円で販売・二重作成と二重販売を拒否', () => {
  let state = catchOne(catchOne(catchOne(initialState(), 'sakuraebi'), 'sakuraebi'), 'maguro');
  state = reduce(state, { type: 'CREATE_BOWL', ingredients: { sakuraebi: 2, maguro: 1 } });
  assert.equal(state.inventory.sakuraebi, 0); assert.equal(state.inventory.maguro, 0); assert.equal(state.bowl.price, 250);
  assert.strictEqual(reduce(state, { type: 'CREATE_BOWL', ingredients: { sakuraebi: 1 } }), state);
  state = reduce(state, { type: 'SELL_BOWL' });
  assert.equal(state.money, 250); assert.equal(state.bowl, null);
  assert.strictEqual(reduce(state, { type: 'SELL_BOWL' }), state);
});
test('無効な食材・負数・小数・超過・空の丼を拒否', () => {
  const state = catchOne(initialState(), 'sakuraebi');
  for (const ingredients of [{}, { sakuraebi: 0 }, { sakuraebi: -1 }, { sakuraebi: 1.5 }, { sakuraebi: 2 }, { unknown: 1 }, { sakuraebi: NaN }, null, [], { sakuraebi: '1' }]) {
    assert.strictEqual(reduce(state, { type: 'CREATE_BOWL', ingredients }), state);
  }
});
test('資金不足と無効な強化を拒否、購入で200円消費し間隔短縮', () => {
  const state = initialState();
  assert.strictEqual(reduce(state, { type: 'BUY_UPGRADE', id: 'lure' }), state);
  const rich = { ...state, money: 200 };
  assert.strictEqual(reduce(rich, { type: 'BUY_UPGRADE', id: 'unknown' }), rich);
  const upgraded = reduce(rich, { type: 'BUY_UPGRADE', id: 'lure' });
  assert.equal(upgraded.money, 0); assert.equal(upgraded.upgrades.lure, 1);
  assert.equal(spawnInterval(1), 1275); assert.ok(spawnInterval(1) < spawnInterval(0));
});
test('最大レベル・間隔の最低値・強化費用の増加', () => {
  let state = { ...initialState(), money: 100000 };
  for (let i = 0; i < BALANCE.maxLevel; i++) { state = reduce(state, { type: 'BUY_UPGRADE', id: 'lure' }); assert.ok(upgradeCost(i+1) > upgradeCost(i)); }
  assert.equal(state.upgrades.lure, 5);
  assert.strictEqual(reduce(state, { type: 'BUY_UPGRADE', id: 'lure' }), state);
  assert.ok(spawnInterval(5) >= BALANCE.minInterval); assert.equal(spawnInterval(100), BALANCE.minInterval);
});
test('基本ループを繰り返しても食材・お金が負にならない', () => {
  let state = initialState();
  for (let i = 0; i < 30; i++) {
    state = catchOne(catchOne(state, 'maguro'), 'shirasu');
    state = reduce(state, { type: 'CREATE_BOWL', ingredients: { maguro: 1, shirasu: 1 } });
    state = reduce(state, { type: 'SELL_BOWL' });
    state = reduce(state, { type: 'BUY_UPGRADE', id: 'lure' });
    assert.ok(state.money >= 0); assert.ok(Object.values(state.inventory).every(n => n >= 0));
  }
  assert.equal(state.stats.sold, 30); assert.equal(state.stats.earned, 6600); assert.equal(state.upgrades.lure, 5);
});
test('魚の退出・画面切替で削除、出現上限と種類別出現率', () => {
  let state = initialState();
  for (let i=0; i<40; i++) state = reduce(state, { type: 'SPAWN_FISH', fish: { id: `id${i}`, species: 'shirasu' } });
  assert.equal(state.activeFish.length, BALANCE.maxFish);
  state = reduce(state, { type: 'REMOVE_FISH', id: 'id0' }); assert.equal(state.activeFish.length, BALANCE.maxFish-1);
  state = reduce(state, { type: 'CLEAR_FISH' }); assert.equal(state.activeFish.length, 0);
  assert.equal(randomFish(0), 'sakuraebi'); assert.equal(randomFish(.5), 'shirasu'); assert.equal(randomFish(.9), 'maguro');
});
