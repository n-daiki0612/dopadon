'use strict';

// ============================================================
// 設定
// ============================================================
const STAGE_W = 960;
const STAGE_H = 540;
const CATCH_TIME = 30;      // 集める時間（秒）
const MAX_TOPPINGS = 5;     // 丼に乗せられる最大数
const TRASH_PENALTY = 3;    // ゴミをとったときに減る秒数
const CATCH_BONUS = 2;      // 1匹とるごとの漁獲ボーナス点
const ITEM_SIZE = 96;
const HIGHSCORE_KEY = 'kaisendon_highscore';

// 海の幸とゴミ。画像は images/ の同名 PNG を差し替えればOK
const ITEMS = {
  shirasu:   { name: 'しらす', point: 20, weight: 18, speed: [110, 160] },
  sakuraebi: { name: '桜えび', point: 30, weight: 15, speed: [130, 190] },
  unagi:     { name: 'うなぎ', point: 50, weight: 6,  speed: [200, 260] },
  ika:       { name: 'イカ',   point: 15, weight: 16, speed: [120, 180] },
  tai:       { name: 'タイ',   point: 35, weight: 10, speed: [150, 210] },
  kani:      { name: 'カニ',   point: 40, weight: 8,  speed: [90, 140] },
  boot:      { name: '長ぐつ', trash: true, weight: 9, speed: [100, 150] },
  can:       { name: '空き缶', trash: true, weight: 9, speed: [100, 150] },
};
const FISH_KEYS = Object.keys(ITEMS).filter(k => !ITEMS[k].trash);

const imgSrc = key => `images/${key}.png`;

// 丼レシピ：上から順に判定し、最初に当てはまったものになる
// c = 種類ごとの個数, n = 合計個数, kinds = 種類数
const RECIPES = [
  { name: '特上駿河湾丼', mult: 3.0, desc: '5種類＋うなぎ・カニ入りの豪華版！',
    test: (c, n, kinds) => kinds >= 5 && c.unagi > 0 && c.kani > 0 },
  { name: '五色海鮮丼', mult: 2.0, desc: '5種類の海の幸がそろった彩り丼',
    test: (c, n, kinds) => kinds >= 5 },
  { name: '静岡ダブル丼', mult: 2.2, desc: 'しらすと桜えび、駿河湾の二大名物',
    test: c => c.shirasu >= 2 && c.sakuraebi >= 2 },
  { name: 'うな丼', mult: 2.0, desc: '浜名湖名物、うなぎたっぷり',
    test: c => c.unagi >= 3 },
  { name: 'カニ丼', mult: 1.8, desc: 'カニの身がぎっしり',
    test: c => c.kani >= 3 },
  { name: 'しらす丼', mult: 1.8, desc: 'ふわふわしらすを山盛りに',
    test: c => c.shirasu >= 3 },
  { name: '桜えび丼', mult: 1.8, desc: '桜色の香ばしい丼',
    test: c => c.sakuraebi >= 3 },
  { name: '鯛丼', mult: 1.8, desc: 'めでたい鯛づくし',
    test: c => c.tai >= 3 },
  { name: '紅白丼', mult: 1.5, desc: 'タイとイカでおめでたい紅白',
    test: c => c.tai >= 1 && c.ika >= 1 },
  { name: '海鮮丼', mult: 1.2, desc: 'いろいろ乗った定番の海鮮丼',
    test: (c, n) => n >= 3 },
  { name: 'ちょっぴり丼', mult: 1.0, desc: '具が少しさみしい…',
    test: (c, n) => n >= 1 },
  { name: '白ごはん', mult: 0, desc: '具がひとつもない！',
    test: () => true },
];

// 丼の上の具の配置（.bowl-wrap 内の座標）
const TOPPING_POS = [
  { x: 138, y: 18 }, { x: 62, y: 40 }, { x: 214, y: 40 }, { x: 100, y: 76 }, { x: 176, y: 76 },
];

// ============================================================
// 状態
// ============================================================
const state = {
  caught: {},      // 集めた数 { shirasu: 3, ... }
  totalCaught: 0,
  toppings: [],    // 丼に乗せた具の key 配列
  items: [],       // 画面上を流れているもの
  timeLeft: CATCH_TIME,
  playing: false,
  lastTime: 0,
  spawnTimer: 0,
  rafId: 0,
};

const $ = id => document.getElementById(id);
const stage = $('stage');
const sea = $('sea');

// ============================================================
// 共通
// ============================================================
function fitStage() {
  const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitStage);

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
}

