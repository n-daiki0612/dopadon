// BGM と効果音の再生。音源は public/sounds に置く
const BGM = { title: 'bgm-title.mp3', fishing: 'bgm-fishing.mp3', donburi: 'bgm-donburi.mp3', shop: 'bgm-upgrade.mp3' };
const SE = { select: 'select.mp3', harpoon: 'harpoon.mp3', net: 'net.mp3', enterShop: 'shop-enter.mp3', purchase: 'purchase.mp3' };
const MUTE_KEY = 'surugadon-muted';
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch {}
let bgm = null, bgmName = null;

export function playSe(name) {
  if (muted) return;
  const audio = new Audio(`/sounds/${SE[name]}`);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}

export function playBgm(name) {
  if (bgmName === name) return;
  bgm?.pause();
  bgmName = name;
  bgm = new Audio(`/sounds/${BGM[name]}`);
  bgm.loop = true;
  bgm.volume = 0.35;
  if (!muted) bgm.play().catch(() => {});
}

export const isMuted = () => muted;
export function setMuted(value) {
  muted = value;
  try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch {}
  if (muted) bgm?.pause(); else bgm?.play().catch(() => {});
}

// ブラウザは操作前の自動再生を止めるので、最初のクリックやキー入力で BGM を鳴らし直す
const resume = () => { if (!muted && bgm?.paused) bgm.play().catch(() => {}); };
document.addEventListener('pointerdown', resume, { once: true });
document.addEventListener('keydown', resume, { once: true });
