const yen = value => `${new Intl.NumberFormat('ja-JP').format(value)}円`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

/**
 * リザルト描画。所持金変更・画面遷移は呼び出し側に委譲する。
 * @param {HTMLElement} mount リザルトの表示先
 * @param {ReturnType<import('./scoring.js').calculateResult>} result 計算済み結果
 * @param {{ wallet?:number, onRetry?:()=>void, onUpgrade?:()=>void, onTitle?:()=>void }} options
 */
export function renderResult(mount, result, options = {}) {
  const { wallet = 0, onRetry = () => {}, onUpgrade = () => {}, onTitle = () => {} } = options;
  const hasFood = result.totalCaught > 0;
  const penalties = result.rows.filter(row => row.category === 'penalty');
  const itemList = result.rows.length ? result.rows.map(row => `
    <div class="catch-row ${row.category === 'penalty' ? 'catch-row--penalty' : ''}">
      <span class="catch-name"><span class="catch-icon" aria-hidden="true">${escapeHtml(row.icon)}</span>${escapeHtml(row.name)}</span>
      <span class="catch-count">× ${row.quantity}</span>
      <strong class="catch-price">${row.subtotal < 0 ? '−' : '+'}${yen(Math.abs(row.subtotal))}</strong>
    </div>`).join('') : '<p class="empty-catch">まだ何も獲れていません。</p>';

  const icons = (result.previewIcons.length ? result.previewIcons : ['🍚']);
  const bowlIngredients = Array.from({length: 7}, (_, i) => icons[i % icons.length])
    .map((icon, i) => `<span class="bowl-food bowl-food--${i+1}" aria-hidden="true">${escapeHtml(icon)}</span>`).join('');

  mount.innerHTML = `
    <section class="result-screen" aria-labelledby="result-heading">
      <div class="sea-bubble bubble-one"></div><div class="sea-bubble bubble-two"></div>
      <header class="result-topbar">
        <span class="brand"><span class="brand-wave">≈</span> SURUGA SEAFOOD</span>
        <span class="wallet-chip">所持金 <strong>${yen(wallet)}</strong></span>
      </header>
      <div class="result-heading">
        <div class="eyebrow"><span class="eyebrow-line"></span> 漁の成果発表 <span class="eyebrow-line"></span></div>
        <h1 id="result-heading">RESULT <span>!</span></h1>
        <p>今日の漁で、こんな丼ができました。</p>
      </div>
      <div class="result-layout">
        <article class="bowl-card">
          <div class="bowl-card-glow"></div>
          <div class="bowl-label">本日の海鮮丼</div>
          <div class="bowl-stage ${hasFood ? '' : 'bowl-stage--empty'}" aria-label="海鮮丼のイメージ">
            <div class="bowl-shadow"></div>
            <div class="bowl-body"><div class="bowl-rim"><div class="bowl-rice">${hasFood ? bowlIngredients : '<span class="plain-rice">🍚</span>'}</div></div></div>
            <span class="sparkle sparkle-one">✦</span><span class="sparkle sparkle-two">✧</span><span class="sparkle sparkle-three">✦</span>
          </div>
          <div class="bowl-title">${escapeHtml(result.bowlName)}</div>
          <p class="bowl-comment">「${escapeHtml(result.comment)}」</p>
          ${result.specialBonusLabel ? `<div class="bonus-tag">✦ ${escapeHtml(result.specialBonusLabel)}</div>` : ''}
          <div class="hero-income"><span>今回の売上</span><strong>${yen(result.earnedMoney)}</strong></div>
          <p class="income-footnote">※ 売上は漁の費用を差し引く前の金額です</p>
        </article>
        <article class="details-card">
          <header class="section-heading"><div><small>CATCH REPORT</small><h2>今回の収穫</h2></div><span class="catch-total">${result.totalCaught} <small>個</small></span></header>
          <div class="catch-list">${itemList}</div>
          <div class="receipt">
            <div class="receipt-row"><span>食材の合計</span><strong>${yen(result.basePrice)}</strong></div>
            <div class="receipt-row receipt-row--bonus"><span>特別ボーナス</span><strong>+ ${yen(result.bonus)}</strong></div>
            <div class="receipt-row receipt-row--minus"><span>マイナスアイテム ${penalties.length ? `(${penalties.reduce((n,r)=>n+r.quantity,0)}個)` : ''}</span><strong>− ${yen(result.penalty)}</strong></div>
            <div class="receipt-total"><span>獲得金額</span><strong>${yen(result.earnedMoney)}</strong></div>
          </div>
          <div class="result-actions">
            <button class="action-btn action-btn--primary" type="button" data-action="retry"><span>⚓</span> もう一度漁へ</button>
            <button class="action-btn action-btn--secondary" type="button" data-action="upgrade"><span>↗</span> 強化する</button>
            <button class="action-btn action-btn--ghost" type="button" data-action="title">タイトルに戻る</button>
          </div>
        </article>
      </div>
      <footer class="result-footer">SHIZUOKA — 海の恵みを、どんぶりに。</footer>
    </section>`;

  mount.querySelector('[data-action="retry"]').addEventListener('click', onRetry);
  mount.querySelector('[data-action="upgrade"]').addEventListener('click', onUpgrade);
  mount.querySelector('[data-action="title"]').addEventListener('click', onTitle);
}
