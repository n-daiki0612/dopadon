import React, { useState } from 'react';
import { FISH } from '../game/constants.js';
export default function FishArt({ species }) {
  const [failed, setFailed] = useState(false);
  const fish = FISH[species];
  return failed ? <span aria-hidden="true" className={`fish-image fish-placeholder ${species}`} style={{ background: fish.color }}/> : <img className={`fish-image ${species}`} src={fish.image} alt="" onError={() => setFailed(true)} />;
}
