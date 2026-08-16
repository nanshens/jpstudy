// Quick screenshot script using Playwright (from npm-cache)
const { chromium } = require('C:/Users/nanshens/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const out = 'D:/project/ai/jpstudy/screenshots';
  const base = 'http://127.0.0.1:4173';

  // Desktop
  const ctxD = await browser.newContext({ viewport: { width: 2560, height: 1440 } });
  const pageD = await ctxD.newPage();

  // 1. cheatsheet page 1
  await pageD.goto(`${base}/verbs/cheatsheet`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(600);
  await pageD.screenshot({ path: `${out}/cv-1-desktop-page1.png`, fullPage: false });

  // 2. click "全部显示"
  await pageD.getByText('全部显示').click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/cv-2-desktop-revealed.png`, fullPage: false });

  // 3. next page
  await pageD.getByRole('button', { name: /下一页/ }).first().click();
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/cv-3-desktop-page2.png`, fullPage: false });

  // Mobile (iPhone 13 Pro Max: 430x932)
  const ctxM = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true });
  const pageM = await ctxM.newPage();
  await pageM.goto(`${base}/verbs/cheatsheet`, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(600);
  await pageM.screenshot({ path: `${out}/cv-4-mobile-page1.png`, fullPage: false });
  await pageM.getByText('全部显示').click();
  await pageM.waitForTimeout(400);
  await pageM.screenshot({ path: `${out}/cv-5-mobile-revealed.png`, fullPage: false });

  // Full pages (entire document)
  await pageD.goto(`${base}/verbs/cheatsheet`, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(400);
  await pageD.screenshot({ path: `${out}/cv-6-desktop-fullpage.png`, fullPage: true });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
