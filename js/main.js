import { loadState, saveState, beginTrip, settleTrip } from './user_data.js';
import { startFishing } from './fishing.js';
import { renderResult, moneyText } from './result.js';
import { renderShop, describeStats } from './shop.js';

const app = document.getElementById('app');
const state = loadState();
let cleanup = () => {}, navigating = false, shopReturn = 'title';
function persist() {
  document.getElementById('wallet').textContent = moneyText(state.money);
  document.getElementById('save-notice').textContent = saveState(state) ? '' : '保存できないため、このページを閉じると進行状況が失われます。';
}
async function navigate(page) {
  if (navigating) return;
  navigating = true;
  app.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(`./pages/${page}.html`);
    if (!response.ok) throw new Error('画面の読み込みに失敗しました。');
    const html = await response.text();
    cleanup(); cleanup = () => {};
    app.innerHTML = html; state.screen = page;
    const bind = (id, handler) => { const el = app.querySelector(`#${id}`); if (el) el.onclick = handler; };
    bind('start', () => navigate('fishing'));
    bind('retry', () => navigate('fishing'));
    bind('title', () => navigate('title'));
    bind('shop', () => { shopReturn = page; navigate('shop'); });
    bind('back', () => navigate(shopReturn === 'result' && state.lastResult ? 'result' : 'title'));
    if (page === 'title') {
      app.querySelector('#title-stats').textContent = `これまでの出漁 ${state.trips} 回 · ${describeStats(state)}`;
      if (state.lastResult) { app.querySelector('#last-result').hidden = false; bind('last-result', () => navigate('result')); }
    } else if (page === 'fishing') {
      const trip = beginTrip(state);
      if (!trip) throw new Error('漁はすでに進行中です。');
      cleanup = startFishing(app, trip, state.currentCatch, catches => {
        if (settleTrip(state, trip.id, catches)) { persist(); navigate('result'); }
      });
    } else if (page === 'result') {
      if (!state.lastResult) throw new Error('まだ漁の結果がありません。');
      renderResult(app, state.lastResult);
    } else if (page === 'shop') renderShop(app, state, persist);
    persist(); app.focus(); window.scrollTo(0, 0);
  } catch (error) {
    cleanup(); cleanup = () => {};
    state.activeTrip = null;
    app.innerHTML = '<section class="error"><h1>港への接続を確認してください</h1><p>ローカルHTTPサーバーから index.html を開いてください。画面ファイルの取得に失敗した場合も、ここから再試行できます。</p><p id="error-detail"></p><button id="recover" class="primary">タイトルへ再接続</button></section>';
    app.querySelector('#error-detail').textContent = error.message;
    app.querySelector('#recover').onclick = () => navigate('title');
  } finally { navigating = false; app.removeAttribute('aria-busy'); }
}
window.addEventListener('pagehide', () => { cleanup(); persist(); });
navigate('title');
