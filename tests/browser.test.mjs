// 既存のChromium系ブラウザを独立した一時プロファイルで起動するE2Eテスト。
// パッケージ追加不要。ユーザーのブラウザ・保存データには触れない。
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const executable = process.env.GAME_TEST_BROWSER;
if (!executable) throw Error('GAME_TEST_BROWSER に Chromium系ブラウザの実行ファイルを指定してください');
const profile = await mkdtemp(path.join(tmpdir(), 'kaisendon-e2e-'));
const child = spawn(executable, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1280,900', 'about:blank'],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let log = '';
    const timeout = setTimeout(() => reject(Error('Browser start timed out: ' + log.slice(-1000))), 20000);
    child.once('error', reject);
    child.stderr.on('data', chunk => { log += chunk; const match = log.match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timeout); resolve(match[1]); } });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map(), errors = [], failedRequests = [];
  socket.onclose = event => { for (const p of pending.values()) p.reject(Error(`CDP closed ${event.code}: ${event.reason}`)); };
  socket.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id) { const p = pending.get(msg.id); pending.delete(msg.id); if (msg.error) p.reject(Error(JSON.stringify(msg.error))); else p.resolve(msg.result); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails);
    if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400 && !msg.params.response.url.endsWith('/favicon.ico')) failedRequests.push(msg.params.response);
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error(`CDP timeout: ${method}`)), 10000);
    const requestId = ++id; pending.set(requestId, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } }); socket.send(JSON.stringify({ id: requestId, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  await command('Runtime.enable'); await command('Page.enable'); await command('Network.enable');
  const evaluate = async expression => {
    const r = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const waitFor = async (expression, timeout = 10000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) { if (await evaluate(expression)) return; await delay(100); }
    throw Error('Timed out: ' + expression);
  };
  const click = async selector => {
    const p = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e||e.disabled) throw Error('Missing/disabled control'); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...p });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...p });
  };
  const screenshot = async filename => {
    const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(path.join(profile, filename), Buffer.from(result.data, 'base64'));
  };
  const saved = () => evaluate("JSON.parse(localStorage.getItem('kaisendon_save_v1'))");
  await command('Page.navigate', { url: 'http://127.0.0.1:4173' });
  await waitFor("!!document.querySelector('#start')");
  await screenshot('title.png');
  await click('#shop'); await waitFor("!!document.querySelector('#upgrades')");
  assert.equal(await evaluate("document.querySelector('[data-upgrade=time]').disabled"), true);
  await click('#back'); await waitFor("!!document.querySelector('.title-page')");

  async function fishRound(expectedTime, expectedTool) {
    await click('#start'); await waitFor("!!document.querySelector('#sea')");
    assert.equal(await evaluate("document.querySelector('#hud-time').textContent"), String(expectedTime));
    assert.ok((await evaluate("document.querySelector('#equipment').textContent")).includes(expectedTool));
    let attacked = 0, sawHp = false, sawMovement = false, previous = null, capturedShot = false;
    const end = Date.now() + (expectedTime + 10) * 1000;
    while (Date.now() < end && await evaluate("!!document.querySelector('#sea')")) {
      const fish = await evaluate(`(() => { const e=[...document.querySelectorAll('.fish:not(.trash)')].find(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('#sea').getBoundingClientRect();return r.x>s.x+20&&r.right<s.right-10}); if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,id:e.dataset.fish,label:e.getAttribute('aria-label')}; })()`);
      if (fish) {
        if (previous?.id === fish.id && previous.x !== fish.x) sawMovement = true;
        if (/HP [2-9]/.test(fish.label)) sawHp = true;
        previous = fish;
        if (!capturedShot && attacked > 3) { await screenshot('fishing.png'); capturedShot = true; }
        await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: fish.x, y: fish.y, button: 'left', clickCount: 1 });
        await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: fish.x, y: fish.y, button: 'left', clickCount: 1 });
        attacked++;
      }
      await delay(160);
    }
    await waitFor("!!document.querySelector('#settled-note')");
    const state = await saved(); assert.ok(state.lastResult.count > 0); assert.ok(attacked > 0);
    const r = state.lastResult; assert.equal(r.totalScore, r.baseScore + r.bonus - r.penalty);
    await screenshot('result.png');
    console.log(JSON.stringify({ trip: state.trips, attacked, count: r.count, money: state.money, expectedTime, expectedTool, sawHp, sawMovement }));
    return state;
  }
  const first = await fishRound(30, '銛');
  await click('#shop'); await waitFor("!!document.querySelector('#tools')");
  await click('[data-upgrade=time]');
  assert.equal((await saved()).money, first.money - 150);
  await click('[data-tool=net]');
  assert.equal((await saved()).equipment, 'net');
  await screenshot('shop.png');
  await click('#back'); await waitFor("!!document.querySelector('#settled-note')");
  assert.equal((await saved()).money, first.money - 510);
  await click('#title'); await waitFor("!!document.querySelector('.title-page')");
  const second = await fishRound(35, '網');
  assert.equal(second.tools.net, 5);
  await click('#title'); await waitFor("!!document.querySelector('.title-page')");
  await command('Page.reload'); await waitFor("!!document.querySelector('.title-page')");
  assert.equal((await saved()).money, second.money);
  assert.equal((await saved()).upgrades.time, 1);
  // 破損直前の保存データをテスト用プロファイルだけに準備。
  await evaluate("(() => {const s=JSON.parse(localStorage.getItem('kaisendon_save_v1'));s.tools.bigNet=1;s.equipment='bigNet';localStorage.setItem('kaisendon_save_v1',JSON.stringify(s));})()");
  await command('Page.reload'); await waitFor("!!document.querySelector('.title-page')");
  const third = await fishRound(35, '大きな網');
  assert.equal(third.tools.bigNet, 0); assert.equal(third.equipment, 'spear'); assert.equal(third.lastResult.brokenTool, 'bigNet');
  await click('#shop'); await waitFor("!!document.querySelector('#tools')");
  assert.ok((await evaluate("document.querySelector('#equipped-tool').textContent")).includes('銛'));
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
  await screenshot('shop-mobile.png');
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  console.log('PASS: 3 full rounds, purchase, upgrade, durability, breakage, restore, no JS errors or missing resources.');
  console.log('Screenshots: ' + profile);
} finally { socket?.close(); child.kill(); }
