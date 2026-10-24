import { calculateScore } from "./scoring.js";

const app = document.getElementById("app");

// ゲーム全体の状態
const gameState = {
  money: 0,
};

// タイトル画面
function showTitle() {
  app.innerHTML = `
    <h1>海の幸あつめて海鮮丼</h1>
    <p>所持金：${gameState.money}円</p>
    <button id="start">漁に出る</button>
    <button id="shop">アップグレード</button>
  `;

  document.getElementById("start").onclick = showFishing;
  document.getElementById("shop").onclick = showShop;
}

// 漁画面（仮）
function showFishing() {
  app.innerHTML = `
    <h1>漁画面</h1>
    <button id="finish">漁を終了</button>
  `;

  document.getElementById("finish").onclick = () => {
    // 仮の捕獲データ
    const catches = {
      shirasu: 30, //個数
      sakuraebi: 10,
      maguro: 2,
      can: 1,
    };

    finishFishing(catches);
  };
}

// 漁終了処理
function finishFishing(catches) {
  const result = calculateScore(catches);

  gameState.money += result.totalScore;

  showResult(result);
}

// リザルト画面（仮）
function showResult(result) {
  app.innerHTML = `
    <h1>リザルト</h1>
    <p>${result.name}</p>
    <p>獲得金額：${result.totalScore}円</p>
    <button id="back">タイトルへ</button>
  `;

  document.getElementById("back").onclick = showTitle;
}

// アップグレード画面（仮）
function showShop() {
  app.innerHTML = `
    <h1>アップグレード画面</h1>
    <button id="back">タイトルへ</button>
  `;

  document.getElementById("back").onclick = showTitle;
}

// 起動
showTitle();
