import { ITEMS, TOOLS } from './data/config.js';
import { itemArt } from './fishing.js';
export const moneyText = value => `${value.toLocaleString('ja-JP')} G`;

export function renderResult(root, result) {
  for (const key of ['name', 'size', 'comment', 'bonusName']) root.querySelector(`[data-result="${key}"]`).textContent = result[key];
  for (const key of ['baseScore', 'bonus', 'penalty', 'totalScore']) root.querySelector(`[data-result="${key}"]`).textContent = moneyText(result[key]);
  root.querySelector('#result-count').textContent = `${result.count} 個`;
  root.querySelector('#settled-note').textContent = `第${result.trip}回の売上は反映済みです。${result.brokenTool ? ` ${TOOLS[result.brokenTool].name}が壊れたため、銛に戻しました。` : ''}`;
  const entries = ITEMS.filter(i => result.catches[i.id] > 0);
  root.querySelector('#catch-list').innerHTML = entries.length ? entries.map(i =>
    `<li class="${i.kind === 'trash' ? 'bad' : ''}"><span>${i.emoji} ${i.name}</span><strong>× ${result.catches[i.id]}</strong></li>`).join('') : '<li>捕獲なし。次の漁に挑戦しよう！</li>';
  const foods = entries.filter(i => i.kind !== 'trash');
  const bowl = root.querySelector('#toppings');
  const toppings = [];
  // 各種類を先に1つずつ載せ、最大14個まで数量順に追加。売上は全捕獲が対象。
  for (const item of foods) toppings.push(item);
  for (const item of foods) for (let n = 1; n < result.catches[item.id] && toppings.length < 14; n++) toppings.push(item);
  bowl.innerHTML = toppings.slice(0, 14).map((item, i) => {
    const angle = i * 2.4, radius = 12 + Math.sqrt(i) * 7;
    return `<span class="topping" style="left:${50 + Math.cos(angle) * radius}%;top:${42 + Math.sin(angle) * radius * 0.55}%;transform:translate(-50%,-50%) rotate(${i * 17 % 40 - 20}deg)">${itemArt(item)}</span>`;
  }).join('');
}
