// 综合测试页面 + road-test 一時停止 + 移动端 nav 验证
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-mix-' + Date.now());
const OUT_DIR = path.join(__dirname, '..', 'screenshots');
const PORT = 9667;

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
  // Home - 看新增的"综合测试"按钮
  { url: '/', file: 'mix-1-home.png', w: 1440, h: 900, after: 'wait 1500' },
  // Mixed test - config phase (桌面)
  { url: '/mixed-test', file: 'mix-2-config.png', w: 1440, h: 900, after: 'wait 1500' },
  // Mixed test - config phase (移动)
  { url: '/mixed-test', file: 'mix-3-config-mobile.png', w: 430, h: 932, after: 'wait 1500' },
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
    const consoleLogs = [];
    ws.on('message', msg => {
      const m = JSON.parse(msg);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      if (m.method === 'Runtime.consoleAPICalled' || m.method === 'Log.entryAdded' || m.method === 'Runtime.exceptionThrown') {
        consoleLogs.push(m);
      }
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
      const info = await send('Runtime.evaluate', {
        expression: `(() => ({ href: location.href, h1: document.querySelector('h1')?.textContent || null, hasButton: document.body.innerText.includes('综合测试'), navItems: Array.from(document.querySelectorAll('header a, nav a')).map(a => a.textContent.trim()).filter(Boolean), cardCount: document.querySelectorAll('[class*="border-primary"]').length, bodyTextHead: document.body.innerText.slice(0, 300) }))()`,
        returnByValue: true,
      });
      results.push({ url: s.url, file: s.file, ...info.result.result.value });
      console.log('saved', s.file, '|', info.result.result.value.h1);
    }

    // 综合测试 - 测试阶段
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await send('Page.navigate', { url: URL_BASE + '/mixed-test' });
    await new Promise(r => setTimeout(r, 1500));
    // 点 "开始测试 · 20 题"
    await send('Runtime.evaluate', {
      expression: `(() => { const btns = Array.from(document.querySelectorAll('button')); const start = btns.find(b => b.textContent.includes('开始测试')); if (start) start.click(); return start ? 'clicked' : 'not found'; })()`,
      returnByValue: true,
    });
    await new Promise(r => setTimeout(r, 2500));
    let testInfo = await send('Runtime.evaluate', {
      expression: `(() => ({ href: location.href, hasQuestion: document.body.innerText.includes('第') && document.body.innerText.includes('题'), question: document.querySelector('.text-base.font-medium')?.textContent || null, hasPrev: !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('上一题')), hasNext: !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('下一题')), bodyHead: document.body.innerText.slice(0, 500) }))()`,
      returnByValue: true,
    });
    console.log('testing phase:', JSON.stringify(testInfo.result.result.value, null, 2));
    let ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'mix-4-testing.png'), Buffer.from(ss.result.data, 'base64'));

    // 选个答案
    await send('Runtime.evaluate', {
      expression: `(() => { const opts = document.querySelectorAll('button[class*="rounded-md"][class*="border"][class*="p-3"]'); if (opts[0]) opts[0].click(); return opts.length; })()`,
      returnByValue: true,
    });
    await new Promise(r => setTimeout(r, 1000));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'mix-5-testing-answered.png'), Buffer.from(ss.result.data, 'base64'));

    // 直接跳到结果 (回答完 20 题太慢,直接 evaluate 模拟)
    // 用 Runtime.evaluate 调内部函数太麻烦,直接多次点下一题更省事
    // 但 20 题还是太多,直接重新加载,然后改 URL 不行 (在 testing 阶段才有 questions state)
    // 干脆 20 次 next 走完
    for (let i = 0; i < 19; i++) {
      await send('Runtime.evaluate', {
        expression: `(() => { const opts = document.querySelectorAll('button[class*="rounded-md"][class*="border"][class*="p-3"]'); if (opts[Math.floor(Math.random()*opts.length)]) opts[Math.floor(Math.random()*opts.length)].click(); })()`,
        returnByValue: true,
      });
      await new Promise(r => setTimeout(r, 200));
      await send('Runtime.evaluate', {
        expression: `(() => { const btns = Array.from(document.querySelectorAll('button')); const next = btns.find(b => b.textContent.includes('下一题')); if (next) next.click(); })()`,
        returnByValue: true,
      });
      await new Promise(r => setTimeout(r, 200));
    }
    // 最后一题,选答案+提交
    await send('Runtime.evaluate', {
      expression: `(() => { const opts = document.querySelectorAll('button[class*="rounded-md"][class*="border"][class*="p-3"]'); if (opts[0]) opts[0].click(); })()`,
      returnByValue: true,
    });
    await new Promise(r => setTimeout(r, 500));
    await send('Runtime.evaluate', {
      expression: `(() => { const btns = Array.from(document.querySelectorAll('button')); const submit = btns.find(b => b.textContent.includes('提交')); if (submit) submit.click(); })()`,
      returnByValue: true,
    });
    await new Promise(r => setTimeout(r, 1500));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'mix-6-result.png'), Buffer.from(ss.result.data, 'base64'));
    const resultInfo = await send('Runtime.evaluate', {
      expression: `(() => ({ hasTrophy: document.body.innerText.includes('完成'), hasWrong: document.body.innerText.includes('错题回顾'), score: document.body.innerText.match(/(\\d+)\\s*\\/\\s*\\d+/)?.[0] || null, bodyHead: document.body.innerText.slice(0, 500) }))()`,
      returnByValue: true,
    });
    console.log('result phase:', JSON.stringify(resultInfo.result.result.value, null, 2));

    // 顺便验下 road-test 一時停止的词 (去 /scenarios/road-test 切到 words tab)
    await send('Page.navigate', { url: URL_BASE + '/scenarios/road-test' });
    await new Promise(r => setTimeout(r, 1500));
    await send('Runtime.evaluate', {
      expression: `(() => { const tabs = Array.from(document.querySelectorAll('button')); const w = tabs.find(t => t.textContent.trim() === '单词'); if (w) w.click(); })()`,
      returnByValue: true,
    });
    await new Promise(r => setTimeout(r, 1500));
    // 搜"一時停止"看能不能找到
    const searchInfo = await send('Runtime.evaluate', {
      expression: `(() => { const all = document.body.innerText; return { hasTLP: all.includes('一時停止'), hasKeyPhrase: all.includes('三秒停止') || all.includes('完全停止'), wordCount: all.match(/\\d+ 词|共 \\d+/) || 'n/a', head: all.slice(0, 400) }; })()`,
      returnByValue: true,
    });
    console.log('road-test words check:', JSON.stringify(searchInfo.result.result.value, null, 2));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'mix-7-road-words.png'), Buffer.from(ss.result.data, 'base64'));

    console.log('=== summary ===');
    results.forEach(r => console.log(r.file, '|', r.href, '|', r.h1));
    if (consoleLogs.length) {
      console.log('=== console events ===');
      consoleLogs.slice(0, 20).forEach(l => console.log(JSON.stringify(l).slice(0, 200)));
    }
    ws.close();
  } catch (e) {
    console.error('snap failed:', e);
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