function loadHighscore() {
  try { return Number(localStorage.getItem(HIGHSCORE_KEY)) || 0; } catch (e) { return 0; }
}
function saveHighscore(v) {
  try { localStorage.setItem(HIGHSCORE_KEY, String(v)); } catch (e) { /* 保存できなくても続行 */ }
}

const rand = (min, max) => min + Math.random() * (max - min);

function pickWeighted() {
  const keys = Object.keys(ITEMS);
  const total = keys.reduce((s, k) => s + ITEMS[k].weight, 0);
  let r = Math.random() * total;
  for (const k of keys) {
    r -= ITEMS[k].weight;
    if (r <= 0) return k;
  }
  return keys[0];
}

// ============================================================
// タイトル
// ============================================================
function initTitle() {
  $('title-highscore').textContent = loadHighscore();
  showScreen('title');
}

$('btn-start').addEventListener('click', startCatch);
$('btn-howto').addEventListener('click', () => $('howto').classList.remove('hidden'));
$('btn-howto-close').addEventListener('click', () => $('howto').classList.add('hidden'));
$('btn-title').addEventListener('click', initTitle);

$('howto-time').textContent = CATCH_TIME;
$('howto-max').textContent = MAX_TOPPINGS;
$('build-max').textContent = MAX_TOPPINGS;
$('recipe-list').innerHTML = RECIPES.filter(r => r.mult > 1)
  .map(r => `<li><b>${r.name}</b>（×${r.mult}）：${r.desc}</li>`).join('');

// ============================================================
// メインゲーム①：集める
// ============================================================
function startCatch() {
  state.caught = Object.fromEntries(FISH_KEYS.map(k => [k, 0]));
  state.totalCaught = 0;
  state.toppings = [];
  state.items = [];
  state.timeLeft = CATCH_TIME;
  state.spawnTimer = 0;
  sea.innerHTML = '';
  updateHud();
  renderInventory($('catch-bar'));
  showScreen('catch');
  runCountdown(() => {
    state.playing = true;
    state.lastTime = performance.now();
    state.rafId = requestAnimationFrame(loop);
  });
}

function runCountdown(done) {
  const el = $('countdown');
  const seq = ['3', '2', '1', 'スタート！'];
  let i = 0;
  el.classList.remove('hidden');
  const tick = () => {
    if (i >= seq.length) {
      el.classList.add('hidden');
      done();
      return;
    }
    el.textContent = seq[i++];
    setTimeout(tick, i === seq.length ? 500 : 700);
  };
  tick();
}

function spawnItem() {
  const key = pickWeighted();
  const def = ITEMS[key];
  const el = document.createElement('div');
  el.className = 'item';
  el.innerHTML = `<img src="${imgSrc(key)}" alt="${def.name}" draggable="false" />`;
  const item = {
    key,
    el,
    x: STAGE_W + 10,
    baseY: rand(70, STAGE_H - 86 - ITEM_SIZE - 10),
    speed: rand(def.speed[0], def.speed[1]),
    amp: rand(10, 40),
    freq: rand(1.5, 3.5),
    phase: rand(0, Math.PI * 2),
    t: 0,
  };
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    catchItem(item);
  });
  sea.appendChild(el);
  state.items.push(item);
}

function catchItem(item) {
  if (!state.playing || item.done) return;
  item.done = true;
  item.el.classList.add('caught');
  setTimeout(() => item.el.remove(), 300);

  const def = ITEMS[item.key];
  const cx = item.x + ITEM_SIZE / 2;
  const cy = item.baseY;
  if (def.trash) {
    state.timeLeft = Math.max(0, state.timeLeft - TRASH_PENALTY);
    floatText(`${def.name}… -${TRASH_PENALTY}秒`, cx, cy, true);
  } else {
    state.caught[item.key]++;
    state.totalCaught++;
    floatText(`${def.name} GET!`, cx, cy, false);
    renderInventory($('catch-bar'));
  }
  updateHud();
}

function floatText(text, x, y, bad) {
  const el = document.createElement('div');
  el.className = 'float-text' + (bad ? ' bad' : '');
  el.textContent = text;
  el.style.left = `${x - 50}px`;
  el.style.top = `${y}px`;
  sea.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function updateHud() {
  const t = $('hud-time');
  t.textContent = Math.ceil(state.timeLeft);
  t.classList.toggle('danger', state.timeLeft <= 5);
  $('hud-count').textContent = state.totalCaught;
}

function loop(now) {
  if (!state.playing) return;
  const dt = Math.min((now - state.lastTime) / 1000, 0.1);
  state.lastTime = now;

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    updateHud();
    endCatch();
    return;
  }
  updateHud();

  // 出現間隔は残り時間が少ないほど短く
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnItem();
    const progress = 1 - state.timeLeft / CATCH_TIME;
    state.spawnTimer = rand(0.45, 0.9) * (1 - progress * 0.4);
  }

  for (const it of state.items) {
    if (it.done) continue;
    it.t += dt;
    it.x -= it.speed * dt;
    const y = it.baseY + Math.sin(it.t * it.freq + it.phase) * it.amp;
    it.el.style.transform = `translate(${it.x}px, ${y}px)`;
    if (it.x < -ITEM_SIZE) {
      it.done = true;
      it.el.remove();
    }
  }
  state.items = state.items.filter(it => !it.done);

  state.rafId = requestAnimationFrame(loop);
}

