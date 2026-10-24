import React, { useState } from 'react';
import { useGame } from '../../game/GameContext.jsx';
import { FISH, emptyIngredients, bowlPrice } from '../../game/constants.js';
import FishArt from '../FishArt.jsx';
// 食材を種類ごとに交互に並べる（上限なし）
const toppingList = ingredients => {
  const left = { ...ingredients }, list = [];
  while (Object.values(left).some(Boolean)) for (const id in left) if (left[id] > 0) { list.push(id); left[id]--; }
  return list;
};
// ひまわり型の渦巻きで中心から外へ盛り、丼の縁を越えた分は外側へこぼれ落ちる
const toppingStyle = i => {
  const angle = i * 2.39996, r = 20 * Math.sqrt(i), dx = r * Math.cos(angle);
  const spill = Math.max(0, Math.abs(dx) - 120);
  const y = 72 + r * Math.sin(angle) * 0.45 - r * 0.3 + spill * 0.9;
  return { left: 140 + dx, top: y, zIndex: 3 + Math.round(y), transform: `translate(-50%, -50%) rotate(${(i * 37) % 30 - 15}deg)` };
};
export default function Donburi() {
  const { state, createBowl, sellBowl } = useGame();
  const [selected, setSelected] = useState(emptyIngredients);
  const [message, setMessage] = useState('');
  const ingredients = state.bowl?.ingredients || selected;
  const total = Object.values(selected).reduce((a,b) => a+b, 0);
  const toppings = toppingList(ingredients);
  return <><div className="section-heading"><div><p className="eyebrow">02 / DONBURI</p><h1>とれたてを、一杯に。</h1><p>好きな海の幸を盛りつけて、あなただけの海鮮丼を。</p></div></div><div className="two-columns"><section className="panel"><h2>食材をえらぶ</h2><p className="muted">食材の基本価格の合計が、販売価格になります。</p>{Object.entries(FISH).map(([id, fish]) => <div className="ingredient-row" key={id}><FishArt species={id}/><div className="ingredient-info"><strong>{fish.name}</strong><small>所持 {state.inventory[id]}尾 · ¥{fish.price} / 尾</small></div><div className="stepper"><button aria-label={`${fish.name}を減らす`} disabled={!!state.bowl || selected[id] === 0} onClick={() => setSelected(s => ({ ...s, [id]: s[id]-1 }))}>−</button><output>{selected[id]}</output><button aria-label={`${fish.name}を増やす`} disabled={!!state.bowl || selected[id] >= state.inventory[id]} onClick={() => setSelected(s => ({ ...s, [id]: s[id]+1 }))}>＋</button></div></div>)}<button className="secondary" disabled={!!state.bowl || !Object.values(state.inventory).some(Boolean)} onClick={() => setSelected({ ...state.inventory })}>すべて盛りつける</button><p className="mini-note">食材が足りなくなったら、海へ戻って収穫しよう。</p></section><section className="panel bowl-panel"><p className="eyebrow">YOUR SPECIAL BOWL</p><h2>{state.bowl ? '海鮮丼のできあがり！' : '本日の、駿河どん'}</h2><div className="bowl-illustration"><div className="rice">{!toppings.length && <span className="rice-hint">ここに海の幸を盛りつけよう</span>}</div><div className="topping-pile">{toppings.map((id, i) => <span className="topping" key={i} style={toppingStyle(i)}><FishArt species={id}/></span>)}</div><div className="bowl-base">駿河<span>どん</span></div><div className="bowl-foot"/></div><div className="price-line"><span>販売価格</span><strong>¥{(state.bowl?.price ?? bowlPrice(selected)).toLocaleString()}</strong></div>{state.bowl ? <button className="primary" onClick={() => { const price = state.bowl.price; sellBowl(); setMessage(`海鮮丼を販売しました！ +¥${price.toLocaleString()}`); }}>販売する →</button> : <button className="primary" disabled={!total} onClick={() => { createBowl(selected); setSelected(emptyIngredients()); setMessage('海鮮丼が完成しました。販売してお金にしよう！'); }}>海鮮丼を作る</button>}<p className="mini-note">{state.bowl ? '完成した丼は1杯まで。販売すると次の丼を作れます。' : `選択中 ${total}尾 · 作成すると食材を消費します。`}</p><p className="status" role="status">{message}</p></section></div></>;
}
