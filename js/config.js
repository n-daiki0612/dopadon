// 調整可能な数値はここに集約。価格は既存 scoring.js を優先。
export const SETTINGS = { duration: 30, attack: 1, spawnInterval: [0.45, 0.9], stageWidth: 960,
  stageHeight: 480, itemSize: 76, nameThreshold: 30, middleCount: 10, bigCount: 20,
  priceGrowth: 1.65, saveKey: 'kaisendon_save_v1', maxCatchCount: 100000 };
const item = (id, name, price, hp, appearance, speed, emoji, image = '', kind = 'seafood') =>
  ({ id, name, price, maxHp: hp, appearance, speed, emoji, image, kind });
const image = id => `./assets/${id === 'can' ? 'items' : 'fish'}/${id}.png`;
export const ITEMS = [
  item('shirasu', 'しらす', 50, 1, 18, [110,160], '🐟', image('shirasu')),
  item('sakuraebi', '桜エビ', 100, 1, 15, [130,190], '🦐', image('sakuraebi')),
  item('unagi', 'うなぎ', 50, 3, 6, [200,260], '🐟', image('unagi')),
  item('ika', 'イカ', 15, 1, 16, [120,180], '🦑', image('ika')),
  item('tai', 'タイ', 35, 2, 10, [150,210], '🐠', image('tai')),
  item('kani', 'カニ', 40, 2, 8, [90,140], '🦀', image('kani')),
  item('maguro', 'マグロ', 300, 4, 4, [170,220], '🐟', image('maguro')),
  item('katsuo', 'カツオ', 150, 3, 6, [160,210], '🐟'),
  item('tea', 'お茶葉', 60, 1, 4, [90,130], '🍵', '', 'fun'),
  item('ikura', 'いくら', 120, 2, 4, [100,150], '🔴', '', 'fun'),
  item('mikan', 'みかん', 60, 1, 4, [100,150], '🍊', '', 'fun'),
  item('negitoro', 'ネギトロ', 100, 2, 4, [110,160], '🍣', '', 'fun'),
  item('wasabi', 'ワサビ', 80, 1, 4, [120,170], '🌱', '', 'fun'),
  item('unagipie', 'うなぎパイ', 100, 1, 3, [130,180], '🥧', '', 'fun'),
  item('can', '空き缶', -100, 1, 9, [100,150], '🥫', image('can'), 'trash'),
  item('seaweed', '海藻', -50, 1, 7, [90,140], '🌿', '', 'trash'),
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
export const TOOLS = {
  spear: { name: '銛', emoji: '🔱', price: 0, radius: 0, attack: 1, durability: null, miss: 0 },
  net: { name: '網', emoji: '🕸️', price: 360, radius: 90, attack: 1, durability: 6, miss: 0 },
  bigNet: { name: '大きな網', emoji: '🕸️', price: 1200, radius: 155, attack: 2, durability: 5, miss: 0.15 },
};
export const UPGRADES = {
  range: { name: '網の投げ方を学ぶ', description: '網の半径 +15px（銛は単体のまま）', price: 200, step: 15, max: 8 },
  attack: { name: '網の使い方を学ぶ', description: 'すべての道具の攻撃力 +1', price: 250, step: 1, max: 8 },
  time: { name: '睡眠時間短縮', description: '漁の時間 +5秒（ゲーム内の能力です）', price: 150, step: 5, max: 6 },
  spawn: { name: '漁場開拓', description: '出現頻度 +20%ずつ', price: 300, step: 0.2, max: 8 },
  speed: { name: '船の性能強化', description: '魚の速度 −8%ずつ', price: 300, step: 0.08, max: 6 },
  penalty: { name: 'ゴミの分別名人', description: '減点 −15%ずつ', price: 200, step: 0.15, max: 6 },
};
// 上から最初の1件を採用。rate は基本点に追加する割合。
export const BONUSES = [
  { name: 'しらす丼ボーナス', rate: 0.8, only: 'shirasu' },
  { name: 'いくら丼ボーナス', rate: 0.8, only: 'ikura' },
  { name: '特上駿河湾ボーナス', rate: 2, kinds: 5, requires: { unagi: 1, kani: 1 } },
  { name: '五色ボーナス', rate: 1, kinds: 5 },
  { name: '静岡ダブルボーナス', rate: 1.2, requires: { shirasu: 2, sakuraebi: 2 } },
  { name: '紅白ボーナス', rate: 0.5, requires: { tai: 1, ika: 1 } },
];
export const upgradePrice = (id, level) => Math.round(UPGRADES[id].price * SETTINGS.priceGrowth ** level);
export function statsFor(state) {
  const l = state.upgrades, tool = TOOLS[state.equipment];
  return { attack: SETTINGS.attack * tool.attack + l.attack * UPGRADES.attack.step,
    radius: tool.radius ? tool.radius + l.range * UPGRADES.range.step : 0,
    duration: SETTINGS.duration + l.time * UPGRADES.time.step,
    spawnRate: 1 + l.spawn * UPGRADES.spawn.step, speedFactor: 1 - l.speed * UPGRADES.speed.step,
    penaltyReduction: l.penalty * UPGRADES.penalty.step };
}
