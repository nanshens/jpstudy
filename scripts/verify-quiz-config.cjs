// 验证 ScenarioPage Quiz 的 config 阶段(题数 + 题型多选) + 随机抽题
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-qc-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9668;

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
    '--enable-features=WebSpeech',
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

    // 1) 验证 6 个场景的 config 界面
    const scenarios = ['driving', 'enrollment', 'course-practice', 'road-test', 'signs-rules', 'traffic-rules'];
    for (const sc of scenarios) {
      await send('Page.navigate', { url: `${URL_BASE}/scenarios/${sc}` });
      await new Promise(r => setTimeout(r, 1500));
      await openQuizTab();
      await new Promise(r => setTimeout(r, 1200));
      await shot(`qc-${sc}-config.png`);
    }

    // 2) driving 场景:选 10 题 + 限定 spelling/spell-audio,验证类型筛选
    await send('Page.navigate', { url: `${URL_BASE}/scenarios/driving` });
    await new Promise(r => setTimeout(r, 1500));
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1200));

    // 反选所有
    await evalJs(`(() => {
      // 找"清空"按钮
      const btns = Array.from(document.querySelectorAll('button'));
      const clear = btns.find(b => b.textContent.trim() === '清空');
      if (clear) clear.click();
    })()`);
    await new Promise(r => setTimeout(r, 300));
    // 只勾选拼写测试 + 听力拼写
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        const t = b.textContent || '';
        if (t.includes('拼写测试') || t.includes('听力拼写')) b.click();
      }
    })()`);
    await new Promise(r => setTimeout(r, 300));
    // 选 10 题
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const t10 = btns.find(b => b.textContent.trim() === '10 题');
      if (t10) t10.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));
    await shot('qc-driving-filtered.png');

    // 3) 验证随机抽题 - 在 driving 场景开始全做测试,然后记下题目顺序,
    // 重新开始,确认题目顺序不同
    // 开始测试
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const go = btns.find(b => b.textContent.trim() === '开始小测');
      if (go) go.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));
    // 抽取前 3 题的 id
    const order1 = await evalJs(`(() => {
      const cards = document.querySelectorAll('[class*="Card"]');
      const txt = document.body.innerText;
      const m = txt.match(/第\\s*1\\s*题.*?第\\s*2\\s*题/s);
      return m ? m[0] : txt.slice(0, 200);
    })()`);
    console.log('Round1 first 200 chars:', String(order1).slice(0, 200));

    // 答完所有题(用 clickFirst)
    // 先到最后一题
    const totalQs = await evalJs(`(() => {
      const m = document.body.innerText.match(/共\\s*(\\d+)\\s*题/);
      return m ? parseInt(m[1]) : 0;
    })()`);
    console.log('Total questions in this round:', totalQs);

    // 直接点"查看成绩"循环
    async function answerOnce() {
      return evalJs(`(() => {
        // 选第一选项 / 输入拼写
        const opts = document.querySelectorAll('button[type=button]');
        for (const b of opts) {
          const t = b.textContent || '';
          if (/下一题|查看成绩|提交|重新播放|听发音|改设置/.test(t)) continue;
          if (/[A-D]\\.\\s/.test(t)) { b.click(); return 'option'; }
        }
        const input = document.querySelector('input[type=text], input:not([type])');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'とうきょう');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const submit = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '提交');
          if (submit) { submit.click(); return 'spelling'; }
        }
        return 'nothing';
      })()`);
    }
    async function next() {
      return evalJs(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nxt = btns.find(b => /下一题|查看成绩/.test(b.textContent || ''));
        if (nxt) { nxt.click(); return true; }
        return false;
      })()`);
    }
    for (let k = 0; k < totalQs; k++) {
      await answerOnce();
      await new Promise(r => setTimeout(r, 60));
      await next();
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 800));
    await shot('qc-driving-result.png');

    // 4) 验证随机性:再来一组
    await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const redo = btns.find(b => b.textContent.includes('再来一组'));
      if (redo) redo.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));
    // 截第一题
    await shot('qc-driving-shuffle2-q1.png');

    // 5) 移动端:driving config
    await send('Page.navigate', { url: `${URL_BASE}/scenarios/driving` });
    await new Promise(r => setTimeout(r, 1500));
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1200));
    await shot('qc-driving-config-mobile.png', 430, 932);

    // 6) 移动端:traffic-rules config
    await send('Page.navigate', { url: `${URL_BASE}/scenarios/traffic-rules` });
    await new Promise(r => setTimeout(r, 1500));
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1200));
    await shot('qc-traffic-config-mobile.png', 430, 932);

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
