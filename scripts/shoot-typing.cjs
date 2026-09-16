// 截图 TypingView 各模式
const { chromium } = require('C:/Users/nanshens/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const out = 'D:/project/ai/jpstudy/screenshots';
  const base = 'http://127.0.0.1:4173';

  // Desktop
  const ctxD = await browser.newContext({ viewport: { width: 2560, height: 1440 } });
  const pageD = await ctxD.newPage();

  // 1. medical typing 默认 (all = kana + kanji + romaji)
  await pageD.goto(`${base}/scenarios/medical`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(1500);
  await pageD.locator('button:has-text("打字")').click();
  await pageD.waitForTimeout(1500);
  await pageD.screenshot({ path: `${out}/ty-1-medical-default.png`, fullPage: false });

  // 2. 点击设置切换到 kana-kanji 模式
  await pageD.locator('button[title*="显示模式"]').click();
  await pageD.waitForTimeout(300);
  await pageD.locator('button:has-text("假名+汉字")').click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/ty-2-kana-kanji.png`, fullPage: false });

  // 3. 切换到只汉字
  await pageD.locator('button:has-text("只汉字")').click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/ty-3-kanji-only.png`, fullPage: false });

  // 4. 切换到听写模式
  await pageD.locator('button:has-text("听写模式")').click();
  await pageD.waitForTimeout(800);
  await pageD.screenshot({ path: `${out}/ty-4-listen.png`, fullPage: false });

  // 5. 切换到假名+罗马字
  await pageD.locator('button:has-text("假名+罗马字")').click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/ty-5-kana-romaji.png`, fullPage: false });

  // 6. 输入字符测试
  await pageD.locator('button:has-text("全提示")').first().click();
  await pageD.waitForTimeout(300);
  await pageD.locator('input[autocomplete="off"]').first().focus();
  await pageD.keyboard.type('ka');
  await pageD.waitForTimeout(500);
  await pageD.screenshot({ path: `${out}/ty-6-typing-progress.png`, fullPage: false });

  // 7. 切到 it-work 场景验证
  await pageD.goto(`${base}/scenarios/it-work`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(1500);
  await pageD.locator('button:has-text("打字")').click();
  await pageD.waitForTimeout(1500);
  await pageD.screenshot({ path: `${out}/ty-7-it-work.png`, fullPage: false });

  // 8. driving 场景
  await pageD.goto(`${base}/scenarios/driving`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(1500);
  await pageD.locator('button:has-text("打字")').click();
  await pageD.waitForTimeout(1500);
  await pageD.screenshot({ path: `${out}/ty-8-driving.png`, fullPage: false });

  // Mobile
  const ctxM = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true });
  const pageM = await ctxM.newPage();
  await pageM.goto(`${base}/scenarios/medical`, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(1500);
  await pageM.locator('button:has-text("打字")').click();
  await pageM.waitForTimeout(1500);
  await pageM.screenshot({ path: `${out}/ty-9-mobile.png`, fullPage: false });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });