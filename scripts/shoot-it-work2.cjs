// 截图 it-work 场景页 (修正版)
const { chromium } = require('C:/Users/nanshens/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const out = 'D:/project/ai/jpstudy/screenshots';
  const base = 'http://127.0.0.1:4173';

  // Desktop
  const ctxD = await browser.newContext({ viewport: { width: 2560, height: 1440 } });
  const pageD = await ctxD.newPage();
  pageD.on('console', (msg) => console.log('[console]', msg.type(), msg.text()));

  // it-work overview
  await pageD.goto(`${base}/scenarios/it-work`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(1500);
  await pageD.screenshot({ path: `${out}/it-2-overview.png`, fullPage: false });

  // words tab - 用 button role
  await pageD.locator('button:has-text("单词")').first().click();
  await pageD.waitForTimeout(800);
  await pageD.screenshot({ path: `${out}/it-3-words.png`, fullPage: false });

  // grammar tab
  await pageD.locator('button:has-text("语法")').first().click();
  await pageD.waitForTimeout(800);
  await pageD.screenshot({ path: `${out}/it-4-grammar.png`, fullPage: false });

  // dialogs
  await pageD.locator('button:has-text("对话")').first().click();
  await pageD.waitForTimeout(800);
  await pageD.screenshot({ path: `${out}/it-5-dialog.png`, fullPage: false });

  // listening
  await pageD.locator('button:has-text("听力")').first().click();
  await pageD.waitForTimeout(800);
  await pageD.screenshot({ path: `${out}/it-6-listening.png`, fullPage: false });

  // quiz
  await pageD.locator('button:has-text("小测")').first().click();
  await pageD.waitForTimeout(800);
  await pageD.screenshot({ path: `${out}/it-7-quiz-config.png`, fullPage: false });

  // start quiz
  const startBtn = pageD.locator('button', { hasText: /开始测试|开始答题|开始/ }).first();
  if (await startBtn.count() > 0) {
    await startBtn.click();
    await pageD.waitForTimeout(1000);
    await pageD.screenshot({ path: `${out}/it-8-quiz-q1.png`, fullPage: false });
  }

  // Mobile
  const ctxM = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true });
  const pageM = await ctxM.newPage();
  await pageM.goto(`${base}/scenarios/it-work`, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(1500);
  await pageM.screenshot({ path: `${out}/it-9-mobile.png`, fullPage: false });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
