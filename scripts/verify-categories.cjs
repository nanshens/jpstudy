// 验证 ScenariosPage 按 category 分组
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-cat-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9671;

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
  if (!(await waitForUrl(URL_BASE + '/'))) {
    console.error('vite preview failed');
    preview.kill();
    process.exit(1);
  }
  console.log('vite preview ready');

  console.log('[2/3] starting chrome...');
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
    async function shot(name, w = 1440, h = 900) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w, height: h, deviceScaleFactor: 1, mobile: w < 800,
      });
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(OUT_DIR, name);
      fs.writeFileSync(file, Buffer.from(ss.result.data, 'base64'));
      console.log('saved', name);
    }

    // 桌面
    await send('Page.navigate', { url: URL_BASE + '/scenarios' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('cat-1-desktop.png');

    // 完整页面(长截图 - 截 full page)
    const layout = await send('Page.getLayoutMetrics', {});
    const fullW = layout.result?.contentSize?.width || 1440;
    const fullH = layout.result?.contentSize?.height || 1800;
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: Math.min(fullH, 4000), deviceScaleFactor: 1, mobile: false,
    });
    const ssFull = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(OUT_DIR, 'cat-2-desktop-full.png'), Buffer.from(ssFull.result.data, 'base64'));
    console.log('saved cat-2-desktop-full.png', '|', fullH, 'px tall');

    // 移动端
    await send('Page.navigate', { url: URL_BASE + '/scenarios' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('cat-3-mobile.png', 430, 932);

    // 移动端长图
    const layout2 = await send('Page.getLayoutMetrics', {});
    const fullH2 = layout2.result?.contentSize?.height || 1800;
    await send('Emulation.setDeviceMetricsOverride', {
      width: 430, height: Math.min(fullH2, 4000), deviceScaleFactor: 1, mobile: true,
    });
    const ssFull2 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(OUT_DIR, 'cat-4-mobile-full.png'), Buffer.from(ssFull2.result.data, 'base64'));
    console.log('saved cat-4-mobile-full.png', '|', fullH2, 'px tall');

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
