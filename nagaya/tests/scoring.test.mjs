import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateResult } from '../js/scoring.js';

test('空の収穫は売上0円', () => {
  const result = calculateResult({});
  assert.equal(result.earnedMoney, 0);
  assert.equal(result.bowlName, '収穫なし');
});

test('単一しらすはしらす丼になり30%加点', () => {
  const result = calculateResult({ shirasu: 10 });
  assert.equal(result.bowlName, 'しらす丼');
  assert.equal(result.basePrice, 500);
  assert.equal(result.bonus, 150);
  assert.equal(result.earnedMoney, 650);
});

test('単一いくらはボーナス適用', () => {
  const result = calculateResult({ ikura: 5 });
  assert.equal(result.bowlName, 'いくら丼');
  assert.equal(result.earnedMoney, 1040);
});

test('混合で30個以上の最多食材を採用', () => {
  const result = calculateResult({ sakuraebi: 30, shirasu: 10 });
  assert.equal(result.bowlName, '桜エビ中盛丼');
  assert.equal(result.bonus, 0);
});

test('混合で30個未満なら海鮮丼', () => {
  const result = calculateResult({ shirasu: 4, maguro: 2 });
  assert.equal(result.bowlName, '海鮮丼');
});

test('サイズは獲得金額に基づく', () => {
  assert.equal(calculateResult({ maguro: 8 }).size, '中盛');
  assert.equal(calculateResult({ maguro: 18 }).size, '大盛');
});

test('空き缶は減点され食材数には含まれない', () => {
  const result = calculateResult({ shirasu: 2, can: 1 });
  assert.equal(result.basePrice, 100);
  assert.equal(result.penalty, 120);
  assert.equal(result.earnedMoney, 10); // しらすだけの30%ボーナスを適用後、空き缶で減点
  assert.equal(result.totalCaught, 2);
});

test('同数最多の場合の優先順位は安定', () => {
  const result = calculateResult({ shirasu: 30, sakuraebi: 30 });
  assert.equal(result.dominantId, 'shirasu');
});

test('不正な値や未知のIDは集計しない', () => {
  const result = calculateResult({ shirasu: -4, maguro: 1.8, can: Infinity, other: 500 });
  assert.equal(result.totalCaught, 1);
  assert.equal(result.earnedMoney, 200);
});

test('入力を変更しない', () => {
  const catches = { shirasu: 4, can: 1 };
  const copy = structuredClone(catches);
  calculateResult(catches);
  assert.deepEqual(catches, copy);
});
