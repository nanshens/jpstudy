// 截图 v2 验证修复
const { chromium } = require('C:/Users/nanshens/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const out = 'D:/project/ai/jpstudy/screenshots';
  const base = 'http://127.0.0.1:4173';

  const ctxD = await browser.newContext({ viewport: { width: 2560, height: 1440 } });
  const pageD = await ctxD.newPage();
  pageD.on('pageerror', (err) => console.log('[ERR]', err.message));

  await pageD.goto(`${base}/scenarios/medical`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(1500);
  await pageD.locator('button:has-text("打字")').click();
  await pageD.waitForTimeout(1500);

  // 1. 初始 (空虚线 + placeholder)
  await pageD.screenshot({ path: `${out}/ty-v2-1-initial.png`, fullPage: false });

  // 2. 输入"f" (第一个字符对)
  await pageD.locator('input[autocomplete="off"]').first().focus();
  await pageD.keyboard.type('f');
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/ty-v2-2-correct.png`, fullPage: false });

  // 3. 输入错字符 "x" 测试错字样式
  await pageD.keyboard.type('x');
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/ty-v2-3-wrong.png`, fullPage: false });

  // 4. 切换输入方式 — 应该清空输入,不跳下一题
  // 先看看当前是哪个 mode (默认是 hiragana 还是 romaji?)
  // 看 title 提示
  const inputTypeBtnTitle = await pageD.locator('button[title*="输入方式"]').getAttribute('title');
  console.log('当前输入方式 button title:', inputTypeBtnTitle);
  await pageD.locator('button[title*="输入方式"]').click();
  await pageD.waitForTimeout(600);
  await pageD.screenshot({ path: `${out}/ty-v2-4-toggle-mode.png`, fullPage: false });

  // 5. 输入新模式下第一个字符
  await pageD.keyboard.type('f');
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/ty-v2-5-new-mode-typing.png`, fullPage: false });

  // Mobile
  const ctxM = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true });
  const pageM = await ctxM.newPage();
  await pageM.goto(`${base}/scenarios/medical`, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(1500);
  await pageM.locator('button:has-text("打字")').click();
  await pageM.waitForTimeout(1500);
  await pageM.screenshot({ path: `${out}/ty-v2-6-mobile.png`, fullPage: false });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });