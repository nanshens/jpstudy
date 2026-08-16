// 验证修复:Basics 弹窗 + 速查表更多动词
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-vbf-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9674;

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
  console.log('[1/3] vite preview...');
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4173', '--strictPort'],
    { cwd: PROJECT, stdio: ['ignore', 'pipe', 'pipe'], shell: true, windowsHide: true });
  if (!(await waitForUrl(URL_BASE + '/'))) { preview.kill(); process.exit(1); }
  console.log('vite ok');

  console.log('[2/3] chrome...');
  const chrome = spawn(EDGE, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT_DEBUG, '--user-data-dir=' + PROFILE,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (!(await waitForUrl('http://127.0.0.1:' + PORT_DEBUG + '/json/version', 20000))) {
    chrome.kill(); preview.kill(); process.exit(1);
  }
  console.log('chrome ok');

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
      if (r.result?.exceptionDetails) console.error('JS:', r.result.exceptionDetails.exception?.description);
      return r.result?.result?.value;
    }
    async function shot(name, w = 1440, h = 900) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 800 });
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT_DIR, name), Buffer.from(ss.result.data, 'base64'));
      console.log('saved', name);
    }

    // 1) Basics 页面 + 弹窗
    await send('Page.navigate', { url: URL_BASE + '/verbs/basics' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('vbf-1-basics.png');

    // 点击第一个 "查看详细" 按钮
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const detail = btns.find(b => (b.textContent || '').includes('查看详细'));
      if (detail) detail.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await shot('vbf-2-basics-modal.png');

    // 2) 关闭弹窗,看看 cheatsheet
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const close = btns.find(b => (b.textContent || '') === 'X' || b.querySelector('svg')?.classList?.contains('lucide-x'));
      if (close) close.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));

    // 3) Cheatsheet
    await send('Page.navigate', { url: URL_BASE + '/verbs/cheatsheet' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('vbf-3-cheatsheet.png');

    // 全部揭示
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const show = btns.find(b => (b.textContent || '').includes('全部显示'));
      if (show) show.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    await shot('vbf-4-cheatsheet-revealed.png');

    ws.close();
    console.log('=== done ===');
  } catch (e) { console.error('failed:', e); }
  finally {
    chrome.kill(); preview.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
