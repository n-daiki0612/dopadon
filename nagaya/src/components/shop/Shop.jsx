import React from 'react';
import { useGame } from '../../game/GameContext.jsx';
import { BALANCE, spawnInterval, upgradeCost } from '../../game/constants.js';
export default function Shop() {
  const { state, buyUpgrade } = useGame();
  const level = state.upgrades.lure;
  const max = level >= BALANCE.maxLevel;
  const cost = upgradeCost(level);
  return <><div className="section-heading"><div><p className="eyebrow">03 / UPGRADE</p><h1>いい道具で、いい漁を。</h1><p>海鮮丼の売上で道具を強化。次のひと潜りを、もっと豊かに。</p></div></div><div className="two-columns"><section className="panel upgrade-panel"><div className="gear-art">🪸<span>✦</span></div><p className="eyebrow">FISHING EQUIPMENT</p><h2>おさかな集魚セット</h2><p className="muted">魚を呼び寄せて、出現までの時間を15%短縮。</p><div className="level-line"><strong>LEVEL {level} / {BALANCE.maxLevel}</strong><div className="level-bars">{Array.from({ length: BALANCE.maxLevel }, (_, i) => <span key={i} className={i < level ? 'filled' : ''}/>)}</div></div><div className="upgrade-effect"><span>魚の出現間隔</span><b>{(spawnInterval(level)/1000).toFixed(2)}秒</b>{!max && <><span>→</span><b>{(spawnInterval(level+1)/1000).toFixed(2)}秒</b></>}</div><button className="primary" disabled={max || state.money < cost} onClick={() => buyUpgrade('lure')}>{max ? '最大レベル達成！' : `強化する — ¥${cost.toLocaleString()}`}</button><p className="mini-note" role="status">{max ? '最高の道具で、駿河湾の海へ。' : state.money < cost ? `あと ¥${(cost-state.money).toLocaleString()}。海鮮丼を販売して貯めよう。` : '準備万端！ 購入すると、すぐに効果が反映されます。'}</p></section><aside className="panel log-panel"><p className="eyebrow">YOUR FISHING STORY</p><h2>あなたの漁の記録</h2><div><span>これまでの収穫</span><strong>{state.stats.caught}<small> 尾</small></strong></div><div><span>販売した海鮮丼</span><strong>{state.stats.sold}<small> 杯</small></strong></div><div><span>累計売上</span><strong>¥{state.stats.earned.toLocaleString()}</strong></div><p className="shop-tip">まずは200円を目標に。<br/>桜エビ1尾とマグロ1尾の丼で、<br/>最初の強化ができます。</p></aside></div></>;
}
