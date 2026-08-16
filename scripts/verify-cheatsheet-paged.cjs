// 验证速查表分页
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-cp-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9675;

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
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4173', '--strictPort'],
    { cwd: PROJECT, stdio: ['ignore', 'pipe', 'pipe'], shell: true, windowsHide: true });
  if (!(await waitForUrl(URL_BASE + '/'))) { preview.kill(); process.exit(1); }
  const chrome = spawn(EDGE, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT_DEBUG, '--user-data-dir=' + PROFILE,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (!(await waitForUrl('http://127.0.0.1:' + PORT_DEBUG + '/json/version', 20000))) {
    chrome.kill(); preview.kill(); process.exit(1);
  }
  console.log('ok');

  try {
    const tabs = await get('/json');
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    const WebSocket = require('ws');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 0; const pending = new Map();
    ws.on('message', m => { const p = JSON.parse(m); if (p.id && pending.has(p.id)) { pending.get(p.id)(p); pending.delete(p.id); } });
    await new Promise(r => ws.on('open', r));
    function send(method, params = {}) {
      const _id = ++id;
      return new Promise(res => { pending.set(_id, res); ws.send(JSON.stringify({ id: _id, method, params })); });
    }
    async function shot(name, w = 1440, h = 900) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 800 });
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT_DIR, name), Buffer.from(ss.result.data, 'base64'));
      console.log('saved', name);
    }
    async function evalJs(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (r.result?.exceptionDetails) console.error('JS:', r.result.exceptionDetails.exception?.description);
      return r.result?.result?.value;
    }

    // 1) 桌面 - 第 1 页
    await send('Page.navigate', { url: URL_BASE + '/verbs/cheatsheet' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('cp-1-page1.png');

    // 2) 桌面 - 第 2 页
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const next = btns.find(b => (b.textContent || '').trim() === '下一页' || (b.textContent || '').trim().startsWith('下一页'));
      if (next) next.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    await shot('cp-2-page2.png');

    // 3) 桌面 - 全部揭示 + 第 1 页
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const prev = btns.find(b => (b.textContent || '').trim().startsWith('上一页'));
      if (prev) prev.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const show = btns.find(b => (b.textContent || '').includes('全部显示'));
      if (show) show.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    await shot('cp-3-revealed-page1.png');

    // 4) 桌面 - 跳到第 3 页
    await evalJs(`(() => {
      // 找 上一页/下一页 各点 2 次下一页
      for (let i = 0; i < 2; i++) {
        const btns = Array.from(document.querySelectorAll('button'));
        const next = btns.find(b => (b.textContent || '').trim().startsWith('下一页'));
        if (next) next.click();
      }
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await shot('cp-4-page3.png');

    // 5) 移动端 - 移动端需要紧凑
    await send('Page.navigate', { url: URL_BASE + '/verbs/cheatsheet' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('cp-5-mobile.png', 430, 932);

    // 6) 移动端长图(看所有页高度)
    const layout = await send('Page.getLayoutMetrics', {});
    const fullH = layout.result?.contentSize?.height || 800;
    await send('Emulation.setDeviceMetricsOverride', { width: 430, height: Math.min(fullH, 4000), deviceScaleFactor: 1, mobile: true });
    const ss = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(OUT_DIR, 'cp-6-mobile-full.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('saved cp-6-mobile-full.png |', fullH, 'px');

    ws.close();
  } catch (e) { console.error('failed:', e); }
  finally {
    chrome.kill(); preview.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
