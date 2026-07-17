// 5 个场景全部截图
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-5-' + Date.now());
const OUT_DIR = path.join(__dirname, '..', 'screenshots');
const PORT = 9666;

const chrome = spawn(EDGE, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + PROFILE,
  URL_BASE + '/scenarios',
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
  { url: '/scenarios', file: 'final-1-scenarios.png', w: 1440, h: 900 },
  { url: '/scenarios/driving', file: 'final-2-driving.png', w: 1440, h: 900 },
  { url: '/scenarios/enrollment', file: 'final-3-enrollment.png', w: 1440, h: 900 },
  { url: '/scenarios/course-practice', file: 'final-4-course.png', w: 1440, h: 900 },
  { url: '/scenarios/road-test', file: 'final-5-road.png', w: 1440, h: 900 },
  { url: '/scenarios/signs-rules', file: 'final-6-signs.png', w: 1440, h: 900 },
  { url: '/scenarios/enrollment', file: 'final-7-enrollment-mobile.png', w: 430, h: 932 },
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

    const results = [];
    for (const s of shots) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 800,
      });
      await send('Page.navigate', { url: URL_BASE + s.url });
      await new Promise(r => setTimeout(r, 2500));
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT_DIR, s.file), Buffer.from(ss.result.data, 'base64'));
      // also extract data
      const info = await send('Runtime.evaluate', {
        expression: `(() => ({ href: location.href, h1: document.querySelector('h1')?.textContent || null, cardCount: document.querySelectorAll('a[href^="/scenarios/"]').length, bodyTextHead: document.body.innerText.slice(0, 200) }))()`,
        returnByValue: true,
      });
      results.push({ url: s.url, file: s.file, ...info.result.result.value });
      console.log('saved', s.file, '|', info.result.result.value.h1);
    }
    console.log('=== summary ===');
    results.forEach(r => console.log(r.file, '|', r.href, '|', r.h1));
    ws.close();
  } catch (e) {
    console.error('snap failed:', e);
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
