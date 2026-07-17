// 验证 traffic-rules 5 种新题型
// 一次浏览器 session,按 idx 升序逐题前进,遇到目标题型时截图
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const PROJECT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-qt-' + Date.now());
const OUT_DIR = path.join(PROJECT, 'screenshots');
const PORT_DEBUG = 9667;
const QUIZ_PATH = path.join(PROJECT, 'public', 'data', 'scenarios', 'traffic-rules', 'quiz.json');

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
  // 1) 起 vite preview
  console.log('[1/4] starting vite preview...');
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

  // 2) chrome
  console.log('[2/4] starting chrome headless...');
  const chrome = spawn(EDGE, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT_DEBUG,
    '--user-data-dir=' + PROFILE,
    '--enable-features=WebSpeech',
    URL_BASE + '/scenarios/traffic-rules',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (!(await waitForUrl('http://127.0.0.1:' + PORT_DEBUG + '/json/version', 20000))) {
    console.error('chrome failed');
    chrome.kill();
    preview.kill();
    process.exit(1);
  }
  console.log('chrome ready');

  try {
    // 3) 题库分析:对每个目标类型,只截一次"该类型题"
    const quiz = JSON.parse(fs.readFileSync(QUIZ_PATH, 'utf8'));
    // 跳过 truefalse(已有 250 题,跑过去太慢;老的 truefalse 题目设计没变,只测新 4 种)
    const wantTypes = ['listening', 'response', 'spelling', 'spell-audio'];
    const targets = wantTypes
      .map(t => ({ type: t, idx: quiz.findIndex(q => (q.type || 'choice') === t) }))
      .filter(t => t.idx >= 0);
    console.log('Targets:', targets);

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
      await evalJs(`(() => {
        const tabs = Array.from(document.querySelectorAll('button, [role=tab]'));
        const tb = tabs.find(b => {
          const t = (b.textContent || '').trim();
          return t === '小测' || t.endsWith('小测');
        });
        if (tb) tb.click();
      })()`);
    }
    async function clickFirstOption() {
      return evalJs(`(() => {
        const opts = document.querySelectorAll('button[type=button]');
        for (const b of opts) {
          const t = b.textContent || '';
          if (/下一题|查看成绩|提交|重新播放|听发音/.test(t)) continue;
          if (/[A-D]\\.\\s/.test(t)) { b.click(); return 'option'; }
        }
        return 'no-option';
      })()`);
    }
    async function clickNext() {
      return evalJs(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nxt = btns.find(b => /下一题|查看成绩/.test(b.textContent || ''));
        if (nxt) { nxt.click(); return true; }
        return false;
      })()`);
    }
    async function submitSpelling() {
      return evalJs(`(() => {
        const input = document.querySelector('input[type=text], input:not([type])');
        if (!input) return 'no-input';
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'とうきょう');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '提交');
        if (btn) { btn.click(); return 'submitted'; }
        return 'no-submit';
      })()`);
    }
    async function answerCurrent() {
      const r = await clickFirstOption();
      if (r === 'no-option') await submitSpelling();
    }

    // 1) overview
    await send('Page.navigate', { url: URL_BASE + '/scenarios/traffic-rules' });
    await new Promise(r => setTimeout(r, 2000));
    await shot('qt-1-overview.png');

    // 2) 进入 quiz
    await openQuizTab();
    await new Promise(r => setTimeout(r, 1500));
    await shot('qt-2-quiz-init.png');

    // 3) 一路前进;遇到目标 idx 时截图(未揭示)
    // 顺序按 idx 升序
    targets.sort((a, b) => a.idx - b.idx);
    let lastIdx = 0;
    for (const tg of targets) {
      // 从 lastIdx 前进到 tg.idx
      const gap = tg.idx - lastIdx;
      console.log(`→ moving from ${lastIdx} to ${tg.idx} (gap=${gap}) for type=${tg.type}`);
      const start = Date.now();
      for (let k = 0; k < gap; k++) {
        await answerCurrent();
        const moved = await clickNext();
        if (!moved) {
          console.log('  cannot move next at k=', k);
          break;
        }
      }
      console.log(`  moved in ${Date.now() - start}ms`);
      await new Promise(r => setTimeout(r, 800));
      // 截"未揭示"图
      await shot(`qt-${tg.type}.png`);
      // 答一下,再截"揭示"图
      await answerCurrent();
      await new Promise(r => setTimeout(r, 800));
      await shot(`qt-${tg.type}-answered.png`);
      lastIdx = tg.idx;
    }

    // 4) 移动端 spelling 截图
    const spellT = targets.find(t => t.type === 'spelling');
    if (spellT) {
      await send('Page.navigate', { url: URL_BASE + '/scenarios/traffic-rules' });
      await new Promise(r => setTimeout(r, 1500));
      await openQuizTab();
      await new Promise(r => setTimeout(r, 1200));
      for (let k = 0; k < spellT.idx; k++) {
        await answerCurrent();
        await clickNext();
      }
      await new Promise(r => setTimeout(r, 800));
      await shot('qt-spelling-mobile.png', 430, 932);
    }

    // 5) 移动端 listening 截图
    const listT = targets.find(t => t.type === 'listening');
    if (listT) {
      await send('Page.navigate', { url: URL_BASE + '/scenarios/traffic-rules' });
      await new Promise(r => setTimeout(r, 1500));
      await openQuizTab();
      await new Promise(r => setTimeout(r, 1200));
      for (let k = 0; k < listT.idx; k++) {
        await answerCurrent();
        await clickNext();
      }
      await new Promise(r => setTimeout(r, 800));
      await shot('qt-listening-mobile.png', 430, 932);
    }

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
