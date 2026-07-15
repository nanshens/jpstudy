// Headless test: visit /scenarios, dump console errors, click driving card, report.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE = path.join(process.env.TEMP, 'chrome-debug-profile-' + Date.now());
const OUT_DIR = path.join(__dirname, '..', 'screenshots');

// 1) Start chrome with remote debugging on 9222
const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--remote-debugging-port=9333',
  '--user-data-dir=' + PROFILE,
  '--window-size=1440,900',
  URL_BASE + '/scenarios',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeErr = '';
chrome.stderr.on('data', d => { chromeErr += d.toString(); });

function getJSON(p) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9333' + p, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e){ reject(e); } });
    }).on('error', reject);
  });
}

async function waitChrome() {
  for (let i = 0; i < 30; i++) {
    try { await getJSON('/json/version'); return; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('chrome not ready: ' + chromeErr);
}

(async () => {
  try {
    await waitChrome();
    // Find the page target
    const tabs = await getJSON('/json');
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    if (!tab) throw new Error('no tab');

    const wsUrl = tab.webSocketDebuggerUrl;
    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const events = [];

    ws.on('message', msg => {
      const m = JSON.parse(msg);
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)(m);
        pending.delete(m.id);
      } else if (m.method) {
        events.push(m);
      }
    });

    await new Promise(r => ws.on('open', r));

    function send(method, params = {}) {
      const _id = ++id;
      return new Promise(resolve => {
        pending.set(_id, resolve);
        ws.send(JSON.stringify({ id: _id, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Log.enable');
    await send('Console.enable');

    // wait a bit for page to load
    await new Promise(r => setTimeout(r, 2500));

    // collect errors
    const consoleErrors = events.filter(e => e.method === 'Runtime.consoleAPICalled' && (e.params.type === 'error' || e.params.type === 'warning'));
    const runtimeExceptions = events.filter(e => e.method === 'Runtime.exceptionThrown');
    const networkFailed = events.filter(e => e.method === 'Network.loadingFailed');

    // dump page info
    const title = await send('Runtime.evaluate', { expression: 'document.title' });
    const href = await send('Runtime.evaluate', { expression: 'location.href' });
    const linkCount = await send('Runtime.evaluate', {
      expression: `(() => {
        const ls = document.querySelectorAll('a[href^="/scenarios/"]');
        return Array.from(ls).map(a => ({
          href: a.getAttribute('href'),
          text: (a.textContent || '').slice(0, 60),
          visible: !!a.offsetParent,
          rect: a.getBoundingClientRect(),
        }));
      })()`
    });

    console.log('=== title ==='); console.log(title.result.result.value);
    console.log('=== href ==='); console.log(href.result.result.value);
    console.log('=== scenario links ===');
    console.log(JSON.stringify(linkCount.result.result.value, null, 2));
    console.log('=== console errors ===');
    consoleErrors.forEach(e => console.log(JSON.stringify(e.params)));
    console.log('=== exceptions ===');
    runtimeExceptions.forEach(e => console.log(JSON.stringify(e.params.exceptionDetails)));
    console.log('=== network failed ===');
    networkFailed.slice(0, 5).forEach(e => console.log(JSON.stringify(e.params)));

    // Try clicking first scenario link
    const clickResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const a = document.querySelector('a[href^="/scenarios/driving"]');
        if (!a) return { ok: false, reason: 'link not found' };
        // capture pre-click
        const before = location.href;
        a.click();
        // wait for navigation
        await new Promise(r => setTimeout(r, 1500));
        return { ok: true, before, after: location.href };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log('=== click result ===');
    console.log(JSON.stringify(clickResult.result.result.value, null, 2));

    // After click, dump current state
    await new Promise(r => setTimeout(r, 500));
    const after = await send('Runtime.evaluate', {
      expression: `(() => ({
        href: location.href,
        h1: document.querySelector('h1')?.textContent || null,
        bodyTextLen: document.body.innerText.length,
        bodyTextHead: document.body.innerText.slice(0, 300),
      }))()`
    });
    console.log('=== after click state ===');
    console.log(JSON.stringify(after.result.result.value, null, 2));

    // Screenshot of current page
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'debug-click-after.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('screenshot saved: screenshots/debug-click-after.png');

    ws.close();
  } catch (e) {
    console.error('test failed:', e);
  } finally {
    chrome.kill();
    // cleanup profile
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
