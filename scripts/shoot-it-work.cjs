// 截图 it-work 场景页 + 列表
const { chromium } = require('C:/Users/nanshens/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const out = 'D:/project/ai/jpstudy/screenshots';
  const base = 'http://127.0.0.1:4173';

  // Desktop
  const ctxD = await browser.newContext({ viewport: { width: 2560, height: 1440 } });
  const pageD = await ctxD.newPage();

  // 1. 场景列表 (it-work 应在 "其他" 区)
  await pageD.goto(`${base}/scenarios`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(600);
  await pageD.screenshot({ path: `${out}/it-1-scenarios-list.png`, fullPage: true });

  // 2. it-work overview
  await pageD.goto(`${base}/scenarios/it-work`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(600);
  await pageD.screenshot({ path: `${out}/it-2-overview.png`, fullPage: false });

  // 3. words tab
  await pageD.getByRole('tab', { name: /单词/ }).click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/it-3-words.png`, fullPage: false });

  // 4. dialog tab
  await pageD.getByRole('tab', { name: /对话/ }).click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/it-4-dialog.png`, fullPage: false });

  // 5. listening tab
  await pageD.getByRole('tab', { name: /听力/ }).click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/it-5-listening.png`, fullPage: false });

  // 6. quiz config
  await pageD.getByRole('tab', { name: /小测/ }).click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/it-6-quiz-config.png`, fullPage: false });

  // 7. start quiz
  await pageD.getByText(/开始测试|开始答题|开始/).first().click();
  await pageD.waitForTimeout(600);
  await pageD.screenshot({ path: `${out}/it-7-quiz-q1.png`, fullPage: false });

  // Mobile
  const ctxM = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true });
  const pageM = await ctxM.newPage();

  await pageM.goto(`${base}/scenarios/it-work`, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(600);
  await pageM.screenshot({ path: `${out}/it-8-mobile.png`, fullPage: false });

  await pageM.goto(`${base}/scenarios`, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(600);
  await pageM.screenshot({ path: `${out}/it-9-mobile-list.png`, fullPage: true });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
