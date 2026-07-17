// 验证 traffic-rules 场景
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const URL_BASE = 'http://localhost:4173';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(process.env.TEMP || 'C:\\Users\\nanshens\\AppData\\Local\\Temp', 'edge-tr-' + Date.now());
const OUT_DIR = path.join(__dirname, '..', 'screenshots');
const PORT = 9668;

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
  // 1. 场景列表 - 看新加的"交规学习"
  { url: '/scenarios', file: 'tr-1-list.png', w: 1440, h: 900 },
  // 2. 交规学习 - 概览
  { url: '/scenarios/traffic-rules', file: 'tr-2-overview.png', w: 1440, h: 900 },
  // 3. 交规学习 - 教材 tab (PDF)
  { url: '/scenarios/traffic-rules', file: 'tr-3-textbook.png', w: 1440, h: 900, clickText: '教材' },
  // 4. 交规学习 - 单词
  { url: '/scenarios/traffic-rules', file: 'tr-4-words.png', w: 1440, h: 900, clickText: '单词' },
  // 5. 交规学习 - 小测
  { url: '/scenarios/traffic-rules', file: 'tr-5-quiz.png', w: 1440, h: 900, clickText: '小测' },
  // 6. 移动端 - 教材 tab
  { url: '/scenarios/traffic-rules', file: 'tr-6-mobile.png', w: 430, h: 932, clickText: '教材' },
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
    const pageErrors = [];
    const failedRequests = [];
    ws.on('message', msg => {
      const m = JSON.parse(msg);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails?.text || JSON.stringify(m).slice(0, 200));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleLogs.push(m.params);
      if (m.method === 'Network.loadingFailed') failedRequests.push(m.params.errorText + ' ' + (m.params.request?.url || ''));
    });
    await new Promise(r => ws.on('open', r));
    function send(method, params = {}) {
      const _id = ++id;
      return new Promise(res => { pending.set(_id, res); ws.send(JSON.stringify({ id: _id, method, params })); });
    }
    await send('Network.enable');
    await send('Runtime.enable');
    await send('Page.enable');

    for (const s of shots) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 800,
      });
      await send('Page.navigate', { url: URL_BASE + s.url });
      await new Promise(r => setTimeout(r, 2500));

      // 如果需要点击 tab
      if (s.clickText) {
        await send('Runtime.evaluate', {
          expression: `(() => { const btns = Array.from(document.querySelectorAll('button')); const t = btns.find(b => b.textContent.trim() === ${JSON.stringify(s.clickText)}); if (t) t.click(); return t ? 'clicked' : 'not found'; })()`,
          returnByValue: true,
        });
        await new Promise(r => setTimeout(r, 3000));
      }

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT_DIR, s.file), Buffer.from(ss.result.data, 'base64'));
      const info = await send('Runtime.evaluate', {
        expression: `(() => ({ href: location.href, h1: document.querySelector('h1')?.textContent || null, hasIframe: !!document.querySelector('iframe'), iframeSrc: document.querySelector('iframe')?.src || null, tabs: Array.from(document.querySelectorAll('[role=tab]')).map(t => t.textContent.trim()), bodyTextHead: document.body.innerText.slice(0, 300) }))()`,
        returnByValue: true,
      });
      console.log('saved', s.file, '|', JSON.stringify(info.result.result.value));
    }

    // 答几道题
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL_BASE + '/scenarios/traffic-rules' });
    await new Promise(r => setTimeout(r, 1500));
    await send('Runtime.evaluate', {
      expression: `(() => { const btns = Array.from(document.querySelectorAll('button')); const t = btns.find(b => b.textContent.trim() === '小测'); if (t) t.click(); })()`,
      returnByValue: true,
    });
    await new Promise(r => setTimeout(r, 1500));
    // 答 3 道题看看
    for (let i = 0; i < 3; i++) {
      await send('Runtime.evaluate', {
        expression: `(() => { const opts = document.querySelectorAll('button[class*="rounded-md"][class*="border"][class*="p-3"]'); if (opts[Math.floor(Math.random()*opts.length)]) opts[Math.floor(Math.random()*opts.length)].click(); })()`,
        returnByValue: true,
      });
      await new Promise(r => setTimeout(r, 800));
      await send('Runtime.evaluate', {
        expression: `(() => { const btns = Array.from(document.querySelectorAll('button')); const next = btns.find(b => b.textContent.includes('下一题')); if (next) next.click(); })()`,
        returnByValue: true,
      });
      await new Promise(r => setTimeout(r, 500));
    }
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'tr-7-quiz-progress.png'), Buffer.from(ss.result.data, 'base64'));
    const qInfo = await send('Runtime.evaluate', {
      expression: `(() => ({ question: document.querySelector('.text-base.font-medium')?.textContent || null, hasOptions: document.querySelectorAll('button[class*="rounded-md"][class*="border"]').length, hasScenario: document.body.innerText.includes('正しい') || document.body.innerText.includes('正しくない') }))()`,
      returnByValue: true,
    });
    console.log('quiz progress:', JSON.stringify(qInfo.result.result.value));

    // 综合测试 - 看 traffic-rules 是否被勾选
    await send('Page.navigate', { url: URL_BASE + '/mixed-test' });
    await new Promise(r => setTimeout(r, 1500));
    const mixedInfo = await send('Runtime.evaluate', {
      expression: `(() => ({ h1: document.querySelector('h1')?.textContent, hasTrafficRules: document.body.innerText.includes('交规学习'), checkboxCount: document.querySelectorAll('button[class*="rounded-md"][class*="border"][class*="p-3"]').length }))()`,
      returnByValue: true,
    });
    console.log('mixed-test:', JSON.stringify(mixedInfo.result.result.value));
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'tr-8-mixed-test-with-traffic.png'), Buffer.from(ss2.result.data, 'base64'));

    console.log('=== Errors ===');
    if (pageErrors.length) console.log('Page errors:', pageErrors.slice(0, 5));
    if (consoleLogs.length) console.log('Console errors:', consoleLogs.slice(0, 5).map(l => l.args?.[0]?.value || JSON.stringify(l).slice(0, 200)));
    if (failedRequests.length) console.log('Failed requests:', failedRequests.slice(0, 5));
    if (!pageErrors.length && !consoleLogs.length && !failedRequests.length) console.log('No errors detected!');

    ws.close();
  } catch (e) {
    console.error('snap failed:', e);
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
})();
