import { calculateResult } from './scoring.js';
import { renderResult } from './result.js';

// このファイルはプレビュー専用。本番では漁担当から受け取った捕獲数を使う。
const sampleSets = [
  { label: 'しらす大漁', catches: { shirasu: 38, can: 1, seaweed: 2 } },
  { label: '全部いくら', catches: { ikura: 24 } },
  { label: '海鮮いろいろ', catches: { shirasu: 9, sakuraebi: 8, maguro: 3, ika: 4, kani: 2, wasabi: 2 } },
  { label: 'マグロが主役', catches: { maguro: 32, shirasu: 6, katsuo: 4 } },
  { label: '収穫なし', catches: { can: 2 } },
];
let wallet = 800;
let active = 0;
let runId = 0;
const settledRuns = new Set();
const app = document.querySelector('#app');
const samples = document.querySelector('#samples');
const message = document.querySelector('#demo-message');

function settleOnce(id, result) {
  if (settledRuns.has(id)) return;
  settledRuns.add(id);
  wallet += result.earnedMoney;
}

function showSample(index) {
  active = index;
  const result = calculateResult(sampleSets[index].catches);
  settleOnce(++runId, result); // デモでは切り替えを新たな漁の完了として扱う
  renderResult(app, result, {
    wallet,
    onRetry: () => showSample((active + 1) % sampleSets.length),
    onUpgrade: () => {
      message.textContent = '強化画面への遷移イベントが発生しました（強化画面は別担当）。';
    },
    onTitle: () => {
      message.textContent = 'タイトル画面への遷移イベントが発生しました（タイトル画面は別担当）。';
    },
  });
  [...samples.children].forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === active));
  });
  message.textContent = `「${sampleSets[index].label}」を表示しています。サンプル切替・もう一度漁へで新しい漁を模擬します。`;
}

samples.replaceChildren(...sampleSets.map((sample, i) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = sample.label;
  button.addEventListener('click', () => showSample(i));
  return button;
}));
document.querySelector('#reset-wallet').addEventListener('click', () => {
  wallet = 800;
  settledRuns.clear();
  // 現在の結果は再精算しない。サンプル切替から新しい漁として計上される。
  renderResult(app, calculateResult(sampleSets[active].catches), {
    wallet,
    onRetry: () => showSample((active + 1) % sampleSets.length),
    onUpgrade: () => { message.textContent = '強化画面への遷移イベントが発生しました。'; },
    onTitle: () => { message.textContent = 'タイトル画面への遷移イベントが発生しました。'; },
  });
  message.textContent = '所持金を800円にリセットしました。';
});
showSample(0);
