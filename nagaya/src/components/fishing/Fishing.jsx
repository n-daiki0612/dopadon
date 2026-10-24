import React, { useEffect, useState } from 'react';
import { useGame } from '../../game/GameContext.jsx';
import { BALANCE, FISH, randomFish, spawnInterval } from '../../game/constants.js';
import FishArt from '../FishArt.jsx';
export default function Fishing({ navigate }) {
  const { state, spawnFish, clearFish, removeFish, catchFish } = useGame();
  const [notice, setNotice] = useState(null);
  const interval = spawnInterval(state.upgrades.lure);
  useEffect(() => {
    const spawn = () => spawnFish({ id: crypto.randomUUID(), species: randomFish(), top: 19 + Math.random() * 51, direction: Math.random() > .5 ? 1 : -1 });
    spawn();
    const timer = setInterval(spawn, interval);
    return () => clearInterval(timer);
  }, [interval, spawnFish]);
  useEffect(() => () => clearFish(), [clearFish]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 1200); return () => clearTimeout(timer); }, [notice]);
  return <>
    <div className="section-heading"><div><p className="eyebrow">01 / FISHING</p><h1>駿河湾で、ひと潜り。</h1><p>泳ぐ魚をクリックして、とれたての海の幸を集めよう。</p></div><span className="location">● 静岡・駿河湾</span></div>
    <div className="fishing-layout"><section className="ocean" aria-label="漁のフィールド">
      <div className="ocean-top"><span>水揚げ日和 <i>☀</i></span><span>出現間隔 {(interval / 1000).toFixed(2)}s</span></div>
      <div className="sunbeam"/><div className="sunbeam second"/>
      {[0,1,2,3,4,5,6].map(i => <span key={i} className="bubble" style={{ left: `${10 + i * 13}%`, animationDelay: `${-i * 1.7}s` }}/ >)}
      <div className="sea-label">SURUGA BAY <span>小さな漁から、大きな一杯へ。</span></div>
      {state.activeFish.map(fish => <button key={fish.id} className={`swimming-fish direction-${fish.direction}`} style={{ top: `${fish.top}%`, animationDuration: `${BALANCE.swimDuration}ms` }} aria-label={`${FISH[fish.species].name}を収穫`} onAnimationEnd={() => removeFish(fish.id)} onClick={() => { catchFish(fish.id); setNotice({ text: `${FISH[fish.species].name} +1`, id: fish.id }); }}><FishArt species={fish.species}/><span className="fish-name">{FISH[fish.species].name}</span></button>)}
      <div className="seabed"><span>〰</span><span>♧</span><span>〰</span><span>♧</span></div>
      <div className="catch-notice" role="status">{notice && <span key={notice.id}>✦ {notice.text}</span>}</div>
      <p className="ocean-hint">☝ 魚をクリック / タップで収穫</p>
    </section><aside className="panel catch-panel"><p className="eyebrow">TODAY'S CATCH</p><h2>いまの水揚げ</h2><p className="muted">おいしい一杯の、もとになる。</p><div className="inventory-list">{Object.entries(FISH).map(([id, fish]) => <div className="inventory-row" key={id}><FishArt species={id}/><div><strong>{fish.name}</strong><small>¥{fish.price} / 尾</small></div><b>{state.inventory[id]}<small> 尾</small></b></div>)}</div><div className="catch-total"><span>収穫した数</span><strong>{state.stats.caught} <small>尾</small></strong></div><button className="primary" onClick={() => navigate('donburi')}>海鮮丼をつくる <span>→</span></button><p className="mini-note">1尾からでも、海鮮丼にできます。</p></aside></div>
    <div className="journey"><span className="active">01 <b>海で収穫</b></span><i>→</i><span>02 <b>丼をつくって販売</b></span><i>→</i><span>03 <b>道具を強化</b></span><div>くり返すほど、漁が楽しくなる。</div></div>
  </>;
}
