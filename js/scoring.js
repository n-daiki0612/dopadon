import { ITEMS, SETTINGS, BONUSES } from './config.js';

export function normalizeCatches(catches = {}) {
  return Object.fromEntries(ITEMS.map(item => {
    const value = catches && Object.hasOwn(catches, item.id) ? catches[item.id] : 0;
    return [item.id, Number.isFinite(value) ? Math.max(0, Math.min(SETTINGS.maxCatchCount, Math.floor(value))) : 0];
  }));
}
// 純粋関数：所持金を変更しない。未知のIDは無視する。
export function calculateScore(catches, { penaltyReduction = 0 } = {}) {
  const counts = normalizeCatches(catches);
  const foods = ITEMS.filter(item => item.kind !== 'trash' && counts[item.id] > 0);
  const result = { name: '海鮮丼', size: '', count: 0, baseScore: 0, bonus: 0,
    bonusName: 'ボーナスなし', penalty: 0, totalScore: 0, comment: '' };
  for (const item of ITEMS) {
    const n = counts[item.id];
    if (item.kind === 'trash') result.penalty += Math.abs(item.price) * n;
    else { result.count += n; result.baseScore += item.price * n; }
  }
  result.size = result.count >= SETTINGS.bigCount ? '大盛' : result.count >= SETTINGS.middleCount ? '中盛' : '並盛';
  // 同数の場合は設定ファイルの掲載順を優先する。
  const most = foods.reduce((best, item) => !best || counts[item.id] > counts[best.id] ? item : best, null);
  if (most && counts[most.id] >= SETTINGS.nameThreshold) result.name = `${most.name}丼`;
  const bonus = foods.length ? BONUSES.find(rule =>
    (!rule.only || (foods.length === 1 && foods[0].id === rule.only)) &&
    (!rule.kinds || foods.length >= rule.kinds) &&
    Object.entries(rule.requires || {}).every(([id, n]) => counts[id] >= n)) : null;
  if (bonus) {
    result.bonusName = bonus.name;
    result.bonus = Math.round(result.baseScore * bonus.rate);
    if (bonus.dishName) result.name = bonus.dishName;
  }
  const reduction = Number.isFinite(penaltyReduction) ? Math.max(0, Math.min(1, penaltyReduction)) : 0;
  result.penalty = Math.round(result.penalty * (1 - reduction));
  result.totalScore = result.baseScore + result.bonus - result.penalty;
  result.comment = result.count === 0 ? '今日は白ごはん。次の漁でおいしい具を集めよう！'
    : foods.some(i => i.kind === 'fun') ? '自由な発想の一杯！意外な具材も、今日の漁の思い出。'
    : result.count >= SETTINGS.bigCount ? '海の恵みをたっぷり盛り付けた、満足の一杯！'
    : 'しらすや桜エビも探して、自分だけの一杯を育てよう。';
  return result;
}
