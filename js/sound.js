// BGM・効果音の再生。音声ファイルは assets/sounds/ に置く。
// Node.js のテストから読み込まれても動くよう、Audio はブラウザでのみ使う。
const BGM = {
  title: 'bgm-title.mp3',
  fishing: 'bgm-fishing.mp3',
  result: 'bgm-donburi.mp3',
  shop: 'bgm-upgrade.mp3',
};
const SE = {
  select: 'select.mp3',
  harpoon: 'harpoon.mp3',
  net: 'net.mp3',
  purchase: 'purchase.mp3',
  enterShop: 'shop-enter.mp3',
  result: 'result.mp3',
};
const BGM_VOLUME = 0.35;
const SE_VOLUME = 0.7;
const MUTE_KEY = 'kaisendon_muted';
const canPlay = typeof Audio !== 'undefined';
const src = file => `./assets/sounds/${file}`;

let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* 保存できない環境では毎回オン */ }

let bgm = null, bgmPage = null, waitingForUnlock = false;
const seCache = {};

// ブラウザは最初の操作まで自動再生を止めるので、操作があったら再挑戦する。
function unlockLater() {
  if (waitingForUnlock || typeof window === 'undefined') return;
  waitingForUnlock = true;
  const retry = () => {
    waitingForUnlock = false;
    window.removeEventListener('pointerdown', retry);
    window.removeEventListener('keydown', retry);
    if (bgm && !muted) bgm.play().catch(() => {});
  };
  window.addEventListener('pointerdown', retry);
  window.addEventListener('keydown', retry);
}

export function playBgm(page) {
  if (!canPlay || page === bgmPage) return;
  bgm?.pause();
  bgmPage = page;
  bgm = BGM[page] ? new Audio(src(BGM[page])) : null;
  if (!bgm) return;
  bgm.loop = true;
  bgm.volume = BGM_VOLUME;
  if (!muted) bgm.play().catch(unlockLater);
}

export function playSe(name) {
  if (!canPlay || muted || !SE[name]) return;
  seCache[name] ??= new Audio(src(SE[name]));
  // 連打しても重ねて鳴るよう複製して再生する。
  const audio = seCache[name].cloneNode();
  audio.volume = SE_VOLUME;
  audio.play().catch(() => {});
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch { /* 無視 */ }
  if (!bgm) return;
  if (muted) bgm.pause(); else bgm.play().catch(unlockLater);
}
