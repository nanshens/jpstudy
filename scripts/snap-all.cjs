// Take screenshots of multiple pages
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-snap-' + Date.now());
const OUT_DIR = path.join(__dirname, '..', 'screenshots');
const PORT = 9555;

const chrome = spawn(EDGE, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + PROFILE,
  URL_BASE + '/',
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
  throw new Error('chrome not ready: ' + chromeStderr);
}

const shots = [
  { url: '/', file: 'snap-1-home.png', w: 1440, h: 900 },
  { url: '/scenarios', file: 'snap-2-scenarios.png', w: 1440, h: 900 },
  { url: '/scenarios/driving', file: 'snap-3-driving-overview.png', w: 1440, h: 900 },
  { url: '/kana', file: 'snap-4-kana.png', w: 1440, h: 900 },
  { url: '/scenarios/driving', file: 'snap-5-mobile.png', w: 430, h: 932 },
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
    ws.on('message', msg => {
      const m = JSON.parse(msg);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    });
    await new Promise(r => ws.on('open', r));
    function send(method, params = {}) {
      const _id = ++id;
      return new Promise(res => { pending.set(_id, res); ws.send(JSON.stringify({ id: _id, method, params })); });
    }

    for (const s of shots) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 800,
      });
      await send('Page.navigate', { url: URL_BASE + s.url });
      await new Promise(r => setTimeout(r, 2500));
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT_DIR, s.file), Buffer.from(ss.result.data, 'base64'));
      console.log('saved', s.file);
    }

    // Also click "words" tab on /scenarios/driving
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL_BASE + '/scenarios/driving' });
    await new Promise(r => setTimeout(r, 2000));
    await send('Runtime.evaluate', {
      expression: `(() => { const t = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '单词'); t?.click(); })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    let ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'snap-6-driving-words.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('saved snap-6-driving-words.png');

    // dialogs tab
    await send('Runtime.evaluate', {
      expression: `(() => { const t = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '对话'); t?.click(); })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'snap-7-driving-dialogs.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('saved snap-7-driving-dialogs.png');

    ws.close();
  } catch (e) {
    console.error('snap failed:', e);
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
