import React, { useState } from 'react';
import { FISH } from '../game/constants.js';
export default function FishArt({ species }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span aria-hidden="true" className={`fish-art ${species}`}>{FISH[species].emoji}{species === 'shirasu' && <small>🐟🐟</small>}</span> : <img className="fish-image" src={`/assets/${species}.png`} alt="" onError={() => setFailed(true)} />;
}
