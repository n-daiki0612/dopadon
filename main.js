import { calculateScore } from "./scoring.js";

const app = document.getElementById("app");

// ゲーム全体の状態
const gameState = {
  money: 0,
};

// 直前のリザルト
let lastResult = null;

// 強化画面から戻る先
let shopReturn = "title";

// HTMLファイルを読み込む
async function loadPage(page) {
  const response = await fetch(`./pages/${page}.html`);

  if (!response.ok) {
    throw new Error(`${page}.html の読み込みに失敗しました`);
  }

  app.innerHTML = await response.text();
}

// タイトル画面
async function showTitle() {
  await loadPage("title");

  document.getElementById("money").textContent = gameState.money;
  document.getElementById("start").onclick = showFishing;
  document.getElementById("shop").onclick = () => showShop("title");
}

// 漁画面
async function showFishing() {
  await loadPage("fishing");

  // 仮の捕獲データ
  const catches = {
    shirasu: 30,
    sakuraebi: 10,
    maguro: 2,
    can: 1,
  };

  // 将来的にはfishing.jsから捕獲データを受け取る
  document.getElementById("finish").onclick = () => {
    finishFishing(catches);
  };
}

// 漁終了処理
function finishFishing(catches) {
  const result = calculateScore(catches);

  gameState.money += result.totalScore;
  lastResult = result;

  showResult(result);
}

// リザルト画面
async function showResult(result) {
  await loadPage("result");

  document.getElementById("result-name").textContent = result.name;
  document.getElementById("result-size").textContent = result.size;
  document.getElementById("result-score").textContent = result.totalScore;
  document.getElementById("result-comment").textContent = result.comment;

  document.getElementById("retry").onclick = showFishing;
  document.getElementById("shop").onclick = () => showShop("result");
  document.getElementById("title").onclick = showTitle;
}

// 強化画面
async function showShop(returnTo = "title") {
  shopReturn = returnTo;

  await loadPage("shop");

  document.getElementById("money").textContent = gameState.money;

  // 将来的にはshop.jsを呼び出す
  document.getElementById("back").onclick = () => {
    if (shopReturn === "result" && lastResult) {
      showResult(lastResult);
    } else {
      showTitle();
    }
  };
}

// ゲーム開始
showTitle();
