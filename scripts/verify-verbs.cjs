// 验证动词变形模块
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-vb-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9673;

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

    // 1) 主页
    await send('Page.navigate', { url: URL_BASE + '/verbs' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('vb-1-home.png');

    // 主页长截图
    const layout = await send('Page.getLayoutMetrics', {});
    const fullH = layout.result?.contentSize?.height || 1500;
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: Math.min(fullH, 4000), deviceScaleFactor: 1, mobile: false,
    });
    const ssFull = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(OUT_DIR, 'vb-2-home-full.png'), Buffer.from(ssFull.result.data, 'base64'));
    console.log('saved vb-2-home-full.png', '|', fullH, 'px tall');

    // 2) Basics
    await send('Page.navigate', { url: URL_BASE + '/verbs/basics' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('vb-3-basics.png');

    // 3) Forms 主页
    await send('Page.navigate', { url: URL_BASE + '/verbs/forms' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('vb-4-forms.png');

    // 4) Forms 弹窗
    await evalJs(`(() => {
      const cards = document.querySelectorAll('[id]');
      const masu = document.getElementById('masu');
      if (masu) masu.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await shot('vb-5-forms-modal.png');

    // 5) Practice config
    await send('Page.navigate', { url: URL_BASE + '/verbs/practice' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('vb-6-practice-config.png');

    // 6) Practice 第 1 题
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const go = btns.find(b => b.textContent.includes('开始练习'));
      if (go) go.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));
    await shot('vb-7-practice-q1.png');

    // 7) Cheatsheet
    await send('Page.navigate', { url: URL_BASE + '/verbs/cheatsheet' });
    await new Promise(r => setTimeout(r, 2500));
    await shot('vb-8-cheatsheet.png');

    // 8) 显示全部
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const show = btns.find(b => b.textContent.includes('全部显示'));
      if (show) show.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await shot('vb-9-cheatsheet-revealed.png');

    // 9) 移动端 - 主页
    await send('Page.navigate', { url: URL_BASE + '/verbs' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('vb-10-home-mobile.png', 430, 932);

    // 10) 移动端 - 速查表
    await send('Page.navigate', { url: URL_BASE + '/verbs/cheatsheet' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('vb-11-cheatsheet-mobile.png', 430, 932);

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
