const catches = {
  //fishの個数
  shirasu: 30,
  sakuraebi: 10,
  maguro: 2,
  can: 1,
};

const seafoodPrices = {
  // 将来的にはfish_data.jsからインポートする
  shirasu: 50,
  sakuraebi: 100,
  maguro: 300,
  can: -100,
};

export function calculateScore(catches) {
  const result = {
    name: "", //海鮮丼の名前
    size: "", //丼のサイズ
    count: 0, //魚の数合計
    baseScore: 0, //魚の値段合計
    bonus: 0, //ボーナスで追加される値段
    bonusName: "", // ボーナス名
    penalty: 0, //ペナルティで減産される値段
    totalScore: 0,
    comment: "",
  };
  const big_size_basis = 20; //サイズ「大」「中」の境の値
  const litlle_size_basis = 10; //サイズ「中」「小」の境の値

  for (const key of Object.keys(catches)) {
    result.baseScore += catches[key] * seafoodPrices[key]; //捕獲数×値段を合算
    result.count += catches[key]; //count決定処理
    if (seafoodPrices[key] < 0) {
      result.penalty += seafoodPrices[key]; // penaltyを求める
    }
  }
  // size決定処理
  if (result.count >= big_size_basis) {
    result.size = "big";
  } else if (result.fish_count >= litlle_size_basis) {
    result.size = "middle";
  } else {
    result.size = "little";
  }

  // bonus加算処理
  // name決定処理
  // comment作成処理
  // totalScore計算
  result.totalScore = result.baseScore + result.bonus;
  console.log(result);
  return result;
}

calculateScore(catches);
