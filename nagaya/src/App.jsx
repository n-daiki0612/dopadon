import React, { useEffect, useState } from 'react';
import { useGame } from './game/GameContext.jsx';
import Fishing from './components/fishing/Fishing.jsx';
import Donburi from './components/donburi/Donburi.jsx';
import Shop from './components/shop/Shop.jsx';
import { isMuted, playBgm, playSe, setMuted } from './game/sound.js';
export default function App() {
  const [page, setPage] = useState('fishing');
  const { state } = useGame();
  const [muted, setMutedState] = useState(isMuted);
  useEffect(() => { playBgm(page); if (page === 'shop') playSe('enterShop'); }, [page]);
  const go = id => { if (id !== page && id !== 'shop') playSe('select'); setPage(id); };
  const toggleSound = () => { setMuted(!muted); setMutedState(!muted); };
  return <div className="app"><header><a className="brand" href="#" onClick={e => { e.preventDefault(); go('fishing'); }}><span className="brand-mark">≋</span><span>駿河どん！<small>SHIZUOKA SEAFOOD DAYS</small></span></a><nav aria-label="ゲーム画面">{[['fishing','漁にでる','01'],['donburi','海鮮丼','02'],['shop','ショップ','03']].map(([id, label, number]) => <button key={id} aria-current={page === id ? 'page' : undefined} className={page === id ? 'selected' : ''} onClick={() => go(id)}><small>{number}</small> {label}{id === 'donburi' && state.bowl && <span className="nav-dot"/>}</button>)}</nav><button className="sound-toggle" aria-pressed={!muted} aria-label={muted ? 'サウンドをオンにする' : 'サウンドをオフにする'} onClick={toggleSound}>{muted ? '🔇' : '🔊'}</button><div className="wallet"><span className="coin">¥</span><div><small>所持金</small><strong>¥{state.money.toLocaleString()}</strong></div></div></header><main>{page === 'fishing' ? <Fishing navigate={go}/> : page === 'donburi' ? <Donburi/> : <Shop/>}</main><footer><span>静岡の海から、いただきます。</span><span>SURUGA DON! <b>≋</b> SHIZUOKA</span><small>進行はこのページを開いている間のみ保存されます</small></footer></div>;
}
