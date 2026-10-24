// 価格はデモ用の仮数値。漁担当と合意したらこのファイルだけを調整する。
// category: seafood = 海の幸 / playful = おふざけ / penalty = 減点アイテム
export const ITEM_LIST = [
  { id: 'shirasu',   name: 'しらす',     icon: '🐟', price: 50,  category: 'seafood', bowlName: 'しらす丼',   comment: '駿河湾の恵み、しらすが主役の一杯！' },
  { id: 'sakuraebi', name: '桜エビ',     icon: '🦐', price: 90,  category: 'seafood', bowlName: '桜エビ丼',   comment: '桜色に染まった、静岡らしい一杯！' },
  { id: 'unagi',     name: 'うなぎ',     icon: '🐍', price: 230, category: 'seafood', bowlName: 'うなぎ丼',   comment: '今日はちょっと豪華に、うなぎで決まり！' },
  { id: 'ika',       name: 'イカ',       icon: '🦑', price: 80,  category: 'seafood', bowlName: 'イカ丼',     comment: 'ぷりぷりのイカがたっぷり！' },
  { id: 'tai',       name: 'タイ',       icon: '🐠', price: 180, category: 'seafood', bowlName: 'タイ丼',     comment: 'めでたい漁の成果だ！' },
  { id: 'kani',      name: 'カニ',       icon: '🦀', price: 200, category: 'seafood', bowlName: 'カニ丼',     comment: 'カニの存在感がすごい！' },
  { id: 'maguro',    name: 'マグロ',     icon: '🐟', price: 200, category: 'seafood', bowlName: 'マグロ丼',   comment: 'マグロ好きにはたまらない一杯！' },
  { id: 'katsuo',    name: 'カツオ',     icon: '🐟', price: 140, category: 'seafood', bowlName: 'カツオ丼',   comment: 'カツオのうまみがぎゅっと詰まった一杯！' },
  { id: 'ocha',      name: 'お茶葉',     icon: '🍵', price: 15,  category: 'playful', bowlName: 'お茶丼' },
  { id: 'ikura',     name: 'いくら',     icon: '🟠', price: 160, category: 'playful', bowlName: 'いくら丼',   comment: '宝石みたいないくらがキラキラ！' },
  { id: 'mikan',     name: 'みかん',     icon: '🍊', price: 25,  category: 'playful', bowlName: 'みかん丼' },
  { id: 'negitoro',  name: 'ネギトロ',   icon: '🍣', price: 120, category: 'playful', bowlName: 'ネギトロ丼' },
  { id: 'wasabi',    name: 'ワサビ',     icon: '🌿', price: 20,  category: 'playful', bowlName: 'ワサビ丼' },
  { id: 'unagipie',  name: 'うなぎパイ', icon: '🥧', price: 45,  category: 'playful', bowlName: 'うなぎパイ丼' },
  { id: 'can',       name: '空き缶',     icon: '🥫', price: -120,category: 'penalty' },
  { id: 'seaweed',   name: '海藻',       icon: '🌱', price: -50, category: 'penalty' },
];
export const ITEMS = Object.fromEntries(ITEM_LIST.map(item => [item.id, item]));

export const RULES = {
  namedBowlThreshold: 30,        // 30個以上で最多の食材名の丼にする
  specialBonusMultiplier: 1.3,  // しらすのみ / いくらのみの単一食材ボーナス
  specialSingleIngredientIds: ['shirasu', 'ikura'],
  mediumScoreThreshold: 1500,
  largeScoreThreshold: 3500,
};
