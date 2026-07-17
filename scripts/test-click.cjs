// 简化的 headless click test
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const CHROME = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-prof-' + Date.now());
const OUT_DIR = path.join(__dirname, '..', 'screenshots');

const PORT = 9444;

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + PROFILE,
  '--window-size=1440,900',
  URL_BASE + '/',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeStderr = '';
chrome.stderr.on('data', d => { chromeStderr += d.toString(); });

function get(p) {
  return new Promise((res, rej) => {
    http.get('http://127.0.0.1:' + PORT + p, r => {
      let body = '';
      r.on('data', c => body += c);
      r.on('end', () => { try { res(JSON.parse(body)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}

async function wait() {
  for (let i = 0; i < 40; i++) {
    try { await get('/json/version'); return; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('chrome not ready: ' + chromeStderr);
}

(async () => {
  try {
    await wait();
    const tabs = await get('/json');
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    const WebSocket = require('ws');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();
    const events = [];
    ws.on('message', msg => {
      const m = JSON.parse(msg);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      else if (m.method) events.push(m);
    });
    await new Promise(r => ws.on('open', r));
    function send(method, params = {}) {
      const _id = ++id;
      return new Promise(res => { pending.set(_id, res); ws.send(JSON.stringify({ id: _id, method, params })); });
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Log.enable');
    await send('Console.enable');

    // ===== Test 1: /scenarios should load driving card =====
    await send('Page.navigate', { url: URL_BASE + '/scenarios' });
    await new Promise(r => setTimeout(r, 2500));

    const scenariosResult = await send('Runtime.evaluate', {
      expression: `(() => ({
        href: location.href,
        cardCount: document.querySelectorAll('a[href^="/scenarios/"]').length,
        firstCardHref: document.querySelector('a[href^="/scenarios/"]')?.getAttribute('href') || null,
        bodyTextHead: document.body.innerText.slice(0, 200),
        loadingGone: !document.body.innerText.includes('加载'),
      }))()`,
      returnByValue: true,
    });
    console.log('=== /scenarios state ===');
    console.log(JSON.stringify(scenariosResult.result.result.value, null, 2));

    // screenshot
    let ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'test-scenarios.png'), Buffer.from(ss.result.data, 'base64'));

    // ===== Test 2: click first card and check navigation =====
    const click = await send('Runtime.evaluate', {
      expression: `(async () => {
        const a = document.querySelector('a[href^="/scenarios/"]');
        if (!a) return { ok: false, reason: 'no link' };
        a.click();
        await new Promise(r => setTimeout(r, 2000));
        return { ok: true, after: location.href, h1: document.querySelector('h1')?.textContent || null, bodyTextHead: document.body.innerText.slice(0, 200) };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log('=== after click ===');
    console.log(JSON.stringify(click.result.result.value, null, 2));

    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'test-after-click.png'), Buffer.from(ss.result.data, 'base64'));

    // ===== Test 3: errors =====
    const errors = events.filter(e => e.method === 'Runtime.exceptionThrown');
    const consoleErr = events.filter(e => e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error');
    const netFailed = events.filter(e => e.method === 'Network.loadingFailed');
    console.log('=== exceptions ===');
    errors.forEach(e => console.log(JSON.stringify(e.params.exceptionDetails.exception?.description || e.params.exceptionDetails).slice(0, 500)));
    console.log('=== console errors ===');
    consoleErr.forEach(e => console.log(JSON.stringify(e.params.args).slice(0, 500)));
    console.log('=== network failed ===');
    netFailed.slice(0, 5).forEach(e => console.log(e.params.errorText + ' ' + e.params.requestId));

    ws.close();
  } catch (e) {
    console.error('test failed:', e);
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
