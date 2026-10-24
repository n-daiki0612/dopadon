import { TOOLS, UPGRADES, upgradePrice, statsFor } from './config.js';
import { moneyText } from './result.js';
import { itemArt } from './fishing.js';
import { playSe } from './sound.js';

export function purchaseUpgrade(state, id) {
  if (!Object.hasOwn(UPGRADES, id) || state.activeTrip) return false;
  const level = state.upgrades[id], price = upgradePrice(id, level);
  if (level >= UPGRADES[id].max || state.money < price) return false;
  state.money -= price; state.upgrades[id]++; return true;
}
export function purchaseTool(state, id) {
  if (!Object.hasOwn(TOOLS, id) || id === 'spear' || state.activeTrip) return false;
  const tool = TOOLS[id];
  if (state.money < tool.price || state.tools[id] > 0) return false;
  state.money -= tool.price; state.tools[id] = tool.durability; state.equipment = id; return true;
}
export function equipTool(state, id) {
  if (!Object.hasOwn(TOOLS, id) || state.activeTrip || (id !== 'spear' && !state.tools[id])) return false;
  state.equipment = id; return true;
}
export function describeStats(state) {
  const s = statsFor(state);
  return `攻撃力 ${s.attack} / ${s.radius ? `範囲 ${s.radius}px` : '単体攻撃'} / ${s.duration}秒 / 出現 ×${s.spawnRate.toFixed(1)} / 速度 ${Math.round(s.speedFactor * 100)}% / 減点軽減 ${Math.round(s.penaltyReduction * 100)}%`;
}
export function renderShop(root, state, onChange) {
  root.querySelector('#abilities').textContent = describeStats(state);
  root.querySelector('#equipped-tool').textContent = `${TOOLS[state.equipment].name} · ${state.equipment === 'spear' ? '壊れない' : `残り ${state.tools[state.equipment]} 回の漁`}`;
  root.querySelector('#upgrades').innerHTML = Object.entries(UPGRADES).map(([id, def]) => {
    const level = state.upgrades[id], maxed = level >= def.max, price = upgradePrice(id, level);
    return `<article class="shop-card"><div class="card-top"><span class="tag">能力強化</span><b>Lv.${level} / ${def.max}</b></div><h3>${def.name}</h3><p>${def.description}</p><button data-upgrade="${id}" ${maxed || state.money < price ? 'disabled' : ''}>${maxed ? '最大レベル' : `${moneyText(price)} で強化`}</button></article>`;
  }).join('');
  root.querySelector('#tools').innerHTML = Object.entries(TOOLS).map(([id, tool]) => {
    const owned = id === 'spear' || state.tools[id] > 0;
    return `<article class="shop-card"><div class="card-top"><span class="tool-icon">${itemArt(tool)}</span><span class="tag">${id === state.equipment ? '装備中' : owned ? '所持中' : '未所持・破損'}</span></div><h3>${tool.name}</h3><p>${tool.radius ? `基本半径 ${tool.radius}px・基本攻撃力 ${tool.attack}` : 'クリックした1体に攻撃'}<br>${tool.durability ? `耐久 ${owned ? state.tools[id] : tool.durability} 回の漁` : '耐久無限'}${tool.miss ? '・15%ですっぽ抜け' : ''}</p><button data-${owned ? 'equip' : 'tool'}="${id}" ${id === state.equipment || (!owned && state.money < tool.price) ? 'disabled' : ''}>${owned ? id === state.equipment ? '装備中' : '装備する' : `${moneyText(tool.price)} で購入・装備`}</button></article>`;
  }).join('');
  for (const button of root.querySelectorAll('[data-upgrade],[data-tool],[data-equip]')) {
    button.onclick = () => {
      const ok = button.dataset.upgrade ? purchaseUpgrade(state, button.dataset.upgrade)
        : button.dataset.tool ? purchaseTool(state, button.dataset.tool) : equipTool(state, button.dataset.equip);
      if (ok) playSe(button.dataset.equip ? 'select' : 'purchase');
      root.querySelector('#shop-message').textContent = ok ? '更新しました！次の漁から効果が反映されます。' : '購入できません。所持金と所持状態を確認してください。';
      onChange(); renderShop(root, state, onChange);
    };
  }
}
