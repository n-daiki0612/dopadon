import { ITEM_LIST, ITEMS, RULES } from './data.js';

/**
 * 漁フェーズから受け取るデータ: { shirasu: 30, sakuraebi: 10, can: 1 }
 * 値は0以上の整数。未知のID・無効な数量は計算対象から除外する。
 * 副作用なし: 所持金は更新しない（画面表示と売上の二重加算を防ぐ）。
 */
export function calculateResult(catches = {}) {
  const rows = ITEM_LIST.map(item => {
    const raw = catches?.[item.id];
    const quantity = typeof raw === 'number' && Number.isFinite(raw) && raw > 0
      ? Math.floor(raw) : 0;
    return {
      id: item.id,
      name: item.name,
      icon: item.icon,
      category: item.category,
      unitPrice: item.price,
      quantity,
      subtotal: item.price * quantity,
    };
  }).filter(row => row.quantity > 0);

  const ingredients = rows.filter(row => row.category !== 'penalty');
  const totalCaught = ingredients.reduce((sum, row) => sum + row.quantity, 0);
  const basePrice = ingredients.reduce((sum, row) => sum + row.subtotal, 0);
  const penalty = -rows.filter(row => row.category === 'penalty')
    .reduce((sum, row) => sum + row.subtotal, 0);

  const singleIngredient = ingredients.length === 1 ? ingredients[0] : null;
  const special = singleIngredient && RULES.specialSingleIngredientIds.includes(singleIngredient.id);
  const bonus = special ? Math.floor(basePrice * (RULES.specialBonusMultiplier - 1)) : 0;
  const earnedMoney = Math.max(0, basePrice + bonus - penalty);

  // 同数最多の場合は ITEM_LIST の並びを優先し、毎回同じ結果にする。
  const dominant = ingredients.reduce((best, current) => {
    return !best || current.quantity > best.quantity ? current : best;
  }, null);

  let bowlBaseName = '海鮮丼';
  if (totalCaught === 0) {
    bowlBaseName = '収穫なし';
  } else if (special || (dominant && dominant.quantity >= RULES.namedBowlThreshold)) {
    bowlBaseName = ITEMS[dominant.id].bowlName;
  }

  const size = earnedMoney >= RULES.largeScoreThreshold ? '大盛'
    : earnedMoney >= RULES.mediumScoreThreshold ? '中盛' : '普通';
  const bowlName = totalCaught === 0 ? bowlBaseName
    : bowlBaseName === '海鮮丼'
      ? `海鮮${size === '普通' ? '' : size}丼`
      : bowlBaseName.replace(/丼$/, `${size === '普通' ? '' : size}丼`);

  let comment = 'いろんな海の幸が集まった、にぎやかな一杯！';
  if (totalCaught === 0) {
    comment = '今回は空振り。また次の漁でリベンジしよう！';
  } else if (special && dominant.id === 'shirasu') {
    comment = 'しらす一筋！ 駿河湾の恵みをぎゅっと一杯に。';
  } else if (special && dominant.id === 'ikura') {
    comment = 'ぜんぶいくら！ 夢みたいなキラキラ丼。';
  } else if (bowlBaseName !== '海鮮丼') {
    comment = ITEMS[dominant.id].comment ?? `${ITEMS[dominant.id].name}が主役の一杯！`;
  }

  return {
    bowlName,
    bowlBaseName,
    size,
    comment,
    rows,
    ingredients,
    totalCaught,
    basePrice,
    bonus,
    penalty,
    earnedMoney,
    specialBonusLabel: special ? `${singleIngredient.name}だけ！ 30%ボーナス` : null,
    dominantId: dominant?.id ?? null,
    // 魚アイコンはプレビュー表現用。実素材に置き換え可能。
    previewIcons: ingredients
      .slice().sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5).map(row => row.icon),
  };
}
