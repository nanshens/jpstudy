// 验证 medical + pregnancy 2 个新场景(精简版)
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-ns-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9670;

function get(p, port = PORT_DEBUG) {
  return new Promise((res, rej) => {
    http.get('http://127.0.0.1:' + port + p, r => {
      let body = ''; r.on('data', c => body += c);
      r.on('end', () => { try { res(JSON.parse(body)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await new Promise((res, rej) => {
        http.get(url, resp => { resp.on('data', () => {}); resp.on('end', () => res(resp.statusCode)); }).on('error', rej);
      });
      if (r < 500) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

(async () => {
  console.log('[1/3] starting vite preview...');
  const preview = spawn(
    'npx.cmd',
    ['vite', 'preview', '--port', '4173', '--strictPort'],
    { cwd: PROJECT, stdio: ['ignore', 'pipe', 'pipe'], shell: true, windowsHide: true },
  );
  let previewLog = '';
  preview.stdout.on('data', d => { previewLog += d.toString(); });
  preview.stderr.on('data', d => { previewLog += d.toString(); });
  if (!(await waitForUrl(URL_BASE + '/'))) {
    console.error('vite preview failed:', previewLog);
    preview.kill();
    process.exit(1);
  }
  console.log('vite preview ready');

  console.log('[2/3] starting chrome headless...');
  const chrome = spawn(EDGE, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT_DEBUG,
    '--user-data-dir=' + PROFILE,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (!(await waitForUrl('http://127.0.0.1:' + PORT_DEBUG + '/json/version', 20000))) {
    console.error('chrome failed');
    chrome.kill();
    preview.kill();
    process.exit(1);
  }
  console.log('chrome ready');

  try {
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
    async function evalJs(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result?.exceptionDetails) {
        console.error('JS error:', r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
      }
      return r.result?.result?.value;
    }
    async function shot(name, w = 1440, h = 900) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w, height: h, deviceScaleFactor: 1, mobile: w < 800,
      });
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(OUT_DIR, name);
      fs.writeFileSync(file, Buffer.from(ss.result.data, 'base64'));
      console.log('saved', name);
    }
    async function openQuizTab() {
      return evalJs(`(() => {
        const tabs = Array.from(document.querySelectorAll('button, [role=tab]'));
        const tb = tabs.find(b => {
          const t = (b.textContent || '').trim();
          return t === '小测' || t.endsWith('小测');
        });
        if (tb) { tb.click(); return true; }
        return false;
      })()`);
    }

    // 1) Scenarios page
    await send('Page.navigate', { url: URL_BASE + '/scenarios' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('ns-1-scenarios-list.png');

    // 2) medical overview + config
    await send('Page.navigate', { url: URL_BASE + '/scenarios/medical' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('ns-2-medical-overview.png');
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1200));
    await shot('ns-3-medical-quiz-config.png');

    // 3) pregnancy overview + config
    await send('Page.navigate', { url: URL_BASE + '/scenarios/pregnancy' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('ns-4-pregnancy-overview.png');
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1200));
    await shot('ns-5-pregnancy-quiz-config.png');

    // 4) 移动端
    await send('Page.navigate', { url: URL_BASE + '/scenarios' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('ns-6-scenarios-mobile.png', 430, 932);

    await send('Page.navigate', { url: URL_BASE + '/scenarios/pregnancy' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('ns-7-pregnancy-mobile.png', 430, 932);

    ws.close();
    console.log('=== done ===');
  } catch (e) {
    console.error('verify failed:', e);
  } finally {
    chrome.kill();
    preview.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
