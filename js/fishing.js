import { ITEMS, ITEM_BY_ID, SETTINGS, TOOLS } from './config.js';
import { playSe } from './sound.js';

export function pickWeighted(random = Math.random) {
  let n = random() * ITEMS.reduce((sum, item) => sum + item.appearance, 0);
  for (const item of ITEMS) { n -= item.appearance; if (n <= 0) return item; }
  return ITEMS.at(-1);
}
export function targetsAt(items, point, radius, targetId) {
  return items.filter(item => !item.done && (radius === 0 ? item.uid === targetId
    : Math.hypot(item.x - point.x, item.y - point.y) <= radius));
}
export function hitItem(item, attack, miss, random = Math.random) {
  if (item.done) return 'done';
  if (random() < miss) return 'miss';
  item.hp = Math.max(0, item.hp - attack);
  if (item.hp === 0) { item.done = true; return 'caught'; }
  return 'hit';
}
export function itemArt(item) {
  const emoji = `<span class="emoji" aria-hidden="true">${item.emoji}</span>`;
  // 画像が読み込めないときだけ絵文字に切り替える。
  return item.image ? `<img src="${item.image}" alt="" draggable="false" onerror="this.outerHTML=this.dataset.fallback" data-fallback='${emoji}'>` : emoji;
}

// 既存 game.js の重み付き生成・左移動・正弦波の揺れを再利用。
export function startFishing(root, trip, catches, onFinish) {
  const sea = root.querySelector('#sea'), hudTime = root.querySelector('#hud-time');
  const hudCount = root.querySelector('#hud-count'), ring = root.querySelector('#aim');
  const { stats, equipment } = trip, tool = TOOLS[equipment];
  const W = SETTINGS.stageWidth, H = SETTINGS.stageHeight;
  let items = [], uid = 0, raf = 0, stopped = false, elapsed = 0, spawnTimer = 0, lastTime = performance.now();
  let foodCount = 0, trashCount = 0;
  const rand = (min, max) => min + Math.random() * (max - min);
  const controller = new AbortController();
  const options = { signal: controller.signal };
  root.querySelector('#equipment').textContent = `${tool.emoji} ${tool.name} · 攻撃力 ${stats.attack}`;
  root.querySelector('#fishing-help').textContent = stats.radius ? `円の中の魚をまとめて攻撃！ 半径 ${stats.radius}px${tool.miss ? ' ／ 15%ですっぽ抜け' : ''}` : '魚をクリック・タップして攻撃！ HPが0になると捕獲。赤いゴミは避けよう。';
  function position(el, x, y) { el.style.left = `${x / W * 100}%`; el.style.top = `${y / H * 100}%`; }
  function effect(text, x, y, bad = false) {
    const el = document.createElement('span');
    el.className = `catch-effect${bad ? ' bad' : ''}`; el.textContent = text; position(el, x, y);
    sea.append(el); el.addEventListener('animationend', () => el.remove(), { once: true });
  }
  function spawn() {
    const def = pickWeighted(), el = document.createElement('button');
    const item = { uid: String(++uid), id: def.id, x: W + 40, y: rand(65, H - 65), hp: def.maxHp,
      speed: rand(...def.speed) * stats.speedFactor, phase: rand(0, Math.PI * 2), age: 0, done: false, el };
    item.baseY = item.y;
    el.type = 'button'; el.className = `fish ${def.kind}`; el.dataset.fish = item.uid;
    el.style.width = `${SETTINGS.itemSize / W * 100}%`;
    el.setAttribute('aria-label', `${def.name} HP ${item.hp}`);
    el.innerHTML = `${itemArt(def)}<span class="fish-name">${def.name}</span><span class="hp"><i></i></span>`;
    position(el, item.x, item.y); sea.append(el); items.push(item);
  }
  function point(event) {
    const rect = sea.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * W, y: (event.clientY - rect.top) / rect.height * H };
  }
  function aim(p) {
    position(ring, p.x, p.y); ring.hidden = false;
    ring.style.width = `${Math.max(12, stats.radius * 2) / W * 100}%`;
  }
  function attack(p, targetId) {
    if (stopped) return;
    aim(p);
    playSe(stats.radius ? 'net' : 'harpoon');
    for (const item of targetsAt(items, p, stats.radius, targetId)) {
      const def = ITEM_BY_ID[item.id], outcome = hitItem(item, stats.attack, tool.miss);
      if (outcome === 'miss') { effect('すっぽ抜け！', item.x, item.y); continue; }
      item.el.querySelector('.hp i').style.width = `${item.hp / def.maxHp * 100}%`;
      item.el.setAttribute('aria-label', `${def.name} HP ${item.hp}`);
      if (outcome === 'caught') {
        catches[item.id] = (catches[item.id] || 0) + 1;
        if (def.kind === 'trash') trashCount++; else foodCount++;
        item.el.remove(); effect(def.kind === 'trash' ? 'ゴミを捕獲…' : `${def.name} GET!`, item.x, item.y, def.kind === 'trash');
      } else {
        item.el.animate([{ filter: 'brightness(2)', scale: '1.15' }, { filter: 'brightness(1)', scale: '1' }], { duration: 180 });
      }
    }
    hudCount.textContent = `${foodCount} 個 / ゴミ ${trashCount} 個`;
  }
  sea.addEventListener('pointermove', e => aim(point(e)), options);
  sea.addEventListener('pointerleave', () => { ring.hidden = true; }, options);
  sea.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); attack(point(e), e.target.closest('[data-fish]')?.dataset.fish);
  }, options);
  sea.addEventListener('click', e => {
    if (e.detail !== 0) return; // キーボード操作のみ。pointerdown と重複させない。
    const item = items.find(i => i.uid === e.target.closest('[data-fish]')?.dataset.fish);
    if (item) attack(item, item.uid);
  }, options);
  // 非表示タブでは時間と魚を一緒に停止する。
  document.addEventListener('visibilitychange', () => { lastTime = performance.now(); }, options);
  function stop() { stopped = true; cancelAnimationFrame(raf); controller.abort(); }
  function loop(now) {
    if (stopped) return;
    const dt = document.hidden ? 0 : Math.max(0, (now - lastTime) / 1000); lastTime = now;
    elapsed += dt;
    hudTime.textContent = Math.ceil(Math.max(0, stats.duration - elapsed));
    hudTime.classList.toggle('danger', stats.duration - elapsed <= 5);
    root.querySelector('#time-progress').value = Math.max(0, 1 - elapsed / stats.duration);
    if (elapsed >= stats.duration) { stop(); onFinish({ ...catches }); return; }
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn(); spawnTimer = rand(...SETTINGS.spawnInterval) * (1 - elapsed / stats.duration * 0.4) / stats.spawnRate;
    }
    for (const item of items) {
      if (item.done) continue;
      item.age += dt; item.x -= item.speed * dt; item.y = item.baseY + Math.sin(item.age * 2 + item.phase) * 20;
      position(item.el, item.x, item.y);
      if (item.x < -60) { item.done = true; item.el.remove(); }
    }
    items = items.filter(i => !i.done);
    raf = requestAnimationFrame(loop);
  }
  hudTime.textContent = stats.duration;
  raf = requestAnimationFrame(loop);
  return stop;
}