function endCatch() {
  state.playing = false;
  cancelAnimationFrame(state.rafId);
  const el = $('countdown');
  el.textContent = 'しゅうりょう！';
  el.classList.remove('hidden');
  setTimeout(() => {
    el.classList.add('hidden');
    sea.innerHTML = '';
    startBuild();
  }, 1200);
}

// 集めた数の一覧（集める画面・盛り付け画面で共用）
function renderInventory(container, onClick) {
  container.innerHTML = '';
  for (const key of FISH_KEYS) {
    const left = state.caught[key] - state.toppings.filter(k => k === key).length;
    const slot = document.createElement('div');
    slot.className = 'inv-slot' + (left <= 0 ? ' empty' : '');
    slot.title = ITEMS[key].name;
    slot.innerHTML = `<img src="${imgSrc(key)}" alt="${ITEMS[key].name}" draggable="false" /><span class="num">${left}</span>`;
    if (onClick && left > 0) slot.addEventListener('click', () => onClick(key));
    container.appendChild(slot);
  }
}

// ============================================================
// メインゲーム②：盛り付け
// ============================================================
function startBuild() {
  state.toppings = [];
  renderBuild();
  showScreen('build');
}

function renderBuild() {
  renderInventory($('build-inventory'), key => {
    if (state.toppings.length >= MAX_TOPPINGS) return;
    state.toppings.push(key);
    renderBuild();
  });
  renderBowl($('build-bowl'), index => {
    state.toppings.splice(index, 1);
    renderBuild();
  });

  const r = evaluate(state.toppings);
  $('preview').innerHTML =
    `<div class="sub">いまの丼（${state.toppings.length} / ${MAX_TOPPINGS}）</div>` +
    `<div class="name">${r.recipe.name}</div>` +
    `<div class="sub">${r.recipe.desc}</div>`;
}

function renderBowl(wrap, onClick) {
  const box = wrap.querySelector('.toppings');
  box.innerHTML = '';
  state.toppings.forEach((key, i) => {
    const img = document.createElement('img');
    img.src = imgSrc(key);
    img.alt = ITEMS[key].name;
    img.draggable = false;
    img.style.left = `${TOPPING_POS[i].x}px`;
    img.style.top = `${TOPPING_POS[i].y}px`;
    if (onClick) img.addEventListener('click', () => onClick(i));
    box.appendChild(img);
  });
}

$('btn-finish').addEventListener('click', showResult);

// ============================================================
// スコア計算
// ============================================================
function evaluate(toppings) {
  const c = Object.fromEntries(FISH_KEYS.map(k => [k, 0]));
  toppings.forEach(k => c[k]++);
  const n = toppings.length;
  const kinds = FISH_KEYS.filter(k => c[k] > 0).length;
  const recipe = RECIPES.find(r => r.test(c, n, kinds));
  const base = toppings.reduce((s, k) => s + ITEMS[k].point, 0);
  return { recipe, base, dishScore: Math.round(base * recipe.mult) };
}

function rankOf(score) {
  if (score >= 450) return 'S';
  if (score >= 300) return 'A';
  if (score >= 180) return 'B';
  return 'C';
}

// ============================================================
// リザルト
// ============================================================
function showResult() {
  const r = evaluate(state.toppings);
  const catchScore = state.totalCaught * CATCH_BONUS;
  const total = r.dishScore + catchScore;

  $('result-name').textContent = r.recipe.name;
  $('result-desc').textContent = r.recipe.desc;
  $('r-base').textContent = r.base;
  $('r-mult').textContent = `×${r.recipe.mult}`;
  $('r-catch').textContent = `${catchScore}（${state.totalCaught}匹）`;
  $('r-total').textContent = total;
  $('r-rank').textContent = rankOf(total);
  renderBowl($('result-bowl'));

  const isNew = total > loadHighscore();
  if (isNew) saveHighscore(total);
  $('r-new').classList.toggle('hidden', !isNew);

  showScreen('result');
}

// ============================================================
fitStage();
initTitle();
