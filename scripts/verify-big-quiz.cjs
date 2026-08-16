// 验证大题库:小测 config 显示 + 随机抽题
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-bq-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9672;

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

    // 1) driving 场景 quiz config - 看题量
    await send('Page.navigate', { url: URL_BASE + '/scenarios/driving' });
    await new Promise(r => setTimeout(r, 2500));
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1500));
    await shot('bq-1-driving-config.png');

    // 2) 进入 driving 全部题 50 题
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const t50 = btns.find(b => b.textContent.trim() === '50 题');
      if (t50) t50.click();
    })()`);
    await new Promise(r => setTimeout(r, 200));
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const go = btns.find(b => b.textContent.trim() === '开始小测');
      if (go) go.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));
    await shot('bq-2-driving-q1.png');

    // 3) 听 kanji 选中文题(找 type=listening 的词)
    // 直接通过 React state 走不现实,只能继续点
    // 直接截取后几题
    for (let k = 0; k < 5; k++) {
      await evalJs(`(() => {
        const opts = document.querySelectorAll('button[type=button]');
        for (const b of opts) {
          const t = b.textContent || '';
          if (/下一题|查看成绩|提交|重新播放|听发音/.test(t)) continue;
          if (/[A-D]\\.\\s/.test(t)) { b.click(); break; }
        }
      })()`);
      await new Promise(r => setTimeout(r, 80));
      await evalJs(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nxt = btns.find(b => /下一题|查看成绩/.test(b.textContent || ''));
        if (nxt) nxt.click();
      })()`);
      await new Promise(r => setTimeout(r, 80));
    }
    await new Promise(r => setTimeout(r, 800));
    await shot('bq-3-driving-q6.png');

    // 4) course-practice 题量最大,跑一下
    await send('Page.navigate', { url: URL_BASE + '/scenarios/course-practice' });
    await new Promise(r => setTimeout(r, 2500));
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1500));
    await shot('bq-4-course-practice-config.png');

    // 5) 移动端 course-practice config
    await shot('bq-5-course-practice-mobile.png', 430, 932);

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
