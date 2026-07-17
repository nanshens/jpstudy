// 验证对话框空态 + 单词语法新内容
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-empty-' + Date.now());
const OUT_DIR = path.join(__dirname, '..', 'screenshots');
const PORT = 9669;

const chrome = spawn(EDGE, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + PROFILE,
  URL_BASE + '/scenarios/traffic-rules',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeStderr = '';
chrome.stderr.on('data', d => { chromeStderr += d.toString(); });

function get(p) {
  return new Promise((res, rej) => {
    http.get('http://127.0.0.1:' + PORT + p, r => {
      let body = ''; r.on('data', c => body += c);
      r.on('end', () => { try { res(JSON.parse(body)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}

async function wait() {
  for (let i = 0; i < 40; i++) {
    try { await get('/json/version'); return; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('chrome not ready');
}

const shots = [
  { url: '/scenarios/traffic-rules', file: 'fix-1-dialogs.png', w: 1440, h: 900, clickText: '对话', wait: 1500 },
  { url: '/scenarios/traffic-rules', file: 'fix-2-listening.png', w: 1440, h: 900, clickText: '听力', wait: 1500 },
  { url: '/scenarios/traffic-rules', file: 'fix-3-words.png', w: 1440, h: 900, clickText: '单词', wait: 1500 },
  { url: '/scenarios/traffic-rules', file: 'fix-4-grammar.png', w: 1440, h: 900, clickText: '语法', wait: 1500 },
];

(async () => {
  try {
    await wait();
    const tabs = await get('/json');
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    const WebSocket = require('ws');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.on('message', msg => {
      const m = JSON.parse(msg);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.text || '');
    });
    await new Promise(r => ws.on('open', r));
    function send(method, params = {}) {
      const _id = ++id;
      return new Promise(res => { pending.set(_id, res); ws.send(JSON.stringify({ id: _id, method, params })); });
    }

    for (const s of shots) {
      await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 800 });
      await send('Page.navigate', { url: URL_BASE + s.url });
      await new Promise(r => setTimeout(r, 2000));
      if (s.clickText) {
        await send('Runtime.evaluate', {
          expression: `(() => { const btns = Array.from(document.querySelectorAll('button')); const t = btns.find(b => b.textContent.trim() === ${JSON.stringify(s.clickText)}); if (t) t.click(); return t ? 'clicked' : 'not found'; })()`,
          returnByValue: true,
        });
        await new Promise(r => setTimeout(r, s.wait || 1500));
      }
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT_DIR, s.file), Buffer.from(ss.result.data, 'base64'));
      const info = await send('Runtime.evaluate', {
        expression: `(() => ({ href: location.href, hasContent: document.body.innerText.length > 100, h3Count: document.querySelectorAll('h3').length, h3Texts: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.slice(0, 50)), bodyHead: document.body.innerText.slice(0, 400) }))()`,
        returnByValue: true,
      });
      console.log('saved', s.file, '|', JSON.stringify(info.result.result.value).slice(0, 200));
    }
    console.log('Errors:', errors.length);
    ws.close();
  } catch (e) {
    console.error('snap failed:', e);
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
